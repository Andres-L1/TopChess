import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Users, Award, Zap, LayoutDashboard, Monitor, Globe, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import FindMentorWizard from '../components/FindMentorWizard';
import PremiumButton from '../components/PremiumButton';
import FeatureCard from '../components/FeatureCard';

import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Teacher, Request } from '../types/index';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1] as any
        }
    }
};

const Home = () => {
    const navigate = useNavigate();
    const { currentUserId, isAuthenticated, loginWithGoogle, userRole, currentUser } = useAuth();
    const { t } = useTranslation();
    const [showWizard, setShowWizard] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [stats, setStats] = useState({ users: 0, teachers: 0, requests: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const data = await firebaseService.getPlatformStats();
            setStats({
                users: data.users || 0,
                teachers: data.teachers || 0,
                requests: data.requests || 0
            });
        };
        fetchStats();
    }, []);

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
            if (allTeachers.length === 0) {
                toast.error("No hay profesores disponibles en este momento");
                setShowWizard(false);
                setIsMatching(false);
                return;
            }

            // Simple matching logic
            let matched = allTeachers.find(t => t.teachingStyle === answers.style);
            if (!matched) matched = allTeachers[0]; // Fallback

            if (!currentUserId || !currentUser) {
                toast.error("Error: Sesión no válida");
                return;
            }

            // Create automatic approved request
            const requestId = `req_${Date.now()}_${currentUserId.substring(0, 5)}`;
            const req: Request = {
                id: requestId,
                studentId: currentUserId,
                studentName: currentUser.displayName || 'Estudiante',
                teacherId: matched.id,
                status: 'approved', // Automatically approved
                timestamp: Date.now(),
                message: "¡Hola! El sistema nos ha emparejado automáticamente."
            };

            await firebaseService.createRequest(req);

            // Notify Teacher
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
            navigate(`/chat/${matched.id}`); // Proceed directly to chat

        } catch (error) {
            console.error("Matching error:", error);
            toast.error("Error durante el emparejamiento.");
        } finally {
            setIsMatching(false);
        }
    };

    // If Wizard is active, show it exclusively
    if (showWizard) {
        return (
            <div className="min-h-screen pt-24 px-4 flex items-center justify-center relative overflow-hidden bg-[#1b1a17]">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 w-full max-w-4xl animate-enter">
                    <>
                        <button
                            onClick={() => setShowWizard(false)}
                            className="mb-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            ← Volver
                        </button>
                        {isMatching ? (
                            <div className="glass-panel h-[500px] flex flex-col items-center justify-center p-12 text-center bg-[#262421]">
                                <div className="w-20 h-20 border-4 border-gold/10 border-t-gold rounded-full animate-spin mb-6"></div>
                                <h3 className="text-2xl font-bold text-white mb-2">Analizando Perfil...</h3>
                                <p className="text-[#8b8982]">Buscando al maestro perfecto para ti en nuestra red</p>
                            </div>
                        ) : (
                            <FindMentorWizard onComplete={handleWizardComplete} onCancel={() => setShowWizard(false)} />
                        )}
                    </>
                </div>
            </div>
        );
    }

    // Default Landing Page View
    return (
        <div className="relative min-h-screen">
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none z-0" />
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[150px] pointer-events-none z-0" />

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-6xl mx-auto text-center relative z-10"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gold text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-sm">
                        <Sparkles size={14} /> La Élite del Ajedrez Hispano
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.1]">
                        Encontramos al <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold">Gran Maestro perfecto</span> para ti
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-xl text-[#8b8982] max-w-2xl mx-auto mb-10 leading-relaxed">
                        No pierdas tiempo buscando. Nuestro sistema te empareja automáticamente con el mentor ideal según tu nivel y objetivos. Únete a la plataforma más premium.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <PremiumButton onClick={handleFindTeacher} size="lg" icon={Play} className="w-full sm:w-auto min-w-[200px]">
                            {isAuthenticated ? 'Encontrar Inmediatamente' : 'Comienza tu Camino'}
                        </PremiumButton>
                        {!isAuthenticated && (
                            <PremiumButton variant="outline" size="lg" onClick={() => navigate('/onboarding')} className="w-full sm:w-auto min-w-[200px]">
                                Quiero ser Profesor
                            </PremiumButton>
                        )}
                        {isAuthenticated && (
                            <PremiumButton variant="outline" size="lg" onClick={() => navigate('/dashboard')} icon={LayoutDashboard} className="w-full sm:w-auto min-w-[200px]">
                                Ir a mi Panel
                            </PremiumButton>
                        )}
                    </motion.div>

                    {/* Stats */}
                    <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-10 border-t border-white/5 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">{stats.users}+</div>
                            <div className="text-xs text-[#8b8982] uppercase tracking-widest">Estudiantes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">{stats.teachers}+</div>
                            <div className="text-xs text-[#8b8982] uppercase tracking-widest">Grandes Maestros</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">100%</div>
                            <div className="text-xs text-[#8b8982] uppercase tracking-widest">Match Perfecto</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">4.9/5</div>
                            <div className="text-xs text-[#8b8982] uppercase tracking-widest">Satisfacción</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Features Section */}
            <div className="py-24 px-4 bg-[#1a1917]/50 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Todo en un solo lugar</h2>
                        <p className="text-[#8b8982]">Nos encargamos del aburrido proceso logístico. Tú dedícate a jugar.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Monitor}
                            title="Aula Integrada"
                            description="Tablero, videollamada y análisis integrados en una misma pantalla."
                            delay="0s"
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Emparejamiento IA"
                            description="Encontramos al profesor perfecto en segundos analizando tu estilo de juego."
                            delay="0.1s"
                        />
                        <FeatureCard
                            icon={Globe}
                            title="Pagos Globales"
                            description="Tarifas estandarizadas con Stripe. Todo se gestiona automáticamente."
                            delay="0.2s"
                        />
                        <FeatureCard
                            icon={Users}
                            title="Chat y Comunidad"
                            description="Mantente conectado y pide revisión de partidas."
                            delay="0.3s"
                        />
                        <FeatureCard
                            icon={Award}
                            title="Calendario Nativo"
                            description="Reserva con 1 click. Los créditos mensuales se descuentan al instante."
                            delay="0.4s"
                        />

                        <FeatureCard
                            icon={ShieldCheck}
                            title="Comunidad Verificada"
                            description="Solo aceptamos Grandes Maestros con título verificado internacionalmente."
                            delay="0.5s"
                        />
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 px-4 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tight">
                        ¿Listo para alcanzar la <br /><span className="text-gold">Maestría</span>?
                    </h2>
                    <PremiumButton onClick={handleFindTeacher} size="xl" className="px-12 py-6 text-xl shadow-2xl shadow-gold/20 hover:shadow-gold/40">
                        Empieza Ahora <ChevronRight className="ml-2" />
                    </PremiumButton>
                </div>
            </div>
        </div>
    );
};

export default Home;
