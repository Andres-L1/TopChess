import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, ChevronRight, Video, Calendar as CalendarIcon, X, LogOut, Search, MessageCircle, TrendingUp, DollarSign, BookOpen, ExternalLink } from 'lucide-react';
import BookingModal from '../components/BookingModal';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Booking, Homework, Teacher } from '../types/index';
import PaymentModal from '../components/PaymentModal';

import { StudentStats } from './StudentDashboard/components/StudentStats';
import { StudentMentors } from './StudentDashboard/components/StudentMentors';
import { StudentSidebar } from './StudentDashboard/components/StudentSidebar';
import ChessPieceAvatar from '../components/ChessPieceAvatar';
import { getStudentTierProgress } from '../utils/progression';
import CharacterCreatorModal from '../components/CharacterCreatorModal';
import { RoomView } from '../components/RoomView';
import { FurnitureType } from '../components/Furniture';
import { getStudentRoomLayout } from '../utils/roomLayouts';

interface Slot {
    dayIndex: number;
    hour: string;
}

const StudentDashboard: React.FC = () => {
    const auth = useAuth();
    const { currentUserId, logout, currentUser } = auth!; // Added currentUser
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0); // This should come from a real Wallet service eventually
    const [myTeachers, setMyTeachers] = useState<(Teacher & { classCredits?: number })[]>([]);
    const [pendingRequests, setPendingRequests] = useState<(Teacher & { requestDate?: number })[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [myHomeworks, setMyHomeworks] = useState<Homework[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    // Booking Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    // Metaverse Tabs & Furniture State
    const [activeTab, setActiveTab] = useState<'mi-sala' | 'overview'>('mi-sala');
    const [furnitureModalAction, setFurnitureModalAction] = useState<FurnitureType | null>(null);

    // Filter static homeworks just to know count or show modal
    const pendingHomeworks = myHomeworks.filter(hw => hw.status === 'pending');


    useEffect(() => {
        if (!currentUserId) return;
        let isMounted = true;
        let unsubRequests: () => void;
        let unsubBookings: () => void;
        let unsubWallet: () => void;

        const loadStaticData = async () => {
            setIsLoading(true);
            try {
                const homeworks = await firebaseService.getHomeworksForStudent(currentUserId);
                if (isMounted) setMyHomeworks(homeworks);
            } catch (error) {
                console.error("Error loading static student data", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadStaticData();

        unsubWallet = firebaseService.observeWallet(currentUserId, (wallet) => {
            if (isMounted) setBalance(wallet.balance);
        });

        unsubRequests = firebaseService.observeRequestsForStudent(currentUserId, async (requests) => {
            if (!isMounted) return;

            // Filter active teachers (approved)
            const approvedReqs = requests.filter((r: any) => r.status === 'approved');
            const uniqueApprovedMap = new Map();
            approvedReqs.forEach(r => {
                if (!uniqueApprovedMap.has(r.teacherId)) uniqueApprovedMap.set(r.teacherId, r);
            });

            const approvedPromises = Array.from(uniqueApprovedMap.values())
                .map(async (r: any) => {
                    const t = await firebaseService.getTeacherById(r.teacherId);
                    return t ? { ...t, classCredits: r.classCredits || 0 } : null;
                });
            const approvedTeachers = await Promise.all(approvedPromises);
            if (isMounted) setMyTeachers(approvedTeachers.filter(t => t !== null));

            // Pending requests
            const pendingReqs = requests.filter((r: any) => r.status === 'pending');
            const uniquePendingMap = new Map();
            pendingReqs.forEach(r => {
                if (!uniquePendingMap.has(r.teacherId)) uniquePendingMap.set(r.teacherId, r);
            });

            const pendingPromises = Array.from(uniquePendingMap.values())
                .map(async (r: any) => {
                    const t = await firebaseService.getTeacherById(r.teacherId);
                    return t ? { ...t, requestDate: r.timestamp } : null;
                });
            const pendingTeachers = await Promise.all(pendingPromises);
            if (isMounted) setPendingRequests(pendingTeachers.filter(t => t !== null));
        });

        unsubBookings = firebaseService.observeBookingsForUser(currentUserId, 'student', (bookings) => {
            if (isMounted) setMyBookings(bookings);
        });

        return () => {
            isMounted = false;
            if (unsubRequests) unsubRequests();
            if (unsubBookings) unsubBookings();
            if (unsubWallet) unsubWallet();
        };
    }, [currentUserId]);

    const openBookingModal = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setIsBookingModalOpen(true);
    };

    const handleOpenPaymentModal = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = async (method: 'stripe' | 'mercadopago') => {
        if (!selectedTeacher) return;
        try {
            const res = await firebaseService.buySubscription(currentUserId, selectedTeacher, method);
            if (res.success) {
                toast.success(res.message);
                setIsPaymentModalOpen(false);
                setSelectedTeacher(null);

                // Refresh teachers to get updated credits
                const requests = await firebaseService.getRequestsForStudent(currentUserId);
                const approvedReqs = requests.filter((r: any) => r.status === 'approved');
                const uniqueApprovedMap = new Map();
                approvedReqs.forEach(r => {
                    if (!uniqueApprovedMap.has(r.teacherId)) uniqueApprovedMap.set(r.teacherId, r);
                });
                const approvedPromises = Array.from(uniqueApprovedMap.values())
                    .map(async (r: any) => {
                        const t = await firebaseService.getTeacherById(r.teacherId);
                        return t ? { ...t, classCredits: r.classCredits || 0 } : null;
                    });
                const approvedTeachers = await Promise.all(approvedPromises);
                setMyTeachers(approvedTeachers.filter(t => t !== null));
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error processing subscription:", error);
            toast.error("Error al procesar la suscripción");
        }
    };

    const handleBookingSuccess = async () => {
        if (!currentUserId) return;

        // Refresh bookings
        const bookings = await firebaseService.getBookingsForUser(currentUserId, 'student');
        setMyBookings(bookings);

        // Refresh teachers credits
        const requests = await firebaseService.getRequestsForStudent(currentUserId);
        const approvedReqs = requests.filter((r: any) => r.status === 'approved');
        const uniqueApprovedMap = new Map();
        approvedReqs.forEach(r => {
            if (!uniqueApprovedMap.has(r.teacherId)) uniqueApprovedMap.set(r.teacherId, r);
        });
        const approvedPromises = Array.from(uniqueApprovedMap.values())
            .map(async (r: any) => {
                const t = await firebaseService.getTeacherById(r.teacherId);
                return t ? { ...t, classCredits: r.classCredits || 0 } : null;
            });
        const approvedTeachers = await Promise.all(approvedPromises);
        setMyTeachers(approvedTeachers.filter((t: any) => t !== null));
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Calculate next class — only future confirmed bookings, sorted by date then time
    const today = new Date().toISOString().split('T')[0];
    const nextClass = [...myBookings]
        .filter(b => b.status === 'confirmed' && b.date >= today)
        .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        })[0] ?? null;

    // Student tier progression
    const studentElo = (currentUser as any)?.elo || 0;
    const studentTierProgress = getStudentTierProgress(studentElo);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-24">

            {/* Chess Piece Progression Panel */}
            <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 mb-6" style={{ boxShadow: `0 0 40px ${studentTierProgress.current.color}20` }}>
                <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Avatar */}
                    <ChessPieceAvatar
                        name={currentUser?.displayName || 'Alumno'}
                        elo={studentElo}
                        size="xl"
                        animate={true}
                        showName={false}
                        showTier={true}
                    />
                    {/* ELO info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-3xl" style={{ color: studentTierProgress.current.color }}>
                                {studentTierProgress.current.pieceSymbol}
                            </span>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: studentTierProgress.current.color }}>
                                    {studentTierProgress.current.title}
                                </div>
                                <h2 className="text-xl font-black text-white">{studentTierProgress.current.piece}</h2>
                            </div>
                            <div className="ml-auto text-right">
                                <div className="text-xs text-white/40">Tu ELO</div>
                                <div className="text-2xl font-black font-mono" style={{ color: studentTierProgress.current.color }}>
                                    {studentElo}
                                </div>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                            <div className="flex justify-between text-xs text-white/40 mb-1.5">
                                <span>{studentTierProgress.current.piece}</span>
                                {studentTierProgress.next
                                    ? <span>{studentTierProgress.next.piece} — faltan {studentTierProgress.remaining} ELO</span>
                                    : <span>👑 Rango máximo</span>}
                            </div>
                            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${studentTierProgress.current.color}, ${studentTierProgress.current.color}aa)` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${studentTierProgress.progress * 100}%` }}
                                    transition={{ duration: 1.5, ease: 'easeOut' }}
                                />
                            </div>
                        </div>

                        {studentTierProgress.next && (
                            <div className="text-[11px] text-white/30">
                                Sigue mejorando tu ELO para convertirte en{' '}
                                <span style={{ color: studentTierProgress.next.color }} className="font-black">
                                    {studentTierProgress.next.piece}
                                </span>{' '}{studentTierProgress.next.pieceSymbol}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="flex md:flex-row flex-col gap-4 bg-[#0d0d0c]/50 p-2 rounded-2xl border border-white/5 backdrop-blur-md mb-8">
                <button
                    onClick={() => setActiveTab('mi-sala')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'mi-sala'
                        ? 'bg-gold text-black shadow-lg shadow-gold/20'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <span className="text-lg">🏠</span> Mi Sala
                </button>
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold transition-all ${activeTab === 'overview'
                        ? 'bg-gold text-black shadow-lg shadow-gold/20'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <span className="text-lg">📊</span> Panel General
                </button>
            </div>

            {activeTab === 'mi-sala' && (
                <div className="h-[600px] w-full bg-[#0d0d0c] rounded-[40px] border border-white/10 overflow-hidden relative shadow-2xl">
                    <div className="absolute top-4 left-4 z-10 px-4 py-2 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 text-white font-bold text-sm flex items-center gap-2 shadow-xl">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Mi Habitación Base
                    </div>
                    {/* El RoomView usa un roomId fijo para que sea personal del alumno */}
                    <RoomView
                        roomId={`student_${currentUserId}`}
                        width={getStudentRoomLayout((currentUser as any)?.elo || 800).width}
                        height={getStudentRoomLayout((currentUser as any)?.elo || 800).height}
                        furniturePlacements={getStudentRoomLayout((currentUser as any)?.elo || 800).furniturePlacements}
                        obstacles={getStudentRoomLayout((currentUser as any)?.elo || 800).obstacles}
                        onFurnitureClick={(type) => {
                            setFurnitureModalAction(type);
                        }}
                    />

                    {/* Furniture Intraction Modal */}
                    {furnitureModalAction && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setFurnitureModalAction(null)}>
                            <div className="liquid-glass-dark border border-white/10 rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="text-4xl mb-4 text-center">
                                    {furnitureModalAction === 'chalkboard' ? '📝' : furnitureModalAction === 'desk' ? '👨‍🏫' : furnitureModalAction === 'bookshelf' ? '📚' : '♟️'}
                                </div>
                                <h2 className="text-xl font-black text-white text-center mb-2">
                                    {furnitureModalAction === 'chalkboard' ? 'Mis Tareas' : furnitureModalAction === 'desk' ? 'Mentores y Reservas' : furnitureModalAction === 'bookshelf' ? 'Librería de Ajedrez' : 'Mesa de Ajedrez'}
                                </h2>
                                <p className="text-sm text-text-muted text-center mb-6">
                                    {furnitureModalAction === 'chalkboard'
                                        ? `Tienes ${pendingHomeworks.length} tareas pendientes asignadas por tus profesores.`
                                        : furnitureModalAction === 'desk'
                                            ? `Tienes ${myBookings.length} clases reservadas. Descubre nuevos mentores en tu panel genral.`
                                            : furnitureModalAction === 'bookshelf'
                                                ? 'Tus recursos, estudios y material de lectura están aquí.'
                                                : 'Afila tus piezas. Juega contra el bot o relájate viendo partidas magistrales.'}
                                </p>
                                <div className="flex gap-3">
                                    {(furnitureModalAction === 'chalkboard' || furnitureModalAction === 'desk') && (
                                        <button onClick={() => { setFurnitureModalAction(null); setActiveTab('overview'); }} className="btn-primary flex-1">
                                            Ir al Panel General
                                        </button>
                                    )}
                                    <button onClick={() => setFurnitureModalAction(null)} className="btn-secondary flex-1">
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative group">
                                <div className="absolute -inset-1.5 bg-gradient-to-r from-gold/30 via-amber-500/20 to-gold/30 rounded-2xl blur-md opacity-0 group-hover:opacity-60 transition duration-700"></div>
                                <div className="relative w-20 h-20 rounded-2xl liquid-glass border-2 border-gold/30 flex items-center justify-center overflow-hidden shadow-2xl">
                                    {currentUser?.photoURL ? (
                                        <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-black text-gold uppercase">{currentUser?.displayName?.charAt(0) || 'A'}</span>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-[#0d0d0c] rounded-full shadow-lg shadow-green-500/50"></div>
                                {/* Avatar Edit Button */}
                                <button
                                    onClick={() => setIsAvatarModalOpen(true)}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-400 border-2 border-[#0d0d0c] rounded-full shadow-lg shadow-blue-500/50 flex items-center justify-center transition-colors"
                                    title="Editar avatar"
                                >
                                    <span className="text-[9px] text-white font-bold">✎</span>
                                </button>
                            </div>
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">
                                    {currentUser?.displayName?.split(' ')[0] || 'Alumno'} <span className="text-gold">.</span>
                                </h1>
                                <p className="text-sm md:text-lg text-text-muted font-medium flex items-center gap-2 mt-1">
                                    Afila tus piezas, es momento de ganar.
                                </p>
                            </div>
                        </div>

                        {nextClass && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full md:w-auto"
                            >
                                <div className="liquid-glass rounded-[22px] p-[1px] liquid-glow-intense">
                                    <div className="bg-[#0d0d0c]/60 backdrop-blur-xl px-6 py-4 rounded-[21px] flex items-center gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-[3px] text-gold mb-1">Próxima Clase</span>
                                            <div className="flex items-center gap-2 text-white font-bold">
                                                <CalendarIcon size={16} className="text-gold" />
                                                <span>{new Date(nextClass.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })} - {nextClass.time}</span>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/classroom/${nextClass.teacherId}`}
                                            className="px-6 py-3 bg-gold text-black font-black text-xs rounded-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-gold/20 liquid-shimmer"
                                        >
                                            <span className="relative z-10 flex items-center gap-2"><Video size={16} /> ENTRAR AL AULA</span>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Gamification Stats */}
                    <StudentStats />

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        {/* Left Col: Mentors */}
                        <div className="lg:col-span-2 space-y-8">
                            <StudentMentors
                                isLoading={isLoading}
                                myTeachers={myTeachers}
                                openBookingModal={openBookingModal}
                                handleOpenPaymentModal={handleOpenPaymentModal}
                            />
                        </div>

                        {/* Right Col */}
                        <StudentSidebar
                            nextClass={nextClass}
                            myHomeworks={myHomeworks}
                            pendingRequests={pendingRequests}
                        />
                    </div>
                </div>
            )}

            {/* Booking Modal */}
            {selectedTeacher && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => {
                        setIsBookingModalOpen(false);
                        setSelectedTeacher(null);
                    }}
                    teacher={selectedTeacher}
                    studentId={currentUserId}
                    onSuccess={handleBookingSuccess}
                />
            )}

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handlePaymentSuccess}
                teacher={selectedTeacher}
            />

            <CharacterCreatorModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
            />
        </div>
    );
};

export default StudentDashboard;
