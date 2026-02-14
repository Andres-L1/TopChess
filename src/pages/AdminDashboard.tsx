import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { AppUser, Teacher, Transaction } from '../types/index';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Users, GraduationCap, Calendar, Shield, Search,
    CheckCircle, Ban, DollarSign, Activity, FileText,
    AlertTriangle, ArrowUpRight, ArrowDownLeft,
    ChevronRight, TrendingUp, Zap, Settings, LogOut, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [stats, setStats] = useState({ users: 0, teachers: 0, requests: 0, revenue: 0 });
    const [users, setUsers] = useState<AppUser[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'users' | 'teachers' | 'payments' | 'analytics'>('users');

    useEffect(() => {
        if (currentUser?.email !== 'andreslgumuzio@gmail.com') {
            navigate('/');
            return;
        }

        // Stats and Data fetch
        setLoading(true);

        // Listeners for real-time stats
        const unsubUsers = firebaseService.subscribeToCollection('users', (data) => {
            setUsers(data as AppUser[]);
        });

        const unsubTeachers = firebaseService.subscribeToCollection('teachers', (data) => {
            setTeachers(data as Teacher[]);
        });

        const unsubTrans = firebaseService.subscribeToCollection('transactions', (data) => {
            setTransactions(data as Transaction[]);
        });

        const fetchInitialStats = async () => {
            const s = await firebaseService.getPlatformStats();
            setStats(s);
            setLoading(false);
        };

        fetchInitialStats();

        return () => {
            unsubUsers();
            unsubTeachers();
            unsubTrans();
        };
    }, [currentUser, navigate]);

    const handleVerifyTeacher = async (teacherId: string, currentStatus: boolean) => {
        try {
            await firebaseService.verifyTeacher(teacherId, !currentStatus);
            toast.success(currentStatus ? t('admin.messages.verif_removed') : t('admin.messages.verif_added'));
            fetchData();
        } catch (error) {
            toast.error(t('admin.messages.verif_error'));
        }
    };

    const handleBanUser = async (userId: string, currentStatus: string) => {
        const isBanned = currentStatus === 'banned';
        try {
            await firebaseService.banUser(userId, !isBanned);
            toast.success(isBanned ? t('admin.messages.user_unbanned') : t('admin.messages.user_banned'));
            fetchData();
        } catch (error) {
            toast.error(t('admin.messages.status_error'));
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#161512] flex items-center justify-center text-gold font-bold uppercase tracking-widest text-xs animate-pulse">
                {t('admin.loading')}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans pb-24">
            <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-gold to-orange-500 rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                            <div className="relative p-3 bg-[#111] rounded-xl border border-white/10 shadow-2xl">
                                <Shield className="text-gold h-8 w-8" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                                Control <span className="text-gold">Central</span>
                            </h1>
                            <div className="flex items-center gap-2 text-text-muted">
                                <Activity size={12} className="text-green-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sistema Operativo • {stats.users + stats.teachers} Entidades</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-3 border-white/5 bg-white/[0.02]">
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)] animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8b8982]">Respuesta: 24ms</span>
                        </div>
                        <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-text-muted hover:text-white">
                            <Search size={18} />
                        </button>
                    </div>
                </div>

                {/* Top Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <StatCard
                        icon={Users}
                        label="Estudiantes"
                        value={stats.users}
                        trend="+12%"
                        color="blue"
                    />
                    <StatCard
                        icon={GraduationCap}
                        label="Mentores"
                        value={stats.teachers}
                        trend="+2"
                        color="gold"
                    />
                    <StatCard
                        icon={Calendar}
                        label="Clases"
                        value={stats.requests}
                        trend="En curso"
                        color="purple"
                    />
                    <StatCard
                        icon={DollarSign}
                        label="Ingresos Mensuales"
                        value={`${stats.revenue.toFixed(2)}€`}
                        trend="+24.5%"
                        color="green"
                    />
                </div>

                {/* Tabs Navigation */}
                <div className="flex p-1 bg-[#111] rounded-2xl border border-white/5 w-full md:w-fit overflow-x-auto hide-scrollbar scrollbar-hide shadow-xl">
                    <div className="flex min-w-max">
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Gestión de Usuarios" />
                        <TabButton active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={GraduationCap} label="Cuerpo Docente" />
                        <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={FileText} label="Transacciones" />
                        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={Activity} label="Analíticas" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl animate-fade-in">
                    <div className="p-6 border-b border-[#302e2b] flex flex-col md:flex-row justify-between items-center gap-4 bg-white/5">
                        <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                            {activeTab === 'users' && <><Users size={20} className="text-blue-400" /> {t('admin.titles.users')}</>}
                            {activeTab === 'teachers' && <><GraduationCap size={20} className="text-gold" /> {t('admin.titles.teachers')}</>}
                            {activeTab === 'payments' && <><DollarSign size={20} className="text-green-400" /> {t('admin.titles.payments')}</>}
                        </h2>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666]" size={16} />
                            <input
                                type="text"
                                placeholder={t('admin.filter')}
                                className="w-full bg-[#161512] border border-[#302e2b] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-gold/50 transition-all placeholder:text-[#444]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        {activeTab === 'users' && (
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] text-text-muted text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Identidad</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Privilegios</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Activos</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Estado</th>
                                        <th className="p-4 md:p-6 text-right italic font-mono tracking-tighter">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="" className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-gold/30 transition-all shadow-xl" />
                                                        {user.status === 'banned' && (
                                                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 border-2 border-[#111]">
                                                                <Ban size={8} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white tracking-tight text-sm">{user.name}</span>
                                                        <span className="text-[10px] text-text-muted font-mono lowercase">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${user.role === 'teacher' ? 'bg-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]' : 'bg-blue-400'}`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${user.role === 'teacher' ? 'text-gold' : 'text-blue-400'}`}>
                                                        {user.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                                    <span className="text-green-500">€</span>
                                                    {user.walletBalance?.toFixed(2) || '0.00'}
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${user.status === 'banned' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                                    {user.status === 'banned' ? 'Restringido' : 'Operativo'}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6 text-right">
                                                <button
                                                    onClick={() => handleBanUser(user.id, user.status || 'active')}
                                                    className={`p-2.5 rounded-xl transition-all border ${user.status === 'banned' ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'}`}
                                                >
                                                    <Ban size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'teachers' && (
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] text-text-muted text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Mentor</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Región</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Tarifa / Comisión</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Rendimiento</th>
                                        <th className="p-4 md:p-6 text-right italic font-mono tracking-tighter">Estatus</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTeachers.map(teacher => (
                                        <tr key={teacher.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img src={teacher.image} className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all border border-white/5 shadow-lg group-hover:scale-105 duration-500" alt="" />
                                                        {teacher.isVerified && (
                                                            <div className="absolute -bottom-1 -right-1 bg-gold rounded-full p-1 border-2 border-[#111] shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                                                                <CheckCircle size={10} className="text-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-white tracking-tight group-hover:text-gold transition-colors">{teacher.name}</span>
                                                        <span className="text-[10px] text-text-muted font-mono lowercase">{teacher.teachingStyle}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <span className="text-xs font-medium text-text-muted border border-white/5 bg-white/[0.02] px-2.5 py-1 rounded-lg">
                                                    {teacher.region}
                                                </span>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{teacher.price}€<span className="text-[10px] font-normal text-text-muted ml-1">/h</span></span>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="w-1 h-1 rounded-full bg-gold"></div>
                                                        <span className="text-[10px] text-gold font-black uppercase tracking-widest">{teacher.commissionRate * 100}% Fee</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-6">
                                                    <div>
                                                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-0.5">Clases</p>
                                                        <p className="text-sm font-bold text-white">{teacher.classesGiven}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-0.5">Ingresos</p>
                                                        <p className="text-sm font-bold text-green-400">{teacher.earnings.toFixed(2)}€</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6 text-right">
                                                <button
                                                    onClick={() => handleVerifyTeacher(teacher.id, teacher.isVerified || false)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all border ${teacher.isVerified ? 'bg-gold text-black border-gold shadow-lg shadow-gold/10' : 'bg-white/5 text-white/40 border-white/10 hover:border-gold/50 hover:text-gold'}`}
                                                >
                                                    {teacher.isVerified ? 'Verificado' : 'Pendiente'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'payments' && (
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] text-text-muted text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                    <tr>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Evento</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Cuantía</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Cronología</th>
                                        <th className="p-4 md:p-6 italic font-mono tracking-tighter">Ruta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-white/[0.01] transition-colors group">
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-xl ${tx.type === 'deposit' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'} border border-white/5`}>
                                                        {tx.type === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                                    </div>
                                                    <span className="text-sm font-bold text-white tracking-tight">{tx.description}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-mono font-bold ${tx.description.includes('Comisión') ? 'text-gold' : 'text-white'}`}>
                                                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}€
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex flex-col text-[10px] text-text-muted font-mono uppercase tracking-widest">
                                                    <span className="font-bold text-white/40">{new Date(tx.timestamp).toLocaleDateString()}</span>
                                                    <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center gap-2 text-[10px] font-mono text-white/20">
                                                    <span className="truncate max-w-[80px] hover:text-white/50 cursor-help" title={tx.fromId}>{tx.fromId}</span>
                                                    <ChevronRight size={10} />
                                                    <span className="truncate max-w-[80px] hover:text-white/50 cursor-help" title={tx.toId}>{tx.toId}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// UI Components
const StatCard = ({ icon: Icon, label, value, color, trend }: any) => {
    const colors: any = {
        blue: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
        gold: 'border-gold/30 text-gold bg-gold/5',
        purple: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
        green: 'border-green-500/30 text-green-400 bg-green-500/5'
    };

    return (
        <div className={`glass-panel p-6 rounded-2xl flex flex-col gap-4 border border-white/5 shadow-2xl transition-all hover:scale-[1.02] hover:border-white/10 ${colors[color]}`}>
            <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl bg-white/5`}>
                    <Icon size={20} />
                </div>
                {trend && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-white/50 lowercase tracking-widest">
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
                <h3 className="text-2xl font-bold tracking-tighter text-white">{value}</h3>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest ${active ? 'bg-gold text-black shadow-lg shadow-gold/20 scale-[1.02]' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
    >
        <Icon size={14} className={active ? 'text-black' : 'text-gold'} />
        {label}
    </button>
);

export default AdminDashboard;

