import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Clock, Trophy, ExternalLink, Bell, Check, X, Video, LogOut, TrendingUp, MessageCircle, Map as MapIcon, Plus, Settings } from 'lucide-react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Skeleton from '../components/Skeleton';
import { Request, Teacher, Booking, Homework } from '../types/index';
import { lichessService } from '../services/lichessService';
import HomeworkModal from '../components/HomeworkModal';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';

interface DashboardStats {
    earnings: number;
    students: number;
    hours: number;
}

const TeacherDashboard = () => {
    const { currentUserId, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'homework' | 'club'>('overview');
    const [stats, setStats] = useState<DashboardStats>({ earnings: 0, students: 0, hours: 0 });
    const [requests, setRequests] = useState<Request[]>([]);
    const [myStudents, setMyStudents] = useState<any[]>([]);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [availability, setAvailability] = useState<string[]>([]);
    const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [club, setClub] = useState<any>(null);
    const [clubTeachers, setClubTeachers] = useState<any[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isCreatingClub, setIsCreatingClub] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        if (!currentUserId) return;
        let isMounted = true;
        let unsubRequests: () => void;
        let unsubBookings: () => void;

        const loadStaticData = async () => {
            setIsLoading(true);
            try {
                const profile = await firebaseService.getTeacherById(currentUserId);
                if (isMounted) setTeacherProfile(profile);

                const avail = await firebaseService.getTeacherAvailability(currentUserId);
                if (isMounted) setAvailability(avail);

                const myHomeworks = await firebaseService.getHomeworksForTeacher(currentUserId);
                if (isMounted) setHomeworks(myHomeworks);

                if (profile && isMounted) {
                    setStats({
                        earnings: profile.earnings,
                        students: profile.classesGiven > 0 ? Math.floor(profile.classesGiven / 4) : 0,
                        hours: profile.classesGiven
                    });
                }

                if (profile?.role === 'club_director') {
                    const myClub = await firebaseService.getClubByDirectorId(currentUserId);
                    if (isMounted && myClub) setClub(myClub);
                }
            } catch (error) {
                console.error("Error loading dashboard data", error);
                toast.error("Error al cargar datos estáticos");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadStaticData();

        unsubRequests = firebaseService.observeRequestsForTeacher(currentUserId, async (allReqs) => {
            if (!isMounted) return;
            const pendingPromises = allReqs
                .filter((r: any) => r.status === 'pending')
                .map(async (r: any) => {
                    const u = await firebaseService.getUser(r.studentId);
                    return { ...r, studentName: u?.name || 'Usuario' };
                });
            const pendingRequests = await Promise.all(pendingPromises);
            if (isMounted) setRequests(pendingRequests);

            const approvedReqs = allReqs.filter((r: any) => r.status === 'approved');
            const uniqueApprovedMap = new Map();
            approvedReqs.forEach(r => {
                if (!uniqueApprovedMap.has(r.studentId)) {
                    uniqueApprovedMap.set(r.studentId, r);
                }
            });

            const approvedPromises = Array.from(uniqueApprovedMap.values())
                .map(async (r: any) => {
                    const u = await firebaseService.getUser(r.studentId);
                    return u ? { ...u, requestId: r.id } : null;
                });
            const approvedStudents = await Promise.all(approvedPromises);
            if (isMounted) setMyStudents(approvedStudents.filter(s => s !== null));
        });

        unsubBookings = firebaseService.observeBookingsForUser(currentUserId, 'teacher', (bookings) => {
            if (!isMounted) return;
            if (bookings.length > 0) {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = bookings.filter((b: Booking) =>
                    b.status !== 'cancelled' && b.date >= today
                );
                const sorted = [...upcoming].sort((a, b) => {
                    const dateCompare = a.date.localeCompare(b.date);
                    if (dateCompare !== 0) return dateCompare;
                    return a.time.localeCompare(b.time);
                });
                setNextBooking(sorted[0] ?? null);
            } else {
                setNextBooking(null);
            }
        });

        return () => {
            isMounted = false;
            if (unsubRequests) unsubRequests();
            if (unsubBookings) unsubBookings();
        };
    }, [currentUserId]);

    const handleAcceptRequest = async (requestId: string) => {
        try {
            await firebaseService.updateRequestStatus(requestId, 'approved');
            // The snapshot listener will automatically update the UI lists.
            toast.success(`Solicitud aceptada`);
        } catch (error) {
            console.error("Error accepting request:", error);
            toast.error("Error al procesar solicitud");
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        try {
            await firebaseService.updateRequestStatus(requestId, 'rejected');
            setRequests(prev => prev.filter(r => r.id !== requestId));
            toast.success(`Solicitud rechazada`);
        } catch (error) {
            console.error("Error rejecting request:", error);
            toast.error("Error al rechazar solicitud");
        }
    };

    const handleSaveAvailability = async (newAvail: string[]) => {
        await firebaseService.updateTeacherAvailability(currentUserId, newAvail);
        setAvailability(newAvail);
        toast.success("Horario actualizado correctamente");
    };

    const handleCreateHomework = async (data: Omit<Homework, 'id' | 'teacherId' | 'status' | 'assignedAt'>) => {
        try {
            const newHomework: Homework = {
                ...data,
                id: `hw_${Date.now()}`,
                teacherId: currentUserId,
                status: 'pending',
                assignedAt: Date.now()
            };
            await firebaseService.createHomework(newHomework);
            setHomeworks(prev => [newHomework, ...prev]);
            toast.success("Tarea asignada correctamente");
        } catch (error) {
            console.error("Error create homework", error);
            toast.error("Error al asignar tarea");
        }
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

    const handleCreateClub = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = prompt("Nombre de tu nuevo club:");
        if (!name) return;

        setIsCreatingClub(true);
        try {
            const clubId = await firebaseService.createClub(name, currentUserId);
            toast.success("¡Club creado con éxito! Ahora eres Director de Club.");
            window.location.reload(); // Quickest way to refresh all roles/context
        } catch (error) {
            toast.error("Error al crear el club");
        } finally {
            setIsCreatingClub(false);
        }
    };

    const handleInviteTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        setIsInviting(true);
        try {
            const result = await firebaseService.inviteTeacherToClub(club.id, inviteEmail);
            if (result.success) {
                toast.success(result.message);
                setInviteEmail('');
                // Refresh club data or teachers list
                const updatedTeachers = await firebaseService.getTeachers(); // For now, or just wait for refresh
                setClubTeachers(updatedTeachers.filter(t => t.clubId === club.id));
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Error al invitar profesor");
        } finally {
            setIsInviting(false);
        }
    };

    useEffect(() => {
        if (!club) return;
        const loadClubTeachers = async () => {
            const allTeachers = await firebaseService.getTeachers();
            setClubTeachers(allTeachers.filter(t => t.clubId === club.id));
        };
        loadClubTeachers();
    }, [club]);

    const renderClubTab = () => {
        if (!club && teacherProfile?.role !== 'club_director') {
            return (
                <div className="max-w-2xl mx-auto py-12 text-center animate-enter">
                    <div className="bg-gradient-to-br from-gold/20 to-transparent p-8 rounded-3xl border border-gold/20 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                        <MapIcon size={48} className="text-gold mx-auto mb-6 group-hover:scale-110 transition-transform" />
                        <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Escala tu Academia</h2>
                        <p className="text-white/60 mb-8 leading-relaxed">
                            Crea tu propio club para gestionar múltiples profesores, ver sus clases en tiempo real en la <span className="text-gold font-bold">Oficina Virtual</span> y centralizar tus operaciones.
                        </p>
                        <button
                            onClick={handleCreateClub}
                            disabled={isCreatingClub}
                            className="bg-gold hover:bg-white text-black font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-xl shadow-gold/20 disabled:opacity-50"
                        >
                            {isCreatingClub ? 'Creando...' : 'Crear mi Club'}
                        </button>
                    </div>
                </div>
            );
        }

        if (!club) return <div className="text-center py-20 text-white/40">Cargando datos del club...</div>;

        return (
            <div className="space-y-6 animate-enter">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1b1a17] p-6 rounded-2xl border border-white/5 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                            <Trophy className="text-gold" size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white">{club.name}</h2>
                            <p className="text-sm text-gold/60 font-bold uppercase tracking-widest">Director del Club</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Link to="/office" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl border border-white/10 transition-all font-bold text-sm">
                            <MapIcon size={18} />
                            Oficina Virtual
                        </Link>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1b1a17] text-white/40 p-3 rounded-xl border border-white/5 hover:text-white transition-all">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Users size={20} className="text-gold" />
                                    Profesores del Club
                                </h3>
                                <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-mono text-white/40">{clubTeachers.length}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {clubTeachers.map((t: Teacher) => (
                                    <div key={t.id} className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-gold/20 transition-all flex items-center gap-4">
                                        <img
                                            src={t.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=333&color=fff`}
                                            className="w-10 h-10 rounded-lg object-cover"
                                            alt={t.name}
                                        />
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-bold text-sm text-white truncate">{t.name}</h4>
                                            <p className="text-[10px] text-text-muted uppercase tracking-widest">{t.title || 'Instructor'}</p>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${t.onlineStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : t.onlineStatus === 'in_class' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Plus size={20} className="text-gold" />
                                Invitar Profesor
                            </h3>
                            <p className="text-xs text-text-muted mb-6">Añade nuevos instructores a tu club ingresando su correo electrónico registrado en TopChess.</p>
                            <form onSubmit={handleInviteTeacher} className="space-y-4">
                                <input
                                    type="email"
                                    required
                                    placeholder="correo@ejemplo.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-gold/50 focus:outline-none transition-all placeholder:text-white/20"
                                />
                                <button
                                    type="submit"
                                    disabled={isInviting || !inviteEmail}
                                    className="w-full bg-gold hover:bg-white text-black font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-gold/10 disabled:opacity-50"
                                >
                                    {isInviting ? 'Invitando...' : 'Añadir al Club'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                    <Link to={`/classroom/${currentUserId}`} className="btn-secondary flex items-center gap-2 text-[10px] sm:text-sm md:text-base flex-1 md:flex-none justify-center py-2 px-2 sm:px-4">
                        <ExternalLink size={18} />
                        <span className="truncate">{t('dashboard.my_classroom')}</span>
                    </Link>
                    <div className="flex gap-1 p-1 bg-dark-panel rounded-lg border border-white/5 flex-1 md:flex-none justify-center">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 md:flex-none px-2 sm:px-4 py-2 rounded-md text-[10px] sm:text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            {t('dashboard.overview')}
                        </button>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`flex-1 md:flex-none px-2 sm:px-4 py-2 rounded-md text-[10px] sm:text-sm font-medium transition-all ${activeTab === 'schedule' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            {t('dashboard.schedule')}
                        </button>
                        <button
                            onClick={() => setActiveTab('homework')}
                            className={`flex-1 md:flex-none px-2 sm:px-4 py-2 rounded-md text-[10px] sm:text-sm font-medium transition-all ${activeTab === 'homework' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            Tareas
                        </button>
                        <button
                            onClick={() => setActiveTab('club')}
                            className={`flex-1 md:flex-none px-2 sm:px-4 py-2 rounded-md text-[10px] sm:text-sm font-medium transition-all ${activeTab === 'club' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            Club
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
            ) : activeTab === 'homework' ? (
                <div className="space-y-6 animate-enter">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Tareas Asignadas</h2>
                        <button
                            onClick={() => setIsHomeworkModalOpen(true)}
                            className="bg-gold hover:bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-gold/10"
                        >
                            + Nueva Tarea
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {homeworks.length === 0 ? (
                            <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                <p className="text-text-muted">No has asignado tareas aún.</p>
                            </div>
                        ) : (
                            homeworks.map(hw => (
                                <div key={hw.id} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-gold/20 transition-all group relative overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 ${hw.status === 'completed' ? 'bg-green-500/20' : 'bg-gold/10'}`}></div>

                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${hw.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                            {hw.status === 'completed' ? 'Completada' : 'Pendiente'}
                                        </span>
                                        <span className="text-[10px] text-text-muted font-mono">
                                            {new Date(hw.assignedAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-white mb-1 truncate" title={hw.title}>{hw.title}</h3>
                                    <p className="text-xs text-text-muted mb-4 line-clamp-2">{hw.description || "Sin descripción"}</p>

                                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5 text-xs">
                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]">
                                            {(hw.studentName || 'U').substring(0, 1)}
                                        </div>
                                        <span className="text-white/80 font-bold">{hw.studentName}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <HomeworkModal
                        isOpen={isHomeworkModalOpen}
                        onClose={() => setIsHomeworkModalOpen(false)}
                        onSave={handleCreateHomework}
                        students={myStudents}
                    />
                </div>
            ) : activeTab === 'club' ? (
                renderClubTab()
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
                                            {teacherProfile?.title && (
                                                <span className="ml-auto px-1.5 py-0.5 bg-gold text-black text-[8px] rounded font-black tracking-widest">{teacherProfile.title}</span>
                                            )}
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
                                        <div className="text-center py-10 text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                                            <Bell size={40} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-sm font-medium">Bandeja de entrada vacía</p>
                                        </div>
                                    ) : (
                                        requests.map(req => (
                                            <div key={req.id} className="p-4 rounded-2xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 hover:border-gold/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4 relative overflow-hidden">
                                                <div className="absolute inset-y-0 left-0 w-1 bg-gold scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center font-bold text-gold border border-gold/20 shadow-lg">
                                                        {(req.studentName || 'U').substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-sm">{req.studentName || 'Interesado'}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></div>
                                                            <span className="text-[10px] text-gold/60 font-black uppercase tracking-widest">Nueva Solicitud</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => handleAcceptRequest(req.id)}
                                                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gold text-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-gold/10"
                                                    >
                                                        Aceptar
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectRequest(req.id)}
                                                        aria-label="Rechazar solicitud"
                                                        className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/10"
                                                    >
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
                        <div className="w-full lg:w-80 flex flex-col gap-6">
                            <div className="glass-panel rounded-2xl p-4 md:p-6 flex flex-col gap-4">
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

                            {/* Lichess Integration */}
                            <div className="glass-panel rounded-2xl p-4 md:p-6 flex flex-col gap-4 bg-gradient-to-br from-[#1b1a17] to-white/[0.05]">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                        <svg viewBox="0 0 448 512" className="w-5 h-5 fill-white opacity-80" xmlns="http://www.w3.org/2000/svg"><path d="M0 432L448 432 448 480 0 480 0 432zM334.8 191.1C355.7 154.5 354 116.3 328.7 87.7 296 50.8 238.2 46.2 199.1 77.5 167.3 103 154.7 146.4 167 182.8 123.6 211.5 96 261.2 96 317.9L96 384l256 0 0-66.2C352 268 332.1 224 334.8 191.1zM224 0C241.7 0 256 14.3 256 32 256 49.7 241.7 64 224 64 206.3 64 192 49.7 192 32 192 14.3 206.3 0 224 0z" /></svg>
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Lichess Sync</h2>
                                    {teacherProfile?.lichessAccessToken && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    )}
                                </div>
                                <p className="text-[10px] text-white/50 leading-relaxed">
                                    {teacherProfile?.lichessAccessToken
                                        ? `Conectado como ${teacherProfile.lichessUsername}. Tus estudios privados ahora son visibles en el aula.`
                                        : 'Conecta tu cuenta para importar estudios privados y públicos directamente en el Aula.'}
                                </p>

                                <div className="pt-2">
                                    {!teacherProfile?.lichessAccessToken ? (
                                        <button
                                            onClick={async () => {
                                                const verifier = await generateCodeVerifier();
                                                const challenge = await generateCodeChallenge(verifier);

                                                // Save verifier in session storage for the callback
                                                sessionStorage.setItem('lichess_code_verifier', verifier);

                                                const params = new URLSearchParams({
                                                    response_type: 'code',
                                                    client_id: lichessService.getLICHESS_CLIENT_ID(),
                                                    redirect_uri: lichessService.getREDIRECT_URI(),
                                                    scope: 'study:read',
                                                    code_challenge_method: 'S256',
                                                    code_challenge: challenge,
                                                    state: Math.random().toString(36).substring(2)
                                                });

                                                window.location.href = `https://lichess.org/oauth?${params.toString()}`;
                                            }}
                                            className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-all hover:scale-[1.02] shadow-xl shadow-white/5"
                                        >
                                            Conectar con Lichess
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <div className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                                                    {teacherProfile.lichessUsername?.substring(0, 1).toUpperCase()}
                                                </div>
                                                <span className="text-xs text-white/90 font-bold">{teacherProfile.lichessUsername}</span>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await firebaseService.updateTeacher(currentUserId, {
                                                            lichessAccessToken: undefined,
                                                            lichessUsername: undefined
                                                        });
                                                        setTeacherProfile(prev => prev ? { ...prev, lichessAccessToken: undefined, lichessUsername: undefined } : null);
                                                        toast.success("Desconectado de Lichess");
                                                    } catch (e) {
                                                        toast.error("Error al desconectar");
                                                    }
                                                }}
                                                className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 transition-all"
                                                title="Desconectar"
                                                aria-label="Desconectar cuenta de Lichess"
                                            >
                                                <LogOut size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Active Students Section */}
                        <div className="flex-1 glass-panel rounded-2xl p-4 md:p-6 min-h-[400px]">
                            <h2 className="text-lg md:text-xl font-bold text-white mb-6">Mis Alumnos</h2>
                            <div className="space-y-4">
                                {isLoading ? (
                                    [1, 2].map((i) => <Skeleton key={i} width="100%" height={80} />)
                                ) : (
                                    myStudents.length === 0 ? (
                                        <div className="text-center py-10 text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                                            <Users size={40} className="mx-auto mb-4 opacity-10" />
                                            <p className="text-sm font-medium">Sin alumnos activos</p>
                                        </div>
                                    ) : (
                                        myStudents.map(student => (
                                            <div key={student.id} className="p-5 rounded-2xl bg-[#1b1a17] border border-white/5 hover:border-gold/20 transition-all flex flex-col gap-4 shadow-xl">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center font-bold text-gold border border-gold/10">
                                                            {(student.name || 'U').substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-white text-sm">{student.name || 'Usuario'}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">ESTUDIANTE</span>
                                                                <div className="w-1 h-1 rounded-full bg-green-500"></div>
                                                                <span className="text-[9px] text-green-500/60 font-black uppercase tracking-widest">En línea</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] font-mono text-white/40 italic">Última clase: Ayer</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <Link to={`/chat/${student.id}`} className="bg-white/5 hover:bg-white/10 text-white/80 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group">
                                                        <MessageCircle size={14} className="group-hover:text-gold transition-colors" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Mensaje</span>
                                                    </Link>
                                                    <Link to={`/classroom/${currentUserId}`} className="bg-gold hover:bg-white text-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group font-black shadow-lg shadow-gold/5">
                                                        <Video size={14} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Aula en vivo</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
};

export default TeacherDashboard;
