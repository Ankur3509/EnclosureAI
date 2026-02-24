import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Command, CheckCircle2 } from 'lucide-react';

export default function PromptBox({ onSend, loading, pipelineStep, disabled, initialPrompt = "" }) {
    const [text, setText] = useState(initialPrompt);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    const handleSubmit = () => {
        if (text.trim() && !loading && !disabled) {
            onSend(text.trim());
            setText("");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSubmit();
        }
    };

    const steps = [
        { id: 1, label: "AI Reasoning" },
        { id: 2, label: "CAD Generation" },
        { id: 3, label: "3D Simulation" }
    ];

    return (
        <div className="relative w-full max-w-4xl mx-auto">
            <motion.div
                layout
                className="relative flex flex-col glass-panel p-4 shadow-2xl neon-glow"
            >
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe your enclosure... (e.g., 'A desktop case for Arduino Uno with top vents')"
                    className="w-full bg-transparent text-lg text-white placeholder-slate-500 outline-none resize-none px-2 py-1 max-h-[300px]"
                    disabled={loading || disabled}
                />

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                    <div className="flex flex-col gap-2">
                        {loading ? (
                            <div className="flex gap-4">
                                {steps.map((s) => (
                                    <div key={s.id} className="flex items-center gap-1.5 grayscale transition-all duration-500"
                                        style={{ filter: pipelineStep >= s.id ? 'grayscale(0)' : 'grayscale(1)', opacity: pipelineStep >= s.id ? 1 : 0.4 }}>
                                        {pipelineStep > s.id ? (
                                            <CheckCircle2 size={12} className="text-brand-cyan" />
                                        ) : (
                                            <div className={`w-2 h-2 rounded-full ${pipelineStep === s.id ? 'bg-brand-blue animate-pulse' : 'bg-slate-600'}`} />
                                        )}
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${pipelineStep === s.id ? 'text-brand-blue' : 'text-slate-500'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex gap-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Command size={10} /> + ENTER to generate</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!text.trim() || loading || disabled}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all
              ${text.trim() && !loading && !disabled
                                ? 'bg-brand-blue text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="text-sm">Processing...</span>
                            </div>
                        ) : (
                            <>
                                <span className="text-sm">Generate</span>
                                <Sparkles size={16} />
                            </>
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Example badge suggests */}
            <AnimatePresence>
                {!text && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-wrap gap-2 mt-4 justify-center"
                    >
                        {["ESP32 Wall Mount", "Raspberry Pi 5 Desktop", "Snap-fit Battery Box"].map((sample) => (
                            <button
                                key={sample}
                                onClick={() => setText(sample)}
                                className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-slate-400 rounded-full border border-white/5 transition-colors"
                            >
                                {sample}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
