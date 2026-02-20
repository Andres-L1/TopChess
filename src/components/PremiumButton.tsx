import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PremiumButtonProps {
    onClick?: () => void;
    children: React.ReactNode;
    icon?: LucideIcon;
    variant?: 'gold' | 'white' | 'outline' | 'danger';
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
    onClick,
    children,
    icon: Icon,
    variant = 'gold',
    className = '',
    disabled = false,
    type = 'button',
    size = 'md'
}) => {
    const baseStyles = "group relative overflow-hidden transition-all duration-300 font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const sizeStyles = {
        sm: "px-4 py-2 text-[10px] rounded-lg",
        md: "px-6 py-3 text-xs rounded-xl",
        lg: "px-10 py-5 text-base rounded-2xl",
        xl: "px-12 py-6 text-xl rounded-3xl"
    };

    const variantStyles = {
        gold: "bg-gold text-black hover:bg-white shadow-lg shadow-gold/10 hover:shadow-white/20",
        white: "bg-white text-black hover:bg-gold shadow-lg shadow-white/10 hover:shadow-gold/20",
        outline: "bg-transparent text-text-muted border border-white/10 hover:border-white/30 hover:text-white",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40"
    };

    const sweepColor = variant === 'gold' ? 'bg-white/40' : 'bg-gold/40';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        >
            {/* Sweep Animation Effect */}
            <div className={`absolute inset-0 ${sweepColor} translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-in-out`}></div>

            <span className="relative flex items-center gap-2">
                {children}
                {Icon && <Icon size={size === 'lg' ? 24 : 16} strokeWidth={2.5} />}
            </span>
        </button>
    );
};

export default PremiumButton;
