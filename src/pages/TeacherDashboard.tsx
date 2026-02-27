import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { deleteField } from 'firebase/firestore';
import { Users, DollarSign, Clock, Trophy, ExternalLink, Bell, Check, X, Video, LogOut, TrendingUp, MessageCircle, Map as MapIcon, Plus, Settings, Home } from 'lucide-react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import { getTeacherRoomLayout } from '../utils/roomLayouts';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';
import { Request, Teacher, Booking, Homework, Club, AppUser } from '../types/index';
import { lichessService } from '../services/lichessService';
import HomeworkModal from '../components/HomeworkModal';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';
import TeacherClubTab from './TeacherDashboard/components/TeacherClubTab';
import TeacherScheduleTab from './TeacherDashboard/components/TeacherScheduleTab';
import TeacherHomeworkTab from './TeacherDashboard/components/TeacherHomeworkTab';
import TeacherOverviewTab from './TeacherDashboard/components/TeacherOverviewTab';
import IsometricBuilding from '../components/IsometricBuilding';
import { getTeacherTierProgress } from '../utils/progression';
import CharacterCreatorModal from '../components/CharacterCreatorModal';
import { RoomView, FurniturePlacement } from '../components/RoomView';
import { FurnitureType } from '../components/Furniture';
import ProgressionModal from '../components/ProgressionModal';

interface DashboardStats {
    earnings: number;
    students: number;
    hours: number;
}

const TeacherDashboard = () => {
    const { currentUserId, logout, setUserRole } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'homework' | 'club' | 'mi-sala'>('overview');
    const [furnitureModalAction, setFurnitureModalAction] = useState<FurnitureType | null>(null);
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
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    const [isProgressionModalOpen, setIsProgressionModalOpen] = useState(false);

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
        if (!inviteEmail || !club) return;

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

    // Building progression
    const tierProgress = getTeacherTierProgress(teacherProfile?.earnings || 0);

    return (
        <React.Fragment>
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-24">
                {/* Building Progression Panel */}
                {teacherProfile && (
                    <div className="relative overflow-hidden rounded-3xl liquid-glass p-6" style={{ boxShadow: `0 0 40px ${tierProgress.current.color}20` }}>
                        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                            {/* Isometric building */}
                            <div className="flex-shrink-0">
                                <IsometricBuilding
                                    earnings={teacherProfile.earnings || 0}
                                    teacherName={teacherProfile.name}
                                    isOnline={teacherProfile.onlineStatus === 'online' || teacherProfile.onlineStatus === 'in_class'}
                                    isInClass={teacherProfile.onlineStatus === 'in_class'}
                                    size="md"
                                    showLabel={false}
                                />
                            </div>

                            {/* Tier info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl">{tierProgress.current.buildingEmoji}</span>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: tierProgress.current.color }}>
                                            Tu Academia
                                        </div>
                                        <h2 className="text-xl font-black text-white">{tierProgress.current.name}</h2>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <div className="text-xs text-white/40">Ingresos totales</div>
                                        <div className="text-lg font-black" style={{ color: tierProgress.current.color }}>
                                            {(teacherProfile.earnings || 0).toLocaleString('es-ES', { style: 'currency', currency: teacherProfile.currency || 'EUR' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-white/40 mb-1.5">
                                        <span>{tierProgress.current.name}</span>
                                        {tierProgress.next ? <span>{tierProgress.next.name} — faltan {tierProgress.remaining.toLocaleString('es-ES')}€</span> : <span>🏆 Nivel máximo</span>}
                                    </div>
                                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: `linear-gradient(90deg, ${tierProgress.current.color}, ${tierProgress.current.color}aa)` }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${tierProgress.progress * 100}%` }}
                                            transition={{ duration: 1.5, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>

                                {/* Perks */}
                                <div className="flex flex-wrap gap-1.5">
                                    {tierProgress.current.perks.map(perk => (
                                        <span key={perk} className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${tierProgress.current.color}15`, color: tierProgress.current.color }}>✓ {perk}</span>
                                    ))}
                                    {tierProgress.next && (
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white/30 bg-white/5 border border-white/10">
                                            🔒 {tierProgress.next.perks[0]} (siguiente nivel)
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsProgressionModalOpen(true)}
                                    className="mt-4 px-4 py-2 rounded-xl bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 w-max"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Ver Roadmap de Mejoras
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                            Mi Panel <span className="text-gold">.</span>
                        </h1>
                        <p className="text-sm md:text-lg text-text-muted font-medium mt-1">Bienvenido de vuelta, aquí está tu academia.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 p-1.5 liquid-glass-subtle rounded-2xl shadow-2xl">
                        {[
                            { id: 'overview', label: 'Resumen' },
                            { id: 'mi-sala', label: '🏠 Mi Sala' },
                            { id: 'schedule', label: 'Horario' },
                            { id: 'homework', label: 'Tareas' },
                            { id: 'club', label: 'Club' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'liquid-glass-subtle liquid-glow text-gold'
                                    : 'text-text-muted hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
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
                ) : activeTab === 'mi-sala' ? (
                    <div className="space-y-4">
                        <div className="p-4 liquid-glass-subtle rounded-2xl border border-white/5">
                            <p className="text-xs text-text-muted uppercase tracking-widest font-bold mb-1">Tu Aula Virtual</p>
                            <p className="text-sm text-white/60">Haz clic en el suelo para moverte. Acércate a un mueble para interactuar con él.</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded-xl grid grid-cols-3 gap-3 text-center text-[10px] font-bold uppercase tracking-widest text-text-muted">
                            <div>🖋️ Pizarra → Asignar Tarea</div>
                            <div>☕ Mesa Profesor → Ver Disponibilidad</div>
                            <div>💰 Caja Registradora → Pagos</div>
                        </div>
                        {currentUserId && (
                            <RoomView
                                roomId={`teacher_${currentUserId}`}
                                width={getTeacherRoomLayout(teacherProfile?.earnings || 0).width}
                                height={getTeacherRoomLayout(teacherProfile?.earnings || 0).height}
                                furniturePlacements={getTeacherRoomLayout(teacherProfile?.earnings || 0).furniturePlacements}
                                obstacles={getTeacherRoomLayout(teacherProfile?.earnings || 0).obstacles}
                                onFurnitureClick={(type) => {
                                    if (type === 'chalkboard') {
                                        setIsHomeworkModalOpen(true);
                                    } else {
                                        setFurnitureModalAction(type);
                                    }
                                }}
                            />
                        )}
                        {/* Info modal for non-homework furniture */}
                        {furnitureModalAction && furnitureModalAction !== 'chalkboard' && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setFurnitureModalAction(null)}>
                                <div className="liquid-glass-dark border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                                    <div className="text-4xl mb-4 text-center">
                                        {furnitureModalAction === 'register' ? '💰' : furnitureModalAction === 'desk' ? '☕' : '♟️'}
                                    </div>
                                    <h2 className="text-xl font-black text-white text-center mb-2">
                                        {furnitureModalAction === 'register' ? 'Caja Registradora' : furnitureModalAction === 'desk' ? 'Mesa del Profesor' : 'Mesa de Ajedrez'}
                                    </h2>
                                    <p className="text-sm text-text-muted text-center mb-6">
                                        {furnitureModalAction === 'register'
                                            ? `Has generado ${(teacherProfile?.earnings || 0).toLocaleString('es-ES', { style: 'currency', currency: teacherProfile?.currency || 'EUR' })} en ingresos totales.`
                                            : furnitureModalAction === 'desk'
                                                ? `Tienes ${pendingBookings.length} reservas pendientes. Ve a la pestaña Horario para gestionar tu disponibilidad.`
                                                : 'Inicia una partida de ajedrez en tu aula virtual.'}
                                    </p>
                                    <div className="flex gap-3">
                                        {furnitureModalAction === 'desk' && (
                                            <button onClick={() => { setFurnitureModalAction(null); setActiveTab('schedule'); }} className="btn-primary flex-1">
                                                Ver Horario
                                            </button>
                                        )}
                                        {furnitureModalAction === 'register' && (
                                            <button onClick={() => { setFurnitureModalAction(null); /* navigate to wallet */ }} className="btn-primary flex-1">
                                                Ver Billetera
                                            </button>
                                        )}
                                        <button onClick={() => setFurnitureModalAction(null)} className="flex-1 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all">
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
            <CharacterCreatorModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} />
            <ProgressionModal isOpen={isProgressionModalOpen} onClose={() => setIsProgressionModalOpen(false)} currentEarnings={teacherProfile?.earnings || 0} />
        </React.Fragment>
    );

};

export default TeacherDashboard;
