import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LayoutDashboard, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';
import Logo from './Logo';

const Navbar: React.FC = () => {
    const authContext = useAuth();
    const { userRole, logout } = authContext;
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isClassroom = location.pathname.includes('/classroom/') || location.pathname.includes('/room/');

    return (
        <nav
            className={`fixed top-0 left-0 right-0 h-16 z-50 transition-all duration-500 flex items-center justify-between px-6 
        ${isScrolled
                    ? 'bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 shadow-2xl'
                    : 'bg-transparent border-b border-transparent'}`}
        >
            <Link to="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80" aria-label="Home">
                <Logo className="w-8 h-8 text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]" />
                <h1 className="font-bold text-xl tracking-tighter text-white">
                    TOP<span className="text-gold font-light">CHESS</span>
                </h1>
            </Link>

            <div className="flex items-center gap-4">
                {!authContext?.isAuthenticated ? (
                    <button
                        onClick={() => authContext?.loginWithGoogle()}
                        className="px-6 py-2 rounded-xl bg-white text-black font-bold hover:bg-gold transition-all duration-300 text-xs uppercase tracking-widest shadow-lg shadow-white/5"
                    >
                        Iniciar Sesión
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        {userRole === 'teacher' && (
                            <Link
                                to="/dashboard"
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all border border-white/5 hover:border-white/10 font-bold text-[10px] uppercase tracking-wider"
                            >
                                <LayoutDashboard size={14} />
                                {t('nav.panel')}
                            </Link>
                        )}

                        {authContext.currentUser?.email === 'andreslgumuzio@gmail.com' && (
                            <Link
                                to="/admin"
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all border border-red-500/20 font-bold text-[10px] uppercase tracking-wider"
                            >
                                <LayoutDashboard size={14} />
                                Admin
                            </Link>
                        )}

                        <Link
                            to="/profile"
                            className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white transition-all border border-white/5 hover:border-white/10 shadow-inner"
                            title="Mi Perfil"
                        >
                            {authContext.currentUser?.photoURL ? (
                                <img src={authContext.currentUser.photoURL} alt="Profile" className="w-6 h-6 rounded-lg object-cover" />
                            ) : (
                                <User size={18} />
                            )}
                        </Link>

                        <button
                            onClick={logout}
                            className="p-2 rounded-xl bg-red-500/5 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-all border border-red-500/10"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
