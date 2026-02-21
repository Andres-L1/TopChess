import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, GraduationCap } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const STEPS = [
    {
        id: 'level',
        question: '¿Cuál es tu nivel aproximado de ajedrez?',
        options: [
            { value: 'beginner', label: 'Principiante', desc: 'Conozco las reglas, pocas partidas.' },
            { value: 'intermediate', label: 'Intermedio (Club)', desc: 'Juego torneos o online frecuentemente (1000-1500 ELO).' },
            { value: 'advanced', label: 'Avanzado', desc: 'Jugador de torneo fuerte (>1500 ELO).' }
        ]
    },
    {
        id: 'goals',
        question: '¿Qué aspecto quieres mejorar más?',
        options: [
            { value: 'tactics', label: 'Táctica y Cálculo', desc: 'Dejar de cometer errores graves.' },
            { value: 'openings', label: 'Aperturas', desc: 'Tener un plan sólido al inicio.' },
            { value: 'endgame', label: 'Finales', desc: 'Ganar partidas igualadas.' },
            { value: 'strategy', label: 'Estrategia', desc: 'Planes a largo plazo y posicionamiento.' }
        ]
    },
    {
        id: 'style',
        question: '¿Cómo prefieres las clases?',
        options: [
            { value: 'active', label: 'Práctica Activa', desc: 'Jugar, analizar y resolver ejercicios.' },
            { value: 'theory', label: 'Teoría y Análisis', desc: 'Estudiar partidas y conceptos profundos.' },
            { value: 'mixed', label: 'Híbrido', desc: 'Un poco de todo.' }
        ]
    },
    {
        id: 'theme',
        question: 'Elige tu tablero inicial',
        options: [
            { value: 'classic', label: 'Clásico madera', desc: 'El tablero tradicional de toda la vida.' },
            { value: 'dark', label: 'Modo Oscuro', desc: 'Tablero minimalista, ideal para la vista.' },
            { value: 'glass', label: 'Cristal Premium', desc: 'El estilo exclusivo de TopChess.' }
        ]
    }
];

const StudentWizard = ({ onComplete }: { onComplete: () => void }) => {
    const { currentUserId, currentUser, setUserRole } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = (value: string) => {
        const stepId = STEPS[currentStep].id;
        // Single choice for simplicity in student wizard, except maybe goals? Let's do single for now as per design
        setAnswers((prev: any) => ({ ...prev, [stepId]: value }));
    };

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // FINISH
            setIsSubmitting(true);
            try {
                const userProfile = {
                    id: currentUserId,
                    email: currentUser?.email || '',
                    name: currentUser?.displayName || 'Estudiante',
                    role: 'student' as const,
                    photoURL: currentUser?.photoURL || '',
                    createdAt: Date.now(),
                    walletBalance: 0,
                    currency: 'EUR',
                    elo: answers['level'] === 'beginner' ? 600 : answers['level'] === 'intermediate' ? 1200 : 1600,
                    learningGoals: [answers['goals']], // Wrap in array as type expects array
                    preferredStyle: answers['style'],
                    boardTheme: answers['theme'] || 'glass'
                };

                await firebaseService.createUser(userProfile);
                setUserRole('student');

                toast.success("¡Perfil de estudiante creado!");
                onComplete();
            } catch (error) {
                console.error("Error creating student profile:", error);
                toast.error("Error al crear perfil");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const step = STEPS[currentStep];
    const canIsNext = answers[step.id];

    return (
        <div className="w-full bg-[#262421] border border-[#302e2b] rounded-2xl shadow-2xl overflow-hidden flex flex-col h-auto md:h-[600px]">
            {/* Header */}
            <div className="bg-[#1e1d1b] p-6 border-b border-[#302e2b] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <GraduationCap size={16} />
                    </div>
                    <span className="font-bold text-white">Configuración de Alumno</span>
                </div>
                <div className="flex gap-1">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 w-6 rounded-full transition-colors ${i <= currentStep ? 'bg-blue-500' : 'bg-[#302e2b]'}`}
                        />
                    ))}
                </div>
            </div>

            <div className="p-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {step.question}
                    </h2>
                </div>

                <div className="grid gap-3 max-w-md mx-auto w-full">
                    {step.options.map((opt: { value: string, label: string, desc: string, icon?: string }) => {
                        const isSelected = answers[step.id] === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative
                                    ${isSelected
                                        ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                        : 'bg-[#302e2b]/50 border-transparent hover:border-[#403d39] hover:bg-[#302e2b]'
                                    }
                                `}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className={`font-bold text-lg ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                                            {opt.label}
                                        </div>
                                        <div className="text-sm text-[#8b8982]">
                                            {opt.desc}
                                        </div>
                                    </div>
                                    {isSelected && <Check size={20} className="text-blue-400" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-auto pt-8 flex justify-between items-center max-w-md mx-auto w-full">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`text-[#8b8982] hover:text-white px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1
                            ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}
                        `}
                    >
                        <ChevronLeft size={16} /> Atrás
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!canIsNext || isSubmitting}
                        className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2
                            ${canIsNext
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                : 'bg-[#302e2b] text-[#666] cursor-not-allowed'
                            }
                        `}
                    >
                        {isSubmitting ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {currentStep === STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
                                {currentStep < STEPS.length - 1 && <ChevronRight size={16} />}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentWizard;
