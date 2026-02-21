import React from 'react';
import { DollarSign, Users, Clock, Trophy, Bell, X, Video, LogOut, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import Skeleton from '../../../components/Skeleton';
import { Teacher, Request, Booking, AppUser } from '../../../types';
import { firebaseService } from '../../../services/firebaseService';
import toast from 'react-hot-toast';

interface TeacherOverviewTabProps {
    isLoading: boolean;
    stats: { earnings: number; students: number; hours: number };
    levelInfo: { name: string; currentComm: number; nextComm: number; target: number; next: string };
    currency: string;
    progressPercent: number;
    teacherProfile: Teacher | null;
    requests: Request[];
    handleAcceptRequest: (id: string) => Promise<void>;
    handleRejectRequest: (id: string) => Promise<void>;
    nextBooking: Booking | null;
    currentUserId: string;
    myStudents: AppUser[];
    handleLichessConnect: () => Promise<void>;
    handleLichessDisconnect: () => Promise<void>;
}

const TeacherOverviewTab: React.FC<TeacherOverviewTabProps> = ({
    isLoading,
    stats,
    levelInfo,
    currency,
    progressPercent,
    teacherProfile,
    requests,
    handleAcceptRequest,
    handleRejectRequest,
    nextBooking,
    currentUserId,
    myStudents,
    handleLichessConnect,
    handleLichessDisconnect
}) => {
    const { t } = useTranslation();

    return (
        <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {isLoading ? (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col justify-between">
                                <Skeleton width="40%" height={20} />
                                <Skeleton width="80%" height={40} />
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-3 rounded-xl bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
                                    <DollarSign size={24} />
                                </div>
                                <span className="text-xs font-mono text-green-400/80">Ganancia: {(levelInfo.currentComm * 100).toFixed(0)}%</span>
                            </div>
                            <div className="mt-4 relative z-10">
                                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.earnings.toFixed(2)}{currency}</span>
                                <p className="text-xs md:text-sm text-text-muted">{t('dashboard.total_earnings')}</p>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[{ v: 0 }, { v: 10 }, { v: 5 }, { v: 20 }, { v: 15 }, { v: 30 }, { v: stats.earnings > 30 ? stats.earnings : 40 }]}>
                                        <Area type="monotone" dataKey="v" stroke="#4ade80" fill="#4ade80" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                                    <Users size={24} />
                                </div>
                            </div>
                            <div className="mt-4 relative z-10">
                                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.students}</span>
                                <p className="text-xs md:text-sm text-text-muted">{t('dashboard.active_students')}</p>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[{ v: 1 }, { v: 2 }, { v: 2 }, { v: 3 }, { v: stats.students > 3 ? stats.students : 4 }]}>
                                        <Area type="stepAfter" dataKey="v" stroke="#3b82f6" fill="#3b82f6" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col justify-between group hover:border-gold/30 transition-all relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                            </div>
                            <div className="mt-4 relative z-10">
                                <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">{stats.hours}h</span>
                                <p className="text-xs md:text-sm text-text-muted">{t('dashboard.classes_given')}</p>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={[{ v: 0 }, { v: 5 }, { v: 8 }, { v: 15 }, { v: stats.hours }]}>
                                        <Area type="monotone" dataKey="v" stroke="#a855f7" fill="#a855f7" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Gamification Card */}
                        <div className="glass-panel p-4 md:p-6 rounded-2xl bg-gradient-to-br from-dark-panel to-gold/5 border-gold/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy size={20} className="text-gold" />
                                    <span className="text-gold font-bold text-sm uppercase tracking-wider">Nivel {levelInfo.name}</span>
                                    {teacherProfile?.title && (
                                        <span className="ml-auto px-1.5 py-0.5 bg-gold text-black text-[8px] rounded font-black tracking-widest">{teacherProfile.title}</span>
                                    )}
                                </div>
                                <div className="w-full bg-black/40 h-2 rounded-full mb-2 overflow-hidden relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-gold to-orange-500 shadow-[0_0_10px_rgba(255,215,0,0.5)] transition-all duration-1000"
                                        style={{ width: `${progressPercent}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-text-muted flex justify-between">
                                    <span>{teacherProfile?.classesGiven || 0} / {levelInfo.target} Clases</span>
                                    <span className="text-gold">Siguiente: {levelInfo.next}</span>
                                </p>
                                <div className="mt-3 pt-3 border-t border-white/5 text-[10px] space-y-1">
                                    <p className="flex justify-between text-white/80"><span>Tu Comisión Actual:</span> <span className="text-green-400 font-mono font-bold">{(levelInfo.currentComm * 100).toFixed(0)}%</span></p>
                                    <p className="flex justify-between text-white/50"><span>Siguiente Nivel:</span> <span className="text-gold font-mono">{(levelInfo.nextComm * 100).toFixed(0)}%</span></p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="flex gap-6 flex-col lg:flex-row h-full">
                {/* Requests Feed */}
                <div className="flex-1 glass-panel rounded-2xl p-4 md:p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg md:text-xl font-bold text-white">{t('dashboard.pending_requests')}</h2>
                        {!isLoading && requests.length > 0 && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold animate-pulse">{requests.length} nuevas</span>}
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3">
                                        <Skeleton width="100%" height={60} />
                                    </div>
                                ))}
                            </>
                        ) : (
                            requests.length === 0 ? (
                                <div className="text-center py-10 text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                                    <Bell size={40} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium">Bandeja de entrada vacía</p>
                                </div>
                            ) : (
                                requests.map(req => (
                                    <div key={req.id} className="p-4 rounded-2xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 hover:border-gold/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4 relative overflow-hidden">
                                        <div className="absolute inset-y-0 left-0 w-1 bg-gold scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center font-bold text-gold border border-gold/20 shadow-lg">
                                                {(req.studentName || 'U').substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{req.studentName || 'Interesado'}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></div>
                                                    <span className="text-[10px] text-gold/60 font-black uppercase tracking-widest">Nueva Solicitud</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                onClick={() => handleAcceptRequest(req.id)}
                                                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gold text-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-gold/10"
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                onClick={() => handleRejectRequest(req.id)}
                                                aria-label="Rechazar solicitud"
                                                className="p-2 rounded-xl bg-white/5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition-all border border-white/10"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>

                {/* Quick Classroom Link */}
                <div className="w-full lg:w-80 flex flex-col gap-6">
                    <div className="glass-panel rounded-2xl p-4 md:p-6 flex flex-col gap-4">
                        <h2 className="text-lg md:text-xl font-bold text-white mb-2">{t('dashboard.quick_access')}</h2>
                        <Link to={`/classroom/${currentUserId}`} className="group relative overflow-hidden rounded-xl aspect-video bg-black flex items-center justify-center border border-white/10 hover:border-gold/50 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-br from-dark-panel to-gold/20 opacity-40 group-hover:scale-105 transition-transform duration-700"></div>
                            <div className="relative z-10 flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-gold/90 text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3)] group-hover:scale-110 transition-transform">
                                    <Video size={24} />
                                </div>
                                <span className="font-bold text-white tracking-wide">{t('dashboard.enter_classroom')}</span>
                            </div>
                        </Link>
                        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                            <h4 className="font-bold text-sm text-gold">{t('dashboard.next_class')}</h4>
                            {nextBooking ? (
                                <>
                                    <p className="text-xs text-white">Clase el {nextBooking.date}</p>
                                    <p className="text-[10px] text-text-muted">Hora: {nextBooking.time}</p>
                                    <div className="h-1 w-full bg-black/50 rounded-full overflow-hidden mt-1">
                                        <div className="h-full bg-green-500 w-full animate-pulse-slow"></div>
                                    </div>
                                </>
                            ) : (
                                <p className="text-xs text-text-muted italic">No tienes clases próximas agendadas.</p>
                            )}
                        </div>
                    </div>

                    {/* Lichess Integration */}
                    <div className="glass-panel rounded-2xl p-4 md:p-6 flex flex-col gap-4 bg-gradient-to-br from-[#1b1a17] to-white/[0.05]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <svg viewBox="0 0 448 512" className="w-5 h-5 fill-white opacity-80" xmlns="http://www.w3.org/2000/svg"><path d="M0 432L448 432 448 480 0 480 0 432zM334.8 191.1C355.7 154.5 354 116.3 328.7 87.7 296 50.8 238.2 46.2 199.1 77.5 167.3 103 154.7 146.4 167 182.8 123.6 211.5 96 261.2 96 317.9L96 384l256 0 0-66.2C352 268 332.1 224 334.8 191.1zM224 0C241.7 0 256 14.3 256 32 256 49.7 241.7 64 224 64 206.3 64 192 49.7 192 32 192 14.3 206.3 0 224 0z" /></svg>
                            </div>
                            <h2 className="text-lg font-bold text-white">Lichess Sync</h2>
                            {teacherProfile?.lichessAccessToken && (
                                <div className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                            )}
                        </div>
                        <p className="text-[10px] text-white/50 leading-relaxed">
                            {teacherProfile?.lichessAccessToken
                                ? `Conectado como ${teacherProfile.lichessUsername}. Tus estudios privados ahora son visibles en el aula.`
                                : 'Conecta tu cuenta para importar estudios privados y públicos directamente en el Aula.'}
                        </p>

                        <div className="pt-2">
                            {!teacherProfile?.lichessAccessToken ? (
                                <button
                                    onClick={handleLichessConnect}
                                    className="btn-primary w-full py-3 text-[10px]"
                                >
                                    Conectar con Lichess
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <div className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                                            {teacherProfile.lichessUsername?.substring(0, 1).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-white/90 font-bold">{teacherProfile.lichessUsername}</span>
                                    </div>
                                    <button
                                        onClick={handleLichessDisconnect}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 transition-all"
                                        title="Desconectar"
                                    >
                                        <LogOut size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Students Section */}
                <div className="flex-1 glass-panel rounded-2xl p-4 md:p-6 min-h-[400px]">
                    <h2 className="text-lg md:text-xl font-bold text-white mb-6">Mis Alumnos</h2>
                    <div className="space-y-4">
                        {isLoading ? (
                            [1, 2].map((i) => <Skeleton key={i} width="100%" height={80} />)
                        ) : (
                            myStudents.length === 0 ? (
                                <div className="text-center py-10 text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                                    <Users size={40} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium">Sin alumnos activos</p>
                                </div>
                            ) : (
                                myStudents.map(student => (
                                    <div key={student.id} className="p-5 rounded-2xl bg-[#1b1a17] border border-white/5 hover:border-gold/20 transition-all flex flex-col gap-4 shadow-xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center font-bold text-gold border border-gold/10">
                                                    {(student.name || 'U').substring(0, 1).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm">{student.name || 'Usuario'}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full">ESTUDIANTE</span>
                                                        <div className="w-1 h-1 rounded-full bg-green-500"></div>
                                                        <span className="text-[9px] text-green-500/60 font-black uppercase tracking-widest">En línea</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-mono text-white/40 italic">Última clase: Ayer</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <Link to={`/chat/${student.id}`} className="bg-white/5 hover:bg-white/10 text-white/80 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group">
                                                <MessageCircle size={14} className="group-hover:text-gold transition-colors" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Mensaje</span>
                                            </Link>
                                            <Link to={`/classroom/${currentUserId}`} className="bg-gold hover:bg-white text-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 group font-black shadow-lg shadow-gold/5">
                                                <Video size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Aula en vivo</span>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default React.memo(TeacherOverviewTab);
