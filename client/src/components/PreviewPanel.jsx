import { motion } from 'framer-motion';
import { Download, FileCode, Maximize2, Layers, Cpu, Settings2, Info } from 'lucide-react';
import STLViewer from './STLViewer';
import { useState } from 'react';

export default function PreviewPanel({ result, stlUrl, scadUrl }) {
    const [wireframe, setWireframe] = useState(false);
    const [transparent, setTransparent] = useState(false);

    if (!result) return (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 glass-panel border-dashed p-12">
            <Cpu size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">Design will appear here</p>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full flex flex-col glass-panel overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/20">
                <h3 className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
                    <Settings2 size={16} className="text-brand-blue" />
                    Generation Result
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setWireframe(!wireframe)}
                        className={`p-2 rounded-lg transition-colors ${wireframe ? 'bg-brand-blue text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <Maximize2 size={16} />
                    </button>
                    <button
                        onClick={() => setTransparent(!transparent)}
                        className={`p-2 rounded-lg transition-colors ${transparent ? 'bg-brand-blue text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <Layers size={16} />
                    </button>
                </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 min-h-[400px] relative">
                <STLViewer url={stlUrl} wireframe={wireframe} transparent={transparent} />
            </div>

            {/* Stats & Actions */}
            <div className="p-6 bg-black/20 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Dimensions (Outer)</span>
                        <span className="text-xs font-mono text-white">
                            {Math.round(result.designPlan.dimensions.length + result.designPlan.wall_thickness * 2)}x{Math.round(result.designPlan.dimensions.width + result.designPlan.wall_thickness * 2)}x{Math.round(result.designPlan.dimensions.height + result.designPlan.wall_thickness)}mm
                        </span>
                    </div>
                    <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Wall Thickness</span>
                        <span className="text-xs font-mono text-white">{result.designPlan.wall_thickness}mm</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <a
                        href={stlUrl}
                        download
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                        <Download size={18} /> Download STL
                    </a>
                    <a
                        href={scadUrl}
                        download
                        className="flex items-center justify-center gap-2 px-5 py-3 glass-panel hover:bg-white/5 text-white rounded-xl font-bold text-sm transition-colors"
                    >
                        <FileCode size={18} />
                    </a>
                </div>
            </div>
        </motion.div>
    );
}
