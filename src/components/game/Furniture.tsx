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
                return { bg: '#8B4513', border: '#5C2E0B', labelColor: '#fff' };
            case 'board':
                return { bg: '#2f3e46', border: '#1a2421', labelColor: '#4ade80' };
            case 'chair':
                return { bg: '#3b82f6', border: '#1d4ed8', labelColor: '#fff' };
            case 'plants':
                return { bg: '#22c55e', border: '#15803d', labelColor: '#fff', borderRadius: '50%' };
            case 'bookshelf':
                return { bg: '#6B4226', border: '#3E2723', labelColor: '#fae8ff' };
            default:
                return { bg: '#4b5563', border: '#1f2937', labelColor: '#fff' };
        }
    };

    const style = getStyle();

    return (
        <motion.div
            className={`absolute flex items-center justify-center ${interactable ? 'cursor-pointer' : ''}`}
            style={{
                left: x,
                top: y,
                width,
                height,
                backgroundColor: style.bg,
                borderColor: style.border,
                borderWidth: 4,
                borderStyle: 'solid',
                borderRadius: style.borderRadius || 8,
                boxShadow: isHovered && interactable ? `0 0 15px ${style.bg}80` : '0 4px 6px rgba(0,0,0,0.3)',
                zIndex: 10
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => interactable && onInteract && onInteract()}
            whileHover={interactable ? { scale: 1.05 } : {}}
            whileTap={interactable ? { scale: 0.95 } : {}}
        >
            {label && (
                <span
                    className="text-[10px] font-black uppercase tracking-widest text-center px-1"
                    style={{ color: style.labelColor, textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                >
                    {label}
                </span>
            )}

            {/* Interact indicator */}
            {interactable && isHovered && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: -20 }}
                    className="absolute -top-6 bg-white text-black text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none"
                >
                    Clic para interactuar
                </motion.div>
            )}
        </motion.div>
    );
};

export default Furniture;
