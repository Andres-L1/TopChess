import React from 'react';
import { Trophy, Clock, Activity, Check } from 'lucide-react';
import { Teacher } from '../../../types/index';
import Skeleton from '../../../components/Skeleton';

interface ClassroomPlayerInfoProps {
    type: 'top' | 'bottom';
    teacherProfile?: Teacher | null;
    // bottom player — real user info
    displayName?: string;
    photoURL?: string;
    userRole?: string;
    elapsedSeconds?: number;
}

/** Format seconds as MM:SS */
const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const ClassroomPlayerInfo: React.FC<ClassroomPlayerInfoProps> = ({
    type,
    teacherProfile,
    displayName,
    photoURL,
    userRole,
    elapsedSeconds = 0,
}) => {
    const timeStr = formatTime(elapsedSeconds);
    const isTeacher = userRole === 'teacher';

    if (type === 'top') {
        // When the logged-in user IS the teacher, top card = student placeholder (or vice versa)
        // When the logged-in user IS a student, top card = teacher
        return (
            <div className="flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2 liquid-glass-subtle rounded-xl shadow-xl">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="relative">
                        {!teacherProfile ? (
                            <Skeleton width={56} height={56} className="rounded-2xl" />
                        ) : (
                            <img
                                src={teacherProfile.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherProfile.name)}&background=random`}
                                alt={teacherProfile.name}
                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 shadow-2xl"
                            />
                        )}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center backdrop-blur-md">
                            <Trophy size={12} className="text-gold" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-0.5 md:gap-1">
                        {!teacherProfile ? (
                            <>
                                <Skeleton width={80} height={12} className="md:w-[100px] md:h-[16px]" />
                                <Skeleton width={40} height={10} className="md:w-[60px] md:h-[12px]" />
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight">
                                        {teacherProfile.name}
                                    </span>
                                    {teacherProfile.title && (
                                        <span className="px-1 py-0.5 bg-gold text-black text-[7px] md:text-[8px] rounded font-black tracking-widest leading-none shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                                            {teacherProfile.title}
                                        </span>
                                    )}
                                    {teacherProfile.isVerified && (
                                        <Check size={9} className="text-blue-400 bg-blue-400/10 rounded-full p-0.5 md:w-2.5 md:h-2.5" />
                                    )}
                                </div>
                                <span className="text-[8px] md:text-[9px] text-white/30 font-bold uppercase tracking-widest">
                                    {teacherProfile.elo} ELO
                                </span>
                            </>
                        )}
                    </div>
                </div>
                {/* Class timer (top) */}
                <div className="flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 bg-black/40 rounded border border-white/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                    <Clock size={10} className="text-white/20 md:w-3 md:h-3 relative z-10" />
                    <span className="text-xs md:text-sm font-mono text-white/90 relative z-10">{timeStr}</span>
                </div>
            </div>
        );
    }

    // Bottom = "Tú"
    const initials = displayName
        ? displayName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
        : '?';

    return (
        <div className="flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2 liquid-glass-subtle rounded-xl shadow-xl mt-1 md:mt-0">
            <div className="flex items-center gap-2 md:gap-4">
                <div className="relative">
                    {photoURL ? (
                        <img
                            src={photoURL}
                            alt={displayName || 'Tú'}
                            className="w-10 h-10 md:w-14 md:h-14 rounded-2xl object-cover border-2 border-green-500/30 shadow-lg"
                        />
                    ) : (
                        <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center shadow-lg">
                            <span className="text-xs md:text-lg font-black text-green-500 uppercase">{initials}</span>
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#161512] shadow-sm" />
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight">
                            {displayName ? displayName.split(' ')[0] : 'Tú'}
                        </span>
                        <span className={`px-1 py-0.5 text-[7px] md:text-[8px] rounded font-black tracking-widest border shadow-sm ${isTeacher
                            ? 'bg-gold/10 text-gold border-gold/20 shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                            : 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.1)]'
                            }`}>
                            {isTeacher ? 'PROF.' : 'ALUMNO'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Activity size={7} className="text-green-500 animate-pulse md:w-2 md:h-2" />
                        <span className="text-[8px] md:text-[9px] text-green-500/50 font-bold uppercase tracking-widest">En línea</span>
                    </div>
                </div>
            </div>
            {/* Class timer (bottom) */}
            <div className="flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 bg-black/40 rounded border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                <Clock size={10} className="text-white/10 md:w-3 md:h-3 relative z-10" />
                <span className="text-xs md:text-sm font-mono text-white/90 relative z-10">{timeStr}</span>
            </div>
        </div>
    );
};

export default React.memo(ClassroomPlayerInfo);
