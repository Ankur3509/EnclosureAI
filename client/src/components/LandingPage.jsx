import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Box, ShieldCheck, Cpu, Layers } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="pt-32 pb-24 px-8 overflow-y-auto">
            {/* Hero Section */}
            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="flex flex-col items-center text-center max-w-5xl mx-auto"
            >
                <motion.div
                    variants={item}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 border border-brand-blue/20 text-brand-blue text-xs font-bold uppercase tracking-widest mb-6"
                >
                    <Sparkles size={12} /> Powered by Llama 3.3
                </motion.div>

                <motion.h1
                    variants={item}
                    className="text-6xl md:text-8xl font-black font-display tracking-tight leading-[1.05] mb-8"
                >
                    Design Electronic <br />
                    <span className="text-gradient">Enclosures with AI</span>
                </motion.h1>

                <motion.p
                    variants={item}
                    className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed"
                >
                    Skip the CAD software. Describe your device in plain English and get
                    production-ready 3D printable STL files in seconds.
                </motion.p>

                <motion.div variants={item}>
                    <button
                        onClick={onGetStarted}
                        className="group flex items-center gap-3 px-10 py-5 bg-brand-blue hover:bg-blue-600 text-white rounded-2xl font-black text-lg transition-all shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95"
                    >
                        Launch Workspace <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </motion.div>

            {/* Feature Section */}
            <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <FeatureCard
                    icon={<Cpu className="w-8 h-8 text-brand-blue" />}
                    title="Parametric Reasoning"
                    description="AI understands mechanical constraints, adding wall thickness and clearances automatically."
                />
                <FeatureCard
                    icon={<Box className="w-8 h-8 text-brand-purple" />}
                    title="Instant 3D Preview"
                    description="Inspect your generated enclosure in a full 3D interactive viewer before downloading."
                />
                <FeatureCard
                    icon={<Layers className="w-8 h-8 text-brand-cyan" />}
                    title="Production Ready"
                    description="Download STL for direct 3D printing or SCAD to fine-tune in OpenSCAD."
                />
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 glass-panel hover:bg-white/[0.05] transition-colors group cursor-default"
        >
            <div className="mb-6 p-4 bg-white/[0.03] rounded-2xl w-fit group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-display">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
}
