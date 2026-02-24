import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Play, Sparkles, Users, Award, Zap, LayoutDashboard, Monitor,
    Globe, ShieldCheck, ChevronRight, BookOpen, Star, Target,
    TrendingUp, Wallet as WalletIcon, Calendar, type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumButton from '../components/PremiumButton';
import FeatureCard from '../components/FeatureCard';

import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AppUser } from '../types/index';
import Logo from '../components/Logo';

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
            ease: [0.22, 1, 0.36, 1] as const
        }
    }
};

const DashboardCard: React.FC<{
    title: string;
    value: string | number;
    icon: LucideIcon;
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
    const [userData, setUserData] = useState<AppUser | null>(null);
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
        navigate('/mentors');
    };

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
                                    {userRole === 'teacher' ? t('home_auth.badge_teacher') : t('home_auth.badge_student')}
                                </div>
                                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-2">
                                    {t('home_auth.greeting', { name: currentUser?.displayName?.split(' ')[0] })}
                                </h1>
                                <p className="text-[#8b8982] text-lg font-medium max-w-xl">
                                    {userRole === 'teacher' ? t('home_auth.desc_teacher') : t('home_auth.desc_student')}
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
                                <PremiumButton onClick={() => navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard')} variant="gold" size="lg" className="w-full sm:w-auto shadow-2xl shadow-gold/20">
                                    {t('home_auth.go_dashboard')} <ChevronRight size={18} />
                                </PremiumButton>
                                {userRole === 'student' && (
                                    <PremiumButton onClick={handleFindTeacher} variant="outline" size="lg" className="w-full sm:w-auto text-white">
                                        {t('home_auth.find_mentor')}
                                    </PremiumButton>
                                )}
                            </div>
                        </motion.div>

                        {/* Real Stats Grid */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {userRole === 'teacher' ? (
                                <>
                                    <DashboardCard title={t('home_auth.stat_students')} value={userData?.studentsCount || 0} icon={Users} color="bg-blue-500" subtitle={t('home_auth.stat_students_sub')} />
                                    <DashboardCard title={t('home_auth.stat_pending')} value={realStats.pendingBookings} icon={Calendar} color="bg-orange-500" subtitle={t('home_auth.stat_pending_sub')} />
                                    <DashboardCard title={t('home_auth.stat_balance')} value={`${userData?.balance || 0} €`} icon={WalletIcon} color="bg-emerald-500" subtitle={t('home_auth.stat_balance_sub')} />
                                    <DashboardCard title={t('home_auth.stat_rating')} value={realStats.teacherRating} icon={Star} color="bg-gold" subtitle={t('home_auth.stat_rating_sub')} />
                                </>
                            ) : (
                                <>
                                    <DashboardCard title={t('home_auth.stat_level')} value={`LVL ${userData?.level || 1}`} icon={TrendingUp} color="bg-gold" subtitle={t('home_auth.stat_level_sub')} />
                                    <DashboardCard title={t('home_auth.stat_streak')} value={`${userData?.streak || 0} ${t('home_auth.stat_streak_sub').split(' ').pop()}`} icon={Zap} color="bg-orange-500" subtitle={t('home_auth.stat_streak_sub')} />
                                    <DashboardCard title={t('home_auth.stat_completed')} value={realStats.studentCompletedClasses} icon={Award} color="bg-emerald-500" subtitle={t('home_auth.stat_completed_sub')} />
                                    <DashboardCard title={t('home_auth.stat_upcoming')} value={realStats.pendingBookings} icon={Calendar} color="bg-blue-500" subtitle={t('home_auth.stat_upcoming_sub')} />
                                </>
                            )}
                        </motion.div>

                        {/* Direct Tools */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => navigate(userRole === 'teacher' ? '/dashboard' : '/mentors')}>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:text-gold transition-all">
                                    <BookOpen size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">{t('home_auth.communications')}</h3>
                                <p className="text-[#8b8982]">{t('home_auth.communications_desc')}</p>
                            </div>

                            <div className="glass-panel p-8 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer group" onClick={() => navigate('/wallet')}>
                                <div className="w-16 h-16 rounded-2xl bg-white/5 text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:text-gold transition-all">
                                    <WalletIcon size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">{t('home_auth.finances')}</h3>
                                <p className="text-[#8b8982]">
                                    {userRole === 'teacher' ? t('home_auth.finances_desc_teacher') : t('home_auth.finances_desc_student')}
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

            <div className="relative pt-32 pb-24 px-4">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-4xl mx-auto text-center relative z-10"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gold text-[10px] font-black uppercase tracking-[5.5px] mb-10 backdrop-blur-md shadow-xl">
                        <Sparkles size={16} /> {t('hero.badge')}
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl lg:text-[110px] font-black tracking-tighter text-white mb-10 leading-[0.9]">
                        {t('hero.title_line1')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-100 to-gold italic">{t('hero.title_line2')}</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="text-lg md:text-2xl text-[#8b8982] max-w-3xl mx-auto mb-14 leading-relaxed font-light">
                        {t('hero.description')}
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <PremiumButton onClick={handleFindTeacher} size="xl" icon={Play} className="w-full sm:w-auto min-w-[280px] shadow-2xl shadow-gold/20 hover:shadow-gold/40">
                            {t('hero.cta_start')}
                        </PremiumButton>
                        <PremiumButton variant="outline" size="xl" onClick={() => navigate('/onboarding')} className="w-full sm:w-auto min-w-[240px] border-white/20 text-white">
                            {t('hero.cta_teach')}
                        </PremiumButton>
                    </motion.div>

                    {/* Stats Bar */}
                    <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center gap-10 md:gap-20 mt-16 pt-12 border-t border-white/5">
                        <div>
                            <div className="text-4xl font-black text-white">{stats.users}+</div>
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">{t('stats.users')}</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-gold">{stats.teachers}+</div>
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">{t('stats.teachers')}</div>
                        </div>
                        <div>
                            <div className="text-4xl font-black text-white">{stats.requests}+</div>
                            <div className="text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">{t('stats.matches')}</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Features (Minimalist Grid) */}
            <div className="py-20 px-4 bg-white/[0.01] border-y border-white/5 relative z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 max-w-2xl mx-auto">
                        <span className="text-gold font-black text-[11px] tracking-[5px] uppercase mb-5 block">{t('features.section_label')}</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{t('features.section_title')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard icon={Monitor} title={t('features.classroom.title')} description={t('features.classroom.desc')} delay="0.1s" />
                        <FeatureCard icon={Zap} title={t('features.fast_match.title')} description={t('features.fast_match.desc')} delay="0.2s" />
                        <FeatureCard icon={Globe} title={t('features.wallet.title')} description={t('features.wallet.desc')} delay="0.3s" />
                        <FeatureCard icon={LayoutDashboard} title={t('features.data.title')} description={t('features.data.desc')} delay="0.4s" />
                        <FeatureCard icon={ShieldCheck} title={t('features.verified.title')} description={t('features.verified.desc')} delay="0.5s" />
                        <FeatureCard icon={Sparkles} title={t('features.dark_glass.title')} description={t('features.dark_glass.desc')} delay="0.6s" />
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="py-32 px-4 text-center relative overflow-hidden bg-gradient-to-b from-transparent to-black">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px] pointer-events-none" />

                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={containerVariants}
                    className="max-w-4xl mx-auto relative z-10"
                >
                    <motion.h2 variants={itemVariants} className="text-5xl md:text-7xl font-black text-white mb-12 tracking-tighter leading-none">
                        {t('cta_footer.title_line1')} <br /> <span className="text-gold italic uppercase">{t('cta_footer.title_line2')}</span>
                    </motion.h2>
                    <motion.div variants={itemVariants}>
                        <PremiumButton onClick={handleFindTeacher} size="xl" className="shadow-2xl shadow-gold/30">
                            {t('cta_footer.button')} <ChevronRight size={24} className="ml-2" />
                        </PremiumButton>
                    </motion.div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/5 bg-black/50 backdrop-blur-sm relative z-10">
                <div className="max-w-6xl mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        {/* Logo + Copyright */}
                        <div className="flex flex-col items-center md:items-start gap-3">
                            <Link to="/" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                                <Logo />
                            </Link>
                            <p className="text-[11px] text-white/30 font-medium tracking-wider">
                                © {new Date().getFullYear()} TopChess. {t('footer.rights')}
                            </p>
                        </div>

                        {/* Links */}
                        <div className="flex items-center gap-8">
                            <Link to="/mentors" className="text-xs text-white/40 hover:text-gold font-bold uppercase tracking-widest transition-colors">
                                {t('footer.mentors')}
                            </Link>
                            <Link to="/onboarding" className="text-xs text-white/40 hover:text-gold font-bold uppercase tracking-widest transition-colors">
                                {t('footer.register')}
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
