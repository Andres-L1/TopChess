import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../App';
import { firebaseService } from '../services/firebaseService';
import { Club, AppUser } from '../types/index';
import { motion, AnimatePresence } from 'framer-motion';
import { Map } from 'lucide-react';

// ─── Pixel Character ─────────────────────────────────────────────────
const SKIN = '#fdd7aa';
const HAIR_COLORS = ['#4a3728', '#2c1810', '#8b4513', '#d4a574', '#1a1a2e', '#c0392b', '#f39c12'];
const SHIRT_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#e91e63', '#ff6b35'];

// Deterministic color from name
const hashColor = (name: string, palette: string[]) => {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return palette[Math.abs(h) % palette.length];
};

const PixelCharacter: React.FC<{
    name: string;
    status: 'online' | 'in_class' | 'offline';
    photoURL?: string;
    animate?: boolean;
}> = ({ name, status, photoURL, animate = true }) => {
    const hair = hashColor(name, HAIR_COLORS);
    const shirt = hashColor(name + 'shirt', SHIRT_COLORS);

    return (
        <motion.div
            className="flex flex-col items-center gap-1 select-none"
            animate={animate ? { y: [0, -2, 0] } : undefined}
            transition={animate ? { duration: 2 + Math.random() * 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
        >
            {/* Name tag */}
            <div className="text-[10px] font-black tracking-wide px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm whitespace-nowrap" style={{ color: shirt }}>
                {name.split(' ')[0]}
            </div>

            {/* Pixel body - 16x24 pixel character */}
            <svg width="32" height="48" viewBox="0 0 16 24" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" style={{ imageRendering: 'pixelated' }}>
                {/* Hair */}
                <rect x="4" y="0" width="8" height="3" fill={hair} />
                <rect x="3" y="1" width="1" height="2" fill={hair} />
                <rect x="12" y="1" width="1" height="2" fill={hair} />

                {/* Face */}
                <rect x="4" y="3" width="8" height="5" fill={SKIN} />
                <rect x="3" y="3" width="1" height="4" fill={SKIN} />
                <rect x="12" y="3" width="1" height="4" fill={SKIN} />

                {/* Eyes */}
                <rect x="5" y="4" width="2" height="2" fill="#1a1a2e" />
                <rect x="9" y="4" width="2" height="2" fill="#1a1a2e" />
                <rect x="5" y="4" width="1" height="1" fill="white" />
                <rect x="9" y="4" width="1" height="1" fill="white" />

                {/* Mouth */}
                <rect x="6" y="6" width="4" height="1" fill="#c0392b" />

                {/* Body / Shirt */}
                <rect x="3" y="8" width="10" height="7" fill={shirt} />
                <rect x="2" y="9" width="1" height="5" fill={shirt} />
                <rect x="13" y="9" width="1" height="5" fill={shirt} />

                {/* Arms */}
                <rect x="1" y="9" width="1" height="4" fill={SKIN} />
                <rect x="14" y="9" width="1" height="4" fill={SKIN} />

                {/* Collar detail */}
                <rect x="6" y="8" width="4" height="1" fill={`${shirt}cc`} />

                {/* Pants */}
                <rect x="4" y="15" width="3" height="4" fill="#2c3e50" />
                <rect x="9" y="15" width="3" height="4" fill="#2c3e50" />

                {/* Shoes */}
                <rect x="3" y="19" width="4" height="2" fill="#1a1a2e" />
                <rect x="9" y="19" width="4" height="2" fill="#1a1a2e" />
            </svg>

            {/* Status indicator */}
            <div className={`w-2.5 h-2.5 rounded-full border border-black/50 shadow-lg ${status === 'in_class' ? 'bg-red-500 shadow-red-500/50 animate-pulse'
                : status === 'online' ? 'bg-green-500 shadow-green-500/50'
                    : 'bg-gray-500'
                }`} />
        </motion.div>
    );
};

// ─── Room Component ───────────────────────────────────────────────────
const Room: React.FC<{
    title: string;
    icon: string;
    teachers: AppUser[];
    emptyText: string;
    accentColor: string;
    className?: string;
    gridPattern?: boolean;
}> = ({ title, icon, teachers, emptyText, accentColor, className = '', gridPattern = true }) => (
    <div className={`relative rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d0d0f] ${className}`}>
        {/* Floor pattern */}
        {gridPattern && (
            <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: `
                    linear-gradient(45deg, #888 25%, transparent 25%),
                    linear-gradient(-45deg, #888 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #888 75%),
                    linear-gradient(-45deg, transparent 75%, #888 75%)
                `,
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
            }} />
        )}

        {/* Room glow */}
        <div className="absolute top-0 left-0 w-full h-1 opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }} />

        {/* Room header */}
        <div className="relative z-10 px-4 py-2 border-b border-white/[0.04] flex items-center gap-2 bg-black/30">
            <span className="text-sm">{icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{title}</span>
            {teachers.length > 0 && (
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/5" style={{ color: accentColor }}>
                    {teachers.length}
                </span>
            )}
        </div>

        {/* Room content - characters */}
        <div className="relative z-10 p-4 min-h-[140px] flex flex-wrap items-end justify-center gap-6">
            <AnimatePresence mode="popLayout">
                {teachers.length > 0 ? (
                    teachers.map(t => (
                        <motion.div
                            key={t.id}
                            initial={{ opacity: 0, y: 20, scale: 0.5 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        >
                            <PixelCharacter
                                name={t.name}
                                status={t.onlineStatus || 'offline'}
                                photoURL={t.photoURL}
                            />
                        </motion.div>
                    ))
                ) : (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/20 text-xs italic w-full text-center py-6"
                    >
                        {emptyText}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>

        {/* Furniture decorations */}
        {title.includes('AULA') && (
            <>
                {/* Desk */}
                <div className="absolute bottom-3 left-4 w-16 h-3 bg-amber-900/40 rounded-sm border border-amber-800/20" />
                {/* Whiteboard */}
                <div className="absolute top-12 right-4 w-12 h-8 bg-white/[0.06] rounded-sm border border-white/10">
                    <div className="m-1 h-1 w-6 bg-blue-400/30 rounded-full" />
                    <div className="m-1 h-1 w-4 bg-red-400/30 rounded-full" />
                </div>
            </>
        )}
        {title.includes('LOUNGE') && (
            <>
                {/* Sofa */}
                <div className="absolute bottom-3 right-4 w-14 h-4 bg-emerald-900/30 rounded-t-md border border-emerald-800/20" />
                {/* Coffee table */}
                <div className="absolute bottom-3 left-6 w-8 h-2 bg-amber-900/30 rounded-sm" />
                {/* Plant */}
                <div className="absolute bottom-5 left-4">
                    <div className="w-2 h-4 bg-green-600/40 rounded-full" />
                    <div className="w-3 h-1.5 bg-amber-800/40 rounded-sm -translate-x-[2px]" />
                </div>
            </>
        )}
        {title.includes('DESCANSO') && (
            <>
                {/* Bed/mat */}
                <div className="absolute bottom-3 right-4 w-12 h-3 bg-indigo-900/30 rounded-sm border border-indigo-800/20" />
            </>
        )}
    </div>
);

// ─── Wall Clock ────────────────────────────────────────────────────
const WallClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const hourAngle = (hours + minutes / 60) * 30;
    const minuteAngle = minutes * 6;

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="48" height="48" viewBox="0 0 48 48" className="drop-shadow-lg">
                <circle cx="24" cy="24" r="22" fill="#1a1a2e" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
                <circle cx="24" cy="24" r="20" fill="#0d0d12" />
                {/* Hour markers */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
                    <line
                        key={angle}
                        x1="24" y1="6" x2="24" y2="8"
                        stroke="white" strokeOpacity="0.3" strokeWidth="1"
                        transform={`rotate(${angle} 24 24)`}
                    />
                ))}
                {/* Hour hand */}
                <line x1="24" y1="24" x2="24" y2="12" stroke="#d4af37" strokeWidth="2" strokeLinecap="round"
                    transform={`rotate(${hourAngle} 24 24)`} />
                {/* Minute hand */}
                <line x1="24" y1="24" x2="24" y2="8" stroke="white" strokeWidth="1" strokeLinecap="round" strokeOpacity="0.7"
                    transform={`rotate(${minuteAngle} 24 24)`} />
                <circle cx="24" cy="24" r="2" fill="#d4af37" />
            </svg>
            <span className="text-[9px] font-mono text-white/30">
                {time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────
const ClubOffice: React.FC = () => {
    const authContext = useContext(AuthContext);
    const [club, setClub] = useState<Club | null>(null);
    const [teachers, setTeachers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authContext?.currentUserId) return;
        const loadClub = async () => {
            const fetchedClub = await firebaseService.getClubByDirectorId(authContext.currentUserId);
            setClub(fetchedClub);
            setLoading(false);
        };
        loadClub();
    }, [authContext?.currentUserId]);

    useEffect(() => {
        if (!club || !club.teacherIds || club.teacherIds.length === 0) return;
        const unsubscribe = firebaseService.observeClubTeachersPresence(club.teacherIds, (updatedTeachers) => {
            setTeachers(updatedTeachers);
        });
        return () => unsubscribe();
    }, [club]);

    const { inClass, online, offline } = useMemo(() => ({
        inClass: teachers.filter(t => t.onlineStatus === 'in_class'),
        online: teachers.filter(t => t.onlineStatus === 'online'),
        offline: teachers.filter(t => !t.onlineStatus || t.onlineStatus === 'offline'),
    }), [teachers]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
                    <span className="text-xs text-white/40 uppercase tracking-widest">Cargando oficina...</span>
                </div>
            </div>
        );
    }

    if (!club) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center text-white p-6 text-center">
                <Map size={48} className="text-gold mb-4" />
                <h1 className="text-2xl font-bold mb-2">Oficina Virtual no disponible</h1>
                <p className="text-white/60">No tienes ningún club asignado a tu cuenta de director actualmente.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-white pt-20 px-3 md:px-6 pb-24">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                            <span className="text-xl">🏢</span>
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                                {club.name}
                            </h1>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Oficina Virtual</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <WallClock />
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[10px] text-white/40">
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" /> En clase
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-white/40">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" /> Online
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-white/40">
                                <div className="w-2 h-2 rounded-full bg-gray-500" /> Offline
                            </div>
                        </div>
                    </div>
                </div>

                {/* Office Grid - 2D Pixel Office Layout */}
                <div className="rounded-2xl border border-white/[0.06] bg-[#0e0e10] p-3 md:p-4 overflow-hidden relative">
                    {/* Building outline glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.02] to-transparent pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 relative z-10">
                        {/* Main classroom - takes 2 cols */}
                        <Room
                            title="AULA PRINCIPAL"
                            icon="🎓"
                            teachers={inClass}
                            emptyText="Ningún profesor en clase"
                            accentColor="#ef4444"
                            className="lg:col-span-2 min-h-[200px]"
                        />

                        {/* Lounge */}
                        <Room
                            title="LOUNGE"
                            icon="☕"
                            teachers={online}
                            emptyText="Lounge vacío"
                            accentColor="#22c55e"
                            className="min-h-[200px]"
                        />

                        {/* Teacher offices - individual rooms */}
                        <Room
                            title="SALA DE REUNIONES"
                            icon="📋"
                            teachers={[]}
                            emptyText="Sin reuniones activas"
                            accentColor="#3b82f6"
                        />

                        {/* Rest area */}
                        <Room
                            title="ZONA DE DESCANSO"
                            icon="💤"
                            teachers={offline}
                            emptyText="Todos están trabajando"
                            accentColor="#6b7280"
                            className="lg:col-span-2"
                        />
                    </div>

                    {/* Bottom status bar */}
                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex flex-wrap items-center gap-4 justify-between">
                        <div className="flex items-center gap-4">
                            {teachers.map(t => (
                                <div key={t.id} className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold" style={{ color: hashColor(t.name + 'shirt', SHIRT_COLORS) }}>
                                        {t.name.split(' ')[0]}
                                    </span>
                                    <span className="text-[9px] text-white/30">
                                        {t.onlineStatus === 'in_class' ? 'en clase' : t.onlineStatus === 'online' ? 'disponible' : 'descansando'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="text-[9px] text-white/20 font-mono">
                            {teachers.length} miembros · {inClass.length + online.length} activos
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubOffice;
