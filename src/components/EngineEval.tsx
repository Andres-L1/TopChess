import React from 'react';

interface EngineEvalProps {
    score: number; // centipawns
    mate: number | null;
    orientation: 'white' | 'black';
}

const EngineEval: React.FC<EngineEvalProps> = ({ score, mate, orientation }) => {
    // Convert score to percentage for the bar
    // Standard scale: +3.00 is very winning, +10.00 is totally winning.
    // Normalized [-5, 5] roughly maps to [0, 100]

    const getPercentage = () => {
        if (mate !== null) return mate > 0 ? 100 : 0;

        const pawnEval = score / 100;
        // Logistic-like curve for smooth scaling
        let p = 50 + (pawnEval * 10); // Simple linear first
        if (p > 95) p = 95;
        if (p < 5) p = 5;
        return p;
    };

    const p = getPercentage();
    const displayScore = mate !== null
        ? `M${Math.abs(mate)}`
        : (score / 100).toFixed(1);

    const isWhiteWinning = mate !== null ? mate > 0 : score > 0;

    // Bar height depends on orientation. 
    // If orientation is 'white', white is at bottom? In Lichess bar is vertical.
    // We'll do a vertical bar. Higher percentage = more white.

    return (
        <div className="w-4 h-full bg-[#403d39] rounded-full overflow-hidden relative flex flex-col shadow-2xl border border-white/5">
            {/* Black Part */}
            <div className="flex-grow bg-[#262421]" />

            {/* White Part */}
            <div
                className="absolute bottom-0 left-0 w-full bg-[#f1f1f1] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                style={{ height: `${p}%` }}
            />

            {/* Score label */}
            <div className={`absolute left-0 w-full text-[8px] font-black text-center z-10 transition-all duration-500
                ${p > 50 ? 'bottom-2 text-black' : 'top-2 text-white'}
            `}>
                {displayScore}
            </div>
        </div>
    );
};

export default EngineEval;
