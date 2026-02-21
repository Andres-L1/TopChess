import React from 'react';
import { AppUser } from '../../../types/index';
import { Ban, Lock, Unlock, Loader2 } from 'lucide-react';
import { fmt, EmptyState } from '../utils';

interface AdminUsersTabProps {
    filteredUsers: AppUser[];
    handleBan: (userId: string, isBanned: boolean) => void;
    processingIds: Set<string>;
}

const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ filteredUsers, handleBan, processingIds }) => {
    return (
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
    );
};

export default AdminUsersTab;
