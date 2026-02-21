import React from 'react';
import { AppUser, Teacher } from '../../../types/index';
import { fmt } from '../utils';

interface AdminSystemTabProps {
    liveCount: number;
    users: AppUser[];
    teachers: Teacher[];
    totalRevenue: number;
    verifiedTeachers: number;
}

const AdminSystemTab: React.FC<AdminSystemTabProps> = ({ liveCount, users, teachers, totalRevenue, verifiedTeachers }) => {
    return (
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
    );
};

export default AdminSystemTab;
