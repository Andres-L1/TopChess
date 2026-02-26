import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, BookOpen, User, Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../App';

interface MobileNavbarProps {
    onMenuClick: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ onMenuClick }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const { userRole, isAuthenticated } = useAuth();

    const isActive = (path: string) => location.pathname === path;

    // Don't show on classroom/room pages as they need full screen
    if (location.pathname.includes('/classroom/') || location.pathname.includes('/room/')) {
        return null;
    }

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 liquid-glass-dark border-t-0 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                <Link
                    to="/"
                    aria-label={t('mobile_nav.home')}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/') ? 'text-gold' : 'text-white/40 hover:text-white/80'}`}
                >
                    {isActive('/') && <div className="absolute top-0 w-8 h-1 bg-gold rounded-b-full shadow-[0_0_15px_rgba(212,175,55,0.6)]" />}
                    <Home size={20} />
                    <span className="text-[10px] font-medium">{t('mobile_nav.home')}</span>
                </Link>

                {isAuthenticated && (
                    <Link
                        to="/mentors"
                        aria-label={t('mobile_nav.mentors')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/mentors') ? 'text-gold' : 'text-white/40 hover:text-white/80'}`}
                    >
                        {isActive('/mentors') && <div className="absolute top-0 w-8 h-1 bg-gold rounded-b-full shadow-[0_0_15px_rgba(212,175,55,0.6)]" />}
                        <Search size={20} />
                        <span className="text-[10px] font-medium">{t('mobile_nav.mentors')}</span>
                    </Link>
                )}

                {isAuthenticated && (
                    <Link
                        to={(userRole === 'teacher' || userRole === 'club_director') ? '/dashboard' : '/student-dashboard'}
                        aria-label={t('mobile_nav.panel')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/dashboard') || isActive('/student-dashboard') || isActive('/office') ? 'text-gold' : 'text-white/40 hover:text-white/80'}`}
                    >
                        {(isActive('/dashboard') || isActive('/student-dashboard')) && <div className="absolute top-0 w-8 h-1 bg-gold rounded-b-full shadow-[0_0_15px_rgba(212,175,55,0.6)]" />}
                        <LayoutDashboard size={20} />
                        <span className="text-[10px] font-medium">{t('mobile_nav.panel')}</span>
                    </Link>
                )}

                {isAuthenticated ? (
                    <Link
                        to="/profile"
                        aria-label={t('mobile_nav.profile')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative ${isActive('/profile') ? 'text-gold' : 'text-white/40 hover:text-white/80'}`}
                    >
                        {isActive('/profile') && <div className="absolute top-0 w-8 h-1 bg-gold rounded-b-full shadow-[0_0_15px_rgba(212,175,55,0.6)]" />}
                        <User size={20} />
                        <span className="text-[10px] font-medium">{t('mobile_nav.profile')}</span>
                    </Link>
                ) : (
                    <button
                        onClick={onMenuClick}
                        aria-label={t('nav.login')}
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-white/40 hover:text-white/80"
                    >
                        <User size={20} />
                        <span className="text-[10px] font-medium">{t('nav.login')}</span>
                    </button>
                )}

                <button
                    onClick={onMenuClick}
                    aria-label={t('mobile_nav.menu')}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-white/40 hover:text-white/80"
                >
                    <Menu size={20} />
                    <span className="text-[10px] font-medium">{t('mobile_nav.menu')}</span>
                </button>
            </div>
            {/* Safe area spacer for iPhone X+ home indicator */}
            <div className="h-safe-area-bottom w-full liquid-glass-dark" />
        </div>

    );
};

export default MobileNavbar;
