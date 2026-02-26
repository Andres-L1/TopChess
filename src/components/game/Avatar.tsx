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
                // Avatar is usually centered above its (x,y) footprint
                transform: 'translate(-50%, -100%)',
                width: 40,
                height: 60
            }}
        >
            {/* Name Tag */}
            <div className="bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1 whitespace-nowrap backdrop-blur-sm border border-white/10 relative">
                {name}
                {isLocalUser && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gold animate-pulse" />
                )}
            </div>

            {/* Basic body (temp shape) */}
            <div className="relative flex flex-col items-center">
                {/* Head */}
                <div
                    className="w-6 h-6 rounded-md shadow-lg z-10"
                    style={{ backgroundColor: '#ffcb9a' }}
                />
                {/* Body */}
                <div
                    className="w-8 h-10 rounded-t-lg -mt-1 shadow-lg border-2 border-black/20"
                    style={{ backgroundColor: color }}
                />
                {/* Shadow */}
                <div className="absolute -bottom-1 w-6 h-2 bg-black/40 blur-[2px] rounded-full z-[-1]" />
            </div>
        </motion.div>
    );
};

export default Avatar;
