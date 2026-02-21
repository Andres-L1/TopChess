import React from 'react';
import { Homework, AppUser } from '../../../types';
import HomeworkModal from '../../../components/HomeworkModal';

interface TeacherHomeworkTabProps {
    homeworks: Homework[];
    myStudents: AppUser[];
    isHomeworkModalOpen: boolean;
    setIsHomeworkModalOpen: (open: boolean) => void;
    handleCreateHomework: (data: Omit<Homework, 'id' | 'teacherId' | 'status' | 'assignedAt'>) => Promise<void>;
}

const TeacherHomeworkTab: React.FC<TeacherHomeworkTabProps> = ({
    homeworks,
    myStudents,
    isHomeworkModalOpen,
    setIsHomeworkModalOpen,
    handleCreateHomework
}) => {
    return (
        <div className="space-y-6 animate-enter">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Tareas Asignadas</h2>
                <button
                    onClick={() => setIsHomeworkModalOpen(true)}
                    className="bg-gold hover:bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-gold/10"
                >
                    + Nueva Tarea
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {homeworks.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                        <p className="text-text-muted">No has asignado tareas aún.</p>
                    </div>
                ) : (
                    homeworks.map(hw => (
                        <div key={hw.id} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-gold/20 transition-all group relative overflow-hidden">
                            <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 ${hw.status === 'completed' ? 'bg-green-500/20' : 'bg-gold/10'}`}></div>

                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${hw.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                    {hw.status === 'completed' ? 'Completada' : 'Pendiente'}
                                </span>
                                <span className="text-[10px] text-text-muted font-mono">
                                    {new Date(hw.assignedAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="font-bold text-white mb-1 truncate" title={hw.title}>{hw.title}</h3>
                            <p className="text-xs text-text-muted mb-4 line-clamp-2">{hw.description || "Sin descripción"}</p>

                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5 text-xs">
                                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]">
                                    {(hw.studentName || 'U').substring(0, 1)}
                                </div>
                                <span className="text-white/80 font-bold">{hw.studentName}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <HomeworkModal
                isOpen={isHomeworkModalOpen}
                onClose={() => setIsHomeworkModalOpen(false)}
                onSave={handleCreateHomework}
                students={myStudents}
            />
        </div>
    );
};

export default React.memo(TeacherHomeworkTab);
