import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AvatarProps {
    id: string;
    name: string;
    x: number;
    y: number;
    color?: string;
    status: 'online' | 'offline' | 'in_class';
    isLocalUser?: boolean; // Determines if camera follows this avatar
}

const Avatar: React.FC<AvatarProps> = ({ name, x, y, color = '#D4AF37', status, isLocalUser }) => {
    return (
        <motion.div
            className="absolute flex flex-col items-center justify-end z-20 pointer-events-none"
            initial={{ x, y }}
            animate={{ x, y }}
            transition={{ type: 'tween', ease: 'linear', duration: 0.15 }}
            style={{
                left: 0,
                top: 0,
                transform: 'translate(-50%, -100%)',
                width: 48,
                height: 70
            }}
        >
            {/* Name Tag */}
            <div className={`
                flex items-center gap-1.5 px-3 py-1 rounded-full mb-2 whitespace-nowrap 
                backdrop-blur-md border shadow-lg transition-all duration-300
                ${isLocalUser
                    ? 'bg-gold/10 border-gold/30 text-gold shadow-gold/20'
                    : 'bg-white/5 border-white/10 text-white shadow-black/50'
                }
            `}>
                <span className="text-[10px] font-black uppercase tracking-wider">{name}</span>
                {status === 'online' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e] animate-pulse" />
                )}
                {status === 'in_class' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]" />
                )}
            </div>

            {/* Premium Character Body */}
            <div className="relative flex flex-col items-center drop-shadow-2xl">
                {/* Glow behind local user */}
                {isLocalUser && (
                    <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full scale-150 -z-10" />
                )}

                {/* Head */}
                <div
                    className="w-7 h-7 rounded-full shadow-[inset_0_-4px_10px_rgba(0,0,0,0.3),_0_4px_10px_rgba(0,0,0,0.5)] z-10 relative"
                    style={{ backgroundColor: '#ffcb9a' }}
                >
                    <div className="absolute top-1 right-2 w-2 h-2 bg-white/40 rounded-full" />
                </div>

                {/* Body / Suit */}
                <div
                    className="w-10 h-10 rounded-t-2xl rounded-b-md -mt-2 shadow-[inset_0_-5px_15px_rgba(0,0,0,0.5),_0_5px_15px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-sm border border-white/10"
                    style={{ backgroundColor: `${color}f0` }}
                >
                    {/* Suit highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent" />
                </div>

                {/* Ground Shadow */}
                <div className="absolute -bottom-1.5 w-8 h-2.5 bg-black/60 blur-[3px] rounded-full z-[-1]" />
            </div>
        </motion.div>
    );
};

export default Avatar;

