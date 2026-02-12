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

            {/* Hero Section */}
            <div className="text-center mb-16 relative z-10 animate-fade-in">
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
                    Domina el Tablero <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold drop-shadow-sm">con Grandes Maestros</span>
                </h2>

                {/* Mobile Match Button */}
                <button
                    onClick={() => setShowWizard(true)}
                    className="md:hidden mt-6 w-full max-w-xs mx-auto py-4 bg-gold text-black rounded-xl font-black uppercase tracking-widest hover:bg-gold-hover transition-all shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center gap-2"
                >
                    <Sparkles size={18} />
                    <span>Encontrar mi Profesor Ideal</span>
                </button>

                <div className="flex justify-center gap-8 text-xs font-bold uppercase tracking-widest text-text-muted mt-8 md:mt-6">
                    <span className="flex items-center gap-2"><Shield size={14} className="text-gold" /> Calidad Garantizada</span>
                    <span className="flex items-center gap-2"><Globe size={14} className="text-gold" /> Clases Globales</span>
                    <span className="flex items-center gap-2"><Star size={14} className="text-gold" /> Top Rated</span>
                </div>
            </div>

            {/* Teacher Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto relative z-10 text-left">
                {teachers.map((teacher, index) => (
                    <div
                        key={teacher.id}
                        className="group bg-dark-panel border border-white/5 rounded-2xl p-6 hover:border-gold/30 transition-all duration-300 hover:shadow-2xl hover:shadow-gold/5 flex flex-col relative overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        {/* Card Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">{teacher.name}</h3>
                                <div className="flex items-center gap-1 text-gold text-xs mt-1">
                                    <Star size={12} fill="currentColor" />
                                    <span className="font-bold">{teacher.rating}</span>
                                    {/* <span className="text-text-muted font-light ml-1">({teacher.reviews} reseñas)</span> - Removed if not in mock data yet */}
                                </div>
                            </div>
                            <span className="bg-gold/10 text-gold text-[10px] font-black px-2 py-1 rounded border border-gold/20 uppercase tracking-wider">
                                {teacher.title}
                            </span>
                        </div>

                        <p className="text-sm text-text-secondary leading-relaxed mb-6 flex-grow font-light border-l-2 border-white/10 pl-3">
                            {teacher.description || teacher.bio}
                        </p>

                        {/* Teacher Tags */}
                        <div className="flex gap-1 flex-wrap mb-4 relative z-10">
                            {teacher.tags && teacher.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[9px] uppercase font-bold text-text-muted bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-auto relative z-10">
                            <div className="flex justify-between items-center mb-4 p-3 bg-black/20 rounded-lg border border-white/5 custom-scrollbar">
                                <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider">Tarifa Mensual</span>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-white">59€</span>
                                    <span className="block text-[10px] text-text-muted">$39 USD (América)</span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate(`/chat/${teacher.id}`)}
                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gold hover:text-black transition-all flex items-center justify-center gap-2 transform group-hover:translate-y-[-2px] shadow-lg"
                            >
                                <span>Contactar Profesor</span>
                                <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Minimal */}
            <footer className="mt-20 text-center border-t border-white/5 pt-8 pb-8 text-text-muted text-xs uppercase tracking-widest">
                &copy; 2024 TopChess Academy. Excellence in Strategy.
            </footer>
        </div>
    );
};

export default Home;
