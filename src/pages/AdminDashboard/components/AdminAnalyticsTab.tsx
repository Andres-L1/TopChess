import React, { useMemo } from 'react';
import { Transaction, Teacher } from '../../../types/index';
import { fmt } from '../utils';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AdminAnalyticsTabProps {
    weeklyRevenue: number[];
    transactions: Transaction[];
    teachers: Teacher[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#1a1917] border border-white/10 p-3 rounded-xl shadow-xl">
                <p className="text-white/60 text-xs mb-1 font-bold">{label}</p>
                <p className="text-gold font-mono font-black text-lg">€{fmt(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ weeklyRevenue, transactions, teachers }) => {

    const revenueData = useMemo(() => {
        return weeklyRevenue.map((v, i) => {
            const day = new Date(Date.now() - (6 - i) * 86400000);
            return {
                name: day.toLocaleDateString('es-ES', { weekday: 'short' }),
                revenue: v
            };
        });
    }, [weeklyRevenue]);

    const txData = useMemo(() => {
        const deposits = transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + Math.abs(t.amount), 0);
        const sent = transactions.filter(t => t.type === 'payment_sent').reduce((s, t) => s + Math.abs(t.amount), 0);
        const received = transactions.filter(t => t.type === 'payment_received').reduce((s, t) => s + Math.abs(t.amount), 0);

        return [
            { name: 'Depósitos', value: deposits, color: '#3b82f6' },
            { name: 'Pagos Enviados', value: sent, color: '#f97316' },
            { name: 'Pagos Recibidos', value: received, color: '#4ade80' }
        ];
    }, [transactions]);

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            {/* Revenue Chart */}
            <div className="glass-panel p-6 rounded-3xl border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-6">Evolución de Ingresos (7 días)</p>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `€${value}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff20', strokeWidth: 1, strokeDasharray: '3 3' }} />
                            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Breakdown */}
                <div className="glass-panel p-6 rounded-3xl border-white/5 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 w-full mb-2">Distribución de Flujos</p>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                            <PieChart>
                                <Pie
                                    data={txData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {txData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number) => [`€${fmt(value)}`, 'Monto']}
                                    contentStyle={{ backgroundColor: '#1a1917', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Teachers */}
                <div className="glass-panel p-6 rounded-3xl border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-6">Top Mentores (Ingresos Brutos)</p>
                    <div className="space-y-4">
                        {[...teachers].sort((a, b) => (b.earnings ?? 0) - (a.earnings ?? 0)).slice(0, 5).map((t, i) => {
                            const maxE = Math.max(...teachers.map(x => x.earnings ?? 0)) || 1;
                            return (
                                <div key={t.id} className="flex items-center gap-4 group">
                                    <div className={`w-6 text-center font-black ${i === 0 ? 'text-gold' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/20'}`}>
                                        #{i + 1}
                                    </div>
                                    <img src={t.image?.startsWith('http') ? t.image : `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.id}`} className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-gold/50 transition-colors" alt="" />
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-bold text-white tracking-wide">{t.name}</span>
                                            <span className="text-sm font-mono font-black text-green-400 drop-shadow-sm">€{fmt(t.earnings ?? 0)}</span>
                                        </div>
                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-green-500/50 to-green-400 rounded-full transition-all duration-1000"
                                                style={{ width: `${((t.earnings ?? 0) / maxE) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsTab;
