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
            className="group p-8 rounded-3xl bg-[#262421] border border-white/5 hover:border-gold/30 hover:bg-[#302e2b] transition-all duration-300 animate-enter hover:-translate-y-2 shadow-xl hover:shadow-gold/10"
            style={{ animationDelay: delay }}
        >
            <div className="w-14 h-14 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mb-6 border border-gold/20 group-hover:scale-110 transition-transform duration-300">
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-gold transition-colors">{title}</h3>
            <p className="text-[#8b8982] leading-relaxed group-hover:text-text-muted transition-colors">
                {description}
            </p>
        </div>
    );
};

export default FeatureCard;
