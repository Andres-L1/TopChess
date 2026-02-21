import React from 'react';
import { Target, BookOpen, Clock, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Booking, Homework, Teacher } from '../../../types';

interface StudentSidebarProps {
    nextClass: Booking | null;
    myHomeworks: Homework[];
    pendingRequests: Teacher[];
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ nextClass, myHomeworks, pendingRequests }) => {
    return (
        <div className="space-y-6">
            {/* Next Class */}
            <div className="glass-panel p-6 rounded-3xl bg-gradient-to-br from-[#1b1a17] to-green-900/10 border-green-500/20 relative overflow-hidden">
                <h3 className="font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                        <Target className="text-green-400" size={18} />
                    </div>
                    Próxima Clase
                </h3>
                {nextClass ? (
                    <div className="text-center py-4">
                        <p className="text-4xl font-bold text-white mb-1 tracking-tighter">{nextClass.time}</p>
                        <p className="text-xs text-green-400 font-mono mb-8 uppercase tracking-widest">{nextClass.date}</p>
                        <Link to={nextClass.meetingLink} className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all block text-center">
                            Entrar al Aula
                        </Link>
                    </div>
                ) : (
                    <div className="text-center py-10 opacity-20 italic text-sm">No hay clases próximas</div>
                )}
            </div>

            {/* Homework Section */}
            <div className="glass-panel p-6 rounded-3xl border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all"></div>
                <h3 className="font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <BookOpen className="text-blue-400" size={18} />
                    </div>
                    Mis Tareas
                </h3>
                <div className="space-y-3 relative z-10">
                    {myHomeworks.length === 0 ? (
                        <p className="text-xs text-text-muted italic opacity-50 text-center py-4">No tienes tareas asignadas</p>
                    ) : (
                        myHomeworks.map(hw => (
                            <a
                                key={hw.id}
                                href={hw.type === 'lichess_study' ? hw.referenceData : '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 hover:border-blue-400/30 transition-all group/item"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${hw.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        {hw.status === 'completed' ? 'Completado' : 'Pendiente'}
                                    </span>
                                    {hw.type === 'lichess_study' && <ExternalLink size={12} className="text-text-muted group-hover/item:text-white" />}
                                </div>
                                <h4 className="font-bold text-white text-sm mb-1 truncate">{hw.title}</h4>
                                <p className="text-xs text-text-muted line-clamp-1">{hw.description || "Sin descripción"}</p>
                            </a>
                        ))
                    )}
                </div>
            </div>

            {/* Pending */}
            <div className="glass-panel p-6 rounded-3xl border-white/5">
                <h3 className="font-bold text-white mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                        <Clock className="text-blue-400" size={18} />
                    </div>
                    Solicitudes
                </h3>
                <div className="space-y-4">
                    {pendingRequests.length === 0 ? (
                        <p className="text-xs text-text-muted italic opacity-50 text-center py-4">Sin solicitudes pendientes</p>
                    ) : (
                        pendingRequests.map(req => (
                            <div key={req.id} className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xs font-bold text-white/20 border border-white/10 uppercase">
                                    {req.name.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm text-white font-bold truncate">{req.name}</p>
                                    <p className="text-[10px] text-blue-400/80 font-black uppercase tracking-widest">Enviada</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
