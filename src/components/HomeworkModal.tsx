import React, { useState } from 'react';
import { X, BookOpen, Clock, AlignLeft, Users } from 'lucide-react';
import { AppUser, Homework } from '../types';

interface HomeworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (homework: Omit<Homework, 'id' | 'teacherId' | 'status' | 'assignedAt'>) => Promise<void>;
    students: AppUser[];
}

const HomeworkModal: React.FC<HomeworkModalProps> = ({ isOpen, onClose, onSave, students }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [studentId, setStudentId] = useState('');
    const [type, setType] = useState<Homework['type']>('lichess_study');
    const [referenceData, setReferenceData] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const selectedStudent = students.find(s => s.id === studentId);
            await onSave({
                studentId,
                studentName: selectedStudent?.name || 'Estudiante',
                title,
                description,
                type,
                referenceData
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-panel border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <BookOpen className="text-gold" size={24} />
                        Asignar Tarea
                    </h2>
                    <p className="text-sm text-text-muted mt-1">Crea un ejercicio para tus alumnos</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Student Selector */}
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-text-muted hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                            <Users size={14} /> Alumno
                        </label>
                        <select
                            required
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="input-premium appearance-none"
                        >
                            <option value="">Selecciona un alumno...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-text-muted hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                            <AlignLeft size={14} /> Título
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Finales de Torres"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="input-premium"
                        />
                    </div>

                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-text-muted hover:text-white transition-colors uppercase tracking-widest">Tipo</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="input-premium appearance-none text-sm"
                            >
                                <option value="lichess_study">Estudio Lichess</option>
                                <option value="custom_fen">Posición (FEN)</option>
                                <option value="puzzle">Puzzle ID</option>
                            </select>
                        </div>
                        <div className="space-y-2 group">
                            <label className="text-[10px] font-black text-text-muted hover:text-white transition-colors uppercase tracking-widest">
                                {type === 'lichess_study' ? 'URL estudio' : type === 'custom_fen' ? 'FEN String' : 'Puzzle ID'}
                            </label>
                            <input
                                type="text"
                                required
                                placeholder={type === 'lichess_study' ? 'https://lichess.org/study/...' : '...'}
                                value={referenceData}
                                onChange={(e) => setReferenceData(e.target.value)}
                                className="input-premium font-mono text-[11px]"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black text-text-muted hover:text-white transition-colors uppercase tracking-widest">Instrucciones</label>
                        <textarea
                            rows={3}
                            placeholder="Explica qué debe hacer el alumno..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-premium resize-none text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 mt-4"
                    >
                        {loading ? 'Asignando...' : 'Asignar Tarea'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default HomeworkModal;
