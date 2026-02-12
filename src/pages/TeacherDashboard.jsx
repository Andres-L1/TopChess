import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { AuthContext } from '../App';
import { DollarSign, Users, Clock, LogOut, CheckCircle, XCircle } from 'lucide-react';
import Logo from '../components/Logo';

const TeacherDashboard = () => {
    const { logout, currentUserId } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({ earnings: 0, students: 0, hours: 0 });
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        // Mock data loading
        setStats({
            earnings: 1250,
            students: 12,
            hours: 45
        });
        const reqs = mockDB.getRequestsForTeacher(currentUserId);
        setRequests(reqs);
    }, [currentUserId]);

    const handleApprove = (studentId) => {
        mockDB.approveRequest(studentId, currentUserId);
        setRequests(mockDB.getRequestsForTeacher(currentUserId));
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-dark-bg text-text-primary font-sans selection:bg-gold selection:text-black">
            {/* Header */}
            <div className="border-b border-white/5 bg-dark-panel/50 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Logo className="w-8 h-8 text-gold" />
                    <h1 className="text-xl font-bold tracking-tight text-white">Panel de <span className="text-gold">Grandes Maestros</span></h1>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-text-muted hover:text-red-400 transition-colors text-xs uppercase font-bold tracking-wider"
                >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-dark-panel p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <DollarSign size={80} />
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-gold/10 rounded-xl text-gold">
                                <DollarSign size={24} />
                            </div>
                            <span className="text-text-muted text-xs uppercase font-bold tracking-wider">Ganancias Mes</span>
                        </div>
                        <span className="text-4xl font-black text-white tracking-tight block mt-2">{stats.earnings}€</span>
                        <span className="text-xs text-green-500 font-bold mt-2 block">+12% vs mes anterior</span>
                    </div>

                    <div className="bg-dark-panel p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Users size={80} />
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                <Users size={24} />
                            </div>
                            <span className="text-text-muted text-xs uppercase font-bold tracking-wider">Alumnos Activos</span>
                        </div>
                        <span className="text-4xl font-black text-white tracking-tight block mt-2">{stats.students}</span>
                    </div>

                    <div className="bg-dark-panel p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Clock size={80} />
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                <Clock size={24} />
                            </div>
                            <span className="text-text-muted text-xs uppercase font-bold tracking-wider">Horas Impartidas</span>
                        </div>
                        <span className="text-4xl font-black text-white tracking-tight block mt-2">{stats.hours}h</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Actions */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Requests Section */}
                        <section>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-gold rounded-full"></span>
                                Solicitudes Pendientes
                            </h2>

                            {requests.length === 0 ? (
                                <div className="bg-dark-panel rounded-xl p-8 text-center border border-white/5 border-dashed">
                                    <p className="text-text-muted italic">No hay solicitudes nuevas.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {requests.map(req => (
                                        <div key={req.studentId} className="bg-dark-panel p-4 rounded-xl border border-white/5 flex justify-between items-center hover:border-gold/30 transition-colors">
                                            <div>
                                                <span className="font-bold text-white block mb-1">Estudiante {req.studentId}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                        req.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                    }`}>
                                                    {req.status === 'pending' ? 'Pendiente' : req.status}
                                                </span>
                                            </div>
                                            {req.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(req.studentId)}
                                                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                                                        title="Aprobar"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors" title="Rechazar">
                                                        <XCircle size={18} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Quick Access */}
                        <section>
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-gold rounded-full"></span>
                                Accesos Rápidos
                            </h2>
                            <div className="bg-gradient-to-r from-dark-panel to-bg-panel p-6 rounded-2xl border border-white/5 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translates-y-10">
                                    <Logo className="w-48 h-48 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-1">Mi Aula Virtual</h3>
                                    <p className="text-text-muted text-sm mb-4">Gestiona tu espacio de enseñanza en tiempo real.</p>
                                    <button
                                        onClick={() => navigate(`/room/${currentUserId}`)}
                                        className="px-6 py-2 bg-gold text-black font-bold rounded-lg hover:bg-white transition-colors shadow-lg shadow-gold/10"
                                    >
                                        Entrar al Aula
                                    </button>
                                </div>
                            </div>
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
