import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    delay?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, delay = '0s' }) => {
    return (
        <div
            className="group p-8 rounded-3xl liquid-glass liquid-shimmer hover:-translate-y-2 transition-all duration-500 animate-enter cursor-default"
            style={{ animationDelay: delay }}
        >
            <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mb-6 border border-gold/20 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(212,175,55,0.2)] transition-all duration-300 relative z-10">
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold transition-colors relative z-10">{title}</h3>
            <p className="text-[#8b8982] leading-relaxed group-hover:text-white/60 transition-colors relative z-10">
                {description}
            </p>
        </div>
    );
};

export default FeatureCard;
