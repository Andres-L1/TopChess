import React from 'react';
import { motion } from 'framer-motion';
import { getStudentTier, StudentTier } from '../utils/progression';

interface ChessPieceAvatarProps {
    name: string;
    elo?: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    animate?: boolean;
    showName?: boolean;
    showTier?: boolean;
    className?: string;
}

// SVG pixel-art chess pieces — each is a 24×24 grid
const PIECE_SVGS: Record<number, React.ReactNode> = {
    // Tier 1 — Pawn ♟
    1: (
        <>
            {/* Head */}
            <circle cx="12" cy="5" r="3" fill="currentColor" />
            {/* Neck */}
            <rect x="11" y="8" width="2" height="2" fill="currentColor" />
            {/* Body */}
            <rect x="9" y="10" width="6" height="5" fill="currentColor" />
            {/* Base */}
            <rect x="7" y="15" width="10" height="3" rx="1" fill="currentColor" />
            <rect x="5" y="18" width="14" height="2" rx="1" fill="currentColor" />
        </>
    ),
    // Tier 2 — Knight ♞
    2: (
        <>
            {/* Horse head */}
            <path d="M8 3 L8 8 L6 10 L6 13 L10 13 L10 8 L14 8 L14 5 L12 3 Z" fill="currentColor" />
            {/* Eye */}
            <circle cx="9" cy="6" r="1" fill="white" fillOpacity="0.6" />
            {/* Neck + body */}
            <rect x="9" y="13" width="6" height="5" fill="currentColor" />
            {/* Base */}
            <rect x="6" y="18" width="12" height="2" rx="1" fill="currentColor" />
            <rect x="4" y="20" width="16" height="2" rx="1" fill="currentColor" />
        </>
    ),
    // Tier 3 — Bishop ♝
    3: (
        <>
            {/* Mitre top */}
            <ellipse cx="12" cy="3" rx="2" ry="3" fill="currentColor" />
            {/* Cross */}
            <rect x="11.5" y="1" width="1" height="5" fill="white" fillOpacity="0.4" />
            <rect x="10" y="3" width="4" height="1" fill="white" fillOpacity="0.4" />
            {/* Head */}
            <circle cx="12" cy="8" r="2.5" fill="currentColor" />
            {/* Body */}
            <path d="M8 10 L7 18 L17 18 L16 10 Z" fill="currentColor" />
            {/* Base */}
            <rect x="6" y="18" width="12" height="2" rx="1" fill="currentColor" />
            <rect x="4" y="20" width="16" height="2" rx="1" fill="currentColor" />
        </>
    ),
    // Tier 4 — Rook ♜
    4: (
        <>
            {/* Battlements */}
            <rect x="6" y="2" width="3" height="4" fill="currentColor" />
            <rect x="10.5" y="2" width="3" height="4" fill="currentColor" />
            <rect x="15" y="2" width="3" height="4" fill="currentColor" />
            {/* Tower top */}
            <rect x="6" y="6" width="12" height="2" fill="currentColor" />
            {/* Window */}
            <rect x="10" y="9" width="4" height="5" fill="currentColor" />
            <rect x="11" y="10" width="2" height="3" fill="black" fillOpacity="0.4" />
            {/* Side walls */}
            <rect x="8" y="6" width="2" height="12" fill="currentColor" />
            <rect x="14" y="6" width="2" height="12" fill="currentColor" />
            {/* Base */}
            <rect x="6" y="18" width="12" height="2" rx="1" fill="currentColor" />
            <rect x="4" y="20" width="16" height="2" rx="1" fill="currentColor" />
        </>
    ),
    // Tier 5 — Queen ♛
    5: (
        <>
            {/* Crown */}
            <path d="M4 8 L7 4 L12 6 L17 4 L20 8 L17 10 L7 10 Z" fill="currentColor" />
            {/* Crown jewels */}
            <circle cx="7" cy="4" r="1.5" fill="white" fillOpacity="0.7" />
            <circle cx="12" cy="5.5" r="1.5" fill="white" fillOpacity="0.7" />
            <circle cx="17" cy="4" r="1.5" fill="white" fillOpacity="0.7" />
            {/* Collar */}
            <ellipse cx="12" cy="10" rx="4" ry="1.5" fill="currentColor" />
            {/* Gown */}
            <path d="M7 11 L5 22 L19 22 L17 11 Z" fill="currentColor" />
            {/* Belt */}
            <rect x="8" y="14" width="8" height="1.5" fill="white" fillOpacity="0.2" />
            {/* Base */}
            <rect x="4" y="22" width="16" height="2" rx="1" fill="currentColor" />
        </>
    ),
    // Tier 6 — King ♚
    6: (
        <>
            {/* Crown */}
            <rect x="9" y="1" width="6" height="1" fill="currentColor" />
            <rect x="11" y="0" width="2" height="3" fill="currentColor" />
            {/* Crown band */}
            <rect x="7" y="3" width="10" height="3" fill="currentColor" />
            {/* Crown gems */}
            <circle cx="9" cy="4.5" r="1" fill="white" fillOpacity="0.6" />
            <circle cx="12" cy="4.5" r="1" fill="white" fillOpacity="0.6" />
            <circle cx="15" cy="4.5" r="1" fill="white" fillOpacity="0.6" />
            {/* Head */}
            <circle cx="12" cy="9" r="3" fill="currentColor" />
            {/* Cape */}
            <path d="M6 12 L4 22 L20 22 L18 12 Z" fill="currentColor" />
            {/* Royal emblem */}
            <path d="M10 15 L12 13 L14 15 L13 18 L11 18 Z" fill="white" fillOpacity="0.25" />
            {/* Base */}
            <rect x="4" y="22" width="16" height="2" rx="1" fill="currentColor" />
        </>
    ),
};

const SIZE_MAP = {
    sm: 32,
    md: 48,
    lg: 72,
    xl: 96,
};

const ChessPieceAvatar: React.FC<ChessPieceAvatarProps> = ({
    name,
    elo = 0,
    size = 'md',
    animate = true,
    showName = true,
    showTier = false,
    className = '',
}) => {
    const tier: StudentTier = getStudentTier(elo);
    const px = SIZE_MAP[size];

    return (
        <motion.div
            className={`flex flex-col items-center gap-1 select-none ${className}`}
            animate={animate ? { y: [0, -3, 0] } : undefined}
            transition={animate ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : undefined}
        >
            {/* Name tag */}
            {showName && (
                <div
                    className="text-[10px] font-black tracking-wide px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap"
                    style={{ background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}44` }}
                >
                    {name.split(' ')[0]}
                </div>
            )}

            {/* Chess piece SVG */}
            <div
                className="relative drop-shadow-[0_2px_8px_var(--piece-glow)]"
                style={{ '--piece-glow': tier.color + '80' } as React.CSSProperties}
            >
                <svg
                    width={px}
                    height={px}
                    viewBox="0 0 24 24"
                    style={{ imageRendering: 'pixelated', color: tier.color, filter: `drop-shadow(0 0 ${px / 8}px ${tier.color}80)` }}
                >
                    {PIECE_SVGS[tier.tier]}
                </svg>

                {/* Shine overlay */}
                <div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle at 35% 35%, ${tier.color}30, transparent 60%)` }}
                />
            </div>

            {/* Tier badge */}
            {showTier && (
                <div className="flex items-center gap-1">
                    <span className="text-[11px]" style={{ color: tier.color }}>
                        {tier.pieceSymbol}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">
                        {tier.piece}
                    </span>
                </div>
            )}
        </motion.div>
    );
};

export default ChessPieceAvatar;
