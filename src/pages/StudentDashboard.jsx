import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { mockDB } from '../services/mockDatabase';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Clock, Target, ChevronRight, Video, Calendar as CalendarIcon, X, LogOut, Search } from 'lucide-react';
import Calendar from '../components/Calendar';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
    const { currentUserId, logout } = useAuth();
    const navigate = useNavigate();
    const [balance, setBalance] = useState(0);
    const [myTeachers, setMyTeachers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);

    // Booking Modal State
    const [bookingTeacher, setBookingTeacher] = useState(null);
    const [teacherAvailability, setTeacherAvailability] = useState([]);

    useEffect(() => {
        // Init balance
        const wallet = mockDB.getWallet(currentUserId);
        setBalance(wallet.balance);

        // Fetch data
        const requests = mockDB.getRequestsForStudent(currentUserId);

        // Filter active teachers (approved requests)
        const approved = requests.filter(r => r.status === 'approved').map(r => {
            return mockDB.getTeacherById(r.teacherId);
        }).filter(Boolean); // Remove nulls if teacher not found

        // Pending requests
        const pending = requests.filter(r => r.status === 'pending').map(r => {
            const t = mockDB.getTeacherById(r.teacherId);
            return { ...t, requestDate: r.timestamp };
        }).filter(Boolean);

        setMyTeachers(approved);
        setPendingRequests(pending);

        // Force update on wallet change
        const walletHandler = () => {
            setBalance(mockDB.getWallet(currentUserId).balance);
        };
        window.addEventListener('wallet-update', walletHandler);
        return () => window.removeEventListener('wallet-update', walletHandler);
    }, [currentUserId]);

    const openBookingModal = (teacher) => {
        const avail = mockDB.getTeacherAvailability(teacher.id);
        setTeacherAvailability(avail);
        setBookingTeacher(teacher);
    };

    const handleSlotBook = (slot) => {
        // Mock Booking Logic
        // In real app, we need Date selection. Here we just say "Next Week: [Day] [Hour]"
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const dateStr = `Próximo ${dayNames[slot.dayIndex]}`;

        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Confirmando reserva...',
                success: `Clase reservada para el ${dateStr} a las ${slot.hour}`,
                error: 'Error al reservar',
            }
        ).then(() => {
            mockDB.createBooking(currentUserId, bookingTeacher.id, `${slot.dayIndex}-${slot.hour}`, "2023-11-20");
            setBookingTeacher(null);
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

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
                    <div className="bg-dark-panel border border-white/10 rounded-xl p-3 flex items-center gap-4 shadow-lg">
                        <div className="text-right">
                            <p className="text-[10px] text-text-muted uppercase tracking-wider">Saldo Disponible</p>
                            <p className="text-xl font-bold text-white font-mono">{balance.toFixed(2)}€</p>
                        </div>
                        <Link to="/wallet" className="btn-primary py-1.5 px-3 text-xs">
                            Recargar
                        </Link>
                    </div>
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
                            {myTeachers.length === 0 && (
                                <div className="col-span-2 p-8 rounded-2xl border border-dashed border-white/10 text-center text-text-muted">
                                    <p>Aún no tienes mentores activos.</p>
                                    <Link to="/" className="text-gold hover:underline mt-2 inline-block">Buscar Profesor</Link>
                                </div>
                            )}

                            {myTeachers.map(teacher => (
                                <div key={teacher.id} className="glass-panel p-4 rounded-xl flex flex-col gap-4 group hover:border-gold/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <img src={teacher.image} alt={teacher.name} className="w-12 h-12 rounded-full object-cover border-2 border-gold/20" />
                                        <div>
                                            <h3 className="font-bold text-white">{teacher.name}</h3>
                                            <p className="text-xs text-text-muted">GM • 2850 ELO</p>
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
                        </div>
                    </section>

                    {/* Progress Stats (Mock) */}
                    <section className="glass-panel p-6 rounded-2xl">
                        <h2 className="text-lg font-bold text-white mb-4">Tu Progreso Semanal</h2>
                        <div className="flex justify-between items-end h-32 gap-2">
                            {[40, 65, 30, 85, 50, 90, 60].map((h, i) => (
                                <div key={i} className="flex-1 bg-white/5 rounded-t-lg relative group overflow-hidden">
                                    <div
                                        style={{ height: `${h}%` }}
                                        className="absolute bottom-0 w-full bg-gradient-to-t from-gold/20 to-gold/60 transition-all duration-500 group-hover:to-gold"
                                    ></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-text-muted font-mono">
                            <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
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
                        <div className="text-center py-6">
                            <p className="text-3xl font-bold text-white mb-1">18:00</p>
                            <p className="text-sm text-green-400 font-mono mb-4">Hoy, 13 Nov</p>
                            <button className="w-full btn-primary py-2 text-sm">
                                Unirse ahora
                            </button>
                        </div>
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
