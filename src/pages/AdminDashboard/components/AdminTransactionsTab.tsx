import React from 'react';
import { Transaction } from '../../../types/index';
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { fmt, timeAgo, EmptyState } from '../utils';

interface AdminTransactionsTabProps {
    filteredTx: Transaction[];
}

const AdminTransactionsTab: React.FC<AdminTransactionsTabProps> = ({ filteredTx }) => {
    return (
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
    );
};

export default AdminTransactionsTab;
