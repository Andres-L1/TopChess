import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Clock, Trophy, ChevronRight, ExternalLink, Calendar as CalendarIcon, Bell, Check, X, Video, LogOut } from 'lucide-react';
import { useAuth } from '../App';
import { mockDB } from '../services/mockDatabase';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
    const { currentUserId, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview'); // overview, students, schedule
    const [stats, setStats] = useState({ earnings: 0, students: 0, hours: 0 });
    const [requests, setRequests] = useState([]);
    const [availability, setAvailability] = useState([]);

    useEffect(() => {
        // Mock data loading
        const wallet = mockDB.getWallet(currentUserId);
        const avail = mockDB.getTeacherAvailability(currentUserId);

        setStats({
            earnings: wallet.balance,
            students: 12, // Keep as mock for now or calculate from approved requests
            hours: 45 // Keep as mock
        });
        const reqs = mockDB.getRequestsForTeacher(currentUserId);
        setRequests(reqs);
        setAvailability(avail);

        // Listen for wallet updates
        const walletHandler = () => {
            const updatedWallet = mockDB.getWallet(currentUserId);
            setStats(prev => ({ ...prev, earnings: updatedWallet.balance }));
        };
        window.addEventListener('wallet-update', walletHandler);
        return () => window.removeEventListener('wallet-update', walletHandler);
    }, [currentUserId]);

    const handleAcceptRequest = (studentId) => {
        mockDB.updateRequestStatus(studentId, currentUserId, 'approved');
        setRequests(prev => prev.filter(r => r.studentId !== studentId));
        toast.success(`Solicitud de ${studentId} aceptada`);
    };

    const handleSaveAvailability = (newAvail) => {
        mockDB.updateTeacherAvailability(currentUserId, newAvail);
        setAvailability(newAvail);
        toast.success("Horario actualizado correctamente");
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
                        Panel de Profesor <span className="text-gold">.</span>
                    </h1>
                    <p className="text-text-muted">Gestiona tus alumnos y ganancias.</p>
                </div>
                <div className="flex gap-4 items-center">
                    <Link to={`/classroom/${currentUserId}`} className="btn-secondary flex items-center gap-2">
                        <ExternalLink size={18} />
                        Mi Aula
                    </Link>
                    <div className="flex gap-2 p-1 bg-dark-panel rounded-lg border border-white/5">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            Resumen
                        </button>
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'schedule' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                        >
                            Horario
                        </button>
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

            {activeTab === 'schedule' ? (
                <div className="glass-panel p-6 rounded-2xl animate-enter">
                    <Calendar
                        mode="edit"
                        availability={availability}
                        onSaveAvailability={handleSaveAvailability}
                    />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-xl bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
                                    <DollarSign size={24} />
                                </div>
                                <span className="text-xs font-mono text-green-400/80">+15% este mes</span>
                            </div>
                            <div className="mt-4">
                                <span className="text-3xl font-bold text-white tracking-tight">{stats.earnings.toFixed(2)}€</span>
                                <p className="text-sm text-text-muted">Ganancias Totales</p>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                    <Users size={24} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-3xl font-bold text-white tracking-tight">{stats.students}</span>
                                <p className="text-sm text-text-muted">Estudiantes Activos</p>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <span className="text-3xl font-bold text-white tracking-tight">{stats.hours}h</span>
                                <p className="text-sm text-text-muted">Clases Impartidas</p>
                            </div>
                        </div>

                        {/* Gamification Card */}
                        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-dark-panel to-gold/5 border-gold/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy size={20} className="text-gold" />
                                    <span className="text-gold font-bold text-sm uppercase tracking-wider">Nivel Maestro</span>
                                </div>
                                <div className="w-full bg-black/40 h-2 rounded-full mb-2 overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-gold to-orange-500 w-[75%] shadow-[0_0_10px_rgba(255,215,0,0.5)]"></div>
                                </div>
                                <p className="text-xs text-text-muted flex justify-between">
                                    <span>Progreso: 75%</span>
                                    <span className="text-gold">Próx: Gran Maestro</span>
                                </p>
                                <div className="mt-3 pt-3 border-t border-white/5 text-[10px] space-y-1">
                                    <p className="flex justify-between text-white/80"><span>Comisión actual:</span> <span className="text-green-400 font-mono">15%</span></p>
                                    <p className="flex justify-between text-white/50"><span>Siguiente nivel:</span> <span className="text-gold font-mono">10%</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-6 flex-col lg:flex-row h-full">
                        {/* Requests Feed */}
                        <div className="flex-1 glass-panel rounded-2xl p-6 min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Solicitudes Pendientes</h2>
                                <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold animate-pulse">{requests.length} nuevas</span>
                            </div>

                            <div className="space-y-4">
                                {requests.length === 0 ? (
                                    <div className="text-center py-10 text-text-muted">
                                        <Bell size={40} className="mx-auto mb-4 opacity-20" />
                                        <p>No tienes solicitudes nuevas.</p>
                                    </div>
                                ) : (
                                    requests.map(req => (
                                        <div key={req.id} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                                                    {req.studentId.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white">{req.studentId}</h4>
                                                    <p className="text-xs text-text-muted">Quiere aprender Defensa India</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleAcceptRequest(req.studentId)}
                                                    className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all" title="Aceptar">
                                                    <Check size={18} />
                                                </button>
                                                <button className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all" title="Rechazar">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Quick Classroom Link */}
                        <div className="w-full lg:w-80 glass-panel rounded-2xl p-6 flex flex-col gap-4">
                            <h2 className="text-xl font-bold text-white mb-2">Acceso Rápido</h2>
                            <Link to={`/classroom/${currentUserId}`} className="group relative overflow-hidden rounded-xl aspect-video bg-black flex items-center justify-center border border-white/10 hover:border-gold/50 transition-all">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529699211952-734e80c4d42b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                                <div className="relative z-10 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-gold/90 text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)] group-hover:scale-110 transition-transform">
                                        <Video size={24} />
                                    </div>
                                    <span className="font-bold text-white tracking-wide">Entrar al Aula</span>
                                </div>
                            </Link>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                                <h4 className="font-bold text-sm text-gold">Próxima Clase</h4>
                                <p className="text-xs text-white">Hoy, 18:00 - vs. Student1</p>
                                <div className="h-1 w-full bg-black/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[60%]"></div>
                                </div>
                                <p className="text-[10px] text-text-muted text-right">En 2 horas</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherDashboard;
