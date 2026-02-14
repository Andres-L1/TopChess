import React from 'react';
import { Trophy, Clock, Activity, Check } from 'lucide-react';
import { Teacher, Message } from '../../../types/index';

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
            <div className="flex items-center justify-between px-4 py-2 bg-[#1b1a17]/80 rounded-lg border border-white/5 backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <Trophy size={16} className="text-gold" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white uppercase tracking-tight">
                                {teacherProfile?.name || 'Maestro'}
                            </span>
                            {teacherProfile?.title && (
                                <span className="px-1 py-0.5 bg-gold text-black text-[8px] rounded font-black tracking-widest leading-none shadow-[0_0_10px_rgba(212,175,55,0.3)]">
                                    {teacherProfile.title}
                                </span>
                            )}
                            {teacherProfile?.isVerified && (
                                <Check size={10} className="text-blue-400 bg-blue-400/10 rounded-full p-0.5" />
                            )}
                        </div>
                        <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">
                            {teacherProfile?.elo || 2400} ELO
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded border border-white/5">
                        <Clock size={12} className="text-white/20" />
                        <span className="text-sm font-mono text-white/90">00:00</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-[#1b1a17]/80 rounded-lg border border-white/5 backdrop-blur-sm shadow-xl mt-8 md:mt-0">
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <span className="text-[10px] font-black text-green-500 uppercase">
                        {currentUserId?.substring(0, 2)}
                    </span>
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white uppercase tracking-tight">Tú</span>
                        <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-[8px] rounded font-black tracking-widest border border-green-500/20">STUDENT</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Activity size={8} className="text-green-500 animate-pulse" />
                        <span className="text-[9px] text-green-500/50 font-bold uppercase tracking-widest">En línea</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded border border-white/5">
                <Clock size={12} className="text-white/10" />
                <span className="text-sm font-mono text-white/90">00:00</span>
            </div>
        </div>
    );
};

export default ClassroomPlayerInfo;
