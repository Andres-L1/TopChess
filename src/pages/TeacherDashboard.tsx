import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Clock, Trophy, ExternalLink, Bell, Check, X, Video, LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Skeleton from '../components/Skeleton';
import { Request, Teacher, Booking } from '../types/index';

interface DashboardStats {
    earnings: number;
    students: number;
    hours: number;
}

const TeacherDashboard = () => {
    const { currentUserId, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'schedule'>('overview');
    const [stats, setStats] = useState<DashboardStats>({ earnings: 0, students: 0, hours: 0 });
    const [requests, setRequests] = useState<Request[]>([]);
    const [availability, setAvailability] = useState<string[]>([]);
    const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Teacher Profile
                const profile = await firebaseService.getTeacherById(currentUserId);
                setTeacherProfile(profile);

                // Fetch Availability, Requests and Bookings
                const avail = await firebaseService.getTeacherAvailability(currentUserId);
                const reqs = await firebaseService.getRequestsForTeacher(currentUserId);
                const bookings = await firebaseService.getBookingsForUser(currentUserId, 'teacher');

                if (profile) {
                    setStats({
                        earnings: profile.earnings,
                        students: profile.classesGiven > 0 ? Math.floor(profile.classesGiven / 4) : 0,
                        hours: profile.classesGiven
                    });
                }

                setRequests(reqs);
                setAvailability(avail);

                if (bookings.length > 0) {
                    // Simple sort by date and time
                    const sorted = [...bookings].sort((a, b) => {
                        const dateCompare = a.date.localeCompare(b.date);
                        if (dateCompare !== 0) return dateCompare;
                        return a.time.localeCompare(b.time);
                    });
                    setNextBooking(sorted[0]);
                }
            } catch (error) {
                console.error("Error fetching dashboard data", error);
                toast.error("Error al cargar datos");
            } finally {
                setIsLoading(false);
            }
        };

        if (currentUserId) {
            fetchData();
        }
    }, [currentUserId]);

    const handleAcceptRequest = async (studentId: string) => {
        const req = requests.find(r => r.studentId === studentId);
        if (req) {
            await firebaseService.updateRequestStatus(req.id, 'approved');
            setRequests(prev => prev.filter(r => r.studentId !== studentId));
            toast.success(`Solicitud de entrada aceptada`);
            // Refresh teacher profile stats if needed
            const profile = await firebaseService.getTeacherById(currentUserId);
            setTeacherProfile(profile);
        }
    };

    const handleSaveAvailability = async (newAvail: string[]) => {
        await firebaseService.updateTeacherAvailability(currentUserId, newAvail);
        setAvailability(newAvail);
        toast.success("Horario actualizado correctamente");
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // GAMIFICATION LOGIC
    const calculateLevel = (classes: number) => {
        if (classes < 10) return { name: 'Novato', next: 'Instructor', target: 10, currentComm: 0.50, nextComm: 0.55 };
        if (classes < 50) return { name: 'Instructor', next: 'Profesor', target: 50, currentComm: 0.55, nextComm: 0.60 };
        if (classes < 200) return { name: 'Profesor', next: 'Maestro', target: 200, currentComm: 0.60, nextComm: 0.70 };
        return { name: 'Maestro', next: 'Gran Maestro', target: 1000, currentComm: 0.70, nextComm: 0.85 };
    };

    const levelInfo = teacherProfile ? calculateLevel(teacherProfile.classesGiven) : calculateLevel(0);
    const progressPercent = teacherProfile ? Math.min(100, (teacherProfile.classesGiven / levelInfo.target) * 100) : 0;
    const currency = teacherProfile?.currency === 'EUR' ? '€' : '$';

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
                        {t('dashboard.title')} <span className="text-gold">.</span>
                    </h1>
                    <p className="text-sm md:text-base text-text-muted">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-4 items-center w-full md:w-auto">
                    <Link to={`/classroom/${currentUserId}`} className="btn-secondary flex items-center gap-2 text-sm md:text-base flex-1 md:flex-none justify-center">
                        <ExternalLink size={18} />
                        {t('dashboard.my_classroom')}
                    </Link>
                    <div className="flex gap-2 p-1 bg-dark-panel rounded-lg border border-white/5 flex-1 md:flex-none justify-center">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            {t('dashboard.overview')}
                        </button>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all ${activeTab === 'schedule' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            {t('dashboard.schedule')}
                        </button>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-text-muted hover:text-red-400 transition-colors rounded-lg border border-white/5 hover:border-red-500/20"
                        title={t('nav.exit')}
                        aria-label={t('nav.exit')}
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {activeTab === 'schedule' ? (
                <div className="glass-panel p-4 md:p-6 rounded-2xl animate-enter overflow-x-auto">
                    <div className="min-w-[600px] md:min-w-0">
                        <Calendar
                            mode="edit"
                            availability={availability}
                            onSaveAvailability={handleSaveAvailability}
                        />
                    </div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {isLoading ? (
                            <>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col justify-between">
                                        <Skeleton width="40%" height={20} />
                                        <Skeleton width="80%" height={40} />
                                    </div>
                                ))}
                            </>
                        ) : (
                            <>
                                <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-xl bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
                                            <DollarSign size={24} />
                                        </div>
                                        <span className="text-xs font-mono text-green-400/80">Ganancia: {(levelInfo.currentComm * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.earnings.toFixed(2)}{currency}</span>
                                        <p className="text-xs md:text-sm text-text-muted">{t('dashboard.total_earnings')}</p>
                                    </div>
                                </div>

                                <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                            <Users size={24} />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.students}</span>
                                        <p className="text-xs md:text-sm text-text-muted">{t('dashboard.active_students')}</p>
                                    </div>
                                </div>

                                <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                                            <Clock size={24} />
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.hours}h</span>
                                        <p className="text-xs md:text-sm text-text-muted">{t('dashboard.classes_given')}</p>
                                    </div>
                                </div>

                                {/* Gamification Card */}
                                <div className="glass-panel p-4 md:p-6 rounded-2xl bg-gradient-to-br from-dark-panel to-gold/5 border-gold/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Trophy size={20} className="text-gold" />
                                            <span className="text-gold font-bold text-sm uppercase tracking-wider">Nivel {levelInfo.name}</span>
                                        </div>
                                        <div className="w-full bg-black/40 h-2 rounded-full mb-2 overflow-hidden relative">
                                            <div
                                                className="h-full bg-gradient-to-r from-gold to-orange-500 shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all duration-1000"
                                                style={{ width: `${progressPercent}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-text-muted flex justify-between">
                                            <span>{teacherProfile?.classesGiven || 0} / {levelInfo.target} Clases</span>
                                            <span className="text-gold">Siguiente: {levelInfo.next}</span>
                                        </p>
                                        <div className="mt-3 pt-3 border-t border-white/5 text-[10px] space-y-1">
                                            <p className="flex justify-between text-white/80"><span>Tu Comisión Actual:</span> <span className="text-green-400 font-mono font-bold">{(levelInfo.currentComm * 100).toFixed(0)}%</span></p>
                                            <p className="flex justify-between text-white/50"><span>Siguiente Nivel:</span> <span className="text-gold font-mono">{(levelInfo.nextComm * 100).toFixed(0)}%</span></p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex gap-6 flex-col lg:flex-row h-full">
                        {/* Requests Feed */}
                        <div className="flex-1 glass-panel rounded-2xl p-4 md:p-6 min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg md:text-xl font-bold text-white">{t('dashboard.pending_requests')}</h2>
                                {!isLoading && requests.length > 0 && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold animate-pulse">{requests.length} nuevas</span>}
                            </div>

                            <div className="space-y-4">
                                {isLoading ? (
                                    <>
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
                                                <Skeleton width="100%" height={60} />
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    requests.length === 0 ? (
                                        <div className="text-center py-10 text-text-muted">
                                            <Bell size={40} className="mx-auto mb-4 opacity-20" />
                                            <p>No tienes solicitudes de alumnos por el momento.</p>
                                        </div>
                                    ) : (
                                        requests.map(req => (
                                            <div key={req.id} className="p-3 md:p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-3">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0">
                                                        {req.studentId.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white">ID Alumno: {req.studentId.substring(0, 8)}...</h4>
                                                        <p className="text-xs text-text-muted">Interesado en tus clases</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto justify-end">
                                                    <button
                                                        onClick={() => handleAcceptRequest(req.studentId)}
                                                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all" title="Aceptar" aria-label="Aceptar">
                                                        <Check size={18} />
                                                    </button>
                                                    <button className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Rechazar" aria-label="Rechazar">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>

                        {/* Quick Classroom Link */}
                        <div className="w-full lg:w-80 glass-panel rounded-2xl p-4 md:p-6 flex flex-col gap-4">
                            <h2 className="text-lg md:text-xl font-bold text-white mb-2">{t('dashboard.quick_access')}</h2>
                            <Link to={`/classroom/${currentUserId}`} className="group relative overflow-hidden rounded-xl aspect-video bg-black flex items-center justify-center border border-white/10 hover:border-gold/50 transition-all">
                                <div className="absolute inset-0 bg-gradient-to-br from-dark-panel to-gold/20 opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-gold/90 text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)] group-hover:scale-110 transition-transform">
                                        <Video size={24} />
                                    </div>
                                    <span className="font-bold text-white tracking-wide">{t('dashboard.enter_classroom')}</span>
                                </div>
                            </Link>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                <h4 className="font-bold text-sm text-gold">{t('dashboard.next_class')}</h4>
                                {nextBooking ? (
                                    <>
                                        <p className="text-xs text-white">Clase el {nextBooking.date}</p>
                                        <p className="text-[10px] text-text-muted">Hora: {nextBooking.time}</p>
                                        <div className="h-1 w-full bg-black/50 rounded-full overflow-hidden mt-1">
                                            <div className="h-full bg-green-500 w-full animate-pulse-slow"></div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-text-muted italic">No tienes clases próximas agendadas.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherDashboard;
