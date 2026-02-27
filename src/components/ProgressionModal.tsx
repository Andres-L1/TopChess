import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Unlock, TrendingUp } from 'lucide-react';
import { TEACHER_TIERS, TeacherTier } from '../utils/progression';

interface ProgressionModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentEarnings: number;
}

const ProgressionModal: React.FC<ProgressionModalProps> = ({ isOpen, onClose, currentEarnings }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#0A0A0F] shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5 p-6 md:p-8 flex justify-between items-start">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-bold uppercase tracking-widest mb-3">
                                <TrendingUp className="w-4 h-4" />
                                Roadmap de Academia
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Progresión de Niveles
                            </h2>
                            <p className="text-white/50 text-sm mt-2 max-w-xl font-medium">
                                A medida que generes más ingresos, tu Aula Virtual se expandirá y desbloquearás nuevas funcionalidades exclusivas para tus alumnos.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                        <div className="relative border-l-2 border-white/10 ml-6 md:ml-8 space-y-12 pb-8">
                            {TEACHER_TIERS.map((tier, index) => {
                                const isUnlocked = currentEarnings >= tier.minEarnings;
                                const isNext = currentEarnings < tier.minEarnings && (index === 0 || currentEarnings >= TEACHER_TIERS[index - 1].minEarnings);

                                return (
                                    <div key={tier.tier} className="relative pl-8 md:pl-12">
                                        {/* Timeline Node */}
                                        <div
                                            className={`absolute -left-[17px] top-6 w-8 h-8 rounded-full border-4 border-[#0A0A0F] flex items-center justify-center transition-all duration-500`}
                                            style={{ backgroundColor: isUnlocked ? tier.color : '#333' }}
                                        >
                                            {isUnlocked ? (
                                                <Unlock className="w-3 h-3 text-[#0A0A0F]" />
                                            ) : (
                                                <Lock className="w-3 h-3 text-white/50" />
                                            )}
                                        </div>

                                        {/* Card */}
                                        <div
                                            className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-500 ${isUnlocked ? 'bg-gradient-to-br from-white/5 to-transparent border border-white/10' : 'bg-white/5 border border-white/5 opacity-60 grayscale'}`}
                                            style={{ boxShadow: isUnlocked ? `0 10px 40px -10px ${tier.glowColor}` : 'none' }}
                                        >
                                            {isNext && (
                                                <div className="absolute top-0 right-0 px-4 py-1 bg-white/10 text-white rounded-bl-xl text-[10px] font-black uppercase tracking-widest">
                                                    Siguiente
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row gap-6">
                                                <div className="flex-shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl bg-[#0A0A0F] border border-white/5 text-5xl">
                                                    {tier.buildingEmoji}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-end gap-3 mb-2">
                                                        <h3 className="text-2xl font-black" style={{ color: isUnlocked ? tier.color : '#fff' }}>
                                                            {tier.name}
                                                        </h3>
                                                        <div className="text-sm font-bold text-white/40 pb-1">
                                                            {tier.minEarnings === 0 ? 'Gratis' : `Desde ${tier.minEarnings.toLocaleString('es-ES')}€`}
                                                        </div>
                                                    </div>
                                                    <p className="text-white/60 text-sm font-medium mb-4">
                                                        {tier.title}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2">
                                                        {tier.perks.map((perk, i) => (
                                                            <div
                                                                key={i}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
                                                                style={{
                                                                    backgroundColor: isUnlocked ? `${tier.color}15` : 'rgba(255,255,255,0.05)',
                                                                    color: isUnlocked ? tier.color : 'rgba(255,255,255,0.4)',
                                                                    border: `1px solid ${isUnlocked ? `${tier.color}30` : 'transparent'}`
                                                                }}
                                                            >
                                                                <span>✓</span> {perk}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProgressionModal;
