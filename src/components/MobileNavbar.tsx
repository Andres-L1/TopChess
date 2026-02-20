import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, BookOpen, User, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';

interface MobileNavbarProps {
    onMenuClick: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ onMenuClick }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const { userRole, isAuthenticated, currentUserId } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    // Don't show on classroom/room pages as they need full screen
    if (location.pathname.includes('/classroom/') || location.pathname.includes('/room/')) {
        return null;
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#161512] border-t border-white/10 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                <Link
                    to="/"
                    aria-label="Ir a Inicio"
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/') ? 'text-gold' : 'text-white/40 hover:text-white/80'}`}
                >
                    {isActive('/') && <div className="absolute top-0 w-8 h-1 bg-gold rounded-b-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
                    <Home size={20} />
                    <span className="text-[10px] font-medium">Jugar</span>
                </Link>

                {isAuthenticated && (
                    <Link
                        to={`/classroom/${currentUserId}`}
                        aria-label="Ir a Aula Interactiva"
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive(`/classroom/${currentUserId}`) ? 'text-gold' : 'text-white/40 hover:text-white/80'}`}
                    >
                        {isActive(`/classroom/${currentUserId}`) && <div className="absolute top-0 w-8 h-1 bg-gold rounded-b-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
                        <BookOpen size={20} />
                        <span className="text-[10px] font-medium">Aprender</span>
                    </Link>
                )}

                {isAuthenticated && (
                    <Link
                        to={(userRole === 'teacher' || userRole === 'club_director') ? '/dashboard' : '/student-dashboard'}
                        aria-label="Ir a Mi Panel"
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/dashboard') || isActive('/student-dashboard') || isActive('/office') ? 'text-gold' : 'text-white/40 hover:text-white/80'}`}
                    >
                        {(isActive('/dashboard') || isActive('/student-dashboard')) && <div className="absolute top-0 w-8 h-1 bg-gold rounded-b-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-medium">Panel</span>
                    </Link>
                )}

                {isAuthenticated ? (
                    <Link
                        to="/profile"
                        aria-label="Ir a Mi Perfil"
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/profile') ? 'text-gold' : 'text-white/40 hover:text-white/80'}`}
                    >
                        {isActive('/profile') && <div className="absolute top-0 w-8 h-1 bg-gold rounded-b-full shadow-[0_0_10px_rgba(212,175,55,0.5)]" />}
                        <User size={20} />
                        <span className="text-[10px] font-medium">Perfil</span>
                    </Link>
                ) : (
                    <button
                        onClick={onMenuClick}
                        aria-label="Iniciar Sesión"
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-white/40 hover:text-white/80"
                    >
                        <User size={20} />
                        <span className="text-[10px] font-medium">Login</span>
                    </button>
                )}

                <button
                    onClick={onMenuClick}
                    aria-label="Abrir Menú Principal"
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-white/40 hover:text-white/80"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">Menú</span>
                </button>
            </div>
            {/* Safe area spacer for iPhone X+ home indicator */}
            <div className="h-safe-area-bottom w-full bg-[#161512]" />
        </div>
    );
};

export default MobileNavbar;
