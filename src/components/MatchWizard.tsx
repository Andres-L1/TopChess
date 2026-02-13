import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Globe, TrendingUp, DollarSign } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const STEPS = [
    {
        id: 'region',
        question: '¿Desde dónde enseñarás?',
        subtitle: 'Esto determinará tu tarifa base y moneda.',
        options: [
            { value: 'EU', label: 'España / Europa', desc: 'Tarifa Mensual: 59€ / alumno', icon: '🇪🇺' },
            { value: 'LATAM', label: 'Latinoamérica / Internacional', desc: 'Tarifa Mensual: $39 USD / alumno', icon: '🌎' }
        ]
    },
    {
        id: 'experience',
        question: 'Tu experiencia en Ajedrez',
        subtitle: 'Para asignarte el nivel de alumnos adecuado.',
        options: [
            { value: 'master', label: 'Maestro (2000+ ELO)', desc: 'Titulado FIDE o experto online.' },
            { value: 'coach', label: 'Instructor (1500-2000 ELO)', desc: 'Jugador de club con experiencia enseñando.' },
            { value: 'monitor', label: 'Monitor (<1500 ELO)', desc: 'Ideal para iniciación y niños.' }
        ]
    },
    {
        id: 'style',
        question: '¿Cuál es tu estilo de enseñanza?',
        options: [
            { value: 'analytical', label: 'Analítico y Riguroso', desc: 'Mucho análisis profundo y estudio serio.' },
            { value: 'dynamic', label: 'Dinámico y Divertido', desc: 'Clases rápidas, prácticas y entretenidas.' },
            { value: 'patient', label: 'Paciente y Comprensivo', desc: 'Ir paso a paso sin prisas.' }
        ]
    }
];

const MatchWizard = ({ onComplete }: { onComplete: () => void }) => {
    const { currentUserId, currentUser } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<any>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = (value: string) => {
        const stepId = STEPS[currentStep].id;
        // Single choice logic
        setAnswers((prev: any) => ({ ...prev, [stepId]: value }));
    };

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // FINISH
            setIsSubmitting(true);
            try {
                const region = answers['region'];
                const price = region === 'EU' ? 59 : 39;
                const currency = region === 'EU' ? 'EUR' : 'USD';

                // Map answers to Teacher Profile
                const profile = {
                    id: currentUserId,
                    name: currentUser?.displayName || 'Profesor',
                    elo: answers['experience'] === 'master' ? 2200 : answers['experience'] === 'coach' ? 1700 : 1400,
                    price: price,
                    currency: currency as 'EUR' | 'USD',
                    region: region as 'EU' | 'LATAM' | 'OTHER',
                    commissionRate: 0.5, // Start at 50%
                    classesGiven: 0,
                    earnings: 0,
                    description: `Profesor especializado en metodología ${answers['style']}.`,
                    image: currentUser?.photoURL || 'https://via.placeholder.com/150',
                    tags: [answers['style'], answers['experience']],
                    teachingStyle: answers['style'],
                    curriculum: 'Personalizado basándome en tus objetivos.',
                    experienceYears: answers['experience'] === 'master' ? 10 : 2,
                    achievements: []
                };

                await firebaseService.createTeacherProfile(profile);

                // Ensure user doc exists in 'users' collection
                const existingUser = await firebaseService.getUser(currentUserId);
                if (existingUser) {
                    await firebaseService.updateUser(currentUserId, { role: 'teacher' });
                } else {
                    // Create new user doc if it doesn't exist
                    const newUser = {
                        id: currentUserId,
                        email: currentUser?.email || '',
                        name: currentUser?.displayName || 'Profesor',
                        role: 'teacher' as const,
                        photoURL: currentUser?.photoURL || '',
                        createdAt: Date.now(),
                        walletBalance: 0,
                        currency: 'EUR'
                    };
                    await firebaseService.createUser(newUser);
                }

                toast.success("¡Perfil de Profesor creado!");
                onComplete();
            } catch (error) {
                console.error("Error creating profile:", error);
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
        <div className="w-full bg-[#262421] border border-gold/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative h-[650px] md:h-auto md:min-h-[600px]">

            {/* Gamification Banner */}
            <div className="bg-gradient-to-r from-gold/20 to-[#262421] p-4 flex items-center gap-3 border-b border-gold/10">
                <div className="bg-gold text-black rounded-full p-1.5 shadow-lg shadow-gold/20">
                    <TrendingUp size={16} />
                </div>
                <div>
                    <div className="text-gold font-bold text-sm">Sistema de Progresión Activo</div>
                    <div className="text-xs text-[#bababa]">Empiezas ganando el <span className="text-white font-bold">50%</span>. ¡Desbloquea hasta el <span className="text-green-400 font-bold">85%</span> enseñando! 🚀</div>
                </div>
            </div>

            <div className="p-8 flex flex-col h-full">
                <div className="mb-8">
                    <span className="text-gold text-xs font-bold uppercase tracking-widest mb-2 block">
                        Paso {currentStep + 1} de {STEPS.length}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                        {step.question}
                    </h2>
                    {(step as any).subtitle && (
                        <p className="text-[#8b8982] mt-2 text-lg">{(step as any).subtitle}</p>
                    )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto mb-8 pr-2 custom-scrollbar">
                    {step.options.map((opt: any) => {
                        const isSelected = answers[step.id] === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => handleSelect(opt.value)}
                                className={`w-full text-left p-6 rounded-xl border transition-all duration-200 group relative overflow-hidden flex items-center gap-4
                                    ${isSelected
                                        ? 'bg-gold/10 border-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                        : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                    }
                                `}
                            >
                                {opt.icon && (
                                    <span className="text-3xl">{opt.icon}</span>
                                )}
                                <div className="flex-1">
                                    <div className={`font-bold text-lg mb-1 ${isSelected ? 'text-gold' : 'text-white'}`}>
                                        {opt.label}
                                    </div>
                                    <div className="text-sm text-[#bababa] font-light flex items-center gap-2">
                                        {opt.desc}
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center text-black shadow-lg">
                                        <Check size={14} strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={`text-[#8b8982] hover:text-white px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${currentStep === 0 ? 'opacity-0' : ''}`}
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
                        {currentStep === STEPS.length - 1 ? (isSubmitting ? 'Finalizar' : 'Crear Perfil') : 'Siguiente'}
                        {currentStep < STEPS.length - 1 && <ChevronRight size={16} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MatchWizard;
