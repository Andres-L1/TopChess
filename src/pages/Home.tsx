import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Play, Sparkles, Users, Award, Zap, LayoutDashboard, Monitor,
    Globe, ShieldCheck, ChevronRight, BookOpen, Star, Target,
    TrendingUp, Wallet as WalletIcon, Calendar, Box, MessageCircle, type LucideIcon
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

    // Authenticated users are redirected from "/" to their dashboards in App.tsx
    // This page only serves as the public marketing landing page.

    return (
        <div className="relative min-h-screen bg-[#050505] overflow-x-hidden">
            {/* Liquid Glass Background Blobs */}
            <div className="absolute top-0 inset-x-0 h-screen pointer-events-none select-none overflow-hidden">
                <div className="absolute top-[-15%] right-[-10%] w-[55%] h-[55%] bg-gradient-to-br from-gold/8 to-amber-600/5 animate-liquid-morph blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] bg-gradient-to-tr from-violet-500/6 to-blue-500/4 animate-liquid-morph blur-[120px]" style={{ animationDelay: '-5s' }} />
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-gradient-to-r from-emerald-500/4 to-cyan-500/3 animate-liquid-morph blur-[100px]" style={{ animationDelay: '-10s' }} />
            </div>

            <div className="relative pt-32 pb-24 px-4">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="max-w-4xl mx-auto text-center relative z-10"
                >
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full liquid-glass-subtle liquid-shimmer text-gold text-[10px] font-black uppercase tracking-[5.5px] mb-10 shadow-xl">
                        <Sparkles size={16} className="relative z-10" /> <span className="relative z-10">{t('hero.badge')}</span>
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

                    {/* Stats Bar — Liquid Glass Cards */}
                    <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 md:gap-6 mt-16 pt-12 border-t border-white/5 max-w-2xl mx-auto">
                        <div className="liquid-glass-subtle rounded-2xl p-4 md:p-6 text-center">
                            <div className="text-3xl md:text-4xl font-black text-white">{stats.users}+</div>
                            <div className="text-[9px] md:text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">{t('stats.users')}</div>
                        </div>
                        <div className="liquid-glass-subtle rounded-2xl p-4 md:p-6 text-center liquid-glow">
                            <div className="text-3xl md:text-4xl font-black text-gold">{stats.teachers}+</div>
                            <div className="text-[9px] md:text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">{t('stats.teachers')}</div>
                        </div>
                        <div className="liquid-glass-subtle rounded-2xl p-4 md:p-6 text-center">
                            <div className="text-3xl md:text-4xl font-black text-white">{stats.requests}+</div>
                            <div className="text-[9px] md:text-[10px] text-white/40 uppercase font-bold tracking-[3px] mt-2">{t('stats.matches')}</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Features (Minimalist Grid) */}
            <div className="py-24 px-4 relative z-10">
                {/* Subtle glass divider */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20 max-w-2xl mx-auto">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-subtle text-gold font-black text-[11px] tracking-[5px] uppercase mb-6">{t('features.section_label')}</span>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">{t('features.section_title')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard icon={Monitor} title={t('features.classroom.title')} description={t('features.classroom.desc')} delay="0.1s" />
                        <FeatureCard icon={Users} title={t('features.fast_match.title')} description={t('features.fast_match.desc')} delay="0.2s" />
                        <FeatureCard icon={Box} title={t('features.wallet.title')} description={t('features.wallet.desc')} delay="0.3s" />
                        <FeatureCard icon={TrendingUp} title={t('features.data.title')} description={t('features.data.desc')} delay="0.4s" />
                        <FeatureCard icon={MessageCircle} title={t('features.verified.title')} description={t('features.verified.desc')} delay="0.5s" />
                        <FeatureCard icon={Sparkles} title={t('features.dark_glass.title')} description={t('features.dark_glass.desc')} delay="0.6s" />
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Final CTA */}
            <div className="py-32 px-4 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-gold/8 to-amber-500/5 animate-liquid-morph blur-[120px] pointer-events-none" />
                <div className="absolute top-[30%] right-[20%] w-[200px] h-[200px] bg-violet-500/5 animate-liquid-morph blur-[80px] pointer-events-none" style={{ animationDelay: '-7s' }} />

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
                        <PremiumButton onClick={handleFindTeacher} size="xl" className="shadow-2xl shadow-gold/30 liquid-shimmer">
                            <span className="relative z-10 flex items-center gap-2">{t('cta_footer.button')} <ChevronRight size={24} /></span>
                        </PremiumButton>
                    </motion.div>
                </motion.div>
            </div>

            {/* Footer */}
            <footer className="liquid-glass-dark border-t-0 relative z-10">
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
