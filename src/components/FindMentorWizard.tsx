import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Search, Sparkles } from 'lucide-react';

const STEPS = [
    {
        id: 'level',
        question: '¿Cuál es tu nivel actual?',
        options: [
            { value: 'beginner', label: 'Principiante', desc: 'Conozco las piezas y poco más.', icon: '👶' },
            { value: 'intermediate', label: 'Intermedio', desc: 'Juego torneos o online (1000-1600 ELO).', icon: '⚔️' },
            { value: 'advanced', label: 'Avanzado', desc: 'Jugador fuerte de club (>1700 ELO).', icon: '🏆' }
        ]
    },
    {
        id: 'goal',
        question: '¿Qué quieres mejorar?',
        options: [
            { value: 'tactics', label: 'Táctica y Cálculo', desc: 'Dejar de colgarme piezas.', icon: '⚡' },
            { value: 'strategy', label: 'Estrategia y Posicional', desc: 'Planes a largo plazo.', icon: '🧠' },
            { value: 'openings', label: 'Aperturas', desc: 'Tener un repertorio sólido.', icon: '📖' }
        ]
    },
    {
        id: 'style',
        question: '¿Cómo prefieres aprender?',
        options: [
            { value: 'analytical', label: 'Análisis Profundo', desc: 'Estudio serio de variantes.', icon: '🔬' },
            { value: 'dynamic', label: 'Práctica y Juego', desc: 'Mucho juego y feedback rápido.', icon: '🎮' },
            { value: 'mixed', label: 'Equilibrado', desc: 'Un poco de teoría y práctica.', icon: '⚖️' }
        ]
    }
];

interface FindMentorWizardProps {
    onComplete: (answers: Record<string, string>) => void;
    onCancel: () => void;
}

const FindMentorWizard = ({ onComplete, onCancel }: FindMentorWizardProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const handleSelect = (value: string) => {
        const stepId = STEPS[currentStep].id;
        setAnswers((prev) => ({ ...prev, [stepId]: value }));
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete(answers);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        } else {
            onCancel();
        }
    };

    const step = STEPS[currentStep];
    const canIsNext = answers[step.id];

    return (
        <div className="w-full bg-[#262421] border border-white/5 rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-white/5 flex">
                {STEPS.map((_, i) => (
                    <div
                        key={i}
                        className={`h-full transition-all duration-500 ${i <= currentStep ? 'bg-gold' : 'bg-transparent'}`}
                        style={{ width: `${100 / STEPS.length}%` }}
                    />
                ))}
            </div>

            <div className="p-8 flex flex-col h-full flex-1">
                <div className="mb-8">
                    <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest mb-2">
                        <Sparkles size={14} /> Paso {currentStep + 1} de {STEPS.length}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {step.question}
                    </h2>
                </div>

                <div className="space-y-3 flex-1">
                    {step.options.map((opt: { value: string, label: string, desc: string, icon?: string }) => {
                        const isSelected = answers[step.id] === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4
                                    ${isSelected
                                        ? 'bg-gold/10 border-gold/50 shadow-lg shadow-gold/5'
                                        : 'bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10'
                                    }
                                `}
                            >
                                <span className="text-3xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                                <div className="flex-1">
                                    <div className={`font-bold text-lg ${isSelected ? 'text-gold' : 'text-white'}`}>
                                        {opt.label}
                                    </div>
                                    <div className="text-sm text-text-muted">
                                        {opt.desc}
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-black">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-between items-center mt-12 pt-6 border-t border-white/5">
                    <button
                        onClick={handleBack}
                        className="text-text-muted hover:text-white px-6 py-2 text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                        {currentStep === 0 ? 'Cancelar' : 'Atrás'}
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!canIsNext}
                        className={`px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest transition-all
                            ${canIsNext
                                ? 'bg-gold text-black hover:bg-gold-hover shadow-xl hover:shadow-gold/20'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'
                            }
                        `}
                    >
                        {currentStep === STEPS.length - 1 ? 'Encontrar Profesor' : 'Siguiente'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FindMentorWizard;
