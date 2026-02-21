import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LayoutDashboard, LogOut, Shield, Globe, X, Bell, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';
import Logo from './Logo';
import MobileNavbar from './MobileNavbar';
import { firebaseService } from '../services/firebaseService';
import { AppNotification } from '../types/index';

const Navbar: React.FC = () => {
    const authContext = useAuth();
    const { userRole, logout } = authContext;
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    useEffect(() => {
        if (authContext?.currentUserId) {
            const unsubscribe = firebaseService.subscribeToNotifications(authContext.currentUserId, (data) => {
                setNotifications(data);
            });
            return () => unsubscribe();
        } else {
            setNotifications([]);
        }
    }, [authContext?.currentUserId]);

    const handleNotificationClick = async (notif: AppNotification) => {
        if (!notif.read) {
            await firebaseService.markNotificationAsRead(notif.id);
        }
        setShowNotifications(false);
        if (notif.link) {
            navigate(notif.link);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [location]);

    const handleLogin = async () => {
        setIsLoginLoading(true);
        try {
            await authContext?.loginWithGoogle();
            setIsMenuOpen(false); // Close menu on successful login
        } catch (e) {
            console.error("Login failed:", e);
        } finally {
            setIsLoginLoading(false); // Reset loading state
        }
    };



    const isClassroom = location.pathname.includes('/classroom/') || location.pathname.includes('/room/');

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 h-16 z-[100] transition-all duration-500 border-b ${isScrolled || isMenuOpen
                    ? 'bg-dark-bg/95 backdrop-blur-xl border-white/5 shadow-2xl'
                    : 'bg-transparent border-transparent'}`}
            >
                <div className="h-full px-6 flex items-center justify-between relative z-[101]">
                    <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80" aria-label="Home">
                        <Logo className="w-8 h-8 text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
                        <h1 className="font-bold text-xl tracking-tighter text-white">
                            TOP<span className="text-gold font-light">CHESS</span>
                        </h1>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Language Switcher */}
                        <button
                            onClick={() => {
                                const newLang = i18n.language === 'es' ? 'en' : 'es';
                                i18n.changeLanguage(newLang);
                            }}
                            aria-label="Cambiar idioma"
                            className="text-xs font-bold text-white/70 hover:text-gold transition-colors uppercase tracking-widest flex items-center gap-1"
                        >
                            <Globe size={14} />
                            {i18n.language === 'es' ? 'ES' : 'EN'}
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-2"></div>
                        {!authContext?.isAuthenticated ? (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleLogin}
                                    disabled={isLoginLoading}
                                    className="btn-primary"
                                >
                                    {isLoginLoading ? '...' : t('nav.login')}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 relative">
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowNotifications(!showNotifications);
                                            setIsMenuOpen(false);
                                        }}
                                        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        <Bell size={18} className="text-white/80 hover:text-white transition-colors" />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-red-500/50 animate-pulse">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Desktop Notifications Dropdown */}
                                    {showNotifications && (
                                        <div className="absolute top-14 right-0 w-80 bg-stone-900 border border-white/5 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-3xl animate-enter">
                                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Notificaciones</h3>
                                                {unreadCount > 0 && (
                                                    <span className="text-[10px] bg-gold/20 text-gold px-2 py-0.5 rounded font-bold uppercase tracking-widest">{unreadCount} Nuevas</span>
                                                )}
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                                                {notifications.length > 0 ? (
                                                    notifications.map(notif => (
                                                        <button
                                                            key={notif.id}
                                                            onClick={() => handleNotificationClick(notif)}
                                                            className={`w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 flex gap-3 ${!notif.read ? 'bg-gold/5' : ''}`}
                                                        >
                                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-gold' : 'bg-transparent'}`}></div>
                                                            <div>
                                                                <p className={`text-sm ${!notif.read ? 'text-white font-bold' : 'text-text-muted font-medium'}`}>{notif.title}</p>
                                                                <p className="text-xs text-text-muted mt-1 leading-relaxed">{notif.message}</p>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center text-text-muted text-sm">No tienes notificaciones x</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    aria-label="Abrir menú de usuario"
                                    className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    {authContext.currentUser?.photoURL && authContext.currentUser.photoURL.startsWith('http') ? (
                                        <img src={authContext.currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <User size={18} className="text-gold" />
                                    )}
                                    {userRole === 'teacher' && (
                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center text-[8px] font-bold text-black border border-black">
                                            T
                                        </span>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        {/* Language Switcher */}
                        <button
                            onClick={() => {
                                const newLang = i18n.language === 'es' ? 'en' : 'es';
                                i18n.changeLanguage(newLang);
                            }}
                            aria-label="Cambiar idioma móvil"
                            className="text-xs font-bold text-white/70 hover:text-gold transition-colors uppercase tracking-widest flex items-center gap-1"
                        >
                            <Globe size={14} />
                            {i18n.language === 'es' ? 'ES' : 'EN'}
                        </button>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label="Abrir menú de usuario móvil"
                            className="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                        >
                            {authContext?.isAuthenticated && authContext.currentUser?.photoURL && authContext.currentUser.photoURL.startsWith('http') ? (
                                <img src={authContext.currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                                <User size={18} className="text-gold" />
                            )}
                            {authContext?.isAuthenticated && userRole === 'teacher' && (
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center text-[8px] font-bold text-black border border-black">
                                    T
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            {isMenuOpen && createPortal(
                <div
                    className={`fixed inset-0 z-[99] bg-dark-bg/95 backdrop-blur-xl transition-transform duration-300 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    <div className="absolute top-0 right-0 p-6 z-[101]">
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            aria-label="Cerrar menú"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <div className="flex flex-col items-center justify-center h-full p-6">
                        <div className="flex flex-col items-center gap-6 mb-8">
                            <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80" aria-label="Home">
                                <Logo className="w-12 h-12 text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
                                <h1 className="font-bold text-3xl tracking-tighter text-white">
                                    TOP<span className="text-gold font-light">CHESS</span>
                                </h1>
                            </Link>
                        </div>

                        {!authContext?.isAuthenticated ? (
                            <div className="flex flex-col gap-4 w-full">
                                <button
                                    onClick={handleLogin}
                                    disabled={isLoginLoading}
                                    className="btn-primary w-full"
                                >
                                    {isLoginLoading && <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                                    {isLoginLoading ? 'Iniciando...' : t('nav.login')}
                                </button>
                            </div>
                        ) : (

                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    {authContext.currentUser?.photoURL && authContext.currentUser.photoURL.startsWith('http') ? (
                                        <img src={authContext.currentUser.photoURL} alt="Profile" className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                                            <User size={20} className="text-gold" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-white font-bold text-sm truncate max-w-[140px]">{authContext.currentUser?.displayName}</p>
                                        <p className="text-gold text-[10px] font-mono uppercase tracking-widest">{userRole}</p>
                                    </div>
                                </div>

                                {(userRole === 'teacher' || userRole === 'club_director') && (
                                    <Link
                                        to="/dashboard"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wider"
                                    >
                                        <LayoutDashboard size={18} className="text-gold/70" />
                                        {t('nav.panel')}
                                    </Link>
                                )}

                                {authContext.currentUser?.email === 'andreslgumuzio@gmail.com' && (
                                    <Link
                                        to="/admin"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wider"
                                    >
                                        <Shield size={18} className="text-red-400" />
                                        {t('nav.admin')}
                                    </Link>
                                )}

                                {userRole === 'club_director' && (
                                    <Link
                                        to="/office"
                                        onClick={() => setIsMenuOpen(false)}
                                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wider"
                                    >
                                        <Map size={18} className="text-purple-400" />
                                        OFICINA VIRTUAL
                                    </Link>
                                )}

                                <Link
                                    to="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wider"
                                >
                                    <User size={18} className="text-blue-400" />
                                    {t('nav.profile')}
                                </Link>

                                <button
                                    onClick={() => { logout(); setIsMenuOpen(false); }}
                                    className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-500/80 hover:text-red-500 hover:bg-red-500/10 transition-all text-sm font-bold uppercase tracking-wider mt-4"
                                >
                                    <LogOut size={18} />
                                    {t('nav.logout')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
            <MobileNavbar onMenuClick={() => setIsMenuOpen(true)} />
        </>
    );
};

export default Navbar;
