```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, Clock, Trophy, ChevronRight, ExternalLink, Calendar as CalendarIcon, Bell, Check, X, Video } from 'lucide-react';
import Calendar from '../components/Calendar';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
    const { logout, currentUserId } = useAuth();
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
        mockDB.approveRequest(studentId, currentUserId); // Assuming this is the correct mockDB method
        setRequests(prev => prev.filter(r => r.studentId !== studentId));
        // Recalc stats if real
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
                <div className="flex gap-4">
                     <Link to={`/ classroom / ${ currentUserId } `} className="btn-secondary flex items-center gap-2">
                        <ExternalLink size={18} />
                        Mi Aula
                    </Link>
                    <div className="flex gap-2 p-1 bg-dark-panel rounded-lg border border-white/5">
                        <button 
                            onClick={() => setActiveTab('overview')}
                            className={`px - 4 py - 2 rounded - md text - sm font - medium transition - all ${ activeTab === 'overview' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white' } `}
                        >
                            Resumen
                        </button>
                        <button 
                            onClick={() => setActiveTab('schedule')}
                            className={`px - 4 py - 2 rounded - md text - sm font - medium transition - all ${ activeTab === 'schedule' ? 'bg-gold text-black shadow-lg' : 'text-text-muted hover:text-white' } `}
                        >
                            Horario
                        </button>
                    </div>
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
                    {/* ... Existing Stats ... */}
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
                    {/* ... other stats ... */}
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
                        {/* Quick Actions & Status */}
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Upcoming Classes - Dynamic Mock */}
                            <div className="bg-dark-panel p-6 rounded-2xl border border-white/5 border-l-4 border-l-gold shadow-lg">
                                <h2 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                                    <span className="uppercase tracking-wider">Próxima Clase</span>
                                    {requests.some(r => r.status === 'approved') && (
                                        <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-gold animate-pulse">En vivo</span>
                                    )}
                                </h2>

                                {requests.some(r => r.status === 'approved') ? (
                                    (() => {
                                        const nextStudent = requests.find(r => r.status === 'approved');
                                        return (
                                            <>
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center text-black font-bold text-lg shadow-lg">
                                                        {nextStudent.studentId.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-lg">Estudiante {nextStudent.studentId}</div>
                                                        <div className="text-xs text-text-muted">Clase Regular • 1500 ELO</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => navigate(`/ room / ${ currentUserId } `)}
                                                    className="w-full py-3 bg-gold text-black font-bold rounded-lg hover:bg-white transition-all shadow-lg shadow-gold/10 flex items-center justify-center gap-2"
                                                >
                                                    <span>Ir al Aula</span>
                                                    <Logo className="w-4 h-4" />
                                                </button>
                                            </>
                                        );
                                    })()
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-text-muted text-sm italic mb-2">No tienes clases programadas.</p>
                                        <p className="text-[10px] text-gray-500">Acepta solicitudes para gestionar tu agenda.</p>
                                    </div>
                                )}
                            </div>

                            {/* Requests Section - Refined */}
                            <div className="bg-dark-panel p-6 rounded-2xl border border-white/5">
                                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <span className="uppercase tracking-wider">Solicitudes</span>
                                    {requests.filter(r => r.status === 'pending').length > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                                            {requests.filter(r => r.status === 'pending').length}
                                        </span>
                                    )}
                                </h2>

                                <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                    {requests.length === 0 ? (
                                        <div className="text-center py-4 opacity-50 text-xs italic">
                                            No hay solicitudes pendientes.
                                        </div>
                                    ) : (
                                        requests.map(req => (
                                            <div key={req.studentId} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                                <div>
                                                    <span className="font-bold text-white text-xs block">Estudiante {req.studentId}</span>
                                                    <span className={`text - [9px] uppercase font - bold tracking - wider ${
    req.status === 'pending' ? 'text-yellow-500' :
    req.status === 'approved' ? 'text-green-500' : 'text-red-500'
} `}>
                                                        {req.status === 'pending' ? 'Pendiente' : req.status}
                                                    </span>
                                                </div>
                                                {req.status === 'pending' && (
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleApprove(req.studentId)}
                                                            className="p-1.5 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded-lg transition-colors"
                                                            title="Aprobar"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                        <button className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors" title="Rechazar">
                                                            <XCircle size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* My Students Section - NEW */}
                        <section>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-gold rounded-full"></span>
                                Mis Alumnos Activos
                            </h2>
                            {requests.filter(r => r.status === 'approved').length === 0 ? (
                                <div className="bg-dark-panel rounded-xl p-8 text-center border border-white/5 border-dashed text-text-muted italic">
                                    No tienes alumnos activos aún.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {requests.filter(r => r.status === 'approved').map(req => (
                                        <div key={req.studentId} className="bg-dark-panel p-4 rounded-xl border border-white/5 flex flex-col sm:flex-row justify-between items-center hover:border-gold/30 transition-all gap-4">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                                                    ST
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">Estudiante {req.studentId}</div>
                                                    <div className="text-[10px] text-green-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <CheckCircle size={10} /> Activo
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => navigate(`/ chat / ${ req.studentId } `)} // In MVP chat ID is likely student ID or shared ID
                                                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                                                >
                                                    <LogOut size={14} className="rotate-180" /> {/* Chat Icon */}
                                                    Chat
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/ room / ${ currentUserId } `)}
                                                    className="flex-1 sm:flex-none px-3 py-1.5 bg-gold/10 hover:bg-gold hover:text-black text-gold border border-gold/30 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                                >
                                                    <CheckCircle size={14} />
                                                    Clase
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar / News */}
                    <div className="bg-dark-panel border border-white/5 rounded-2xl p-6 h-fit">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Novedades TopChess</h3>
                        <ul className="space-y-4">
                            <li className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                <span className="text-[10px] text-gold font-bold block mb-1">NUEVO</span>
                                <p className="text-sm text-text-primary leading-relaxed">Hemos actualizado el tablero a la versión 2.0 con validación estricta y mejor respuesta táctil.</p>
                            </li>
                            <li className="pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                <span className="text-[10px] text-blue-400 font-bold block mb-1">PAGOS</span>
                                <p className="text-sm text-text-primary leading-relaxed">Los pagos del mes de Enero ya han sido procesados. Revisa tu cuenta.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;
