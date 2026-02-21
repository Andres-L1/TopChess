import React, { useState } from 'react';
import { Check, GraduationCap, Trophy, Target, BookOpen, ChevronRight } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const StudentRegistrationForm = ({ onComplete }: { onComplete: () => void }) => {
    const { currentUserId, currentUser, setUserRole } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [level, setLevel] = useState<string>('');
    const [goal, setGoal] = useState<string>('');
    const [style, setStyle] = useState<string>('');

    const handleSubmit = async () => {
        if (!level || !goal || !style) {
            toast.error("Por favor completa todos los campos");
            return;
        }

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
                elo: level === 'beginner' ? 600 : level === 'intermediate' ? 1200 : 1600,
                learningGoals: [goal],
                preferredStyle: style
            };

            await firebaseService.createUser(userProfile);
            setUserRole('student');

            toast.success("¡Perfil creado con éxito!");
            onComplete();
        } catch (error) {
            console.error("Error creating profile:", error);
            toast.error("Error al crear el perfil");
        } finally {
            setIsSubmitting(false);
        }
    };

    const Section = ({ title, icon: Icon, children }: any) => (
        <div className="mb-8 animate-enter">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="text-gold" size={20} />
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {children}
            </div>
        </div>
    );

    const Option = ({ selected, onClick, label, desc }: any) => (
        <button
            onClick={onClick}
            className={`text-left p-4 rounded-xl border transition-all duration-300 relative group flex flex-col justify-start active:scale-[0.98]
                ${selected
                    ? 'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30'
                    : 'bg-[#302e2b]/40 border-white/5 hover:border-blue-500/30 hover:bg-[#302e2b]/80 hover:shadow-lg'
                }
            `}
        >
            <div className="flex w-full justify-between items-start">
                <div>
                    <div className={`font-bold mb-1 transition-colors ${selected ? 'text-blue-400 drop-shadow-sm' : 'text-white group-hover:text-blue-400/90'}`}>{label}</div>
                    <div className="text-xs text-[#8b8982] leading-relaxed">{desc}</div>
                </div>
                {selected && <Check size={16} className="text-blue-400 shrink-0 mt-1 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
            </div>
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
                    <GraduationCap size={32} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Perfil de Estudiante</h2>
                <p className="text-[#8b8982]">Personaliza tu experiencia de aprendizaje</p>
            </div>

            <div className="card-glass p-8">
                <Section title="Nivel de Ajedrez" icon={Trophy}>
                    <Option
                        selected={level === 'beginner'}
                        onClick={() => setLevel('beginner')}
                        label="Principiante"
                        desc="Conozco las reglas básicas o juego ocasionalmente."
                    />
                    <Option
                        selected={level === 'intermediate'}
                        onClick={() => setLevel('intermediate')}
                        label="Intermedio"
                        desc="Juego frecuentemente online o en club (1000-1500 ELO)."
                    />
                    <Option
                        selected={level === 'advanced'}
                        onClick={() => setLevel('advanced')}
                        label="Avanzado"
                        desc="Jugador de torneo competitivo (>1500 ELO)."
                    />
                </Section>

                <Section title="Objetivo Principal" icon={Target}>
                    <Option
                        selected={goal === 'tactics'}
                        onClick={() => setGoal('tactics')}
                        label="Táctica"
                        desc="Mejorar cálculo y evitar errores."
                    />
                    <Option
                        selected={goal === 'openings'}
                        onClick={() => setGoal('openings')}
                        label="Aperturas"
                        desc="Construir un repertorio sólido."
                    />
                    <Option
                        selected={goal === 'strategy'}
                        onClick={() => setGoal('strategy')}
                        label="Estrategia"
                        desc="Planes a largo plazo y finales."
                    />
                </Section>

                <Section title="Estilo de Clase" icon={BookOpen}>
                    <Option
                        selected={style === 'active'}
                        onClick={() => setStyle('active')}
                        label="Práctica"
                        desc="Jugar y analizar partidas."
                    />
                    <Option
                        selected={style === 'theory'}
                        onClick={() => setStyle('theory')}
                        label="Teórica"
                        desc="Conceptos y análisis profundo."
                    />
                    <Option
                        selected={style === 'mixed'}
                        onClick={() => setStyle('mixed')}
                        label="Híbrido"
                        desc="Equilibrio entre teoría y práctica."
                    />
                </Section>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !level || !goal || !style}
                        className="btn-primary"
                    >
                        {isSubmitting ? 'Creando Perfil...' : 'Comenzar a Aprender'}
                        {!isSubmitting && <ChevronRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentRegistrationForm;
