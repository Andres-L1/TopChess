import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, ChevronRight, Video, Calendar as CalendarIcon, X, LogOut, Search } from 'lucide-react';
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

                // Filter active teachers (approved requests)
                const approvedPromises = requests
                    .filter((r: any) => r.status === 'approved')
                    .map((r: any) => firebaseService.getTeacherById(r.teacherId));

                const approvedTeachers = await Promise.all(approvedPromises);

                // Pending requests
                const pendingPromises = requests
                    .filter((r: any) => r.status === 'pending')
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
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white">
                        Hola, <span className="text-gold">Estudiante</span>
                    </h1>
                    <p className="text-text-muted">Continúa tu camino hacia la maestría.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="ml-2 p-2 text-text-muted hover:text-red-400 transition-colors rounded-lg border border-transparent hover:border-red-500/20"
                        title="Cerrar Sesión"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Learning Journey */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Mentors */}
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="text-gold" size={20} /> Mis Mentores
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isLoading ? (
                                <>
                                    {[1, 2].map((i) => (
                                        <div key={i} className="glass-panel p-4 rounded-xl flex flex-col gap-4">
                                            <Skeleton width="100%" height={100} />
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    {myTeachers.length === 0 && (
                                        <div className="col-span-2 p-8 rounded-2xl border border-dashed border-white/10 text-center text-text-muted">
                                            <p>Aún no tienes mentores activos.</p>
                                            <Link to="/" className="text-gold hover:underline mt-2 inline-block">Buscar Profesor</Link>
                                        </div>
                                    )}

                                    {myTeachers.map(teacher => (
                                        <div key={teacher.id} className="glass-panel p-4 rounded-xl flex flex-col gap-4 group hover:border-gold/30 transition-all">
                                            <div className="flex items-center gap-4">
                                                <img src={teacher.image || 'https://ui-avatars.com/api/?name=Profesor+Chess&background=random'} alt={teacher.name} className="w-12 h-12 rounded-full object-cover border-2 border-gold/20" />
                                                <div>
                                                    <h3 className="font-bold text-white">{teacher.name}</h3>
                                                    <p className="text-xs text-text-muted">{teacher.elo} ELO</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-auto">
                                                <Link to={`/classroom/${teacher.id}`} className="flex-1 btn-secondary text-center text-xs py-2 flex items-center justify-center gap-2">
                                                    <Video size={14} /> Entrar al Aula
                                                </Link>
                                                <button
                                                    onClick={() => openBookingModal(teacher)}
                                                    className="flex-1 bg-white/5 hover:bg-gold hover:text-black border border-white/10 text-white text-xs py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CalendarIcon size={14} /> Agendar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Col: Requests & Upcoming */}
                <div className="space-y-6">
                    {/* Pending Requests */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="text-blue-400" size={18} /> Solicitudes Enviadas
                        </h3>
                        <div className="space-y-3">
                            {pendingRequests.length === 0 && <p className="text-xs text-text-muted italic">No tienes solicitudes pendientes.</p>}
                            {pendingRequests.map(req => (
                                <div key={req.id} className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center gap-3 opacity-70">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">
                                        {req.name.substring(0, 2)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-white font-medium">{req.name}</p>
                                        <p className="text-[10px] text-yellow-500">Pendiente de aprobación</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming Classes Box */}
                    <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-dark-panel to-green-900/10 border-green-500/10">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Target className="text-green-400" size={18} /> Próxima Clase
                        </h3>
                        {nextClass ? (
                            <div className="text-center py-6">
                                <p className="text-3xl font-bold text-white mb-1">{nextClass.time}</p>
                                <p className="text-sm text-green-400 font-mono mb-4">{nextClass.date}</p>
                                <Link to={nextClass.meetingLink} className="w-full btn-primary py-2 text-sm block">
                                    Unirse ahora
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-text-muted">
                                <p>No tienes clases próximas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {bookingTeacher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-dark-panel border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                        <button
                            onClick={() => setBookingTeacher(null)}
                            className="absolute top-4 right-4 text-text-muted hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold text-white">Reservar Clase</h2>
                            <p className="text-sm text-text-muted">con <span className="text-gold">{bookingTeacher.name}</span></p>
                        </div>

                        <div className="p-6">
                            <Calendar
                                mode="view"
                                availability={teacherAvailability}
                                onSlotClick={handleSlotBook}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
