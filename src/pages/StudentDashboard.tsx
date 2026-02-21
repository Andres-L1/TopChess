import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, ChevronRight, Video, Calendar as CalendarIcon, X, LogOut, Search, MessageCircle, TrendingUp, DollarSign, BookOpen, ExternalLink } from 'lucide-react';
import Calendar from '../components/Calendar';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';
import { Booking, Homework } from '../types/index';
import PaymentModal from '../components/PaymentModal';

import { StudentStats } from './StudentDashboard/components/StudentStats';
import { StudentMentors } from './StudentDashboard/components/StudentMentors';
import { StudentSidebar } from './StudentDashboard/components/StudentSidebar';

interface Slot {
    dayIndex: number;
    hour: string;
}

const StudentDashboard: React.FC = () => {
    const auth = useAuth();
    const { currentUserId, logout, currentUser } = auth!; // Added currentUser
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0); // This should come from a real Wallet service eventually
    const [myTeachers, setMyTeachers] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [myHomeworks, setMyHomeworks] = useState<Homework[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Booking Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
    const [teacherAvailability, setTeacherAvailability] = useState<string[]>([]);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);


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

    const openBookingModal = async (teacher: any) => {
        const avail = await firebaseService.getTeacherAvailability(teacher.id);
        setTeacherAvailability(avail);
        setSelectedTeacher(teacher);
        setIsBookingModalOpen(true);
    };

    const handleOpenPaymentModal = (teacher: any) => {
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

    const handleSlotBook = async (slot: Slot) => {
        // Real Booking Logic
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const dateStr = `Próximo ${dayNames[slot.dayIndex]}`;
        const slotId = `${slot.dayIndex}-${slot.hour}`;

        // Simple ID generation
        const bookingId = `booking_${Date.now()}`;

        const newBooking: Booking = {
            id: bookingId,
            studentId: currentUserId,
            teacherId: selectedTeacher.id,
            slotId: slotId,
            date: new Date().toISOString().split('T')[0],
            time: slot.hour,
            status: 'confirmed',
            timestamp: Date.now(),
            meetingLink: `/classroom/${selectedTeacher.id}`
        };

        try {
            const res = await firebaseService.bookClass(currentUserId, selectedTeacher.id, newBooking);
            if (res.success) {
                toast.success(res.message);
                setSelectedTeacher(null);
                setIsBookingModalOpen(false);

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
            } else {
                toast.error(res.message);
            }
        } catch (error) {
            console.error("Error creating booking", error);
            toast.error("Error al reservar la clase");
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Calculate next class — sorted by date then time, excluding cancelled
    const nextClass = [...myBookings]
        .filter(b => b.status !== 'cancelled')
        .sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.time.localeCompare(b.time);
        })[0] ?? null;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gold to-orange-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-16 h-16 rounded-full bg-dark-panel border-2 border-gold/30 flex items-center justify-center font-bold text-2xl text-gold shadow-2xl">
                            {currentUser?.displayName?.charAt(0) || 'A'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-dark-panel rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
                            Hola, <span className="text-gold">{currentUser?.displayName || 'Alumno'}</span> <span className="text-white/20">.</span>
                        </h1>
                        <p className="text-sm md:text-base text-text-muted flex items-center gap-2">
                            <TrendingUp size={14} className="text-green-400" />
                            Tu progreso en TopChess está despegando.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:flex-none glass-panel px-4 py-2 rounded-xl flex items-center gap-3 border-gold/10">
                        <div className="p-2 rounded-lg bg-gold/10 text-gold">
                            <Trophy size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Activo</p>
                            <p className="text-sm font-bold text-white">TopChess</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        aria-label="Cerrar Sesión"
                        className="p-3 text-text-muted hover:text-red-400 transition-all rounded-xl border border-white/5 hover:border-red-500/20 bg-white/2"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
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

            {/* Booking Modal */}
            {selectedTeacher && isBookingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-panel border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        <button onClick={() => { setSelectedTeacher(null); setIsBookingModalOpen(false); }} className="absolute top-4 right-4 text-text-muted hover:text-white" aria-label="Cerrar Modal">
                            <X size={24} />
                        </button>
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">Reservar Clase</h2>
                            <p className="text-sm text-text-muted">con <span className="text-gold">{selectedTeacher.name}</span></p>
                        </div>
                        <div className="p-6">
                            <Calendar mode="view" availability={teacherAvailability} onSlotClick={handleSlotBook} />
                        </div>
                    </div>
                </div>
            )}

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handlePaymentSuccess}
                teacher={selectedTeacher}
            />
        </div>
    );
};

export default StudentDashboard;
