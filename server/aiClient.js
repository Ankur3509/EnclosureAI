// =============================================================================
// aiClient.js (formerly geminiClient.js) — Groq (Llama 3.3 70B)
// Upgraded for Iterative Design & Engineering Accuracy
// =============================================================================

const OpenAI = require("openai");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.GROQ_API_KEY) {
  console.error("FATAL: GROQ_API_KEY is not set in .env");
  process.exit(1);
}

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ---------------------------------------------------------------------------
// System Prompt: The "Engineering Design Manager"
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a Senior Mechanical Engineer specializing in 3D-printable electronic enclosures.
Your goal is to maintain and evolve a Parametric Design Specification (JSON).

TASK:
1. Parse the user's request.
2. If provided, reference the PREVIOUS_DESIGN_STATE to apply iterative changes.
3. Generate a VALIDATED JSON design plan.

ENGINEERING RULES:
- Minimum wall_thickness: 2.0mm.
- Default tolerance: 0.4mm (print gap).
- PCB Standoffs: If a microcontroller is mentioned (Arduino, ESP32), auto-add pcb_mounting.
- Ports: Auto-calculate depth based on wall_thickness + 1mm for clearance.
- Alignment: If ports are added, ensure they don't overlap with screw posts.

JSON SCHEMA:
{
  "case_type": "handheld" | "desktop" | "wall_mount",
  "dimensions": {
    "length": number,
    "width": number,
    "height": number
  },
  "wall_thickness": number,
  "tolerance": number,
  "pcb_mounting": {
    "type": "pillars" | "standoffs" | "none",
    "standoff_height": number,
    "hole_dia": number
  },
  "ports": [
    {
      "type": "usb" | "usb_c" | "hdmi" | "power" | "generic_cutout",
      "side": "front" | "back" | "left" | "right",
      "pos_x": number, (relative to inner wall start)
      "pos_z": number  (height from floor)
    }
  ],
  "ventilation": {
    "enabled": boolean,
    "style": "slots" | "honeycomb",
    "side": "bottom" | "top" | "sides"
  },
  "lid": {
    "style": "screw" | "snap",
    "screw_count": number
  }
}

ITERATIVE LOGIC:
- If user says "Make it taller", increase dimensions.height in the JSON.
- If user says "Add USB-C", append it to ports array.
- DO NOT change unrelated fields. Keep the design stable.

OUTPUT: Return ONLY the raw JSON object.`;

// ---------------------------------------------------------------------------
// Main generation function
// ---------------------------------------------------------------------------
async function generateDesignPlan(userPrompt, previousState = null) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  if (previousState) {
    messages.push({
      role: "assistant",
      content: `CURRENT_DESIGN_STATE: ${JSON.stringify(previousState)}`
    });
    messages.push({
      role: "user",
      content: `CHANGE_REQUEST: ${userPrompt}`
    });
  } else {
    messages.push({
      role: "user",
      content: `INITIAL_REQUEST: ${userPrompt}`
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: messages,
    });

    let plan = JSON.parse(completion.choices[0].message.content);
    return validateAndSanitize(plan);
  } catch (err) {
    console.error("[Groq Error]:", err);
    throw new Error("Failed to generate design plan. Please try again.");
  }
}

// ---------------------------------------------------------------------------
// Engineering Validation Layer (Auto-fixer)
// ---------------------------------------------------------------------------
function validateAndSanitize(plan) {
  // Enforce Core Engineering Rules
  plan.wall_thickness = Math.max(plan.wall_thickness || 2, 2);
  plan.tolerance = plan.tolerance || 0.4;

  if (!plan.dimensions) plan.dimensions = { length: 60, width: 40, height: 25 };
  plan.dimensions.length = Math.max(plan.dimensions.length, 10);
  plan.dimensions.width = Math.max(plan.dimensions.width, 10);
  plan.dimensions.height = Math.max(plan.dimensions.height, 5);

  if (!plan.pcb_mounting) plan.pcb_mounting = { type: "none", standoff_height: 3, hole_dia: 2.5 };
  if (!plan.lid) plan.lid = { style: "screw", screw_count: 4 };
  if (!plan.ports) plan.ports = [];
  if (!plan.ventilation) plan.ventilation = { enabled: false, style: "slots" };

  return plan;
}

module.exports = { generateDesignPlan };
