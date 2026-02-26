import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { getTeacherTier, TeacherTier } from '../utils/progression';

interface IsometricBuildingProps {
    earnings: number;
    teacherName: string;
    isOnline?: boolean;
    isInClass?: boolean;
    occupancy?: number;          // Active students inside
    onClick?: () => void;
    className?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

// ─── Building Floor — one level of the isometric building ─────────────────
const BuildingFloor: React.FC<{
    floorIndex: number;
    width: number;
    height: number;
    depth: number;
    color: string;
    accentColor: string;
    hasWindow?: boolean;
    hasLight?: boolean;
    tier: number;
}> = ({ floorIndex, width, height, depth, color, accentColor, hasWindow = true, hasLight = true, tier }) => {
    const yOffset = floorIndex * (height + depth * 0.5);

    // Isometric face dimensions in SVG units
    const topW = width;
    const topD = depth;
    const faceH = height;

    // Isometric projection points
    // Left face (west wall)
    const leftFace = [
        [0, topD * 0.5],                        // top-left
        [topW * 0.5, 0],                        // top-center
        [topW * 0.5, faceH],                    // bottom-center
        [0, faceH + topD * 0.5],               // bottom-left
    ];
    // Right face (east wall)
    const rightFace = [
        [topW * 0.5, 0],                        // top-center
        [topW, topD * 0.5],                     // top-right
        [topW, faceH + topD * 0.5],            // bottom-right
        [topW * 0.5, faceH],                    // bottom-center
    ];
    // Top face (roof)
    const topFace = [
        [0, topD * 0.5],                        // left
        [topW * 0.5, 0],                        // top
        [topW, topD * 0.5],                     // right
        [topW * 0.5, topD],                     // bottom
    ];

    const pts = (pts: number[][]) => pts.map(p => p.join(',')).join(' ');

    const darkColor = `color-mix(in srgb, ${color} 80%, black)`;
    const lightColor = `color-mix(in srgb, ${color} 60%, white)`;

    return (
        <g transform={`translate(0, ${yOffset})`}>
            {/* Top roof */}
            <polygon points={pts(topFace)} fill={lightColor} opacity="0.95" />
            {/* Left wall */}
            <polygon points={pts(leftFace)} fill={color} />
            {/* Right wall (darker) */}
            <polygon points={pts(rightFace)} fill={darkColor} />

            {/* Windows on left wall */}
            {hasWindow && tier >= 2 && (
                <rect
                    x={5}
                    y={topD * 0.5 + 8}
                    width={16}
                    height={12}
                    rx={1}
                    fill={hasLight ? accentColor : '#1a1a2e'}
                    opacity={hasLight ? 0.9 : 0.4}
                />
            )}
            {/* Windows on right wall */}
            {hasWindow && tier >= 2 && (
                <rect
                    x={topW * 0.5 + 8}
                    y={topD * 0.5 + 8}
                    width={16}
                    height={12}
                    rx={1}
                    fill={hasLight ? accentColor : '#1a1a2e'}
                    opacity={hasLight ? 0.7 : 0.3}
                />
            )}

            {/* Door on ground floor */}
            {floorIndex === 0 && (
                <>
                    <rect
                        x={topW * 0.5 - 10}
                        y={faceH - 14}
                        width={14}
                        height={14}
                        rx={2}
                        fill={accentColor}
                        opacity={0.7}
                    />
                    {/* Door handle */}
                    <circle cx={topW * 0.5 - 2} cy={faceH - 7} r={1.5} fill="white" opacity={0.6} />
                </>
            )}
        </g>
    );
};

// ─── Sign component ────────────────────────────────────────────────────────
const BuildingSign: React.FC<{ name: string; tier: TeacherTier; x: number; y: number }> = ({ name, tier, x, y }) => (
    <foreignObject x={x - 50} y={y} width={100} height={24}>
        <div
            style={{
                background: `${tier.color}22`,
                border: `1px solid ${tier.color}55`,
                borderRadius: '8px',
                padding: '2px 6px',
                textAlign: 'center',
                backdropFilter: 'blur(4px)',
            }}
        >
            <span style={{ color: tier.color, fontSize: '8px', fontWeight: '900', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                {name.split(' ')[0]}
            </span>
        </div>
    </foreignObject>
);

// ─── Main IsometricBuilding ────────────────────────────────────────────────
const IsometricBuilding: React.FC<IsometricBuildingProps> = ({
    earnings,
    teacherName,
    isOnline = false,
    isInClass = false,
    occupancy = 0,
    onClick,
    className = '',
    showLabel = true,
    size = 'md',
}) => {
    const [hovered, setHovered] = useState(false);
    const tier = getTeacherTier(earnings);

    const FLOORS = Math.min(tier.tier, 4); // 1–4 visible floors
    const FLOOR_W = size === 'sm' ? 80 : size === 'md' ? 120 : 160;
    const FLOOR_H = size === 'sm' ? 28 : size === 'md' ? 40 : 52;
    const FLOOR_D = size === 'sm' ? 20 : size === 'md' ? 30 : 40;

    const svgH = FLOORS * (FLOOR_H + FLOOR_D * 0.6) + FLOOR_D + 60;
    const svgW = FLOOR_W + 40;

    // Status color: active class = red pulse, online = green, offline = gray
    const statusColor = isInClass ? '#ef4444' : isOnline ? '#22c55e' : '#6b7280';

    // Ground plane (parking lot / floor)
    const groundPts = [
        [20, svgH - 20],
        [svgW / 2, svgH - 20 - FLOOR_D * 0.5],
        [svgW - 20, svgH - 20],
        [svgW / 2, svgH - 20 + FLOOR_D * 0.5],
    ].map(p => p.join(',')).join(' ');

    return (
        <motion.div
            className={`relative cursor-pointer select-none ${className}`}
            whileHover={{ scale: 1.04, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={onClick}
            animate={{ filter: isInClass ? [`drop-shadow(0 0 8px ${tier.color}60)`, `drop-shadow(0 0 20px ${tier.color}80)`, `drop-shadow(0 0 8px ${tier.color}60)`] : `drop-shadow(0 0 8px ${tier.color}40)` }}
            transition={{ duration: 2, repeat: isInClass ? Infinity : 0 }}
        >
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} overflow="visible">
                {/* Ground shadow */}
                <ellipse cx={svgW / 2} cy={svgH - 15} rx={FLOOR_W * 0.42} ry={FLOOR_D * 0.3} fill="black" opacity={0.2} />

                {/* Ground tile */}
                <polygon points={groundPts} fill={`${tier.color}08`} stroke={`${tier.color}20`} strokeWidth={0.5} />

                {/* Building floors — render bottom first */}
                <g transform={`translate(20, 20)`}>
                    {Array.from({ length: FLOORS }).map((_, i) => (
                        <BuildingFloor
                            key={i}
                            floorIndex={FLOORS - 1 - i}
                            width={FLOOR_W}
                            height={FLOOR_H}
                            depth={FLOOR_D}
                            color={tier.tier === 5 ? '#2d1b00' : '#1a1a2e'}
                            accentColor={tier.color}
                            hasWindow={true}
                            hasLight={isOnline || isInClass}
                            tier={tier.tier}
                        />
                    ))}

                    {/* Rooftop decorations for higher tiers */}
                    {tier.tier >= 3 && (
                        <text x={FLOOR_W * 0.5 - 6} y={10} fontSize={12} textAnchor="middle">
                            {tier.buildingEmoji}
                        </text>
                    )}

                    {/* Academy flag for tier 5 */}
                    {tier.tier === 5 && (
                        <>
                            <line x1={FLOOR_W * 0.5} y1={-5} x2={FLOOR_W * 0.5} y2={-20} stroke={tier.color} strokeWidth={1} />
                            <polygon
                                points={`${FLOOR_W * 0.5},${-20} ${FLOOR_W * 0.5 + 14},${-14} ${FLOOR_W * 0.5},${-8}`}
                                fill={tier.color}
                                opacity={0.9}
                            />
                        </>
                    )}

                    {/* Building sign */}
                    {showLabel && (
                        <BuildingSign
                            name={teacherName}
                            tier={tier}
                            x={FLOOR_W * 0.5}
                            y={FLOORS * (FLOOR_H + FLOOR_D * 0.5) + 4}
                        />
                    )}
                </g>

                {/* Status light — top right */}
                <motion.circle
                    cx={svgW - 12}
                    cy={12}
                    r={5}
                    fill={statusColor}
                    animate={{ opacity: isInClass ? [1, 0.3, 1] : 1 }}
                    transition={{ duration: 1, repeat: isInClass ? Infinity : 0 }}
                />
                <circle cx={svgW - 12} cy={12} r={8} fill={statusColor} opacity={0.3} />

                {/* Occupancy badge */}
                {occupancy > 0 && (
                    <>
                        <rect x={8} y={4} width={24} height={16} rx={8} fill={`${tier.color}33`} stroke={`${tier.color}66`} strokeWidth={1} />
                        <text x={20} y={16} fontSize={9} textAnchor="middle" fill={tier.color} fontWeight="900" fontFamily="monospace">
                            {occupancy}👤
                        </text>
                    </>
                )}
            </svg>

            {/* Hover tooltip */}
            {hovered && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
                >
                    <div
                        className="px-3 py-2 rounded-xl text-xs font-bold backdrop-blur-md"
                        style={{ background: `${tier.color}22`, border: `1px solid ${tier.color}55`, color: tier.color }}
                    >
                        {tier.buildingEmoji} {tier.name} · {teacherName.split(' ')[0]}
                        <div className="text-[9px] text-white/40 font-normal mt-0.5">
                            {isInClass ? '🔴 En clase' : isOnline ? '🟢 Disponible' : '⚫ Offline'}
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

export default IsometricBuilding;
