import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { AuthContext } from '../App';
import { LogOut, BookOpen, MessageSquare, Clock, Search, Shield, Award } from 'lucide-react';
import Logo from '../components/Logo';

const StudentDashboard = () => {
    const { logout, currentUserId } = React.useContext(AuthContext);
    const navigate = useNavigate();
    const [myTeachers, setMyTeachers] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        // Init balance
        setBalance(mockDB.getWallet(currentUserId).balance);
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
            // We just need to trigger a re-render, getting the balance directly in render or state
            // For simplicity, let's just force update via state or just rely on render reading mockDB if we had a useWallet hook.
            // Since we read mockDB directly in render (bad practice usually, but ok for mock), we need to trigger render.
            // Let's add a dummy state or just fetch balance in useEffect and put in state.
            setBalance(mockDB.getWallet(currentUserId).balance);
        };
        window.addEventListener('wallet-update', walletHandler);
        return () => window.removeEventListener('wallet-update', walletHandler);
    }, [currentUserId]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-dark-bg text-text-primary font-sans">
            {/* Header */}
            <div className="border-b border-white/5 bg-dark-panel/50 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Logo className="w-8 h-8 text-white" />
                    <h1 className="text-xl font-bold tracking-tight text-white">Panel de <span className="text-white">Estudiante</span></h1>
                </div>
                <button
                    onClick={() => navigate('/wallet')}
                    className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs uppercase font-bold tracking-wider mr-4"
                >
                    <div className="bg-gold/10 px-3 py-1 rounded-full border border-gold/20 flex items-center gap-2">
                        <span>{balance.toFixed(2)} €</span>
                    </div>
                </button>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-text-muted hover:text-red-400 transition-colors text-xs uppercase font-bold tracking-wider"
                >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Welcome / Stats Banner */}
                <div className="bg-gradient-to-r from-dark-panel to-[#262421] p-6 rounded-2xl border border-white/5 shadow-lg mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-black text-white mb-2">¡Hola, Estudiante!</h2>
                        <p className="text-text-secondary text-sm">Continúa tu camino hacia la maestría. Tienes <strong className="text-gold">{myTeachers.length} profesores</strong> activos.</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-white/5 hover:bg-gold hover:text-black text-white border border-white/10 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                        <Search size={18} />
                        Buscar Nuevo Profesor
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Column: My Teachers */}
                    <div className="lg:col-span-2 space-y-8">
                        <section>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-gold rounded-full"></span>
                                Mis Profesores
                            </h3>

                            {myTeachers.length === 0 ? (
                                <div className="bg-dark-panel rounded-xl p-8 text-center border border-white/5 border-dashed">
                                    <p className="text-text-muted italic mb-4">Aún no tienes profesores activos.</p>
                                    <button onClick={() => navigate('/')} className="text-gold hover:underline text-sm font-bold">Encontrar un mentor</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {myTeachers.map((teacher) => (
                                        <div key={teacher.id} className="bg-dark-panel p-5 rounded-xl border border-white/5 hover:border-gold/30 transition-all group flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                                <div className="relative">
                                                    <div className="w-14 h-14 rounded-full bg-cover bg-center border-2 border-white/10" style={{ backgroundImage: `url(${teacher.image || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400'})` }}></div>
                                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-dark-panel" title="En línea"></div>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">{teacher.name}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-text-muted">
                                                        <span className="bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 font-bold">{teacher.title}</span>
                                                        <span>• Elo {teacher.rating}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <button
                                                    onClick={() => navigate(`/chat/${teacher.id}`)}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                                                >
                                                    <MessageSquare size={16} />
                                                    Chat
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/room/${teacher.id}`)}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-gold text-black rounded-lg hover:bg-white transition-colors shadow-lg shadow-gold/10 flex items-center justify-center gap-2 font-bold text-sm"
                                                >
                                                    <BookOpen size={16} />
                                                    Aula
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar: Pending & Progress */}
                    <div className="space-y-6">
                        {/* Pending Requests */}
                        <section className="bg-dark-panel border border-white/5 rounded-2xl p-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
                                <Clock size={14} /> Solicitudes Pendientes
                            </h3>
                            {pendingRequests.length === 0 ? (
                                <p className="text-xs text-text-muted italic">No tienes solicitudes pendientes.</p>
                            ) : (
                                <div className="space-y-3">
                                    {pendingRequests.map(req => (
                                        <div key={req.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${req.image})` }}></div>
                                            <div className="overflow-hidden">
                                                <div className="text-sm font-bold text-white truncate">{req.name}</div>
                                                <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Esperando aprobación</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Achievements / Progress Placeholder */}
                        <section className="bg-dark-panel border border-white/5 rounded-2xl p-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
                                <Award size={14} /> Tu Progreso
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-white font-bold">Problemas Tácticos</span>
                                        <span className="text-gold">1450</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[70%] h-full bg-gold rounded-full"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-white font-bold">Clases Completadas</span>
                                        <span className="text-gold">12</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[40%] h-full bg-blue-500 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
