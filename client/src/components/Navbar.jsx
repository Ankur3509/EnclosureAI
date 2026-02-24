import { motion } from 'framer-motion';
import { Box, LogIn, LogOut, User } from 'lucide-react';
import { loginWithGoogle, logout } from '../firebase';

export default function Navbar({ user, onLogoClick }) {
    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-background/50 backdrop-blur-xl border-b border-white/5"
        >
            <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={onLogoClick}
            >
                <div className="p-2 bg-brand-blue/10 rounded-lg group-hover:bg-brand-blue/20 transition-colors">
                    <Box className="w-6 h-6 text-brand-blue" />
                </div>
                <span className="text-xl font-bold font-display tracking-tight text-white">
                    Enclosure<span className="text-brand-blue">AI</span>
                </span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                <a href="#" className="hover:text-white transition-colors">Home</a>
                <a href="#workspace" className="hover:text-white transition-colors">Workspace</a>
                <a href="#" className="flex items-center gap-1 group">
                    Pricing
                    <span className="px-1.5 py-0.5 text-[10px] bg-brand-purple/20 text-brand-purple rounded-md group-hover:bg-brand-purple/30 transition-colors">SOON</span>
                </a>
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-semibold text-white">{user.displayName}</span>
                            <button
                                onClick={logout}
                                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
                            >
                                <LogOut size={10} /> Logout
                            </button>
                        </div>
                        <img
                            src={user.photoURL}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full border border-white/10 shadow-lg"
                        />
                    </div>
                ) : (
                    <button
                        onClick={loginWithGoogle}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-blue text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <LogIn size={16} /> Sign In
                    </button>
                )}
            </div>
        </motion.nav>
    );
}
