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

/* ─── helpers ────────────────────────────────────────────────────────────── */
const fmt = (n: number) => n.toFixed(2);
const timeAgo = (ts: number) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
};

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

const CommissionCell: React.FC<{ teacher: Teacher; onSave: (id: string, rate: number) => Promise<void> }> = ({ teacher, onSave }) => {
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [val, setVal] = useState(String(Math.round((teacher.commissionRate ?? 0.5) * 100)));

    const handleSave = async () => {
        setLoading(true);
        await onSave(teacher.id, Number(val) / 100);
        setLoading(false);
        setEditing(false);
    };

    return editing ? (
        <div className="flex items-center gap-1.5">
            <input
                autoFocus
                type="number" min="10" max="95"
                value={val}
                onChange={e => setVal(e.target.value)}
                className="w-16 bg-black/60 border border-gold/40 rounded-lg px-2 py-1 text-xs text-gold font-mono text-center outline-none"
                disabled={loading}
            />
            <span className="text-[10px] text-white/30">%</span>
            {loading ? (
                <Loader2 size={13} className="text-gold animate-spin" />
            ) : (
                <>
                    <button onClick={handleSave} className="text-green-400 hover:text-green-300 transition-colors"><Check size={13} /></button>
                    <button onClick={() => setEditing(false)} className="text-red-400 hover:text-red-300 transition-colors"><X size={13} /></button>
                </>
            )}
        </div>
    ) : (
        <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 group/edit px-2 py-1 rounded-lg hover:bg-white/5 transition-colors">
            <span className="text-xs font-black text-gold font-mono">{Math.round((teacher.commissionRate ?? 0.5) * 100)}%</span>
            <Edit2 size={10} className="text-white/20 group-hover/edit:text-gold transition-colors" />
        </button>
    );
};

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
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:border-gold/40 outline-none placeholder:text-white/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* ── Tab: USERS ─────────────────────────────────────── */}
                    {activeTab === 'users' && (
                        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        {['Identidad', 'Rol', 'Saldo', 'Registrado', 'Estado', ''].map(h => (
                                            <th key={h} className={`p-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/25 ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <img
                                                            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1b1a17&color=D4AF37&bold=true`}
                                                            className="w-9 h-9 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-gold/20 transition-all"
                                                            alt="" onError={e => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user.name?.charAt(0)}&background=1b1a17&color=D4AF37`; }}
                                                        />
                                                        {user.status === 'banned' && (
                                                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-[#111]"><Ban size={7} className="text-white" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                                                        <p className="text-[10px] text-white/25 font-mono">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${user.role === 'teacher'
                                                    ? 'bg-gold/10 text-gold border-gold/20'
                                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                    }`}>{user.role}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-sm font-bold text-white">€{fmt(user.walletBalance ?? 0)}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[10px] text-white/30 font-mono">
                                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') : '—'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${user.status === 'banned'
                                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    }`}>
                                                    {user.status === 'banned' ? 'Restringido' : 'Activo'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleBan(user.id, user.status === 'banned')}
                                                    disabled={processingIds.has(user.id)}
                                                    className={`p-2 rounded-xl border transition-all flex items-center justify-center ml-auto ${user.status === 'banned'
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                        } ${processingIds.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    title={user.status === 'banned' ? 'Restaurar acceso' : 'Restringir usuario'}
                                                >
                                                    {processingIds.has(user.id) ? <Loader2 size={14} className="animate-spin" /> : (user.status === 'banned' ? <Unlock size={14} /> : <Lock size={14} />)}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && <EmptyState label="No hay usuarios" />}
                        </div>
                    )}

                    {/* ── Tab: TEACHERS ──────────────────────────────────── */}
                    {activeTab === 'teachers' && (
                        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        {['Mentor', 'Región', 'Tarifa/h', 'Comisión', 'Clases', 'Ingresos', ''].map(h => (
                                            <th key={h} className={`p-4 text-[9px] font-black uppercase tracking-[0.2em] text-white/25 ${h === '' ? 'text-right' : 'text-left'}`}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {filteredTeachers.map(teacher => (
                                        <tr key={teacher.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative shrink-0">
                                                        <img src={teacher.image} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10 group-hover:ring-gold/20 transition-all grayscale group-hover:grayscale-0" alt="" />
                                                        {teacher.isVerified && (
                                                            <div className="absolute -bottom-1 -right-1 bg-gold rounded-full p-0.5 border border-[#111] shadow-[0_0_6px_rgba(212,175,55,0.4)]">
                                                                <CheckCircle size={8} className="text-black" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white leading-tight group-hover:text-gold transition-colors">{teacher.name}</p>
                                                        <p className="text-[9px] text-white/25 uppercase tracking-wider">{teacher.teachingStyle}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-[9px] text-white/40 border border-white/10 bg-white/[0.02] px-2 py-1 rounded-lg font-mono">{teacher.region}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-sm font-bold text-white">€{teacher.price}</span>
                                            </td>
                                            <td className="p-4">
                                                <CommissionCell teacher={teacher} onSave={handleCommission} />
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-sm text-white/60">{teacher.classesGiven ?? 0}</span>
                                            </td>
                                            <td className="p-4">
                                                <span className="font-mono text-sm font-bold text-green-400">€{fmt(teacher.earnings ?? 0)}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleVerify(teacher.id, teacher.isVerified ?? false)}
                                                    disabled={processingIds.has(teacher.id)}
                                                    className={`px-3 flex items-center justify-center gap-2 ml-auto py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${teacher.isVerified
                                                        ? 'bg-gold text-black border-gold shadow-gold/20'
                                                        : 'bg-white/5 text-white/30 border-white/10 hover:border-gold/40 hover:text-gold'
                                                        } ${processingIds.has(teacher.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {processingIds.has(teacher.id) ? <Loader2 size={12} className="animate-spin" /> : (teacher.isVerified ? '✓ Verificado' : 'Verificar')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTeachers.length === 0 && <EmptyState label="No hay mentores" />}
                        </div>
                    )}

                    {/* ── Tab: TRANSACTIONS ──────────────────────────────── */}
                    {activeTab === 'transactions' && (
                        <div className="overflow-x-auto overflow-y-hidden custom-scrollbar">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="bg-white/[0.02] border-b border-white/5">
                                        {['Tipo', 'Descripción', 'Cuantía', 'Tiempo', 'Ruta'].map(h => (
                                            <th key={h} className="p-4 text-left text-[9px] font-black uppercase tracking-[0.2em] text-white/25">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.04]">
                                    {filteredTx.map(tx => (
                                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${tx.type === 'deposit'
                                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                    : tx.type === 'payment_received'
                                                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                                        : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                                    }`}>
                                                    {tx.type === 'deposit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-bold text-white truncate max-w-[200px]">{tx.description}</p>
                                                <p className="text-[9px] text-white/25 font-mono">{tx.id}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`font-mono text-sm font-black ${tx.amount > 0
                                                    ? tx.description.toLowerCase().includes('comisión') ? 'text-gold' : 'text-green-400'
                                                    : 'text-red-400'
                                                    }`}>
                                                    {tx.amount > 0 ? '+' : ''}€{fmt(Math.abs(tx.amount))}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div>
                                                    <p className="text-[10px] text-white/50 font-mono">{new Date(tx.timestamp).toLocaleDateString('es-ES')}</p>
                                                    <p className="text-[9px] text-white/25 font-mono">{timeAgo(tx.timestamp)} ago</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/20">
                                                    <span className="truncate max-w-[70px] hover:text-white/50 cursor-help" title={tx.fromId}>{tx.fromId?.slice(0, 8)}…</span>
                                                    <ChevronRight size={9} />
                                                    <span className="truncate max-w-[70px] hover:text-white/50 cursor-help" title={tx.toId}>{tx.toId?.slice(0, 8)}…</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredTx.length === 0 && <EmptyState label="Sin transacciones" />}
                        </div>
                    )}

                    {/* ── Tab: ANALYTICS ─────────────────────────────────── */}
                    {activeTab === 'analytics' && (
                        <div className="p-6 space-y-6">
                            {/* Revenue bars (last 7 days) */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-4">Revenue últimos 7 días</p>
                                <div className="flex items-end gap-2 h-32">
                                    {weeklyRevenue.map((v, i) => {
                                        const max = Math.max(...weeklyRevenue) || 1;
                                        const pct = (v / max) * 100;
                                        const day = new Date(Date.now() - (6 - i) * 86400000);
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                                <span className="text-[8px] text-white/30 font-mono">€{fmt(v)}</span>
                                                <div className="w-full bg-white/5 rounded-t-lg overflow-hidden" style={{ height: '80px' }}>
                                                    <div
                                                        className="w-full bg-gradient-to-t from-gold/60 to-gold rounded-t-lg transition-all duration-500"
                                                        style={{ height: `${Math.max(pct, 4)}%`, marginTop: `${100 - Math.max(pct, 4)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[8px] text-white/20 font-mono">
                                                    {day.toLocaleDateString('es-ES', { weekday: 'short' })}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Revenue breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: 'Depósitos', type: 'deposit', color: 'text-blue-400', border: 'border-blue-500/20' },
                                    { label: 'Pagos enviados', type: 'payment_sent', color: 'text-orange-400', border: 'border-orange-500/20' },
                                    { label: 'Pagos recibidos', type: 'payment_received', color: 'text-green-400', border: 'border-green-500/20' },
                                ].map(row => {
                                    const txs = transactions.filter(t => t.type === row.type as any);
                                    const total = txs.reduce((s, t) => s + Math.abs(t.amount), 0);
                                    return (
                                        <div key={row.type} className={`bg-white/[0.02] border ${row.border} rounded-xl p-4`}>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">{row.label}</p>
                                            <p className={`text-2xl font-black font-mono ${row.color}`}>€{fmt(total)}</p>
                                            <p className="text-[9px] text-white/20 mt-1">{txs.length} operaciones</p>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Top teachers by earnings */}
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-3">Top Mentores por Ingresos</p>
                                <div className="space-y-2">
                                    {[...teachers].sort((a, b) => (b.earnings ?? 0) - (a.earnings ?? 0)).slice(0, 5).map((t, i) => {
                                        const maxE = Math.max(...teachers.map(x => x.earnings ?? 0)) || 1;
                                        return (
                                            <div key={t.id} className="flex items-center gap-3">
                                                <span className="text-[10px] text-white/20 font-mono w-4">{i + 1}</span>
                                                <img src={t.image} className="w-7 h-7 rounded-lg object-cover" alt="" />
                                                <div className="flex-grow">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-white">{t.name}</span>
                                                        <span className="text-xs font-mono text-green-400">€{fmt(t.earnings ?? 0)}</span>
                                                    </div>
                                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full transition-all duration-700"
                                                            style={{ width: `${((t.earnings ?? 0) / maxE) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Tab: SYSTEM ────────────────────────────────────── */}
                    {activeTab === 'system' && (
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                            {/* Service status */}
                            {[
                                { name: 'Firebase Auth', status: 'operational', latency: '12ms' },
                                { name: 'Firestore DB', status: 'operational', latency: '24ms' },
                                { name: 'Firebase Storage', status: 'operational', latency: '45ms' },
                                { name: 'LiveKit RTC', status: 'operational', latency: '38ms' },
                                { name: 'Lichess API', status: 'operational', latency: '120ms' },
                                { name: 'Real-time Sync', status: 'operational', latency: `${liveCount} events` },
                            ].map(svc => (
                                <div key={svc.name} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2 h-2 rounded-full ${svc.status === 'operational'
                                            ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)] animate-pulse'
                                            : 'bg-red-500'
                                            }`} />
                                        <span className="text-sm font-bold text-white">{svc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-mono text-white/30">{svc.latency}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${svc.status === 'operational'
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                            }`}>{svc.status}</span>
                                    </div>
                                </div>
                            ))}

                            {/* Platform summary */}
                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                {[
                                    { label: 'Total usuarios', value: users.length + teachers.length },
                                    { label: 'Usuarios activos', value: users.filter(u => u.status !== 'banned').length },
                                    { label: 'Mentores activos', value: verifiedTeachers },
                                    { label: 'Volumen total', value: `€${fmt(totalRevenue)}` },
                                ].map(item => (
                                    <div key={item.label} className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-center">
                                        <p className="text-[8px] text-white/25 uppercase tracking-widest font-black mb-1">{item.label}</p>
                                        <p className="text-lg font-black text-white">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

/* ─── EmptyState ─────────────────────────────────────────────────────────── */
const EmptyState: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Search size={24} className="text-white/10" />
        <p className="text-[10px] text-white/15 uppercase tracking-[0.3em] font-black">{label}</p>
    </div>
);

export default AdminDashboard;
