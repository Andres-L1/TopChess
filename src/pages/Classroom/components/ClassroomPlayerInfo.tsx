import React from 'react';
import { Trophy, Clock, Activity, Check } from 'lucide-react';
import { Teacher } from '../../../types/index';
import Skeleton from '../../../components/Skeleton';

interface ClassroomPlayerInfoProps {
    type: 'top' | 'bottom';
    teacherProfile?: Teacher | null;
    currentUserId?: string;
}

const ClassroomPlayerInfo: React.FC<ClassroomPlayerInfoProps> = ({
    type,
    teacherProfile,
    currentUserId
}) => {
    if (type === 'top') {
        return (
            <div className="flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2 bg-[#1b1a17]/80 rounded-lg border border-white/5 backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <Trophy size={12} className="text-gold md:w-4 md:h-4" />
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
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 bg-black/40 rounded border border-white/5">
                        <Clock size={10} className="text-white/20 md:w-3 md:h-3" />
                        <span className="text-xs md:text-sm font-mono text-white/90">00:00</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-3 py-1.5 md:px-4 md:py-2 bg-[#1b1a17]/80 rounded-lg border border-white/5 backdrop-blur-sm shadow-xl mt-1 md:mt-0">
            <div className="flex items-center gap-2 md:gap-4">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <span className="text-[9px] md:text-[10px] font-black text-green-500 uppercase">
                        {currentUserId?.substring(0, 2)}
                    </span>
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight">Tú</span>
                        <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-[7px] md:text-[8px] rounded font-black tracking-widest border border-green-500/20">STUDENT</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Activity size={7} className="text-green-500 animate-pulse md:w-2 md:h-2" />
                        <span className="text-[8px] md:text-[9px] text-green-500/50 font-bold uppercase tracking-widest">En línea</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 px-2 py-0.5 md:px-3 md:py-1 bg-black/40 rounded border border-white/5">
                <Clock size={10} className="text-white/10 md:w-3 md:h-3" />
                <span className="text-xs md:text-sm font-mono text-white/90">00:00</span>
            </div>
        </div>
    );
};

export default React.memo(ClassroomPlayerInfo);
