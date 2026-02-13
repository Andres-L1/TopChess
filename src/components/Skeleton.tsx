
import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    variant = "text",
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-white/10 rounded";
    const variantClasses = {
        text: "h-4 w-full",
        circular: "rounded-full",
        rectangular: "h-full w-full"
    };

    const style = {
        width,
        height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export default Skeleton;
