import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { AppUser, Teacher, Transaction } from '../types/index';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Users, GraduationCap, Calendar, Shield, Search,
    CheckCircle, Ban, DollarSign, Activity, FileText,
    AlertTriangle, ArrowUpRight, ArrowDownLeft
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

    const fetchData = async () => {
        try {
            const [statsData, usersData, teachersData, transData] = await Promise.all([
                firebaseService.getPlatformStats(),
                firebaseService.getAllUsers(),
                firebaseService.getAllTeachers(),
                firebaseService.getAllTransactions()
            ]);
            setStats(statsData);
            setUsers(usersData);
            setTeachers(teachersData);
            setTransactions(transData.sort((a, b) => b.timestamp - a.timestamp));
        } catch (error) {
            console.error("Error fetching admin data:", error);
            toast.error(t('admin.messages.load_error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.email !== 'andreslgumuzio@gmail.com') {
            navigate('/');
            return;
        }
        fetchData();
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
        <div className="min-h-screen bg-[#161512] text-white p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 tracking-tighter">
                            <Shield className="text-gold h-10 w-10 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]" />
                            {t('admin.title')}
                        </h1>
                        <p className="text-[#8b8982] text-sm uppercase tracking-widest font-bold opacity-60">{t('admin.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-[#262421] px-4 py-2 rounded-xl border border-[#302e2b] flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]"></div>
                            <span className="text-xs font-mono text-[#8b8982]">{t('admin.status_online')}</span>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={Users}
                        label={t('admin.stats.users')}
                        value={stats.users}
                        color="blue"
                    />
                    <StatCard
                        icon={GraduationCap}
                        label={t('admin.stats.mentors')}
                        value={stats.teachers}
                        color="gold"
                    />
                    <StatCard
                        icon={Calendar}
                        label={t('admin.stats.requests')}
                        value={stats.requests}
                        color="purple"
                    />
                    <StatCard
                        icon={DollarSign}
                        label={t('admin.stats.revenue')}
                        value={`${stats.revenue.toFixed(2)}€`}
                        color="green"
                    />
                </div>

                {/* Tabs Navigation */}
                <div className="flex p-1 bg-[#262421] rounded-2xl border border-[#302e2b] w-fit mx-auto md:mx-0">
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label={t('admin.tabs.users')} />
                    <TabButton active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={GraduationCap} label={t('admin.tabs.teachers')} />
                    <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={FileText} label={t('admin.tabs.transactions')} />
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
                                <thead className="bg-[#262421] text-[#8b8982] text-[10px] uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="p-4">{t('admin.table.identity')}</th>
                                        <th className="p-4">{t('admin.table.role')}</th>
                                        <th className="p-4">{t('admin.table.wallet')}</th>
                                        <th className="p-4">{t('admin.table.status')}</th>
                                        <th className="p-4 text-right">{t('admin.table.maintenance')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#302e2b]">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative">
                                                        <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10" />
                                                        {user.status === 'banned' && (
                                                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-dark-bg">
                                                                <AlertTriangle size={8} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight">{user.name}</span>
                                                        <span className="text-[10px] text-[#666] font-mono">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${user.role === 'teacher' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1 text-xs font-mono text-green-400/80">
                                                    <DollarSign size={10} />
                                                    {user.walletBalance || 0}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-bold ${user.status === 'banned' ? 'text-red-500' : 'text-green-500'}`}>
                                                    {user.status === 'banned' ? t('admin.status.banned') : t('admin.status.active')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleBanUser(user.id, user.status || 'active')}
                                                    className={`p-2 rounded-lg transition-all ${user.status === 'banned' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                                                    title={user.status === 'banned' ? 'Desbloquear' : 'Bloquear'}
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
                                <thead className="bg-[#262421] text-[#8b8982] text-[10px] uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="p-4">{t('admin.table.mentor')}</th>
                                        <th className="p-4">{t('admin.table.region')}</th>
                                        <th className="p-4">{t('admin.table.price_com')}</th>
                                        <th className="p-4">{t('admin.table.classes_earnings')}</th>
                                        <th className="p-4 text-right">{t('admin.table.verification')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#302e2b]">
                                    {filteredTeachers.map(teacher => (
                                        <tr key={teacher.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={teacher.image} className="w-8 h-8 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all border border-white/5" alt="" />
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm">{teacher.name}</span>
                                                            {teacher.isVerified && <CheckCircle size={12} className="text-gold" />}
                                                        </div>
                                                        <span className="text-[10px] text-gold/80 font-mono italic">{teacher.teachingStyle}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-[#8b8982]">{teacher.region}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{teacher.price}{teacher.currency === 'EUR' ? '€' : '$'}</span>
                                                    <span className="text-[10px] text-[#666]">Fee: {teacher.commissionRate * 100}%</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold">{teacher.classesGiven} Clases</span>
                                                    <span className="text-[10px] text-green-400/80">{teacher.earnings.toFixed(0)} Total</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleVerifyTeacher(teacher.id, teacher.isVerified || false)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all border ${teacher.isVerified ? 'bg-gold text-black border-gold shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-gold/50 hover:text-gold'}`}
                                                >
                                                    {teacher.isVerified ? t('admin.status.verified') : t('admin.status.pending')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'payments' && (
                            <table className="w-full text-left">
                                <thead className="bg-[#262421] text-[#8b8982] text-[10px] uppercase font-black tracking-widest">
                                    <tr>
                                        <th className="p-4">{t('admin.table.type')}</th>
                                        <th className="p-4">{t('admin.table.concept')}</th>
                                        <th className="p-4">{t('admin.table.amount')}</th>
                                        <th className="p-4">{t('admin.table.date_time')}</th>
                                        <th className="p-4">{t('admin.table.participants')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#302e2b]">
                                    {transactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                {tx.type === 'deposit' ? (
                                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg w-fit"><ArrowDownLeft size={16} /></div>
                                                ) : (
                                                    <div className="p-2 bg-green-500/10 text-green-400 rounded-lg w-fit"><ArrowUpRight size={16} /></div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-bold tracking-tight">{tx.description}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-mono text-sm font-bold ${tx.description.includes('Comisión') ? 'text-gold' : 'text-white'}`}>
                                                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}€
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col text-[10px] text-[#666]">
                                                    <span className="font-bold">{new Date(tx.timestamp).toLocaleDateString()}</span>
                                                    <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-[10px] font-mono text-white/30 truncate max-w-[150px]">
                                                {tx.fromId} → {tx.toId}
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
const StatCard = ({ icon: Icon, label, value, color }: any) => {
    const colors: any = {
        blue: 'border-blue-500 text-blue-400 bg-blue-500/5',
        gold: 'border-gold text-gold bg-gold/5',
        purple: 'border-purple-500 text-purple-400 bg-purple-500/5',
        green: 'border-green-500 text-green-400 bg-green-500/5'
    };

    return (
        <div className={`glass-panel p-6 rounded-2xl flex flex-col gap-3 border-l-4 shadow-xl transition-all hover:scale-[1.02] ${colors[color]}`}>
            <Icon size={20} className="opacity-80" />
            <div>
                <p className="text-[#8b8982] text-[10px] font-black uppercase tracking-widest">{label}</p>
                <h3 className="text-2xl font-black tracking-tighter text-white">{value}</h3>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${active ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-[#8b8982] hover:text-white hover:bg-white/5'}`}
    >
        <Icon size={14} />
        {label}
    </button>
);

export default AdminDashboard;

