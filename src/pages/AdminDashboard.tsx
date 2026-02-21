import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { firebaseService } from '../services/firebaseService';
import { AppUser, Teacher, Transaction } from '../types/index';
import { useNavigate } from 'react-router-dom';
import {
    Users, GraduationCap, Shield, Search,
    CheckCircle, Ban, DollarSign, Activity,
    FileText, ArrowUpRight, ArrowDownLeft,
    TrendingUp, Zap, AlertTriangle, Eye,
    RefreshCw, ChevronRight, Server, Globe,
    Cpu, Lock, Unlock, Edit2, Check, X,
    BarChart2, Clock, Wifi, WifiOff, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminUsersTab from './AdminDashboard/components/AdminUsersTab';
import AdminTeachersTab from './AdminDashboard/components/AdminTeachersTab';
import AdminTransactionsTab from './AdminDashboard/components/AdminTransactionsTab';
import AdminAnalyticsTab from './AdminDashboard/components/AdminAnalyticsTab';
import AdminSystemTab from './AdminDashboard/components/AdminSystemTab';
import { fmt, timeAgo } from './AdminDashboard/utils';

/* ─── helpers ────────────────────────────────────────────────────────────── */
// Imported from utils

/* ─── real-time clock ─────────────────────────────────────────────────────── */
const useClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    return time;
};

/* ─── mini sparkline (pure SVG) ──────────────────────────────────────────── */
const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#D4AF37' }) => {
    if (data.length < 2) return null;
    const max = Math.max(...data) || 1;
    const min = Math.min(...data);
    const W = 80, H = 28;
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - min) / (max - min || 1)) * H;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={W} height={H} className="opacity-70">
            <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
        </svg>
    );
};

/* ─── StatCard ───────────────────────────────────────────────────────────── */
const COLORS: Record<string, { ring: string; icon: string; badge: string }> = {
    blue: { ring: 'border-blue-500/30', icon: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400' },
    gold: { ring: 'border-gold/30', icon: 'text-gold', badge: 'bg-gold/10 text-gold' },
    purple: { ring: 'border-purple-500/30', icon: 'text-purple-400', badge: 'bg-purple-500/10 text-purple-400' },
    green: { ring: 'border-green-500/30', icon: 'text-green-400', badge: 'bg-green-500/10 text-green-400' },
    red: { ring: 'border-red-500/30', icon: 'text-red-400', badge: 'bg-red-500/10 text-red-400' },
};

const StatCard: React.FC<{
    icon: React.ElementType; label: string; value: string | number;
    sub?: string; color?: string; sparkline?: number[]; live?: boolean;
}> = ({ icon: Icon, label, value, sub, color = 'gold', sparkline, live }) => {
    const c = COLORS[color];
    return (
        <div className={`relative rounded-2xl border ${c.ring} bg-[#111]/60 backdrop-blur-sm p-5 flex flex-col gap-3 transition-all hover:scale-[1.01] group overflow-hidden`}>
            {live && (
                <span className="absolute top-3 right-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                </span>
            )}
            <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl bg-white/5 ${c.icon}`}>
                    <Icon size={18} />
                </div>
                {sparkline && <Sparkline data={sparkline} color={color === 'gold' ? '#D4AF37' : color === 'green' ? '#4ade80' : '#60a5fa'} />}
            </div>
            <div>
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-1">{label}</p>
                <h3 className="text-2xl font-black tracking-tighter text-white">{value}</h3>
                {sub && <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
};

/* ─── TabBtn ─────────────────────────────────────────────────────────────── */
const TabBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string; badge?: number }> = ({ active, onClick, icon: Icon, label, badge }) => (
    <button
        onClick={onClick}
        className={`relative flex items-center gap-2.5 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${active ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-white/30 hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon size={13} className={active ? 'text-black' : 'text-gold'} />
        {label}
        {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {badge > 9 ? '9+' : badge}
            </span>
        )}
    </button>
);

// CommissionCell extracted to AdminTeachersTab

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */
type Tab = 'users' | 'teachers' | 'transactions' | 'analytics' | 'system';

const AdminDashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const now = useClock();

    const [users, setUsers] = useState<AppUser[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('users');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const [liveCount, setLiveCount] = useState(0);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    // Pulse counter for live indicator
    const tickRef = useRef(0);
    useEffect(() => { tickRef.current++; setLiveCount(c => c + 1); }, [users, teachers, transactions]);

    // Redirect non-admins
    useEffect(() => {
        if (!currentUser) return;
        if (currentUser.email !== 'andreslgumuzio@gmail.com') navigate('/');
    }, [currentUser, navigate]);

    // ── Real-time listeners for everything ──────────────────────────────
    useEffect(() => {
        if (!currentUser || currentUser.email !== 'andreslgumuzio@gmail.com') return;

        const unsubUsers = firebaseService.subscribeToCollection('users', (data) => {
            setUsers(data as AppUser[]);
            setLastUpdate(Date.now());
            setLoading(false);
        });
        const unsubTeachers = firebaseService.subscribeToCollection('teachers', (data) => {
            setTeachers(data as Teacher[]);
            setLastUpdate(Date.now());
        });
        const unsubTx = firebaseService.subscribeToCollection('transactions', (data) => {
            setTransactions((data as Transaction[]).sort((a, b) => b.timestamp - a.timestamp));
            setLastUpdate(Date.now());
        });

        return () => { unsubUsers(); unsubTeachers(); unsubTx(); };
    }, [currentUser]);

    /* ── Derived stats (computed from live data) ──────────────────────── */
    const totalRevenue = transactions
        .filter(t => t.type === 'payment_received')
        .reduce((s, t) => s + t.amount, 0);

    const pendingRequests = users.filter(u => u.role === 'student' && u.status !== 'banned').length;
    const bannedUsers = users.filter(u => u.status === 'banned').length;
    const verifiedTeachers = teachers.filter(t => t.isVerified).length;
    const todayRevenue = transactions
        .filter(t => t.type === 'payment_received' && t.timestamp > Date.now() - 86400000)
        .reduce((s, t) => s + t.amount, 0);

    // Weekly revenue sparkline (last 7 days buckets)
    const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
        const dayStart = Date.now() - (6 - i) * 86400000;
        const dayEnd = dayStart + 86400000;
        return transactions
            .filter(t => t.type === 'payment_received' && t.timestamp >= dayStart && t.timestamp < dayEnd)
            .reduce((s, t) => s + t.amount, 0);
    });

    /* ── Actions ────────────────────────────────────────────────────────── */
    const handleBan = async (userId: string, isBanned: boolean) => {
        setProcessingIds(prev => new Set(prev).add(userId));
        try {
            await firebaseService.banUser(userId, !isBanned);
            toast.success(isBanned ? '✅ Usuario desrestringido' : '🚫 Usuario restringido');
        } catch { toast.error('Error al cambiar estado'); }
        finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(userId); return n; }); }
    };

    const handleVerify = async (teacherId: string, isVerified: boolean) => {
        setProcessingIds(prev => new Set(prev).add(teacherId));
        try {
            await firebaseService.verifyTeacher(teacherId, !isVerified);
            toast.success(isVerified ? 'Verificación retirada' : '⭐ Verificación concedida');
        } catch { toast.error('Error al verificar'); }
        finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(teacherId); return n; }); }
    };

    const handleCommission = async (teacherId: string, rate: number) => {
        try {
            await firebaseService.updateTeacher(teacherId, { commissionRate: rate });
            toast.success(`Comisión actualizada al ${Math.round(rate * 100)}%`);
        } catch { toast.error('Error al actualizar comisión'); }
    };

    /* ── Filters ────────────────────────────────────────────────────────── */
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredTeachers = teachers.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase())
    );
    const filteredTx = transactions.filter(t =>
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.fromId?.includes(search) || t.toId?.includes(search)
    );

    /* ── Loading ──────────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c0b0a] flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <Shield size={40} className="text-gold animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-ping" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 animate-pulse">
                    Conectando con Firestore...
                </p>
            </div>
        );
    }

    /* ════════════════════════════════════════════════════════════════════
       RENDER
       ════════════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-[#0c0b0a] text-white overflow-x-hidden">

            {/* ╔══ TOP BAR ════════════════════════════════════════════════╗ */}
            <div className="sticky top-0 z-50 bg-[#0c0b0a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gold/20 rounded-xl blur-md" />
                            <div className="relative p-2.5 bg-[#111] rounded-xl border border-gold/20">
                                <Shield size={20} className="text-gold" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-base font-black tracking-tighter">
                                Control <span className="text-gold">Central</span>
                            </h1>
                            <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.25em]">
                                TopChess Admin · {now.toLocaleTimeString('es-ES')}
                            </p>
                        </div>
                    </div>

                    {/* Live indicators */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl">
                            <Wifi size={11} className="text-green-400" />
                            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">En vivo</span>
                            <span className="text-[9px] text-green-300/50 font-mono">{liveCount} eventos</span>
                        </div>
                        <div className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl">
                            <span className="text-[9px] font-mono text-white/30">Sync: {timeAgo(lastUpdate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl">
                            <span className="text-[9px] text-white/30 uppercase font-black tracking-widest">
                                {users.length + teachers.length} entidades
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ╔══ BODY ════════════════════════════════════════════════════╗ */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-6">

                {/* ── KPI GRID ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard icon={Users} label="Estudiantes" value={users.filter(u => u.role === 'student').length}
                        sub={`${bannedUsers} restringidos`} color="blue" live
                        sparkline={[...Array(7)].map((_, i) => users.filter(u => u.createdAt > Date.now() - (7 - i) * 86400000).length)} />
                    <StatCard icon={GraduationCap} label="Mentores" value={teachers.length}
                        sub={`${verifiedTeachers} verificados`} color="gold" live
                        sparkline={weeklyRevenue.map((_, i) => i)} />
                    <StatCard icon={DollarSign} label="Revenue Total" value={`€${fmt(totalRevenue)}`}
                        sub={`€${fmt(todayRevenue)} hoy`} color="green" live sparkline={weeklyRevenue} />
                    <StatCard icon={FileText} label="Transacciones" value={transactions.length}
                        sub={`${transactions.filter(t => t.timestamp > Date.now() - 86400000).length} hoy`}
                        color="purple" live />
                    <StatCard icon={AlertTriangle} label="Alertas" value={bannedUsers}
                        sub="usuarios restringidos" color="red" live />
                </div>

                {/* ── MAIN PANEL ──────────────────────────────────────────── */}
                <div className="bg-[#111]/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">

                    {/* Tab bar + search */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 p-4 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1 md:pb-0">
                            <TabBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Usuarios" badge={bannedUsers} />
                            <TabBtn active={activeTab === 'teachers'} onClick={() => setActiveTab('teachers')} icon={GraduationCap} label="Mentores" />
                            <TabBtn active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={FileText} label="Transacciones" />
                            <TabBtn active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart2} label="Analíticas" />
                            <TabBtn active={activeTab === 'system'} onClick={() => setActiveTab('system')} icon={Server} label="Sistema" />
                        </div>

                        <div className="relative w-full md:w-72 shrink-0">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                            <input
                                type="text" placeholder="Buscar..." value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="input-premium pl-9 py-2.5 text-xs"
                            />
                        </div>
                    </div>

                    {/* ── Tab: USERS ─────────────────────────────────────── */}
                    {activeTab === 'users' && <AdminUsersTab filteredUsers={filteredUsers} handleBan={handleBan} processingIds={processingIds} />}

                    {/* ── Tab: TEACHERS ──────────────────────────────────── */}
                    {activeTab === 'teachers' && <AdminTeachersTab filteredTeachers={filteredTeachers} handleVerify={handleVerify} handleCommission={handleCommission} processingIds={processingIds} />}

                    {/* ── Tab: TRANSACTIONS ──────────────────────────────── */}
                    {activeTab === 'transactions' && <AdminTransactionsTab filteredTx={filteredTx} />}

                    {/* ── Tab: ANALYTICS ─────────────────────────────────── */}
                    {activeTab === 'analytics' && <AdminAnalyticsTab weeklyRevenue={weeklyRevenue} transactions={transactions} teachers={teachers} />}

                    {/* ── Tab: SYSTEM ────────────────────────────────────── */}
                    {activeTab === 'system' && <AdminSystemTab liveCount={liveCount} users={users} teachers={teachers} totalRevenue={totalRevenue} verifiedTeachers={verifiedTeachers} />}
                </div>

                {/* ── RECENT ACTIVITY FEED ────────────────────────────── */}
                <div className="bg-[#111]/60 border border-white/5 rounded-2xl p-5 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 flex items-center gap-2">
                            <Activity size={11} className="text-green-400" />
                            Feed en Tiempo Real
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                            <span className="text-[9px] text-green-400/60 font-mono">live</span>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {transactions.slice(0, 12).map(tx => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${tx.type === 'deposit' ? 'bg-blue-400' : tx.type === 'payment_received' ? 'bg-green-400' : 'bg-orange-400'
                                        }`} />
                                    <span className="text-xs text-white/60 truncate max-w-[240px]">{tx.description}</span>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <span className={`text-xs font-mono font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {tx.amount >= 0 ? '+' : ''}€{fmt(Math.abs(tx.amount))}
                                    </span>
                                    <span className="text-[9px] text-white/20 font-mono">{timeAgo(tx.timestamp)}</span>
                                </div>
                            </div>
                        ))}
                        {transactions.length === 0 && (
                            <p className="text-center text-[10px] text-white/15 py-6 uppercase tracking-widest">Sin actividad reciente</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
