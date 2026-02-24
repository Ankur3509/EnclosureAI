// =============================================================================
// App.jsx — Main UI for EnclosureAI
//
// Features:
//   • Device description textarea
//   • Generate button with pipeline status indicators
//   • Credit balance display
//   • STL & SCAD download links
//   • JSON design plan preview
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
    Box,
    Download,
    Zap,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    FileCode2,
    Cpu,
    Cog,
    FileDown,
} from "lucide-react";

const API_BASE = "http://localhost:5000";

// ---------------------------------------------------------------------------
// Generate a simple persistent userId (stored in localStorage)
// ---------------------------------------------------------------------------
function getUserId() {
    let id = localStorage.getItem("enclosure_ai_user_id");
    if (!id) {
        id = "user_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        localStorage.setItem("enclosure_ai_user_id", id);
    }
    return id;
}

const USER_ID = getUserId();

// ---------------------------------------------------------------------------
// Pipeline step definitions
// ---------------------------------------------------------------------------
const PIPELINE_STEPS = [
    { key: "ai", label: "Generating design plan with AI…", icon: Cpu },
    { key: "cad", label: "Converting to OpenSCAD code…", icon: FileCode2 },
    { key: "build", label: "Building 3D model…", icon: Cog },
    { key: "done", label: "STL ready for download", icon: FileDown },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function App() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [pipelineStep, setPipelineStep] = useState(-1); // -1 = idle
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [credits, setCredits] = useState(null); // null = loading

    // Fetch credits on mount
    useEffect(() => {
        axios
            .get(`${API_BASE}/api/credits/${USER_ID}`)
            .then((r) => setCredits(r.data.credits))
            .catch(() => setCredits(5)); // fallback
    }, []);

    // Simulate pipeline progress while waiting for the real response
    const animatePipeline = useCallback(() => {
        setPipelineStep(0);
        const timers = [];
        timers.push(setTimeout(() => setPipelineStep(1), 2500));
        timers.push(setTimeout(() => setPipelineStep(2), 4500));
        return () => timers.forEach(clearTimeout);
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return;

        setLoading(true);
        setError(null);
        setResult(null);

        const cancelAnimation = animatePipeline();

        try {
            const response = await axios.post(`${API_BASE}/api/generate`, {
                prompt: prompt.trim(),
                userId: USER_ID,
            });

            setPipelineStep(3); // done
            setResult(response.data);
            setCredits(response.data.credits);
        } catch (err) {
            cancelAnimation();
            setPipelineStep(-1);
            const msg =
                err.response?.data?.error ||
                "Something went wrong. Make sure the server is running.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            handleGenerate();
        }
    };

    const noCredits = credits !== null && credits <= 0;

    return (
        <div className="container">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <header>
                <Box size={44} strokeWidth={1.5} color="#60a5fa" className="logo-icon" />
                <h1>EnclosureAI</h1>
                <p className="subtitle">
                    Describe your electronic device — get a 3D-printable enclosure STL.
                </p>
            </header>

            {/* ── Main Card ───────────────────────────────────────────────── */}
            <main className="glass-card">
                <textarea
                    id="prompt-input"
                    className="prompt-input"
                    placeholder={`Describe your device…\n\ne.g. "A handheld case for Arduino Nano with front USB opening and ventilation holes."`}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    aria-label="Device description"
                />

                <button
                    id="generate-btn"
                    className="btn-primary"
                    onClick={handleGenerate}
                    disabled={loading || noCredits || !prompt.trim()}
                >
                    {loading ? (
                        <>
                            <div className="spinner" />
                            Generating…
                        </>
                    ) : (
                        <>
                            <Zap size={18} />
                            Generate 3D Enclosure
                        </>
                    )}
                </button>

                {/* Credits */}
                <div className="credits-badge">
                    <ShieldCheck size={14} />
                    <span>
                        <span className="credit-count">{credits ?? "…"}</span> generations remaining
                    </span>
                </div>

                {/* Pipeline Steps (visible while loading) */}
                {loading && (
                    <div className="pipeline-status">
                        {PIPELINE_STEPS.map((step, i) => {
                            const StepIcon = step.icon;
                            let cls = "pipeline-step";
                            if (i < pipelineStep) cls += " done";
                            else if (i === pipelineStep) cls += " active";
                            return (
                                <div key={step.key} className={cls}>
                                    <span className="pipeline-dot" />
                                    <StepIcon size={14} />
                                    <span>{step.label}</span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="status-msg error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="results-container">
                        <div className="status-msg success">
                            <CheckCircle2 size={18} />
                            <span>Your enclosure model is ready!</span>
                        </div>

                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                            <a
                                id="download-stl"
                                href={`${API_BASE}${result.stlUrl}`}
                                className="download-btn"
                                download
                            >
                                <Download size={18} />
                                Download STL
                            </a>

                            {result.scadUrl && (
                                <a
                                    id="download-scad"
                                    href={`${API_BASE}${result.scadUrl}`}
                                    className="download-btn"
                                    style={{ background: "linear-gradient(135deg, #8b5cf6, #a855f7)" }}
                                    download
                                >
                                    <FileCode2 size={18} />
                                    Download SCAD
                                </a>
                            )}
                        </div>

                        <div className="plan-preview">
                            <p>Design Specifications</p>
                            <pre>{JSON.stringify(result.designPlan, null, 2)}</pre>
                        </div>
                    </div>
                )}
            </main>

            {/* ── Footer ──────────────────────────────────────────────────── */}
            <footer>
                <span>Powered by Gemini Flash · OpenSCAD · React</span>
            </footer>
        </div>
    );
}
