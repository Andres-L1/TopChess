import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface FurnitureProps {
    id: string;
    type: 'desk' | 'board' | 'chair' | 'plants' | 'bookshelf';
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    interactable?: boolean;
    onInteract?: () => void;
}

const Furniture: React.FC<FurnitureProps> = ({ type, x, y, width, height, label, interactable, onInteract }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Styling based on furniture type
    const getStyle = () => {
        switch (type) {
            case 'desk':
                return { bg: 'from-[#8B4513] to-[#5C2E0B]', border: 'border-[#3d1c04]/50', labelColor: 'text-[#facc15]' };
            case 'board':
                return { bg: 'from-[#2f3e46] to-[#1a2421]', border: 'border-green-500/30', labelColor: 'text-green-400' };
            case 'chair':
                return { bg: 'from-blue-600 to-blue-900', border: 'border-blue-400/30', labelColor: 'text-white' };
            case 'plants':
                return { bg: 'from-green-500 to-green-800', border: 'border-green-300/30', labelColor: 'text-white', borderRadius: '50%' };
            case 'bookshelf':
                return { bg: 'from-[#6B4226] to-[#3E2723]', border: 'border-[#2a1814]/50', labelColor: 'text-[#fae8ff]' };
            default:
                return { bg: 'from-gray-600 to-gray-800', border: 'border-white/20', labelColor: 'text-white' };
        }
    };

    const style = getStyle();

    return (
        <motion.div
            className={`absolute flex items-center justify-center bg-gradient-to-br ${style.bg} border-2 ${style.border} shadow-xl backdrop-blur-md overflow-hidden ${interactable ? 'cursor-pointer' : ''}`}
            style={{
                left: x,
                top: y,
                width,
                height,
                borderRadius: style.borderRadius || 12,
                boxShadow: isHovered && interactable ? `0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1)` : '0 4px 15px rgba(0,0,0,0.6)',
                zIndex: 10
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => interactable && onInteract && onInteract()}
            whileHover={interactable ? { scale: 1.02, y: -2 } : {}}
            whileTap={interactable ? { scale: 0.98 } : {}}
        >
            {/* Glass highlight */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-white/10 rounded-t-full blur-[2px]" />

            {label && (
                <span
                    className={`text-[10px] font-black uppercase tracking-widest text-center px-2 z-10 drop-shadow-md ${style.labelColor}`}
                >
                    {label}
                </span>
            )}

            {/* Interact indicator */}
            {interactable && isHovered && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -20 }}
                    className="absolute -top-10 bg-black/80 backdrop-blur-md border border-white/10 text-white text-[9px] font-bold px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] whitespace-nowrap z-50 pointer-events-none"
                >
                    Clic para interactuar
                </motion.div>
            )}
        </motion.div>
    );
};

export default Furniture;
