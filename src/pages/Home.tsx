import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Play, Sparkles, Users, Award, Zap, LayoutDashboard, Monitor,
    Globe, ShieldCheck, ChevronRight, BookOpen, Star, Target,
    TrendingUp, Wallet as WalletIcon, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FindMentorWizard from '../components/FindMentorWizard';
import PremiumButton from '../components/PremiumButton';
import FeatureCard from '../components/FeatureCard';

import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Request } from '../types/index';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] as any
        }
    }
};

const DashboardCard: React.FC<{
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
}> = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center gap-5 hover:bg-white/[0.04] transition-all group">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-10 border border-current border-opacity-20 group-hover:scale-110 transition-transform`}>
            <Icon size={24} className={color.replace('bg-', 'text-')} />
        </div>
        <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-widest text-[#8b8982] mb-1 truncate">{title}</div>
            <div className="text-2xl font-black text-white">{value}</div>
            {subtitle && <div className="text-[10px] text-white/40 mt-1 uppercase tracking-tighter truncate">{subtitle}</div>}
        </div>
    </div>
);

const Home = () => {
    const navigate = useNavigate();
    const { currentUserId, isAuthenticated, loginWithGoogle, userRole, currentUser } = useAuth();
    const { t } = useTranslation();
    const [showWizard, setShowWizard] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [stats, setStats] = useState({ users: 0, teachers: 0, requests: 0 });
    const [userData, setUserData] = useState<any>(null);
    const [realStats, setRealStats] = useState({
        teacherRating: "4.9",
        studentCompletedClasses: 0,
        pendingBookings: 0
    });

    useEffect(() => {
        const fetchPlatformStats = async () => {
            try {
                const data = await firebaseService.getPlatformStats();
                setStats({
                    users: data.users || 0,
                    teachers: data.teachers || 0,
                    requests: data.requests || 0
                });
            } catch (e) {
                console.error("Error fetching stats", e);
            }
        };
        fetchPlatformStats();
    }, []);

    useEffect(() => {
        if (isAuthenticated && currentUserId) {
            firebaseService.getUser(currentUserId).then(setUserData);

            // Fetch real contextual data based on role
            if (userRole === 'teacher') {
                firebaseService.getTeacherById(currentUserId).then(t => {
                    if (t) setRealStats(prev => ({ ...prev, teacherRating: (t.rating || 5).toFixed(1) }));
                });
                firebaseService.getBookingsForUser(currentUserId, 'teacher').then(b => {
                    const pending = b.filter(x => x.status === 'pending' || x.status === 'confirmed').length;
                    setRealStats(prev => ({ ...prev, pendingBookings: pending }));
                });
            } else if (userRole === 'student') {
                firebaseService.getBookingsForUser(currentUserId, 'student').then(b => {
                    const completed = b.filter(x => x.status === 'completed').length;
                    const pending = b.filter(x => x.status === 'pending' || x.status === 'confirmed').length;
                    setRealStats(prev => ({ ...prev, studentCompletedClasses: completed, pendingBookings: pending }));
                });
            }
        }
    }, [isAuthenticated, currentUserId, userRole]);

    const handleFindTeacher = () => {
        if (!isAuthenticated) {
            toast.error(t('login_to_find'));
            loginWithGoogle();
            return;
        }
        setShowWizard(true);
    };

    const handleWizardComplete = async (answers: any) => {
        setIsMatching(true);
        try {
            const allTeachers = await firebaseService.getTeachers();
            const verifiedTeachers = allTeachers.filter(t => t.isVerified);
            const pool = verifiedTeachers.length > 0 ? verifiedTeachers : allTeachers;

            if (pool.length === 0) {
                toast.error("No hay profesores disponibles en este momento");
                setShowWizard(false);
                setIsMatching(false);
                return;
            }

            let matched = pool.find(t => t.teachingStyle === answers.style);
            if (!matched) matched = pool[0];

            if (!currentUserId || !currentUser) {
                toast.error("Error: Sesión no válida");
                return;
            }

            const requestId = `req_${Date.now()}_${currentUserId.substring(0, 5)}`;
            const req: Request = {
                id: requestId,
                studentId: currentUserId,
                studentName: currentUser.displayName || 'Estudiante',
                teacherId: matched.id,
                status: 'approved',
                timestamp: Date.now(),
                message: "¡Hola! El sistema nos ha emparejado automáticamente."
            };

            await firebaseService.createRequest(req);

            await firebaseService.createNotification({
                id: `notif_${Date.now()}_${matched.id.substring(0, 5)}`,
                userId: matched.id,
                title: '¡Nuevo Alumno Asignado!',
                message: `${currentUser.displayName} se ha unido a tus clases.`,
                type: 'match',
                read: false,
                timestamp: Date.now(),
                link: `/chat/${currentUserId}`
            });

            toast.success("¡Match exitoso! Hemos encontrado a tu mentor.");
            navigate(`/chat/${matched.id}`);

        } catch (error) {
            console.error("Matching error:", error);
            toast.error("Error durante el emparejamiento.");
        } finally {
            setIsMatching(false);
        }
    };

    if (showWizard) {
        return (
            <div className="min-h-screen pt-24 px-4 flex items-center justify-center relative overflow-hidden bg-[#050505]">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-[120px]" />
                </div>
                <div className="relative z-10 w-full max-w-4xl animate-in fade-in zoom-in duration-500">
                    <button
                        onClick={() => setShowWizard(false)}
                        className="mb-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors uppercase text-[10px] font-black tracking-[4px]"
                    >
                        ← Volver al Inicio
                    </button>
                    {isMatching ? (
                        <div className="glass-panel h-[500px] flex flex-col items-center justify-center p-12 text-center bg-white/[0.02] rounded-[40px] border border-white/5">
                            <div className="w-20 h-20 border-4 border-gold/10 border-t-gold rounded-full animate-spin mb-8"></div>
                            <h3 className="text-3xl font-black text-white mb-3">Analizando Perfil...</h3>
                            <p className="text-[#8b8982] uppercase tracking-[2px] text-xs">Buscando al maestro perfecto para ti en nuestra red de élite</p>
                        </div>
                    ) : (
                        <FindMentorWizard onComplete={handleWizardComplete} onCancel={() => setShowWizard(false)} />
                    )}
                </div>
            </div>
        );
    }

    if (isAuthenticated) {
        return (
            <div className="min-h-screen pt-28 pb-20 px-4 bg-[#050505] overflow-x-hidden">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-12"
                    >
                        {/* Welcome Header */}
                        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 md:p-12 rounded-[40px] glass-panel border border-white/5 relative overflow-hidden group">
                            {/* Background Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none transition-transform duration-1000 group-hover:bg-gold/10 group-hover:scale-125" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gold text-[10px] font-black uppercase tracking-[3px] mb-6 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {userRole === 'teacher' ? 'Instructor Verificado' : 'Sala de Estudiante'}
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2">
                                    ¡Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-100 to-gold">{currentUser?.displayName?.split(' ')[0]}</span>!
                                </h1>
                                <p className="text-[#8b8982] text-lg font-medium max-w-xl">
                                    {userRole === 'teacher'
                                        ? "Bienvenido de vuelta a tu centro de mando. Aquí tienes el resumen real de tu academia online."
                                        : "El tablero te espera. Continúa tu entrenamiento o entra en contacto con tu mentor."}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                                <PremiumButton onClick={() => navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard')} variant="gold" size="lg" className="w-full sm:w-auto shadow-2xl shadow-gold/20">
                                    Ir a mi Dashboard <ChevronRight size={18} />
                                </PremiumButton>
                                {userRole === 'student' && (
                                    <PremiumButton onClick={handleFindTeacher} variant="outline" size="lg" className="w-full sm:w-auto text-white">
                                        Buscar Mentor
                                    </PremiumButton>
                                )}
                            </div>
                        </motion.div>

                        {/* Real Stats Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {userRole === 'teacher' ? (
                                <>
                                    <DashboardCard title="Alumnos" value={userData?.studentsCount || 0} icon={Users} color="bg-blue-500" subtitle="Alumnos activos reales" />
                                    <DashboardCard title="Clases Pendientes" value={realStats.pendingBookings} icon={Calendar} color="bg-orange-500" subtitle="Clases programadas" />
                                    <DashboardCard title="Balance" value={`${userData?.balance || 0} €`} icon={WalletIcon} color="bg-emerald-500" subtitle="Wallet actual" />
                                    <DashboardCard title="Tu Rating" value={realStats.teacherRating} icon={Star} color="bg-gold" subtitle="Calificación media" />
                                </>
                            ) : (
                                <>
                                    <DashboardCard title="Nivel" value={`LVL ${userData?.level || 1}`} icon={TrendingUp} color="bg-gold" subtitle="Progresión actual" />
                                    <DashboardCard title="Racha" value={`${userData?.streak || 0} días`} icon={Zap} color="bg-orange-500" subtitle="Dias seguidos" />
                                    <DashboardCard title="Clases Listas" value={realStats.studentCompletedClasses} icon={Award} color="bg-emerald-500" subtitle="Clases recibidas" />
                                    <DashboardCard title="Clases Próximas" value={realStats.pendingBookings} icon={Calendar} color="bg-blue-500" subtitle="Agendadas" />
                                </>
                            )}
                        </motion.div>

                        {/* Direct Tools */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => navigate('/chat')}>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:text-gold transition-all">
                                    <BookOpen size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Comunicaciones</h3>
                                <p className="text-[#8b8982]">Responde los mensajes, solicita revisión de partidas o comunícate vía chat integrado.</p>
                            </div>

                            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => navigate('/wallet')}>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:text-gold transition-all">
                                    <WalletIcon size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Finanzas</h3>
                                <p className="text-[#8b8982]">
                                    {userRole === 'teacher' ? "Revisa tu balance y transfiere a tu cuenta bancaria." : "Recarga créditos para comprar horas con tus profesores."}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#050505] overflow-x-hidden">
            {/* Background Minimal Elements */}
            <div className="absolute top-0 inset-x-0 h-screen pointer-events-none select-none">
                <div className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] bg-gold/5 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
            </div>

            <div className="relative pt-32 pb-40 px-4">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-4xl mx-auto text-center relative z-10"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gold text-[10px] font-black uppercase tracking-[5.5px] mb-10 backdrop-blur-md shadow-xl">
                        <Sparkles size={16} /> Una Red Exclusiva
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-[110px] font-black tracking-tighter text-white mb-10 leading-[0.9]">
                        TU VERDADERO <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-100 to-gold italic">POTENCIAL</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-lg md:text-2xl text-[#8b8982] max-w-3xl mx-auto mb-14 leading-relaxed font-light">
                        Una plataforma minimalista diseñada exclusivamente para conectar a grandes maestros del ajedrez con aspirantes a la maestría. Sin distracciones, solo crecimiento real.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <PremiumButton onClick={handleFindTeacher} size="xl" icon={Play} className="w-full sm:w-auto min-w-[280px] shadow-2xl shadow-gold/20 hover:shadow-gold/40">
                            INICIAR AHORA
                        </PremiumButton>
                        <PremiumButton variant="outline" size="xl" onClick={() => navigate('/onboarding')} className="w-full sm:w-auto min-w-[240px] border-white/20 text-white">
                            SOY PROFESOR
                        </PremiumButton>
                    </motion.div>

                    {/* Stats Bar */}
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-10 md:gap-20 mt-24 pt-12 border-t border-white/5">
                        <div>
                            <div className="text-4xl font-black text-white">{stats.users}+</div>
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">Usuarios</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-gold">{stats.teachers}+</div>
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">Maestros FIDE</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-white">{stats.requests}+</div>
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">Matchs Exitosos</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Features (Minimalist Grid) */}
            <div className="py-32 px-4 bg-white/[0.01] border-y border-white/5 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 max-w-2xl mx-auto">
                        <span className="text-gold font-black text-[11px] tracking-[5px] uppercase mb-5 block">Características</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">LO CRUCIAL, NADA MÁS</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={Monitor} title="AULA INTEGRADA" description="Tablero de alto rendimiento con PGN, evaluación stockfish y audio P2P bajo WebRTC en una misma vista." delay="0.1s" />
                        <FeatureCard icon={Zap} title="FAST MATCH" description="Sistema de emparejamiento automático por IA que cruza tu estilo con los instructores verificados." delay="0.2s" />
                        <FeatureCard icon={Globe} title="BILLETERA GLOBAL" description="Transfiere y paga en cualquier divisa gracias a la potencia de Stripe integrado." delay="0.3s" />
                        <FeatureCard icon={LayoutDashboard} title="DATOS REALES" description="Control completo sobre tu progreso, asertividad (ELO) e historial de clases." delay="0.4s" />
                        <FeatureCard icon={ShieldCheck} title="RIGUROSIDAD" description="Verificación manual de Maestros FIDE/Nacionales para garantizar la calidad." delay="0.5s" />
                        <FeatureCard icon={Sparkles} title="DARK GLASS" description="Estética premium oscura y limpia diseñada para reducir la fatiga visual." delay="0.6s" />
                    </div>
                </div>
            </div>

            {/* Final CTA without image */}
            <div className="py-40 px-4 text-center relative overflow-hidden bg-gradient-to-b from-transparent to-black">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px] pointer-events-none" />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                    className="max-w-4xl mx-auto relative z-10"
                >
                    <motion.h2 variants={itemVariants} className="text-5xl md:text-7xl font-black text-white mb-12 tracking-tighter leading-none">
                        EL TABLERO <br /> <span className="text-gold italic uppercase">TE ESPERA</span>
                    </motion.h2>
                    <motion.div variants={itemVariants}>
                        <PremiumButton onClick={handleFindTeacher} size="xl" className="shadow-2xl shadow-gold/30">
                            ENTRAR EMPAREJAMIENTO <ChevronRight size={24} className="ml-2" />
                        </PremiumButton>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Home;
