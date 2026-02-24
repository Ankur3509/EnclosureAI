import { useState, useEffect, useCallback, useRef } from "react";
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
    MessageSquare,
    Maximize2,
    Layers,
    Settings,
} from "lucide-react";
import STLViewer from "./components/STLViewer";

const API_BASE = "http://localhost:5000";

function getUserId() {
    let id = localStorage.getItem("enclosure_ai_user_id");
    if (!id) {
        id = "user_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        localStorage.setItem("enclosure_ai_user_id", id);
    }
    return id;
}

const USER_ID = getUserId();

export default function App() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [credits, setCredits] = useState(null);

    // Design UI controls
    const [wireframe, setWireframe] = useState(false);
    const [transparent, setTransparent] = useState(false);

    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchCredits();
    }, []);

    const fetchCredits = async () => {
        try {
            const resp = await axios.get(`${API_BASE}/api/credits/${USER_ID}`);
            setCredits(resp.data.credits);
        } catch (err) {
            setCredits(5);
        }
    };

    const handleGenerate = async (isReprompt = false) => {
        if (!prompt.trim() || loading) return;

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_BASE}/api/generate`, {
                prompt: prompt.trim(),
                userId: USER_ID,
                continueSession: isReprompt // Flag for iterative chain
            });

            setResult(response.data);
            setCredits(response.data.credits);
            setPrompt(""); // Clear prompt for next iteration
        } catch (err) {
            setError(err.response?.data?.error || "Generation failed. Check server connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <header>
                <Box size={40} color="#60a5fa" className="logo-icon" />
                <h1>EnclosureAI <span style={{ fontSize: '0.4em', verticalAlign: 'middle', background: 'rgba(96, 165, 250, 0.2)', padding: '4px 8px', borderRadius: '4px', color: '#60a5fa' }}>PRO</span></h1>
                <p className="subtitle">Iterative Parametric Design Engine</p>
            </header>

            <main className="glass-card" style={{ maxWidth: '900px' }}>

                {/* 3D Preview Section */}
                {result ? (
                    <div className="preview-section">
                        <div className="viewer-controls">
                            <button onClick={() => setWireframe(!wireframe)} className={wireframe ? 'active' : ''}>
                                <Maximize2 size={16} /> Wireframe
                            </button>
                            <button onClick={() => setTransparent(!transparent)} className={transparent ? 'active' : ''}>
                                <Layers size={16} /> Transparent
                            </button>
                        </div>

                        <STLViewer
                            url={`${API_BASE}${result.stlUrl}`}
                            wireframe={wireframe}
                            transparent={transparent}
                        />

                        <div className="specs-grid">
                            <div className="spec-item">
                                <span className="label">Outer Dimensions</span>
                                <span className="value">
                                    {Math.round(result.designPlan.dimensions.length + result.designPlan.wall_thickness * 2)} x {Math.round(result.designPlan.dimensions.width + result.designPlan.wall_thickness * 2)} x {Math.round(result.designPlan.dimensions.height + result.designPlan.wall_thickness)} mm
                                </span>
                            </div>
                            <div className="spec-item">
                                <span className="label">Wall Thickness</span>
                                <span className="value">{result.designPlan.wall_thickness} mm</span>
                            </div>
                            <div className="spec-item">
                                <span className="label">Lid Style</span>
                                <span className="value">{result.designPlan.lid.style}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="empty-state">
                        <Cpu size={60} style={{ opacity: 0.2, marginBottom: '20px' }} />
                        <p>Describe your device to begin the design process.</p>
                    </div>
                )}

                {/* Action Board */}
                <div className="action-board">
                    <div className="input-row">
                        <textarea
                            className="prompt-input"
                            style={{ minHeight: '80px', marginBottom: '0' }}
                            placeholder={result ? "Refine design... (e.g. 'Make it 5mm taller' or 'Add vents')" : "Describe your device..."}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            disabled={loading}
                        />
                        <button
                            className="btn-primary"
                            style={{ width: 'auto', padding: '0 2rem' }}
                            onClick={() => handleGenerate(!!result)}
                            disabled={loading || credits <= 0 || !prompt.trim()}
                        >
                            {loading ? <div className="spinner" /> : (result ? <Zap size={20} /> : "Design")}
                        </button>
                    </div>

                    <div className="meta-row">
                        <div className="credits-badge" style={{ marginTop: 0 }}>
                            <ShieldCheck size={14} /> <span>{credits ?? "..."} iterations left</span>
                        </div>

                        {result && (
                            <div className="download-row">
                                <a href={`${API_BASE}${result.stlUrl}`} download className="mini-btn">
                                    <Download size={14} /> STL
                                </a>
                                <a href={`${API_BASE}${result.scadUrl}`} download className="mini-btn">
                                    <FileCode2 size={14} /> SCAD
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="status-msg error">
                        <AlertCircle size={18} /> <span>{error}</span>
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .preview-section { margin-bottom: 2rem; }
        .viewer-controls { display: flex; gap: 10px; margin-bottom: 10px; justify-content: flex-end; }
        .viewer-controls button { 
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); 
          color: #94a3b8; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;
          display: flex; align-items: center; gap: 6px; transition: all 0.2s;
        }
        .viewer-controls button.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        
        .specs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px; }
        .spec-item { background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; text-align: left; }
        .spec-item .label { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .spec-item .value { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; }
        
        .action-board { background: rgba(0,0,0,0.2); padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
        .input-row { display: flex; gap: 1rem; }
        .meta-row { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
        .download-row { display: flex; gap: 8px; }
        
        .mini-btn { 
          background: rgba(255,255,255,0.1); color: white; text-decoration: none; font-size: 0.75rem; 
          padding: 6px 12px; border-radius: 6px; display: flex; align-items: center; gap: 4px; font-weight: 600;
        }
        .mini-btn:hover { background: #3b82f6; }
        
        .empty-state { padding: 4rem 0; opacity: 0.5; }
      `}} />
        </div>
    );
}
