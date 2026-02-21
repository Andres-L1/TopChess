import React from 'react';
import { Trophy, Target, Flame, Star, Award, Zap } from 'lucide-react';

export const StudentStats: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Level & XP Box */}
            <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-[#1a1917] to-gold/5 border-gold/20 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gold/20 transition-all duration-500"></div>
                <div className="flex items-center gap-4 mb-5 relative z-10">
                    <div className="relative">
                        <svg className="w-14 h-14 transform -rotate-90">
                            <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                            <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="163" strokeDashoffset="40" className="text-gold DropShadow transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-gold font-black">
                            L5
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black text-gold uppercase tracking-widest mb-1">Rango Actual</h4>
                        <p className="text-lg font-bold text-white leading-none">Aprendiz Bronce</p>
                    </div>
                </div>
                <div className="space-y-2 relative z-10">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-text-muted">Progreso Nivel 6</span>
                        <span className="text-gold">750/1000 XP</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-gradient-to-r from-gold to-yellow-300 rounded-full w-[75%] shadow-[0_0_10px_rgba(255,215,0,0.5)]"></div>
                    </div>
                </div>
            </div>

            {/* Daily Mission */}
            <div className="glass-panel p-6 rounded-3xl border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-500"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        <Target size={24} />
                    </div>
                    <span className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-black text-blue-400 uppercase tracking-widest">Misión Diaria</span>
                </div>
                <div className="relative z-10">
                    <p className="text-sm font-bold text-white mb-3">Resuelve 5 Tácticas</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-blue-400 w-[60%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        </div>
                        <span className="text-[11px] text-white font-black bg-white/10 px-2 py-0.5 rounded">3/5</span>
                    </div>
                    <p className="text-[10px] text-blue-400/70 mt-3 font-bold">+50 XP al completar</p>
                </div>
            </div>

            {/* Streak */}
            <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-[#1a1917] to-orange-500/5 border-orange-500/20 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/20 transition-all duration-500"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)] animate-pulse">
                        <Flame size={24} />
                    </div>
                    <span className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-black text-orange-500 uppercase tracking-widest">Racha Activa</span>
                </div>
                <div className="relative z-10">
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-black text-white drop-shadow-md">7</span>
                        <span className="text-sm font-bold text-orange-500">Días</span>
                    </div>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((day, i) => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 7 ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'bg-white/10'}`}></div>
                        ))}
                    </div>
                    <p className="text-[10px] text-text-muted mt-3 font-medium">¡Estás on fire! 1 día más para bono.</p>
                </div>
            </div>

            {/* Recent Badges */}
            <div className="glass-panel p-6 rounded-3xl border-white/5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-500"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Award size={24} />
                    </div>
                    <span className="px-2 py-1 bg-white/5 rounded-md text-[9px] font-black text-purple-400 uppercase tracking-widest">Logros Reclutados</span>
                </div>
                <div className="relative z-10">
                    <div className="flex gap-3 mb-2">
                        <div title="Primera Victoria" className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-lg border-2 border-yellow-200/50 transform hover:scale-110 transition-transform">
                            <Star size={18} className="text-white fill-white" />
                        </div>
                        <div title="Táctico Rápido" className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center shadow-lg border-2 border-blue-300/50 transform hover:scale-110 transition-transform">
                            <Zap size={18} className="text-white fill-white" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 border-dashed flex items-center justify-center text-white/20">
                            <Award size={18} />
                        </div>
                    </div>
                    <p className="text-[10px] text-text-muted mt-3 font-medium cursor-pointer hover:text-white transition-colors">Ver vitrina de trofeos →</p>
                </div>
            </div>
        </div>
    );
};
