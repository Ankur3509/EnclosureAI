import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, loginWithGoogle, getUserTrialStatus, incrementPromptCount } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Components
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import LandingPage from './components/LandingPage';
import PromptBox from './components/PromptBox';
import PreviewPanel from './components/PreviewPanel';
import { History, LayoutPanelLeft, Clock, Info, ShieldAlert } from 'lucide-react';

const API_BASE = "http://localhost:5000";

export default function App() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('landing'); // 'landing' or 'workspace'
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [trialData, setTrialData] = useState({ promptsUsed: 0 });
    const [history, setHistory] = useState([]);
    const [pipelineStep, setPipelineStep] = useState(0); // 0: idle, 1: reasoning, 2: cad, 3: stl

    // Auth Listener
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                const data = await getUserTrialStatus(u.email);
                setTrialData(data);
                setView('workspace'); // Auto-switch to workspace on login
            } else {
                setView('landing');
            }
        });
        return unsub;
    }, []);

    const handleGenerate = async (prompt) => {
        if (!user) {
            setError("Please sign in to generate designs.");
            return;
        }

        if (trialData.promptsUsed >= 5) {
            setError("Free trial limit reached (5 generations). More prompts coming soon.");
            return;
        }

        setLoading(true);
        setError(null);
        setPipelineStep(1);

        try {
            // Simulated pipeline steps for UI feedback
            setTimeout(() => setPipelineStep(2), 2000);
            setTimeout(() => setPipelineStep(3), 4500);

            const response = await axios.post(`${API_BASE}/api/generate`, {
                prompt,
                userId: user.email,
                continueSession: !!result
            });

            setResult(response.data);
            // Update trial count in Firestore and local state
            await incrementPromptCount(user.email);
            setTrialData(prev => ({ ...prev, promptsUsed: prev.promptsUsed + 1 }));

            // Add to history
            setHistory(prev => [{ prompt, date: new Date().toLocaleTimeString() }, ...prev]);
        } catch (err) {
            setError(err.response?.data?.error || "Pipeline failure. Check API status.");
        } finally {
            setLoading(false);
            setPipelineStep(0);
        }
    };

    return (
        <div className="min-h-screen font-sans">
            <AnimatedBackground />
            <Navbar user={user} onLogoClick={() => setView('landing')} />

            <AnimatePresence mode="wait">
                {view === 'landing' ? (
                    <motion.div
                        key="landing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <LandingPage onGetStarted={() => user ? setView('workspace') : loginWithGoogle()} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="workspace"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex h-[calc(100vh-80px)] mt-20 px-8 pb-8 gap-8 overflow-hidden"
                    >
                        {/* Left Sidebar - History */}
                        <div className="w-64 hidden lg:flex flex-col glass-panel overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-slate-500">
                                <Clock size={14} /> History
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {history.length === 0 ? (
                                    <div className="text-center py-10 text-slate-600 italic text-xs">No generations yet</div>
                                ) : (
                                    history.map((h, i) => (
                                        <div key={i} className="p-3 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
                                            <p className="text-xs text-white line-clamp-2 mb-1">{h.prompt}</p>
                                            <span className="text-[10px] text-slate-500">{h.date}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Free Trial</span>
                                    <span className="text-xs text-brand-blue font-bold">{trialData.promptsUsed}/5</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(trialData.promptsUsed / 5) * 100}%` }}
                                        className="h-full bg-brand-blue"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Center - Main Workspace */}
                        <div className="flex-1 flex flex-col items-center justify-center relative">
                            <div className="w-full max-w-4xl space-y-8 pb-20">
                                <div className="text-center space-y-4">
                                    <h2 className="text-4xl font-black font-display text-white">
                                        {result ? "Refining Design" : "New Creation"}
                                    </h2>
                                    <p className="text-slate-500 text-sm italic">"A snap-fit box for a 9V battery with top vent slits"</p>
                                </div>

                                <PromptBox
                                    onSend={handleGenerate}
                                    loading={loading}
                                    pipelineStep={pipelineStep}
                                    disabled={trialData.promptsUsed >= 5}
                                />

                                {error && (
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm mx-auto max-w-lg"
                                    >
                                        <ShieldAlert className="shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel - Preview */}
                        <div className="w-[450px] hidden xl:block">
                            <PreviewPanel
                                result={result}
                                stlUrl={result ? `${API_BASE}${result.stlUrl}` : null}
                                scadUrl={result ? `${API_BASE}${result.scadUrl}` : null}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest font-bold text-slate-600 pointer-events-none">
                &copy; 2026 Enclosure AI &bull; Built for Engineers
            </footer>
        </div>
    );
}
