import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = "",
    variant = "text",
    width,
    height
}) => {
    const baseClasses = "animate-pulse bg-white/5 rounded-md";

    let variantClasses = "";
    if (variant === 'circular') variantClasses = "rounded-full";
    if (variant === 'text') variantClasses = "h-4 w-3/4 rounded";

    return (
        <div
            className={`${baseClasses} ${variantClasses} ${className}`}
            style={{ width, height }}
        />
    );
};

export default Skeleton;
