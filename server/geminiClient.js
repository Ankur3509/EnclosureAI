// =============================================================================
// aiClient.js — Groq (Llama 3.3 70B) Integration for EnclosureAI
// Uses the OpenAI-compatible SDK pointed at Groq's endpoint.
// Converts natural-language device descriptions into structured JSON plans.
// =============================================================================

const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

// ---------------------------------------------------------------------------
// Validate API key
// ---------------------------------------------------------------------------
if (!process.env.GROQ_API_KEY) {
  console.error("FATAL: GROQ_API_KEY is not set in .env");
  process.exit(1);
}

// Groq uses an OpenAI-compatible API — just change the baseURL
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ---------------------------------------------------------------------------
// System prompt — instructs the LLM to behave as a mechanical engineer
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an expert mechanical engineer specialising in electronic enclosure design for 3D printing (FDM/FFF).

TASK: Given a user description of an electronic device, produce ONLY a single JSON object (no markdown, no explanation, no code fences).

The JSON must follow this EXACT schema:
{
  "case_type": "handheld" | "desktop" | "wall_mount",
  "dimensions": {
    "length": <number mm>,
    "width": <number mm>,
    "height": <number mm>
  },
  "wall_thickness": <number mm, minimum 2>,
  "components": [
    {
      "name": "<string>",
      "position": "center" | "offset"
    }
  ],
  "ports": [
    {
      "type": "usb" | "micro_usb" | "usb_c" | "power" | "hdmi" | "ethernet" | "audio_jack" | "sd_card" | "generic_cutout",
      "side": "front" | "back" | "left" | "right",
      "position": <number mm from left/bottom edge of that wall to port center>,
      "height_offset": <number mm from inner floor to bottom of port>
    }
  ],
  "vents": <boolean>,
  "screw_posts": <number, usually 4>,
  "lid_type": "snap" | "screw"
}

RULES:
1. All dimensions in millimetres.
2. wall_thickness MUST be >= 2.
3. Use realistic dimensions with clearance. References:
   - Arduino Nano: ~45×18×13 mm (add 4mm clearance per axis → 49×22×17).
   - Arduino Uno: ~69×53×15 mm (add 4mm → 73×57×19).
   - Raspberry Pi 4: ~85×56×17 mm (add 4mm → 89×60×21).
   - ESP32 DevKit: ~55×28×10 mm (add 4mm → 59×32×14).
4. position = distance from left edge (front/back walls) or bottom edge (left/right walls) to port center.
5. height_offset = distance from inner floor to bottom of port opening.
6. If the user mentions ventilation/cooling/heat, set vents to true.
7. Default screw_posts to 4 and lid_type to "screw" unless specified otherwise.
8. Output ONLY the raw JSON object. No other text whatsoever.`;

// ---------------------------------------------------------------------------
// Sleep utility for retry backoff
// ---------------------------------------------------------------------------
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main function — calls Groq/Llama and returns a validated design plan
// ---------------------------------------------------------------------------
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000;

async function generateDesignPlan(userPrompt) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[Groq] Attempt ${attempt}/${MAX_RETRIES} using llama-3.3-70b-versatile...`);

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.15,
        max_tokens: 1024,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      });

      const text = completion.choices[0].message.content;
      console.log("[Groq] Raw response:", text);

      // Parse JSON
      let plan;
      try {
        plan = JSON.parse(text);
      } catch (parseErr) {
        console.error("[Groq] Returned non-JSON:", text);
        throw new Error("AI returned invalid JSON. Please try again.");
      }

      // Sanitise & enforce constraints
      plan = sanitisePlan(plan);
      console.log("[Groq] Sanitised plan:", JSON.stringify(plan, null, 2));
      return plan;

    } catch (err) {
      lastError = err;
      const isRateLimit =
        err.status === 429 ||
        err.code === "rate_limit_exceeded" ||
        err.message?.includes("429") ||
        err.message?.includes("Rate limit");

      if (isRateLimit && attempt < MAX_RETRIES) {
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        console.warn(`[Groq] Rate limited. Retrying in ${backoffMs / 1000}s...`);
        await sleep(backoffMs);
        continue;
      }

      console.error(`[Groq] Failed after ${attempt} attempt(s):`, err.message || err);
      break;
    }
  }

  // Final error — user-friendly message
  if (lastError?.status === 429 || lastError?.message?.includes("Rate limit")) {
    throw new Error("AI service is temporarily busy. Please wait a moment and try again.");
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Sanitise & enforce engineering constraints
// ---------------------------------------------------------------------------
function sanitisePlan(plan) {
  // Enforce minimum wall thickness
  if (!plan.wall_thickness || plan.wall_thickness < 2) {
    plan.wall_thickness = 2;
  }

  // Enforce minimum dimensions
  const d = plan.dimensions || {};
  d.length = Math.max(d.length || 30, 10);
  d.width = Math.max(d.width || 20, 10);
  d.height = Math.max(d.height || 15, 10);
  plan.dimensions = d;

  // Cap at reasonable max (300mm per axis)
  d.length = Math.min(d.length, 300);
  d.width = Math.min(d.width, 300);
  d.height = Math.min(d.height, 200);

  // Default arrays
  plan.components = plan.components || [];
  plan.ports = plan.ports || [];

  // Sanitise ports
  plan.ports = plan.ports.map((port) => {
    if (port.position === undefined || port.position === null) {
      port.position = (port.side === "front" || port.side === "back")
        ? d.length / 2
        : d.width / 2;
    }
    if (port.height_offset === undefined || port.height_offset === null) {
      port.height_offset = 3;
    }
    return port;
  });

  // Boolean / enum defaults
  if (plan.vents === undefined) plan.vents = false;
  if (!plan.screw_posts && plan.screw_posts !== 0) plan.screw_posts = 4;
  if (!plan.lid_type) plan.lid_type = "screw";
  if (!plan.case_type) plan.case_type = "handheld";

  return plan;
}

module.exports = { generateDesignPlan };
