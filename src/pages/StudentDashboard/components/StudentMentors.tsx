import React from 'react';
import { Trophy, Video, Calendar as CalendarIcon, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Teacher } from '../../../types';
import Skeleton from '../../../components/Skeleton';

interface StudentMentorsProps {
    isLoading: boolean;
    myTeachers: Teacher[];
    openBookingModal: (teacher: Teacher) => void;
    handleOpenPaymentModal: (teacher: Teacher) => void;
}

export const StudentMentors: React.FC<StudentMentorsProps> = ({ isLoading, myTeachers, openBookingModal, handleOpenPaymentModal }) => {
    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gold/10">
                        <Trophy className="text-gold" size={20} />
                    </div>
                    Mis Mentores
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {isLoading ? (
                    [1, 2].map((i) => <Skeleton key={i} width="100%" height={150} />)
                ) : (
                    <>
                        {myTeachers.length === 0 ? (
                            <div className="col-span-1 md:col-span-2 p-12 rounded-3xl border-2 border-dashed border-white/5 bg-white/[0.01] text-center">
                                <p className="text-text-muted mb-4 text-sm italic">No tienes mentores activos todavía.</p>
                                <Link to="/" className="btn-secondary py-3 px-8 text-xs">Explorar catálogo</Link>
                            </div>
                        ) : (
                            myTeachers.map(teacher => (
                                <div key={teacher.id} className="glass-panel p-6 rounded-2xl bg-[#1b1a17] border border-white/5 group hover:border-gold/30 transition-all duration-500">
                                    <div className="flex items-center gap-5 mb-6">
                                        <img
                                            src={teacher.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random`}
                                            alt={teacher.name}
                                            className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random`;
                                            }}
                                        />
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-white text-lg truncate group-hover:text-gold transition-colors">{teacher.name}</h3>
                                            <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mt-0.5">{teacher.elo} ELO • Mentor</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="col-span-2 flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg border border-white/5 mb-2">
                                            <span className="text-xs text-text-muted font-bold">Clases Disponibles:</span>
                                            <span className="text-lg font-black text-gold">{teacher.classCredits || 0}</span>
                                        </div>
                                        {teacher.classCredits > 0 ? (
                                            <>
                                                <Link to={`/classroom/${teacher.id}`} className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all border border-white/5">
                                                    <Video size={14} className="text-gold" /> Aula
                                                </Link>
                                                <button
                                                    onClick={() => openBookingModal(teacher)}
                                                    className="flex items-center justify-center gap-2 bg-gold hover:bg-white text-black text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-gold/5"
                                                >
                                                    <CalendarIcon size={14} /> Agendar
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleOpenPaymentModal(teacher)}
                                                className="col-span-2 flex items-center justify-center gap-2 bg-gold hover:bg-white text-black text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-gold/5"
                                            >
                                                <DollarSign size={14} /> Pagar Mensualidad
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </section>
    );
};
