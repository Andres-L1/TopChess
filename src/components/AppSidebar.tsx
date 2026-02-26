import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Search,
    MessageCircle,
    Wallet,
    User,
    LogOut,
    Shield,
    Map,
    Video,
    Menu,
    X,
    Home
} from 'lucide-react';
import { useAuth } from '../App';
import Logo from './Logo';
import { firebaseService } from '../services/firebaseService';

const AppSidebar: React.FC = () => {
    const { userRole, logout, currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isTeacher = userRole === 'teacher' || userRole === 'club_director';
    const isStudent = userRole === 'student';

    // Async admin check
    useEffect(() => {
        if (currentUser?.uid) {
            firebaseService.isAdmin(currentUser.uid).then(setIsAdmin);
        }
    }, [currentUser?.uid]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const menuItems = [
        {
            title: 'Mi Sala',
            icon: Home,
            path: isTeacher ? '/dashboard' : '/student-dashboard',
            show: true
        },
        {
            title: 'Mundo TopChess',
            icon: Map,
            path: '/mundo',
            show: true
        },
        {
            title: 'Aula Virtual',
            icon: Video,
            path: `/room/${currentUser?.uid ?? ''}`,
            show: isTeacher && !!currentUser?.uid
        },
        {
            title: 'Chat',
            icon: MessageCircle,
            path: `/chat/${currentUser?.uid || 'inbox'}`,
            show: true
        },
        {
            title: 'Billetera',
            icon: Wallet,
            path: '/wallet',
            show: true
        },
        {
            title: 'Oficina Virtual',
            icon: Map,
            path: '/office',
            show: userRole === 'club_director'
        },
        {
            title: 'Administración',
            icon: Shield,
            path: '/admin',
            show: isAdmin
        }
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const sidebarContent = (
        <>
            {/* Logo Section */}
            <div className="p-6 mb-4 flex items-center gap-3 overflow-hidden">
                <Link to={isTeacher ? '/dashboard' : '/student-dashboard'} className="flex items-center gap-3 min-w-max">
                    <Logo className="w-8 h-8 text-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] flex-shrink-0" />
                    <h1 className="font-bold text-xl tracking-tighter text-white opacity-0 lg:opacity-100 transition-opacity">
                        TOP<span className="text-gold font-light">CHESS</span>
                    </h1>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
                {menuItems.filter(item => item.show).map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path.startsWith('/chat/') && location.pathname.startsWith('/chat/'));
                    return (
                        <Link
                            key={item.title}
                            to={item.path}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group/item ${isActive
                                ? 'liquid-glass-subtle liquid-glow text-gold border-gold/20'
                                : 'text-text-muted hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={isActive ? 'text-gold' : 'text-gold/70 group-hover/item:text-gold transition-colors'} />
                            <span className="font-bold text-xs uppercase tracking-widest opacity-0 lg:opacity-100 transition-opacity whitespace-nowrap">
                                {item.title}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Profile Section */}
            <div className="p-4 border-t border-white/5">
                <div className="flex flex-col gap-2">
                    <Link
                        to="/profile"
                        className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group/profile"
                    >
                        <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {currentUser?.photoURL ? (
                                <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User size={16} className="text-gold" />
                            )}
                        </div>
                        <div className="opacity-0 lg:opacity-100 transition-opacity overflow-hidden">
                            <p className="text-white text-[10px] font-bold truncate">{currentUser?.displayName || 'Mi Perfil'}</p>
                            <p className="text-gold text-[8px] font-mono uppercase tracking-tighter">{userRole}</p>
                        </div>
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-4 py-3 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all group/logout"
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        <span className="font-bold text-[10px] uppercase tracking-widest opacity-0 lg:opacity-100 transition-opacity">
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-[101] p-2.5 bg-[#0d0d0c]/90 backdrop-blur-md border border-white/10 rounded-xl text-gold shadow-lg"
                aria-label="Abrir menú"
            >
                <Menu size={22} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[101]"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Desktop sidebar (always visible on lg+) */}
            <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 liquid-glass-dark border-r-0 flex-col z-[100]">
                {sidebarContent}
            </aside>

            {/* Mobile sidebar (slide-in drawer) */}
            <aside
                className={`lg:hidden fixed left-0 top-0 h-screen w-72 liquid-glass-dark border-r-0 flex flex-col z-[102] transform transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Close button for mobile */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-5 right-4 p-2 text-white/40 hover:text-white transition-colors"
                    aria-label="Cerrar menú"
                >
                    <X size={20} />
                </button>
                {sidebarContent}
            </aside>
        </>
    );
};

export default AppSidebar;
