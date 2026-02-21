import React, { useState } from 'react';
import { Teacher } from '../../../types/index';
import { CheckCircle, Loader2, Check, X, Edit2 } from 'lucide-react';
import { fmt, EmptyState } from '../utils';

/* ─── Inline CommissionCell (Moved from AdminDashboard) ────────── */
const CommissionCell = ({ teacher, onSave }: { teacher: Teacher, onSave: (id: string, rate: number) => void }) => {
    const defaultRate = teacher.commissionRate ?? 0.6;
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(Math.round(defaultRate * 100).toString());

    const handleSave = () => {
        let parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 0 || parsed > 100) parsed = 60;
        onSave(teacher.id, parsed / 100);
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    type="number" min="0" max="100" autoFocus
                    className="w-12 bg-black border border-white/20 rounded px-1 text-center font-mono text-xs text-white"
                    value={val} onChange={(e) => setVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
                />
                <span className="text-[10px] text-white/50">%</span>
                <button onClick={handleSave} className="p-1 hover:text-green-400 text-white/30 transition-colors"><Check size={12} /></button>
                <button onClick={() => setEditing(false)} className="p-1 hover:text-red-400 text-white/30 transition-colors"><X size={12} /></button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={() => setEditing(true)}>
            <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 font-mono text-xs text-white">
                {Math.round(defaultRate * 100)}%
            </div>
            <Edit2 size={10} className="text-white/20 opacity-0 group-hover/edit:opacity-100 transition-opacity hover:text-gold" />
        </div>
    );
};

interface AdminTeachersTabProps {
    filteredTeachers: Teacher[];
    handleVerify: (teacherId: string, isVerified: boolean) => void;
    handleCommission: (teacherId: string, rate: number) => void;
    processingIds: Set<string>;
}

const AdminTeachersTab: React.FC<AdminTeachersTabProps> = ({ filteredTeachers, handleVerify, handleCommission, processingIds }) => {
    return (
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
    );
};

export default AdminTeachersTab;
