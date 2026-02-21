import React, { useState } from 'react';
import { Check, User, Globe, TrendingUp, Award, Zap, ChevronRight, DollarSign } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const TeacherRegistrationForm = ({ onComplete }: { onComplete: () => void }) => {
    const { currentUserId, currentUser, setUserRole } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [region, setRegion] = useState<string>('');
    const [experience, setExperience] = useState<string>('');
    const [style, setStyle] = useState<string>('');

    const handleSubmit = async () => {
        if (!region || !experience || !style) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        setIsSubmitting(true);
        try {
            const price = region === 'EU' ? 59 : 39;
            const currency = region === 'EU' ? 'EUR' : 'USD';

            const profile = {
                id: currentUserId,
                name: currentUser?.displayName || 'Profesor',
                elo: experience === 'master' ? 2200 : experience === 'coach' ? 1700 : 1400,
                price: price,
                currency: currency as 'EUR' | 'USD',
                region: region as 'EU' | 'LATAM' | 'OTHER',
                commissionRate: 0.5,
                classesGiven: 0,
                earnings: 0,
                description: `Profesor especializado en metodología ${style}.`,
                image: currentUser?.photoURL || 'https://via.placeholder.com/150',
                tags: [style, experience],
                teachingStyle: style,
                curriculum: 'Personalizado basándome en tus objetivos.',
                experienceYears: experience === 'master' ? 10 : 2,
                achievements: []
            };

            await firebaseService.createTeacherProfile(profile);

            // Ensure user doc exists
            const existingUser = await firebaseService.getUser(currentUserId);
            if (existingUser) {
                await firebaseService.updateUser(currentUserId, { role: 'teacher' });
            } else {
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

            setUserRole('teacher');
            toast.success("¡Perfil de profesor creado!");
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

    const Option = ({ selected, onClick, label, desc, icon }: any) => (
        <button
            onClick={onClick}
            className={`text-left p-4 rounded-xl border transition-all duration-300 relative group flex items-start gap-4 active:scale-[0.98]
                ${selected
                    ? 'bg-gradient-to-br from-gold/10 to-gold/5 border-gold shadow-[0_0_20px_rgba(212,175,55,0.15)] ring-1 ring-gold/30'
                    : 'bg-[#302e2b]/40 border-white/5 hover:border-gold/30 hover:bg-[#302e2b]/80 hover:shadow-lg'
                }
            `}
        >
            <div className={`mt-1 transition-transform duration-300 ${selected ? 'scale-110 drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'group-hover:scale-110'}`}>{icon}</div>
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className={`font-bold mb-1 transition-colors ${selected ? 'text-gold drop-shadow-sm' : 'text-white group-hover:text-gold/90'}`}>{label}</div>
                    {selected && <Check size={16} className="text-gold shrink-0 mt-1" />}
                </div>
                <div className="text-xs text-[#8b8982] leading-relaxed">{desc}</div>
            </div>
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header with Gamification */}
            <div className="relative mb-10 text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto mb-4 border border-gold/20">
                    <User size={32} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Perfil de Profesor</h2>
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gold/10 to-transparent border border-gold/20 rounded-full px-4 py-1.5 mx-auto">
                    <TrendingUp size={14} className="text-gold" />
                    <span className="text-xs text-[#d4af37]">Empieza ganando el <span className="font-bold text-white">50%</span>. Sube hasta el <span className="font-bold text-green-400">85%</span>.</span>
                </div>
            </div>

            <div className="card-glass p-8">
                <Section title="Ubicación y Tarifa" icon={Globe}>
                    <Option
                        selected={region === 'EU'}
                        onClick={() => setRegion('EU')}
                        label="Europa / España"
                        desc="Tarifa: 59€ / mes"
                        icon={<span className="text-2xl">🇪🇺</span>}
                    />
                    <Option
                        selected={region === 'LATAM'}
                        onClick={() => setRegion('LATAM')}
                        label="Latinoamérica"
                        desc="Tarifa: $39 USD / mes"
                        icon={<span className="text-2xl">🌎</span>}
                    />
                </Section>

                <Section title="Nivel y Experiencia" icon={Award}>
                    <Option
                        selected={experience === 'master'}
                        onClick={() => setExperience('master')}
                        label="Maestro (2000+)"
                        desc="Titulado FIDE o experto."
                        icon={<Award className={experience === 'master' ? 'text-gold' : 'text-white/20'} size={24} />}
                    />
                    <Option
                        selected={experience === 'coach'}
                        onClick={() => setExperience('coach')}
                        label="Entrenador (1700+)"
                        desc="Jugador de club sólido."
                        icon={<User className={experience === 'coach' ? 'text-gold' : 'text-white/20'} size={24} />}
                    />
                    <Option
                        selected={experience === 'monitor'}
                        onClick={() => setExperience('monitor')}
                        label="Monitor (<1700)"
                        desc="Iniciación y niños."
                        icon={<User className={experience === 'monitor' ? 'text-gold' : 'text-white/20'} size={24} />}
                    />
                </Section>

                <Section title="Estilo de Enseñanza" icon={Zap}>
                    <Option
                        selected={style === 'analytical'}
                        onClick={() => setStyle('analytical')}
                        label="Analítico"
                        desc="Profundidad y rigor."
                        icon={<span className="text-2xl">🧠</span>} // Brain
                    />
                    <Option
                        selected={style === 'dynamic'}
                        onClick={() => setStyle('dynamic')}
                        label="Dinámico"
                        desc="Rápido y divertido."
                        icon={<span className="text-2xl">⚡</span>} // Bolt
                    />
                    <Option
                        selected={style === 'patient'}
                        onClick={() => setStyle('patient')}
                        label="Paciente"
                        desc="Paso a paso."
                        icon={<span className="text-2xl">🐢</span>} // Turtle? Or Heart
                    />
                </Section>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !region || !experience || !style}
                        className="btn-primary"
                    >
                        {isSubmitting ? 'Creando Profesor...' : 'Crear Perfil Profesional'}
                        {!isSubmitting && <ChevronRight size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TeacherRegistrationForm;
