import React from 'react';
import { Crown } from 'lucide-react';

const Logo = ({ className = "w-10 h-10" }) => {
    return (
        <div className={`${className} flex items-center justify-center text-gold`}>
            <Crown size="100%" strokeWidth={1.5} />
        </div>
    );
};

export default Logo;
