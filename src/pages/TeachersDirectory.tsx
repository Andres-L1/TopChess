import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Star, Medal, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';
import { Teacher } from '../types';
import PremiumButton from '../components/PremiumButton';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';
import { useAuth } from '../App';
import BookingModal from '../components/BookingModal';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
    }
};

const TeachersDirectory = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const { currentUserId } = useAuth();

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const allTeachers = await firebaseService.getTeachers();
                const verifiedTeachers = allTeachers.filter(t => t.isVerified);
                // Sort by ELO descending
                verifiedTeachers.sort((a, b) => (b.elo || 0) - (a.elo || 0));
                setTeachers(verifiedTeachers);
            } catch (error) {
                console.error("Error fetching teachers:", error);
                toast.error("No se pudieron cargar los profesores");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeachers();
    }, []);

    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.teachingStyle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleReserveClick = (teacher: Teacher) => {
        setSelectedTeacher(teacher);
        setIsBookingModalOpen(true);
    };

    return (
        <div className="min-h-screen pt-28 pb-20 px-4 bg-[#050505]">
            <div className="max-w-6xl mx-auto">
                <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                    <motion.div variants={itemVariants} className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gold text-xs font-black uppercase tracking-[4px] mb-6">
                            <ShieldCheck size={14} /> Red de Élite
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6">
                            ENCUENTRA TU <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-100 to-gold italic">MENTOR</span>
                        </h1>
                        <p className="text-lg text-[#8b8982] max-w-2xl mx-auto">
                            Explora nuestro directorio exclusivo de Grandes Maestros y Entrenadores FIDE verificados, listos para guiarte en tu camino a la maestría.
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="relative max-w-2xl mx-auto mb-16">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-white/40">
                            <Search size={24} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar maestro por nombre o especialidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-full py-6 pl-16 pr-8 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:bg-[#111] transition-all text-lg font-light"
                        />
                    </motion.div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <Skeleton key={i} width="100%" height={300} className="rounded-3xl" />
                            ))}
                        </div>
                    ) : filteredTeachers.length === 0 ? (
                        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
                            <Star size={48} className="mx-auto text-white/20 mb-4" />
                            <h3 className="text-2xl font-black text-white mb-2">Sin resultados</h3>
                            <p className="text-[#8b8982]">No hemos encontrado maestros que coincidan con tu búsqueda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTeachers.map(teacher => (
                                <motion.div key={teacher.id} variants={itemVariants} className="glass-panel p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-gold/30 transition-all duration-300 group flex flex-col h-full">
                                    <div className="flex gap-4 items-start mb-6">
                                        <div className="relative">
                                            <img
                                                src={teacher.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random`}
                                                alt={teacher.name}
                                                className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 group-hover:border-gold transition-colors"
                                            />
                                            {teacher.isVerified && (
                                                <div className="absolute -bottom-2 -nav-right-2 bg-blue-500 text-white p-1 rounded-full border-2 border-[#111]">
                                                    <ShieldCheck size={12} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-xl truncate group-hover:text-gold transition-colors">{teacher.name}</h3>
                                            <div className="flex flex-col gap-1 mt-1">
                                                <span className="text-[10px] text-gold font-black uppercase tracking-widest">{teacher.title || 'Mentor'} • {teacher.elo} ELO</span>
                                                <div className="flex items-center gap-1 text-white/60 text-xs">
                                                    <Star size={12} className="text-gold fill-gold" />
                                                    <span>{teacher.rating ? teacher.rating.toFixed(1) : '5.0'}</span>
                                                    <span className="mx-1">•</span>
                                                    <span className="text-white/40">{teacher.classesGiven || 0} clases</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-[#8b8982] line-clamp-3 mb-6 flex-grow">
                                        {teacher.description || "Profesor de ajedrez especializado en todos los niveles."}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                            <span className="text-xs text-text-muted">Tarifa</span>
                                            <span className="ml-2 font-white font-bold">{teacher.price} {teacher.currency === 'USD' ? '$' : '€'}/h</span>
                                        </div>
                                        <PremiumButton size="md" onClick={() => handleReserveClick(teacher)} className="px-6 rounded-xl">
                                            AGENDA
                                        </PremiumButton>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
            {selectedTeacher && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => {
                        setIsBookingModalOpen(false);
                        setSelectedTeacher(null);
                    }}
                    teacher={selectedTeacher}
                    studentId={currentUserId}
                />
            )}
        </div>
    );
};

export default TeachersDirectory;
