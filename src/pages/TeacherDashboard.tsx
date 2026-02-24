import React, { useState, useEffect } from 'react';
import { deleteField } from 'firebase/firestore';
import { Users, DollarSign, Clock, Trophy, ExternalLink, Bell, Check, X, Video, LogOut, TrendingUp, MessageCircle, Map as MapIcon, Plus, Settings } from 'lucide-react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import Skeleton from '../components/Skeleton';
import { Request, Teacher, Booking, Homework, Club, AppUser } from '../types/index';
import { lichessService } from '../services/lichessService';
import HomeworkModal from '../components/HomeworkModal';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';
import TeacherClubTab from './TeacherDashboard/components/TeacherClubTab';
import TeacherScheduleTab from './TeacherDashboard/components/TeacherScheduleTab';
import TeacherHomeworkTab from './TeacherDashboard/components/TeacherHomeworkTab';
import TeacherOverviewTab from './TeacherDashboard/components/TeacherOverviewTab';
interface DashboardStats {
    earnings: number;
    students: number;
    hours: number;
}

const TeacherDashboard = () => {
    const { currentUserId, logout, setUserRole } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'homework' | 'club'>('overview');
    const [stats, setStats] = useState<DashboardStats>({ earnings: 0, students: 0, hours: 0 });
    const [requests, setRequests] = useState<Request[]>([]);
    const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
    const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);
    const [myStudents, setMyStudents] = useState<(AppUser & { requestId: string })[]>([]);
    const [homeworks, setHomeworks] = useState<Homework[]>([]);
    const [availability, setAvailability] = useState<string[]>([]);
    const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [club, setClub] = useState<Club | null>(null);
    const [clubTeachers, setClubTeachers] = useState<Teacher[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isCreatingClub, setIsCreatingClub] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [showClubNameModal, setShowClubNameModal] = useState(false);
    const [clubNameInput, setClubNameInput] = useState('');

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

        unsubBookings = firebaseService.observeBookingsForUser(currentUserId, 'teacher', async (bookings) => {
            if (!isMounted) return;

            // Handle Pending Bookings (New requests)
            const pendingPromises = bookings
                .filter(b => b.status === 'pending')
                .map(async (b) => {
                    const u = await firebaseService.getUser(b.studentId);
                    return { ...b, studentName: u?.name || 'Usuario' };
                });
            const pBookings = await Promise.all(pendingPromises);
            if (isMounted) setPendingBookings(pBookings as any);

            // Handle confirmed bookings (upcoming classes)
            const today = new Date().toISOString().split('T')[0];
            const confirmed = bookings
                .filter(b => b.status === 'confirmed' && b.date >= today)
                .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
            const confirmedWithNames = await Promise.all(
                confirmed.map(async (b) => {
                    const u = await firebaseService.getUser(b.studentId);
                    return { ...b, studentName: u?.name || 'Alumno' };
                })
            );
            if (isMounted) setConfirmedBookings(confirmedWithNames);

            if (bookings.length > 0) {
                const today = new Date().toISOString().split('T')[0];
                const upcoming = bookings.filter((b: Booking) =>
                    b.status !== 'cancelled' && b.status !== 'pending' && b.date >= today
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
            toast.success(`Solicitud aceptada`);
        } catch (error) {
            console.error("Error accepting request:", error);
            toast.error("Error al procesar solicitud");
        }
    };

    const handleAcceptBooking = async (bookingId: string) => {
        try {
            await firebaseService.updateBookingStatus(bookingId, 'confirmed');
            toast.success(`Clase confirmada`);
        } catch (error) {
            console.error("Error accepting booking:", error);
            toast.error("Error al confirmar clase");
        }
    };

    const handleRejectBooking = async (bookingId: string) => {
        try {
            await firebaseService.updateBookingStatus(bookingId, 'cancelled');
            toast.success(`Clase rechazada`);
        } catch (error) {
            console.error("Error rejecting booking:", error);
            toast.error("Error al rechazar clase");
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

    const handleDisconnectStudent = async (requestId: string, studentName: string) => {
        if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${studentName} de tu lista de alumnos?`)) return;
        try {
            await firebaseService.updateRequestStatus(requestId, 'rejected');
            setMyStudents(prev => prev.filter(s => s.requestId !== requestId));
            toast.success(`${studentName} ha sido eliminado de tus alumnos`);
        } catch (error) {
            console.error('Error disconnecting student:', error);
            toast.error('Error al eliminar alumno');
        }
    };

    const handleCancelConfirmedBooking = async (bookingId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres cancelar esta clase?')) return;
        try {
            await firebaseService.updateBookingStatus(bookingId, 'cancelled');
            setConfirmedBookings(prev => prev.filter(b => b.id !== bookingId));
            toast.success('Clase cancelada correctamente');
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error('Error al cancelar la clase');
        }
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

    const handleCreateClub = async (name: string) => {
        if (!name.trim()) return;
        setIsCreatingClub(true);
        try {
            await firebaseService.createClub(name.trim(), currentUserId);
            setUserRole('club_director');
            const myClub = await firebaseService.getClubByDirectorId(currentUserId);
            if (myClub) setClub(myClub);
            toast.success("¡Club creado con éxito! Ahora eres Director de Club.");
            setShowClubNameModal(false);
            setClubNameInput('');
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

    const handleLichessConnect = async () => {
        const verifier = await generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
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
    };

    const handleLichessDisconnect = async () => {
        try {
            await firebaseService.updateTeacher(currentUserId, {
                lichessAccessToken: deleteField() as any,
                lichessUsername: deleteField() as any
            });
            setTeacherProfile(prev => prev ? { ...prev, lichessAccessToken: undefined, lichessUsername: undefined } : null);
            toast.success("Desconectado de Lichess");
        } catch (e) {
            toast.error("Error al desconectar");
        }
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
                <TeacherScheduleTab
                    availability={availability}
                    handleSaveAvailability={handleSaveAvailability}
                />
            ) : activeTab === 'homework' ? (
                <TeacherHomeworkTab
                    homeworks={homeworks}
                    myStudents={myStudents}
                    isHomeworkModalOpen={isHomeworkModalOpen}
                    setIsHomeworkModalOpen={setIsHomeworkModalOpen}
                    handleCreateHomework={handleCreateHomework}
                />
            ) : activeTab === 'club' ? (
                <TeacherClubTab
                    club={club}
                    teacherProfile={teacherProfile}
                    clubTeachers={clubTeachers}
                    handleCreateClub={handleCreateClub}
                    isCreatingClub={isCreatingClub}
                    inviteEmail={inviteEmail}
                    setInviteEmail={setInviteEmail}
                    handleInviteTeacher={handleInviteTeacher}
                    isInviting={isInviting}
                    showClubNameModal={showClubNameModal}
                    setShowClubNameModal={setShowClubNameModal}
                    clubNameInput={clubNameInput}
                    setClubNameInput={setClubNameInput}
                />
            ) : (
                <TeacherOverviewTab
                    isLoading={isLoading}
                    stats={stats}
                    levelInfo={levelInfo}
                    currency={currency}
                    progressPercent={progressPercent}
                    teacherProfile={teacherProfile}
                    requests={requests}
                    pendingBookings={pendingBookings}
                    handleAcceptRequest={handleAcceptRequest}
                    handleRejectRequest={handleRejectRequest}
                    handleAcceptBooking={handleAcceptBooking}
                    handleRejectBooking={handleRejectBooking}
                    nextBooking={nextBooking}
                    currentUserId={currentUserId}
                    myStudents={myStudents}
                    handleLichessConnect={handleLichessConnect}
                    handleLichessDisconnect={handleLichessDisconnect}
                    handleDisconnectStudent={handleDisconnectStudent}
                    confirmedBookings={confirmedBookings}
                    handleCancelConfirmedBooking={handleCancelConfirmedBooking}
                />
            )}
        </div>
    );
};

export default TeacherDashboard;
