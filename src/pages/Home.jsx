import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { User, Star, ArrowRight, Shield, Globe, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import MatchWizard from '../components/MatchWizard';
import MatchResult from '../components/MatchResult';
import { findBestMatch } from '../utils/matchingAlgorithm';

const Home = () => {
    const [teachers, setTeachers] = useState([]);
    const [showWizard, setShowWizard] = useState(false);
    const [matchResult, setMatchResult] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const data = mockDB.getTeachers();
        setTeachers(data);
    }, []);

    const handleWizardComplete = (preferences) => {
        setShowWizard(false);
        const bestMatch = findBestMatch(teachers, preferences);
        if (bestMatch) {
            setMatchResult(bestMatch);
        } else {
            // Fallback if no match found (unlikely with our data)
            alert("No se encontraron coincidencias exactas, pero explora nuestros profesores.");
        }
    };

    return (
        <div className="min-h-screen bg-dark-bg text-text-primary px-4 md:px-8 py-8 font-sans selection:bg-gold selection:text-black relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-dark-panel to-transparent opacity-80 pointer-events-none"></div>
            <div className="absolute top-20 right-20 w-96 h-96 bg-gold/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Modals */}
            {showWizard && (
                <MatchWizard
                    onComplete={handleWizardComplete}
                    onCancel={() => setShowWizard(false)}
                />
            )}

            {matchResult && (
                <MatchResult
                    teacher={matchResult}
                    onClose={() => setMatchResult(null)}
                />
            )}

            {/* Header */}
            <header className="flex justify-between items-center mb-12 relative z-10 max-w-7xl mx-auto">
                <div className="flex items-center gap-3 animate-fade-in">
                    <Logo className="w-10 h-10 text-gold drop-shadow-md" />
                    <h1 className="text-2xl font-bold tracking-tighter text-white">
                        TOP<span className="text-gold font-light">CHESS</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowWizard(true)}
                        className="hidden md:flex items-center gap-2 px-6 py-2 bg-gold text-black rounded-full font-bold uppercase text-xs tracking-widest hover:bg-gold-hover transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transform hover:-translate-y-0.5"
                    >
                        <Sparkles size={16} />
                        <span>Encontrar Match</span>
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 px-6 py-2 bg-white/5 hover:bg-gold/10 text-white rounded-full transition-all border border-white/10 hover:border-gold/30 hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] text-xs uppercase font-bold tracking-widest"
                    >
                        <User size={16} />
                        <span>Área Profesores</span>
                    </button>
                </div>
            </header>

            {/* Hero Section - Centered & Premium */}
            <div className="flex-grow flex flex-col items-center justify-center relative z-10 animate-fade-in text-center px-4">
                <div className="mb-8 relative inline-block">
                    {/* Glowing Orb effect behind crown */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gold/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="relative z-10 text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]">
                        <Logo className="w-24 h-24 md:w-32 md:h-32 mx-auto" />
                    </div>
                </div>

                <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-tight text-white">
                    Domina el <br className="md:hidden" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gold to-white animate-gradient-x">Tablero</span>
                </h2>

                <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 font-light leading-relaxed">
                    Conecta con Grandes Maestros de todo el mundo y eleva tu juego al siguiente nivel con clases personalizadas y análisis en tiempo real.
                </p>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-center w-full max-w-md mx-auto">
                    <button
                        onClick={() => setShowWizard(true)}
                        className="w-full py-4 px-8 bg-gold text-black rounded-xl font-black uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] flex items-center justify-center gap-3 text-sm md:text-base group"
                    >
                        <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                        <span>Encontrar mi Entrenador</span>
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full md:w-auto py-4 px-8 bg-white/5 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all flex items-center justify-center gap-3 text-sm md:text-base"
                    >
                        <User size={20} />
                        <span>Soy Profesor</span>
                    </button>
                </div>

                <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-text-muted mt-12 md:mt-16 opacity-60">
                    <span className="flex items-center gap-2"><Shield size={16} className="text-gold" /> Calidad Verificada</span>
                    <span className="flex items-center gap-2"><Globe size={16} className="text-gold" /> Clases Globales</span>
                    <span className="flex items-center gap-2"><Star size={16} className="text-gold" /> Elo Garantizado</span>
                </div>
            </div>

            {/* Footer Minimal */}
            <footer className="mt-20 text-center border-t border-white/5 pt-8 pb-8 text-text-muted text-xs uppercase tracking-widest">
                &copy; 2024 TopChess Academy. Excellence in Strategy.
            </footer>
        </div>
    );
};

export default Home;
