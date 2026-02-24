// =============================================================================
// index.js — Express API server for EnclosureAI
//
// Pipeline:
//   User prompt  →  Gemini API  →  JSON design plan  →  OpenSCAD code
//   →  OpenSCAD CLI  →  STL file  →  download URL
// =============================================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const { generateDesignPlan } = require("./aiClient");
const { generateSCAD } = require("./cadGenerator");
const { getCredits, deductCredit } = require("./credits");

dotenv.config();

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Ensure outputs directory exists
const outputsDir = path.join(__dirname, "..", "outputs");
if (!fs.existsSync(outputsDir)) {
    fs.mkdirSync(outputsDir, { recursive: true });
}

// Serve generated files as static assets
app.use("/outputs", express.static(outputsDir));

// ---------------------------------------------------------------------------
// OpenSCAD executable resolution
// ---------------------------------------------------------------------------
function findOpenSCAD() {
    // Check common install locations on Windows
    const windowsPaths = [
        "C:\\Program Files\\OpenSCAD\\openscad.com",
        "C:\\Program Files\\OpenSCAD\\openscad.exe",
        "C:\\Program Files (x86)\\OpenSCAD\\openscad.com",
        "C:\\Program Files (x86)\\OpenSCAD\\openscad.exe",
    ];

    for (const p of windowsPaths) {
        if (fs.existsSync(p)) {
            console.log(`[OpenSCAD] Found at: ${p}`);
            return p;
        }
    }

    // Fallback — assume it's in PATH
    console.log("[OpenSCAD] Not found in standard locations, will try PATH");
    return "openscad";
}

const OPENSCAD_PATH = findOpenSCAD();

// ---------------------------------------------------------------------------
// Utility: run OpenSCAD as a promise
// ---------------------------------------------------------------------------
function runOpenSCAD(scadPath, stlPath) {
    return new Promise((resolve, reject) => {
        const args = ["-o", stlPath, scadPath];
        console.log(`[OpenSCAD] Running: ${OPENSCAD_PATH} ${args.join(" ")}`);

        execFile(OPENSCAD_PATH, args, { timeout: 120_000 }, (error, stdout, stderr) => {
            if (stderr) console.log("[OpenSCAD stderr]", stderr);
            if (error) {
                console.error("[OpenSCAD] Execution failed:", error.message);
                return reject(new Error(`OpenSCAD failed: ${error.message}`));
            }

            // Verify the STL was actually created
            if (!fs.existsSync(stlPath)) {
                return reject(new Error("OpenSCAD completed but STL file was not created."));
            }

            console.log(`[OpenSCAD] STL created: ${stlPath}`);
            resolve();
        });
    });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", openscad: OPENSCAD_PATH });
});

// Get credits for a user
app.get("/api/credits/:userId", (req, res) => {
    const { userId } = req.params;
    const credits = getCredits(userId);
    res.json({ credits });
});

// In-memory session store for iterative design
const designSessions = {};

// Main generation endpoint
app.post("/api/generate", async (req, res) => {
    const { prompt, userId, continueSession } = req.body;

    // ── Input validation ────────────────────────────────────────────────
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        return res.status(400).json({ error: "Missing or empty prompt." });
    }
    if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "Missing userId." });
    }

    // ── Credit check ────────────────────────────────────────────────────
    const currentCredits = getCredits(userId);
    if (currentCredits <= 0) {
        return res.status(403).json({ error: "Free credits exhausted. Upgrade plan." });
    }

    // ── Pipeline ────────────────────────────────────────────────────────
    try {
        const prevState = continueSession ? designSessions[userId] : null;
        console.log(`\n===== ${prevState ? 'Iterative' : 'New'} Generation Request =====`);
        console.log(`User: ${userId} | Prompt: "${prompt}"`);

        // Step 1: AI → JSON design plan (passing prevState)
        console.log("[Step 1] Calling Gemini for design plan...");
        const designPlan = await generateDesignPlan(prompt, prevState);
        console.log("[Step 1] Design plan updated:", JSON.stringify(designPlan, null, 2));

        // Cache the session state
        designSessions[userId] = designPlan;

        // Step 2: JSON → OpenSCAD code
        console.log("[Step 2] Generating OpenSCAD code...");
        const scadCode = generateSCAD(designPlan);

        // STL Caching Logic: If the SCAD code is identical to a previous one, reuse the STL.
        // For now, we'll just use a hash or look at the ID.
        const fileId = uuidv4();
        const scadPath = path.join(outputsDir, `${fileId}.scad`);
        const stlPath = path.join(outputsDir, `${fileId}.stl`);

        fs.writeFileSync(scadPath, scadCode, "utf-8");
        console.log(`[Step 2] SCAD saved: ${scadPath}`);

        // Step 3: OpenSCAD CLI → STL
        console.log("[Step 3] Running OpenSCAD...");
        await runOpenSCAD(scadPath, stlPath);

        // Step 4: Deduct credit
        const deducted = deductCredit(userId);
        if (!deducted) {
            // Extremely unlikely race condition — still return the STL
            console.warn("[Credits] Deduction failed (possible race).");
        }
        const remainingCredits = getCredits(userId);

        console.log(`[Done] STL ready. Credits remaining: ${remainingCredits}`);

        // Step 5: Respond
        return res.json({
            message: "Success",
            stlUrl: `/outputs/${fileId}.stl`,
            scadUrl: `/outputs/${fileId}.scad`,
            designPlan,
            credits: remainingCredits,
        });
    } catch (err) {
        console.error("[Pipeline Error]", err);

        // Classify error for the frontend
        if (err.message.includes("OpenSCAD")) {
            return res.status(500).json({
                error: "CAD engine error. Make sure OpenSCAD is installed.",
                details: err.message,
            });
        }

        return res.status(500).json({
            error: "Generation failed. Please try again.",
            details: err.message,
        });
    }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`\n🚀 EnclosureAI server running on http://localhost:${PORT}`);
    console.log(`   OpenSCAD path: ${OPENSCAD_PATH}`);
    console.log(`   Outputs dir:   ${outputsDir}\n`);
});
