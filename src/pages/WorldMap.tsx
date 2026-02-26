import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Teacher } from '../types/index';
import IsometricBuilding from '../components/IsometricBuilding';
import { getTeacherTier, getTeacherTierProgress } from '../utils/progression';
import { Search, X, ChevronRight, Star, Clock, Zap } from 'lucide-react';

// ─── Teacher popup card ────────────────────────────────────────────────────
const TeacherCard: React.FC<{
    teacher: Teacher;
    onEnter: () => void;
    onClose: () => void;
}> = ({ teacher, onEnter, onClose }) => {
    const tier = getTeacherTier(teacher.earnings || 0);
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
                className="relative z-10 liquid-glass rounded-3xl p-6 max-w-sm w-full"
                style={{ boxShadow: `0 0 40px ${tier.color}30` }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                    <X size={18} />
                </button>

                {/* Tier badge */}
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{tier.buildingEmoji}</span>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: tier.color }}>
                            {tier.name}
                        </div>
                        <div className="text-white/40 text-xs">Academía TopChess</div>
                    </div>
                </div>

                {/* Teacher info */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                        {teacher.image ? (
                            <img src={teacher.image} alt={teacher.name} className="w-16 h-16 rounded-2xl object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${tier.color}22` }}>
                                👤
                            </div>
                        )}
                        <div
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-[8px]"
                            style={{ background: teacher.onlineStatus === 'online' || teacher.onlineStatus === 'in_class' ? '#22c55e' : '#6b7280' }}
                        />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white">{teacher.name}</h2>
                        <div className="text-white/50 text-xs">{teacher.title || 'Instructor de Ajedrez'}</div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono" style={{ color: tier.color }}>ELO {teacher.elo}</span>
                            {teacher.isVerified && <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-bold">✓ Verificado</span>}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                        { icon: <Star size={12} />, value: teacher.rating ? `${teacher.rating.toFixed(1)}★` : 'Nuevo', label: 'Rating' },
                        { icon: <Clock size={12} />, value: `${teacher.classesGiven || 0}`, label: 'Clases' },
                        { icon: <Zap size={12} />, value: `${teacher.experienceYears || 0}a`, label: 'Exp.' },
                    ].map((s, i) => (
                        <div key={i} className="liquid-glass-subtle rounded-xl p-2 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1" style={{ color: tier.color }}>{s.icon}</div>
                            <div className="text-white text-xs font-black">{s.value}</div>
                            <div className="text-white/40 text-[9px] uppercase tracking-widest">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Price */}
                <div className="liquid-glass-subtle rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div className="text-white/60 text-xs">Plan Mensual (4 Clases)</div>
                    <div className="font-black text-white">
                        {teacher.currency === 'USD' ? `$${teacher.price} USD` : `${teacher.price}€`}
                    </div>
                </div>

                {/* Style tags */}
                {teacher.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {teacher.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
                                style={{ background: `${tier.color}15`, color: tier.color }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* CTA */}
                <button
                    onClick={onEnter}
                    className="w-full py-3 rounded-2xl font-black text-sm uppercase tracking-widest text-black flex items-center justify-center gap-2 liquid-shimmer"
                    style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}bb)` }}
                >
                    <span>Entrar al Aula</span>
                    <ChevronRight size={16} />
                </button>
            </motion.div>
        </motion.div>
    );
};

// ─── World Map street decoration ──────────────────────────────────────────
const StreetDecor: React.FC = () => (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
            <pattern id="grid" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M 200 0 L 0 0 0 200" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        {/* Decorative ground lines */}
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(212,175,55,0.04)" strokeWidth="80" />
        <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(212,175,55,0.04)" strokeWidth="80" />
    </svg>
);

// ─── Empty building slot ──────────────────────────────────────────────────
const EmptySlot: React.FC<{ index: number }> = ({ index }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: index * 0.1 }}
        className="flex flex-col items-center gap-2"
    >
        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center">
            <span className="text-white/20 text-2xl">+</span>
        </div>
        <span className="text-[9px] text-white/15 uppercase tracking-widest font-bold">Plaza libre</span>
    </motion.div>
);

// ─── Main WorldMap page ────────────────────────────────────────────────────
const WorldMap: React.FC = () => {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [filter, setFilter] = useState<'all' | 'online' | 'eu' | 'latam'>('all');

    useEffect(() => {
        const load = async () => {
            const list = await firebaseService.getTeachers();
            setTeachers(list);
            setLoading(false);
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        return teachers
            .filter(t => {
                if (filter === 'online') return t.onlineStatus === 'online' || t.onlineStatus === 'in_class';
                if (filter === 'eu') return t.region === 'EU';
                if (filter === 'latam') return t.region === 'LATAM';
                return true;
            })
            .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => (b.earnings || 0) - (a.earnings || 0)); // highest tier first
    }, [teachers, search, filter]);

    const handleEnterClassroom = (teacher: Teacher) => {
        if (!auth?.isAuthenticated) {
            navigate('/');
            return;
        }
        navigate(`/office/${teacher.id}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <span className="text-xs text-white/30 uppercase tracking-widest font-bold">Cargando el mundo...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pt-20 pb-24 overflow-hidden relative">
            {/* Background atmosphere */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/[0.02] rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/[0.02] rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/5 border border-gold/15 mb-4">
                        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gold/80">
                            {filtered.filter(t => t.onlineStatus !== 'offline').length} profesores activos
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
                        <span className="text-white">MUNDO </span>
                        <span className="text-gradient-gold">TOPCHESS</span>
                    </h1>
                    <p className="text-white/40 text-sm max-w-md mx-auto">
                        Explora las academias de nuestros maestros y entra directo al aula
                    </p>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-10">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar profesor..."
                            className="input-premium w-full pl-10"
                        />
                    </div>
                    <div className="flex gap-2">
                        {[
                            { key: 'all', label: 'Todos' },
                            { key: 'online', label: '🟢 Activos' },
                            { key: 'eu', label: '🇪🇸 Europa' },
                            { key: 'latam', label: '🌎 LATAM' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key as typeof filter)}
                                className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all whitespace-nowrap ${filter === f.key
                                    ? 'bg-gold text-black border-gold shadow-gold/20 shadow-md'
                                    : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* World grid — buildings */}
                <div className="relative rounded-3xl liquid-glass p-6 md:p-10 min-h-[500px]">
                    <StreetDecor />

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <span className="text-4xl mb-3">🏙️</span>
                            <p className="text-white/30 text-sm">No se encontraron profesores con ese filtro</p>
                        </div>
                    ) : (
                        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8 items-end justify-items-center">
                            {filtered.map((teacher, i) => (
                                <motion.div
                                    key={teacher.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, type: 'spring', damping: 20 }}
                                    className="flex flex-col items-center"
                                >
                                    <IsometricBuilding
                                        earnings={teacher.earnings || 0}
                                        teacherName={teacher.name}
                                        isOnline={teacher.onlineStatus === 'online'}
                                        isInClass={teacher.onlineStatus === 'in_class'}
                                        size={getTeacherTier(teacher.earnings || 0).tier >= 4 ? 'lg' : getTeacherTier(teacher.earnings || 0).tier >= 3 ? 'md' : 'sm'}
                                        showLabel={true}
                                        onClick={() => setSelectedTeacher(teacher)}
                                    />
                                </motion.div>
                            ))}

                            {/* Empty slots to fill out the grid */}
                            {Array.from({ length: Math.max(0, 10 - filtered.length) }).map((_, i) => (
                                <EmptySlot key={`empty-${i}`} index={i} />
                            ))}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="relative z-10 mt-8 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-4 text-[10px] text-white/30">
                        <span>🏛️ Las academias más grandes tienen más ingresos generados</span>
                        <span className="ml-auto">👑 Tier 5 = Academía completa · 🪑 Tier 1 = Tutor</span>
                    </div>
                </div>
            </div>

            {/* Teacher popup */}
            <AnimatePresence>
                {selectedTeacher && (
                    <TeacherCard
                        teacher={selectedTeacher}
                        onEnter={() => handleEnterClassroom(selectedTeacher)}
                        onClose={() => setSelectedTeacher(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default WorldMap;
