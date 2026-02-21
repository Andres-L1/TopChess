import React from 'react';
import { Trophy, Users, MapIcon, Settings, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Teacher, Club } from '../../../types';

interface TeacherClubTabProps {
    club: Club | null;
    teacherProfile: Teacher | null;
    clubTeachers: Teacher[];
    handleCreateClub: (e: React.FormEvent) => Promise<void>;
    isCreatingClub: boolean;
    inviteEmail: string;
    setInviteEmail: (email: string) => void;
    handleInviteTeacher: (e: React.FormEvent) => Promise<void>;
    isInviting: boolean;
}

const TeacherClubTab: React.FC<TeacherClubTabProps> = ({
    club,
    teacherProfile,
    clubTeachers,
    handleCreateClub,
    isCreatingClub,
    inviteEmail,
    setInviteEmail,
    handleInviteTeacher,
    isInviting
}) => {
    if (!club && teacherProfile?.role !== 'club_director') {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center animate-enter">
                <div className="bg-gradient-to-br from-gold/20 to-transparent p-8 rounded-3xl border border-gold/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <MapIcon size={48} className="text-gold mx-auto mb-6 group-hover:scale-110 transition-transform" />
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Escala tu Academia</h2>
                    <p className="text-white/60 mb-8 leading-relaxed">
                        Crea tu propio club para gestionar múltiples profesores, ver sus clases en tiempo real en la <span className="text-gold font-bold">Oficina Virtual</span> y centralizar tus operaciones.
                    </p>
                    <button
                        onClick={handleCreateClub}
                        disabled={isCreatingClub}
                        className="btn-primary px-8 py-4"
                    >
                        {isCreatingClub ? 'Creando...' : 'Crear mi Club'}
                    </button>
                </div>
            </div>
        );
    }

    if (!club) return <div className="text-center py-20 text-white/40">Cargando datos del club...</div>;

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1b1a17] p-6 rounded-2xl border border-white/5 shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                        <Trophy className="text-gold" size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{club.name}</h2>
                        <p className="text-sm text-gold/60 font-bold uppercase tracking-widest">Director del Club</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <Link to="/office" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl border border-white/10 transition-all font-bold text-sm">
                        <MapIcon size={18} />
                        Oficina Virtual
                    </Link>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1b1a17] text-white/40 p-3 rounded-xl border border-white/5 hover:text-white transition-all">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Users size={20} className="text-gold" />
                                Profesores del Club
                            </h3>
                            <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-mono text-white/40">{clubTeachers.length}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {clubTeachers.map((t: Teacher) => (
                                <div key={t.id} className="p-4 rounded-xl bg-black/40 border border-white/5 hover:border-gold/20 transition-all flex items-center gap-4">
                                    <img
                                        src={t.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=333&color=fff`}
                                        className="w-10 h-10 rounded-lg object-cover"
                                        alt={t.name}
                                    />
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-bold text-sm text-white truncate">{t.name}</h4>
                                        <p className="text-[10px] text-text-muted uppercase tracking-widest">{t.title || 'Instructor'}</p>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${t.onlineStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : t.onlineStatus === 'in_class' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-gold" />
                            Invitar Profesor
                        </h3>
                        <p className="text-xs text-text-muted mb-6">Añade nuevos instructores a tu club ingresando su correo electrónico registrado en TopChess.</p>
                        <form onSubmit={handleInviteTeacher} className="space-y-4">
                            <input
                                type="email"
                                required
                                placeholder="correo@ejemplo.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                className="input-premium text-sm"
                            />
                            <button
                                type="submit"
                                disabled={isInviting || !inviteEmail}
                                className="btn-primary w-full py-3"
                            >
                                {isInviting ? 'Invitando...' : 'Añadir al Club'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(TeacherClubTab);
