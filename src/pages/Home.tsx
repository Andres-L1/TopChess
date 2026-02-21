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
import heroImage from '../assets/hero-bg.png';

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

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await firebaseService.getPlatformStats();
                setStats({
                    users: data.users || 0,
                    teachers: data.teachers || 12, // Minimal visual padding
                    requests: data.requests || 0
                });
            } catch (e) {
                console.error("Error fetching stats", e);
            }
        };
        fetchStats();
    }, []);

    useEffect(() => {
        if (isAuthenticated && currentUserId) {
            firebaseService.getUser(currentUserId).then(setUserData);
        }
    }, [isAuthenticated, currentUserId]);

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
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="space-y-12"
                    >
                        {/* Welcome Header */}
                        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 md:p-12 rounded-[40px] bg-white/[0.01] border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />

                            <div>
                                <h1 className="text-4xl md:text-7xl font-black tracking-tighter text-white mb-4">
                                    ¡Bienvenido, <span className="text-gold italic">{currentUser?.displayName?.split(' ')[0]}</span>!
                                </h1>
                                <div className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[#8b8982] uppercase tracking-[4px] text-[10px] font-black">
                                        {userRole === 'teacher' ? 'Instructor Verificado TopChess' : 'Aspirante a Maestro'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 relative z-10">
                                <PremiumButton onClick={() => navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard')} variant="gold" size="lg" className="min-w-[180px]">
                                    Ir a mi Dashboard
                                </PremiumButton>
                                {userRole === 'student' && (
                                    <PremiumButton onClick={handleFindTeacher} variant="outline" size="lg">
                                        Explorar Mentores
                                    </PremiumButton>
                                )}
                            </div>
                        </motion.div>

                        {/* Quick Stats Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {userRole === 'teacher' ? (
                                <>
                                    <DashboardCard title="Alumnos" value={userData?.studentsCount || 0} icon={Users} color="bg-blue-500" subtitle="Alumnos activos" />
                                    <DashboardCard title="Horas Clase" value={userData?.totalClasses || 0} icon={Calendar} color="bg-gold" subtitle="En sesión" />
                                    <DashboardCard title="Balance" value={`${userData?.balance || 0} €`} icon={WalletIcon} color="bg-emerald-500" subtitle="Retirable ahora" />
                                    <DashboardCard title="Ranking" value="TOP 10" icon={Award} color="bg-purple-500" subtitle="Instructor destacado" />
                                </>
                            ) : (
                                <>
                                    <DashboardCard title="Nivel" value={`LVL ${userData?.level || 1}`} icon={TrendingUp} color="bg-gold" subtitle="Progresión de ELO" />
                                    <DashboardCard title="Racha" value={`${userData?.streak || 0} días`} icon={Zap} color="bg-orange-500" subtitle="Aprendizaje constante" />
                                    <DashboardCard title="Clases OK" value={userData?.classesCount || 0} icon={BookOpen} color="bg-blue-500" subtitle="Total completadas" />
                                    <DashboardCard title="Meta Mensual" value="75%" icon={Target} color="bg-emerald-500" subtitle="Cerca del hito" />
                                </>
                            )}
                        </motion.div>

                        {/* Main Interaction Area */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 glass-panel p-10 rounded-[50px] border border-white/5 bg-white/[0.02] flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                                <div>
                                    <h3 className="text-3xl font-black text-white mb-6">Tu siguiente paso hacia la victoria</h3>
                                    <p className="text-[#8b8982] mb-10 leading-relaxed text-lg italic pr-12">
                                        {userRole === 'teacher'
                                            ? "Gestiona tus clases hoy. Recuerda que un buen instructor no solo enseña jugadas, sino que enseña a pensar. El aula virtual está activa."
                                            : "El tablero te espera. Comunícate con tu mentor para analizar tus últimas partidas o agenda una nueva sesión intensiva ahora."}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-5">
                                    <PremiumButton onClick={() => navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard')} variant="gold" size="lg" className="px-16 py-6 text-sm">
                                        {userRole === 'teacher' ? 'Ver mis Alumnos' : 'Entrar al Aula'}
                                    </PremiumButton>
                                    <PremiumButton onClick={() => navigate('/chat')} variant="outline" size="lg" className="px-10">
                                        Bandeja de Entrada
                                    </PremiumButton>
                                </div>
                            </div>

                            {/* Decorative Visual Card */}
                            <div className="relative rounded-[50px] overflow-hidden group min-h-[400px]">
                                <img src={heroImage} alt="Chess Hero" className="absolute inset-0 w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 opacity-70" />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />

                                <div className="absolute bottom-10 left-10 right-10">
                                    <div className="glass-panel p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10">
                                        <div className="flex items-center gap-2 text-gold font-black text-[10px] tracking-widest uppercase mb-3">
                                            <Sparkles size={14} /> Sabiduría Elite
                                        </div>
                                        <p className="text-base text-white/90 leading-relaxed font-medium italic">
                                            "En el ajedrez, el conocimiento es poder, pero la paciencia es el arma definitiva."
                                        </p>
                                        <div className="mt-4 flex items-center gap-3">
                                            <div className="w-8 h-px bg-gold/50" />
                                            <span className="text-[10px] text-gold uppercase tracking-tighter font-black">Mentalidad de Campeón</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#050505] overflow-x-hidden">
            {/* Ultra Premium Hero Section */}
            <div className="relative pt-32 pb-48 px-4">
                {/* Background Dynamic Elements */}
                <div className="absolute top-0 inset-x-0 h-screen pointer-events-none select-none">
                    <div className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] bg-gold/10 rounded-full blur-[180px] animate-pulse" />
                    <div className="absolute bottom-[10%] left-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[150px]" />
                    <div className="absolute top-[30%] left-[20%] w-[2px] h-[40vh] bg-gradient-to-b from-transparent via-gold/20 to-transparent" />
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-7xl mx-auto"
                >
                    <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
                        {/* Hero Text */}
                        <div className="flex-[1.2] text-center lg:text-left relative z-10">
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gold text-[10px] font-black uppercase tracking-[5.5px] mb-10 backdrop-blur-md shadow-xl shadow-black/40">
                                <Sparkles size={16} /> La Nueva Era del Ajedrez
                            </motion.div>

                            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-[140px] font-black tracking-tighter text-white mb-10 leading-[0.85]">
                                EL PODER <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-100 to-gold italic">ESTRATÉGICO</span>
                            </motion.h1>

                            <motion.p variants={itemVariants} className="text-lg md:text-2xl text-[#8b8982] max-w-2xl mx-auto lg:mx-0 mb-14 leading-relaxed font-light">
                                Conectamos a los mentores más brillantes del mundo con las mentes más ambiciosas. Un ecosistema de élite donde cada jugada cuenta.
                            </motion.p>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                                <PremiumButton onClick={handleFindTeacher} size="xl" icon={Play} className="w-full sm:w-auto min-w-[280px] shadow-2xl shadow-gold/20 hover:shadow-gold/40">
                                    COMENZAR EL CAMINO
                                </PremiumButton>
                                <PremiumButton variant="outline" size="xl" onClick={() => navigate('/onboarding')} className="w-full sm:w-auto min-w-[240px] border-white/20 text-white">
                                    SER INSTRUCTOR
                                </PremiumButton>
                            </motion.div>

                            {/* Stats Bar */}
                            <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-16 mt-24 pt-12 border-t border-white/5">
                                <div>
                                    <div className="text-4xl font-black text-white">{stats.users}+</div>
                                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">Estudiantes</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-gold">{stats.teachers}+</div>
                                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">Mentores Verificados</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-white">4.9/5</div>
                                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">Nivel de Excelencia</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Hero Image Container */}
                        <div className="flex-1 relative w-full lg:w-auto">
                            <motion.div
                                variants={itemVariants}
                                className="relative z-10 rounded-[80px] overflow-hidden shadow-[0_0_100px_-20px_rgba(212,175,55,0.3)] border border-white/10 aspect-[4/5] lg:aspect-square group bg-[#161512]"
                            >
                                <img
                                    src={heroImage}
                                    alt="Premium Chess Experience"
                                    className="w-full h-full object-cover transition-transform duration-[4s] ease-out group-hover:scale-110 opacity-90"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />

                                {/* Floating Premium Card */}
                                <div className="absolute bottom-10 left-10 right-10 glass-panel p-10 rounded-[40px] bg-black/40 backdrop-blur-2xl border border-white/10 translate-y-6 group-hover:translate-y-0 transition-all duration-700 shadow-2xl">
                                    <div className="flex items-center gap-3 text-gold font-black text-[11px] tracking-[4px] uppercase mb-4">
                                        <Award size={18} /> Elite Membership
                                    </div>
                                    <h4 className="text-2xl font-black text-white mb-3">EXCELENCIA TOPCHESS</h4>
                                    <p className="text-sm text-white/50 leading-relaxed font-medium">
                                        Acceso exclusivo a la red más prestigiosa de Maestros Internacionales y herramientas de vanguardia.
                                    </p>
                                </div>
                            </motion.div>

                            {/* Floating decorative Orbs around the image */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/20 rounded-full blur-[60px] animate-pulse" />
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px]" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Why Us Section (Modern Grid) */}
            <div className="py-40 px-4 bg-white/[0.01] relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
                        <div className="max-w-2xl">
                            <span className="text-gold font-black text-[11px] tracking-[5px] uppercase mb-5 block">La Diferencia</span>
                            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-6">
                                UN ECOSISTEMA <br /> <span className="text-gold italic">DISEÑADO POR EXPERTOS</span>
                            </h2>
                            <p className="text-xl text-[#8b8982] leading-relaxed">
                                No solo conectamos personas, orquestamos una experiencia de aprendizaje que redefine los límites del ajedrez moderno.
                            </p>
                        </div>
                        <div className="hidden md:block">
                            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center animate-bounce">
                                <ChevronRight size={32} className="rotate-90 text-white/20" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={Monitor} title="AULA DE ALTA FIDELIDAD" description="Audio espacial, latencia cero y herramientas de anotación profesional integradas en el motor." delay="0.1s" />
                        <FeatureCard icon={Zap} title="FAST-TRACK IA" description="Algoritmos avanzados que identifican debilidades en tu juego para asignarte el mentor más adecuado." delay="0.2s" />
                        <FeatureCard icon={Globe} title="PAGOS SIN BARRERAS" description="Stripe Connect integrado para transacciones inmediatas, seguras y transparentes a nivel global." delay="0.3s" />
                        <FeatureCard icon={LayoutDashboard} title="ANÁLISIS DE PRECISIÓN" description="Dashboard con gráficas de evolución, gestión de billetera y seguimiento de objetivos en tiempo real." delay="0.4s" />
                        <FeatureCard icon={ShieldCheck} title="TÍTULOS VERIFICADOS" description="Estricto proceso de validación para asegurar que solo aprendes de jugadores titulados FIDE." delay="0.5s" />
                        <FeatureCard icon={Sparkles} title="DISEÑO PREMIUM" description="Una interfaz que respira elegancia y minimalismo para que nada te distraiga de la estrategia." delay="0.6s" />
                    </div>
                </div>
            </div>

            {/* Powerful Final Message */}
            <div className="py-48 px-4 text-center relative overflow-hidden bg-gradient-to-b from-transparent to-black">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[150px] pointer-events-none" />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                    className="max-w-5xl mx-auto relative z-10"
                >
                    <motion.h2 variants={itemVariants} className="text-6xl md:text-9xl font-black text-white mb-16 tracking-tighter leading-none">
                        EL TABLERO <br /> <span className="text-gold italic uppercase">ESTÁ LISTO</span>
                    </motion.h2>
                    <motion.p variants={itemVariants} className="text-xl md:text-3xl text-white/40 mb-20 max-w-3xl mx-auto font-light leading-relaxed">
                        Únete a los cientos de aspirantes que ya están transformando su juego bajo la guía de los maestros más brillantes del habla hispana.
                    </motion.p>
                    <motion.div variants={itemVariants}>
                        <PremiumButton onClick={handleFindTeacher} size="xl" className="px-16 py-8 text-2xl shadow-3xl shadow-gold/30 hover:shadow-gold/60 border border-gold/20">
                            RECLAMA TU LUGAR <ChevronRight size={28} className="ml-2" />
                        </PremiumButton>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Home;
