import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const STEPS = [
    {
        id: 'level',
        question: '¿Cuál es tu nivel actual de ajedrez?',
        options: [
            { value: 'beginner', label: 'Principiante (<1000 ELO)', desc: 'Conozco las reglas pero quiero mejorar mi visión.' },
            { value: 'intermediate', label: 'Intermedio (1000-1800 ELO)', desc: 'Juego torneos o online regularmente.' },
            { value: 'advanced', label: 'Avanzado (>1800 ELO)', desc: 'Busco perfeccionar mi repertorio y estrategia.' }
        ]
    },
    {
        id: 'goal',
        question: '¿Qué es lo que más quieres mejorar?',
        options: [
            { value: 'tactics', label: 'Táctica y Cálculo', desc: 'No dejarme piezas y ver combinaciones.' },
            { value: 'openings', label: 'Aperturas', desc: 'Construir un repertorio sólido.' },
            { value: 'endgame', label: 'Finales', desc: 'Convertir ventajas en victorias.' },
            { value: 'strategy', label: 'Estrategia Posicional', desc: 'Entender los planes a largo plazo.' },
            { value: 'psychology', label: 'Psicología', desc: 'Manejo de nervios y competición.' }
        ]
    },
    {
        id: 'style',
        question: '¿Qué estilo de enseñanza prefieres?',
        options: [
            { value: 'analytical', label: 'Analítico y Riguroso', desc: 'Mucho análisis profundo y estudio serio.' },
            { value: 'dynamic', label: 'Dinámico y Divertido', desc: 'Clases rápidas, prácticas y entretenidas.' },
            { value: 'patient', label: 'Paciente y Comprensivo', desc: 'Ir paso a paso sin prisas.' }
        ]
    }
];

const MatchWizard = ({ onComplete, onCancel }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});

    const handleSelect = (value) => {
        const stepId = STEPS[currentStep].id;
        setAnswers(prev => {
            const current = prev[stepId] || [];
            if (current.includes(value)) {
                return { ...prev, [stepId]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [stepId]: [...current, value] };
            }
        });
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
    const canIsNext = answers[step.id] && answers[step.id].length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-bg/95 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-dark-panel border border-gold/20 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col relative">

                {/* Progress Bar */}
                <div className="h-1 bg-white/5 w-full">
                    <div
                        className="h-full bg-gold transition-all duration-300 ease-out shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                    ></div>
                </div>

                <div className="p-8 flex flex-col h-full">
                    <button onClick={onCancel} className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors">
                        ✕
                    </button>

                    <div className="mb-8">
                        <span className="text-gold text-xs font-bold uppercase tracking-widest mb-2 block">
                            Paso {currentStep + 1} de {STEPS.length}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                            {step.question}
                        </h2>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                        {step.options.map((opt) => {
                            const isSelected = answers[step.id]?.includes(opt.value);
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => handleSelect(opt.value)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden
                                    ${isSelected
                                            ? 'bg-gold/10 border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                            : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                        }
                                `}
                                >
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div>
                                            <div className={`font-bold text-lg mb-1 ${isSelected ? 'text-gold' : 'text-white'}`}>
                                                {opt.label}
                                            </div>
                                            <div className="text-sm text-text-secondary font-light">
                                                {opt.desc}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-black shadow-lg">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <button
                            onClick={handleBack}
                            className="text-text-muted hover:text-white px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1"
                        >
                            <ChevronLeft size={16} /> Atrás
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!canIsNext}
                            className={`px-8 py-3 rounded-full font-bold uppercase text-xs tracking-widest transition-all flex items-center gap-2
                                ${canIsNext
                                    ? 'bg-gold text-black hover:bg-gold-hover shadow-lg hover:shadow-gold/20 transform hover:-translate-y-0.5'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                                }
                            `}
                        >
                            {currentStep === STEPS.length - 1 ? 'Encontrar Match' : 'Siguiente'}
                            {currentStep < STEPS.length - 1 && <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchWizard;
