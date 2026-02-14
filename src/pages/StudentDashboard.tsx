import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, ChevronRight, Video, Calendar as CalendarIcon, X, LogOut, Search, MessageCircle, TrendingUp, DollarSign } from 'lucide-react';
import Calendar from '../components/Calendar';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';
import { Booking } from '../types/index';

interface Slot {
    dayIndex: number;
    hour: string;
}

const StudentDashboard: React.FC = () => {
    const auth = useAuth();
    const { currentUserId, logout } = auth!;
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0); // This should come from a real Wallet service eventually
    const [myTeachers, setMyTeachers] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Booking Modal State
    const [bookingTeacher, setBookingTeacher] = useState<any>(null);
    const [teacherAvailability, setTeacherAvailability] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);

            try {
                // Fetch data from Firestore
                const requests = await firebaseService.getRequestsForStudent(currentUserId);
                const bookings = await firebaseService.getBookingsForUser(currentUserId, 'student');

                // Filter active teachers (approved requests) and deduplicate by teacherId
                const approvedReqs = requests.filter((r: any) => r.status === 'approved');
                const uniqueApprovedMap = new Map();
                approvedReqs.forEach(r => {
                    if (!uniqueApprovedMap.has(r.teacherId)) uniqueApprovedMap.set(r.teacherId, r);
                });

                const approvedPromises = Array.from(uniqueApprovedMap.values())
                    .map((r: any) => firebaseService.getTeacherById(r.teacherId));

                const approvedTeachers = await Promise.all(approvedPromises);

                // Pending requests and deduplicate
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

                setMyTeachers(approvedTeachers.filter(t => t !== null));
                setPendingRequests(pendingTeachers.filter(t => t !== null));
                setMyBookings(bookings);
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

    const openBookingModal = async (teacher: any) => {
        const avail = await firebaseService.getTeacherAvailability(teacher.id);
        setTeacherAvailability(avail);
        setBookingTeacher(teacher);
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
            teacherId: bookingTeacher.id,
            slotId: slotId,
            date: new Date().toISOString().split('T')[0],
            time: slot.hour,
            status: 'confirmed',
            timestamp: Date.now(),
            meetingLink: `/classroom/${bookingTeacher.id}`
        };

        try {
            await firebaseService.createBooking(newBooking);
            toast.success(`Clase reservada para el ${dateStr} a las ${slot.hour}`);
            setBookingTeacher(null);
            // Refresh bookings
            const bookings = await firebaseService.getBookingsForUser(currentUserId, 'student');
            setMyBookings(bookings);
        } catch (error) {
            console.error("Error creating booking", error);
            toast.error("Error al reservar la clase");
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Calculate next class
    const nextClass = myBookings.length > 0 ? myBookings[0] : null; // Should sort by date

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-gold to-orange-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-16 h-16 rounded-full bg-dark-panel border-2 border-gold/30 flex items-center justify-center font-bold text-2xl text-gold shadow-2xl">
                            A
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-dark-panel rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold font-display text-white">
                            Hola, <span className="text-gold">Alumno</span> <span className="text-white/20">.</span>
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
                            <DollarSign size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Balance</p>
                            <p className="text-sm font-bold text-white">{balance.toFixed(2)}€</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-3 text-text-muted hover:text-red-400 transition-all rounded-xl border border-white/5 hover:border-red-500/20 bg-white/2"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Gamification Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-5 rounded-2xl bg-gradient-to-br from-dark-panel to-gold/5 border-gold/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-gold/20 transition-all"></div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-gold text-black shadow-lg shadow-gold/20">
                            <Trophy size={20} />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-gold uppercase tracking-widest">Nivel Actual</h4>
                            <p className="text-xl font-bold text-white">Aprendiz Bronce</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-text-muted">Progreso al Nivel 5</span>
                            <span className="text-gold">750 / 1000 XP</span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-gradient-to-r from-gold to-orange-500 rounded-full w-[75%] shadow-[0_0_10px_rgba(255,215,0,0.3)]"></div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                            <Target size={20} />
                        </div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Misión Diaria</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white mb-1">Gana 2 partidas tácticas</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-400 w-1/2"></div>
                            </div>
                            <span className="text-[10px] text-text-muted font-mono">1/2</span>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <Video size={20} />
                        </div>
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Aprendizaje</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white mb-2">Total Clases Recibidas</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-white">12</span>
                            <span className="text-xs text-text-muted">horas de estudio</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Left Col: Mentors */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gold/10">
                                    <Trophy className="text-gold" size={20} />
                                </div>
                                Mis Mentores
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {isLoading ? (
                                [1, 2].map((i) => <Skeleton key={i} width="100%" height={150} />)
                            ) : (
                                <>
                                    {myTeachers.length === 0 ? (
                                        <div className="col-span-1 md:col-span-2 p-12 rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.01] text-center">
                                            <p className="text-text-muted mb-4 text-sm italic">No tienes mentores activos todavía.</p>
                                            <Link to="/" className="btn-secondary py-3 px-8 text-xs">Explorar catálogo</Link>
                                        </div>
                                    ) : (
                                        myTeachers.map(teacher => (
                                            <div key={teacher.id} className="glass-panel p-6 rounded-2xl bg-[#1b1a17] border border-white/5 group hover:border-gold/30 transition-all duration-500">
                                                <div className="flex items-center gap-5 mb-6">
                                                    <img src={teacher.image || 'https://ui-avatars.com/api/?name=Profesor+Chess&background=random'} alt={teacher.name} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-white text-lg truncate group-hover:text-gold transition-colors">{teacher.name}</h3>
                                                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5">{teacher.elo} ELO • Mentor</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Link to={`/classroom/${teacher.id}`} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all border border-white/5">
                                                        <Video size={14} className="text-gold" /> Aula
                                                    </Link>
                                                    <button
                                                        onClick={() => openBookingModal(teacher)}
                                                        className="flex items-center justify-center gap-2 bg-gold hover:bg-white text-black text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-gold/5"
                                                    >
                                                        <CalendarIcon size={14} /> Agendar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Col */}
                <div className="space-y-6">
                    {/* Next Class */}
                    <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-[#1b1a17] to-green-900/10 border-green-500/20 relative overflow-hidden">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10">
                                <Target className="text-green-400" size={18} />
                            </div>
                            Próxima Clase
                        </h3>
                        {nextClass ? (
                            <div className="text-center py-4">
                                <p className="text-4xl font-bold text-white mb-1 tracking-tighter">{nextClass.time}</p>
                                <p className="text-xs text-green-400 font-mono mb-8 uppercase tracking-widest">{nextClass.date}</p>
                                <Link to={nextClass.meetingLink} className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all block text-center">
                                    Entrar al Aula
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-20 italic text-sm">No hay clases próximas</div>
                        )}
                    </div>

                    {/* Pending */}
                    <div className="glass-panel p-6 rounded-3xl border-white/5">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                                <Clock className="text-blue-400" size={18} />
                            </div>
                            Solicitudes
                        </h3>
                        <div className="space-y-4">
                            {pendingRequests.length === 0 ? (
                                <p className="text-xs text-text-muted italic opacity-50 text-center py-4">Sin solicitudes pendientes</p>
                            ) : (
                                pendingRequests.map(req => (
                                    <div key={req.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-white/20 border border-white/10 uppercase">
                                            {req.name.substring(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-bold truncate">{req.name}</p>
                                            <p className="text-[10px] text-blue-400/80 font-black uppercase tracking-widest">Enviada</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {bookingTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-panel border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        <button onClick={() => setBookingTeacher(null)} className="absolute top-4 right-4 text-text-muted hover:text-white">
                            <X size={24} />
                        </button>
                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">Reservar Clase</h2>
                            <p className="text-sm text-text-muted">con <span className="text-gold">{bookingTeacher.name}</span></p>
                        </div>
                        <div className="p-6">
                            <Calendar mode="view" availability={teacherAvailability} onSlotClick={handleSlotBook} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
