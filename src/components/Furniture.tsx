import React from 'react';
import { motion } from 'framer-motion';

export type FurnitureType =
    | 'desk'          // Teacher's desk — opens booking
    | 'register'      // Cash register / ATM — opens payment
    | 'chalkboard'    // Blackboard — opens homework / tasks
    | 'chess_table'   // Chess table — opens live board / class
    | 'bookshelf'     // Bookshelf — opens student resources
    | 'door';         // Room exit door

interface FurnitureProps {
    type: FurnitureType;
    gridX: number;
    gridY: number;
    screenX: number;
    screenY: number;
    onClick?: (type: FurnitureType) => void;
    /** Used to show the interaction hint */
    isNearby?: boolean;
    label?: string;
}

const FURNITURE_CONFIGS: Record<FurnitureType, {
    emoji: string;
    color: string;
    glow: string;
    label: string;
    width: number;
    height: number;
}> = {
    desk: {
        emoji: '🗓️',
        color: '#8B5E3C',
        glow: 'rgba(139,94,60,0.5)',
        label: 'Reservar Clase',
        width: 60,
        height: 30,
    },
    register: {
        emoji: '💳',
        color: '#1e3a5f',
        glow: 'rgba(30,58,95,0.5)',
        label: 'Pagar Suscripción',
        width: 30,
        height: 30,
    },
    chalkboard: {
        emoji: '📝',
        color: '#1a1a1a',
        glow: 'rgba(255,255,255,0.2)',
        label: 'Ver Tareas',
        width: 80,
        height: 20,
    },
    chess_table: {
        emoji: '♟️',
        color: '#27272a',
        glow: 'rgba(255,215,0,0.4)',
        label: 'Iniciar Clase',
        width: 50,
        height: 50,
    },
    bookshelf: {
        emoji: '📚',
        color: '#523a28',
        glow: 'rgba(82,58,40,0.5)',
        label: 'Ver Recursos',
        width: 70,
        height: 20,
    },
    door: {
        emoji: '🚪',
        color: '#2a1a0e',
        glow: 'rgba(200,150,80,0.4)',
        label: 'Salir del Aula',
        width: 28,
        height: 50,
    },
};

/**
 * Renders an isometric-style furniture object as an SVG foreignObject.
 * Positioned at `screenX, screenY` (already converted from grid coords by IsometricEngine).
 */
const Furniture: React.FC<FurnitureProps> = ({
    type,
    screenX,
    screenY,
    onClick,
    isNearby = false,
    label: labelOverride,
}) => {
    const cfg = FURNITURE_CONFIGS[type];
    const label = labelOverride || cfg.label;
    const w = cfg.width;
    const h = cfg.height;
    const halfW = w / 2;

    // Isometric face: top diamond + front face
    const topPoints = `
        ${screenX},${screenY - h / 2}
        ${screenX + halfW},${screenY}
        ${screenX},${screenY + h / 2}
        ${screenX - halfW},${screenY}
    `;

    const leftFaceX = `${screenX - halfW}`;
    const rightFaceX = `${screenX + halfW}`;
    const faceTop = screenY + h / 2;
    const faceBot = screenY + h / 2 + h;

    return (
        <g
            className={`furniture-${type} cursor-pointer select-none`}
            onClick={() => onClick && onClick(type)}
        >
            {/* Glow when nearby */}
            {isNearby && (
                <ellipse
                    cx={screenX}
                    cy={screenY + h / 2}
                    rx={halfW + 8}
                    ry={h / 2 + 4}
                    fill={cfg.glow}
                    opacity={0.6}
                    className="animate-pulse"
                />
            )}

            {/* Isometric top face */}
            <polygon
                points={topPoints}
                fill={adjustColor(cfg.color, 30)}
                stroke={adjustColor(cfg.color, 50)}
                strokeWidth={1}
            />

            {/* Left face (shadow side) */}
            <polygon
                points={`${leftFaceX},${faceTop} ${screenX},${screenY + h / 2} ${screenX},${faceBot} ${leftFaceX},${faceBot}`}
                fill={adjustColor(cfg.color, -20)}
                stroke={adjustColor(cfg.color, 0)}
                strokeWidth={0.5}
            />

            {/* Right face (light side) */}
            <polygon
                points={`${screenX},${screenY + h / 2} ${rightFaceX},${faceTop} ${rightFaceX},${faceBot} ${screenX},${faceBot}`}
                fill={cfg.color}
                stroke={adjustColor(cfg.color, 10)}
                strokeWidth={0.5}
            />

            {/* Emoji icon on top */}
            <text
                x={screenX}
                y={screenY + h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(w, h) * 0.5}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                {cfg.emoji}
            </text>

            {/* Hover / nearby labels */}
            {isNearby && (
                <g>
                    <rect
                        x={screenX - 50}
                        y={screenY - h - 20}
                        width={100}
                        height={20}
                        rx={6}
                        fill="#000000cc"
                    />
                    <text
                        x={screenX}
                        y={screenY - h - 10}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={10}
                        fill="white"
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                    >
                        {label}
                    </text>
                </g>
            )}
        </g>
    );
};

/** Lighten or darken a hex color by an amount (-255 to 255) */
function adjustColor(hex: string, amount: number): string {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default Furniture;
