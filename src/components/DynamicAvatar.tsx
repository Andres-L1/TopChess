import React, { useState, useEffect } from 'react';
import { AvatarConfig } from '../types';
import ChessPieceAvatar from './ChessPieceAvatar';

interface DynamicAvatarProps {
    config?: AvatarConfig;
    role: 'student' | 'teacher' | 'admin' | 'club_director';
    elo?: number;
    earnings?: number;
    name: string;
    scale?: number;
    chatBubble?: {
        text: string;
        timestamp: number;
    } | null;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
    skinColor: '#ffcca6',
    hairColor: '#4a3000',
    hairStyle: 'short',
    shirtColor: '#4f46e5',
    pantsColor: '#1e293b',
    shoesColor: '#000000'
};

const DynamicAvatar: React.FC<DynamicAvatarProps> = ({
    config,
    role,
    elo = 800,
    earnings = 0,
    name,
    scale = 1,
    chatBubble
}) => {
    const c = config || DEFAULT_AVATAR_CONFIG;
    const [showBubble, setShowBubble] = useState(false);

    useEffect(() => {
        if (chatBubble && Date.now() - chatBubble.timestamp < 7000) {
            setShowBubble(true);
            const timer = setTimeout(() => {
                setShowBubble(false);
            }, 7000 - (Date.now() - chatBubble.timestamp));
            return () => clearTimeout(timer);
        } else {
            setShowBubble(false);
        }
    }, [chatBubble]);

    return (
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center', zIndex: showBubble ? 50 : 10 }} className="relative flex flex-col items-center justify-end">

            {/* Chat Bubble */}
            {showBubble && chatBubble && (
                <div className="absolute -top-[120px] bg-white text-black px-3 py-1.5 rounded-2xl rounded-bl-none text-xs font-bold max-w-[120px] text-center shadow-xl animate-fade-in pointer-events-none word-break break-words border-2 border-slate-200">
                    {chatBubble.text}
                </div>
            )}

            {/* Floating Indicator */}
            <div className="absolute -top-[70px] flex flex-col items-center">
                {role === 'student' ? (
                    <div className="scale-75 origin-bottom">
                        <ChessPieceAvatar elo={elo} name={name} size="sm" showTier={false} />
                    </div>
                ) : (
                    // Teacher Indicator
                    <div className="bg-gradient-to-br from-gold/80 to-yellow-600/80 p-1.5 rounded-full border border-gold shadow-[0_0_15px_rgba(255,215,0,0.4)] backdrop-blur text-xs">
                        👑
                    </div>
                )}
                {/* Name Tag */}
                <div className="bg-black/80 px-2 py-0.5 rounded text-[9px] text-white font-bold whitespace-nowrap mt-1 border border-white/10">
                    {name.split(' ')[0]}
                </div>
            </div>

            {/* Pixel Art Body SVG */}
            <svg width="40" height="60" viewBox="0 0 40 60" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: 'pixelated' }}>
                {/* Shadow */}
                <ellipse cx="20" cy="56" rx="14" ry="4" fill="#000" opacity="0.3" />

                {/* Shoes */}
                <rect x="12" y="52" width="6" height="4" fill={c.shoesColor} rx="1" />
                <rect x="22" y="52" width="6" height="4" fill={c.shoesColor} rx="1" />

                {/* Pants */}
                <rect x="12" y="38" width="16" height="14" fill={c.pantsColor} />
                <rect x="19" y="42" width="2" height="10" fill="#000000" opacity="0.2" /> {/* Leg separator */}

                {/* Shirt / Torso */}
                <rect x="10" y="24" width="20" height="14" fill={c.shirtColor} rx="2" />
                {/* Arms */}
                <rect x="6" y="24" width="4" height="14" fill={c.skinColor} rx="1" />
                <rect x="6" y="24" width="4" height="6" fill={c.shirtColor} rx="1" /> {/* Sleeves */}
                <rect x="30" y="24" width="4" height="14" fill={c.skinColor} rx="1" />
                <rect x="30" y="24" width="4" height="6" fill={c.shirtColor} rx="1" />

                {/* Neck */}
                <rect x="18" y="20" width="4" height="4" fill={c.skinColor} />
                <rect x="18" y="22" width="4" height="2" fill="#000000" opacity="0.1" />

                {/* Head */}
                <rect x="12" y="6" width="16" height="16" fill={c.skinColor} rx="3" />

                {/* Face details */}
                <rect x="15" y="13" width="2" height="2" fill="#000" opacity="0.8" />
                <rect x="23" y="13" width="2" height="2" fill="#000" opacity="0.8" />
                <rect x="18" y="18" width="4" height="1" fill="#000" opacity="0.4" />

                {/* Hair */}
                {c.hairStyle !== 'bald' && (
                    <path
                        d={
                            c.hairStyle === 'long'
                                ? "M 11 12 L 11 5 Q 20 1 29 5 L 29 22 L 26 22 L 26 10 Z"
                                : c.hairStyle === 'spiky'
                                    ? "M 10 8 L 12 2 L 16 6 L 20 1 L 24 6 L 28 2 L 30 8 Z"
                                    : "M 11 12 L 11 5 Q 20 1 29 5 L 29 10 L 27 8 Q 20 4 13 8 Z" // Short
                        }
                        fill={c.hairColor}
                    />
                )}
            </svg>
        </div>
    );
};

export default DynamicAvatar;
