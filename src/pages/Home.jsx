import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Users, Award, Zap } from 'lucide-react';
import MatchWizard from '../components/MatchWizard';

import { mockDB } from '../services/mockDatabase';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const Home = () => {
    const navigate = useNavigate();
    const { currentUserId } = useAuth();
    const [showWizard, setShowWizard] = useState(false);
    const [matchResult, setMatchResult] = useState(null);

    const handleWizardComplete = (answers) => {
        // Mock matching algorithm: just pick a random teacher for now
        // In real app: match tags in 'answers' with teacher.tags
        const teachers = mockDB.getTeachers();
        const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)];

        setMatchResult(randomTeacher);

        // Simulate "Thinking" delay
        toast.success("¡Hemos encontrado tu mentor ideal!");
    };

    const confirmMatch = () => {
        if (!matchResult) return;

        // Auto-create request
        // For demo purposes, we can even AUTO-APPROVE to show the room immediately?
        // Let's stick to standard flow: Create Request -> Go to Chat

        const req = mockDB.createRequest(currentUserId, matchResult.id, "Hola, me gustaría tomar clases contigo.");

        // Optional: Auto-approve for demo smoothness if user is 'student1'
        // mockDB.updateRequestStatus(currentUserId, matchResult.id, 'approved'); 

        navigate(`/chat/${matchResult.id}`);
    };

    const stats = [
        { icon: <Users size={20} />, value: "2K+", label: "Alumnos" },
        { icon: <Award size={20} />, value: "15+", label: "Grandes Maestros" },
        { icon: <Zap size={20} />, value: "24h", label: "Respuesta media" }
    ];

    return (
        <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-20 left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none animate-float" style={{ animationDelay: '0s' }}></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }}></div>

            {!showWizard && !matchResult ? (
                <div className="max-w-4xl w-full text-center z-10 space-y-12 animate-enter">

                    {/* Hero Text */}
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-gold/20 text-gold/90 text-xs font-bold uppercase tracking-widest shadow-lg shadow-gold/5 mb-4 animate-float">
                            <Sparkles size={14} /> La plataforma #1 de Ajedrez Premium
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter leading-tight text-white mb-6">
                            Domina el <span className="text-gradient-gold glow-text">Tablero</span>
                        </h1>

                        <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
                            Conecta con Grandes Maestros de élite. Clases personalizadas, análisis profundos y una experiencia visual de otro nivel.
                        </p>
                    </div>

                    {/* Main Action */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={() => setShowWizard(true)}
                            className="group relative px-10 py-5 bg-white text-black rounded-2xl font-black text-xl tracking-tight hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
                            <span className="relative flex items-center gap-3">
                                ENCONTRAR MENTOR <Play size={24} fill="currentColor" />
                            </span>
                        </button>
                        <p className="text-sm text-text-muted opacity-60">Sin compromiso • Cancelación gratuita</p>
                    </div>

                    {/* Social Proof / Stats */}
                    <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-8 border-t border-white/5">
                        {stats.map((stat, i) => (
                            <div key={i} className="flex flex-col items-center space-y-1 group">
                                <div className="p-3 rounded-full bg-white/5 text-gold mb-2 group-hover:scale-110 transition-transform">{stat.icon}</div>
                                <span className="text-2xl font-bold text-white">{stat.value}</span>
                                <span className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                </div>
            ) : matchResult ? (
                // MATCH RESULT VIEW
                <div className="max-w-md w-full animate-enter z-20">
                    <div className="glass-panel p-8 rounded-3xl text-center space-y-6 border border-gold/30 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                        <div className="inline-block p-4 rounded-full bg-gold/10 border border-gold/30 mb-2">
                            <Award size={48} className="text-gold" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">¡Match Encontrado!</h2>
                            <p className="text-text-muted">Basado en tus objetivos, te recomendamos a:</p>
                        </div>

                        <div className="bg-black/30 p-4 rounded-xl border border-white/10 flex items-center gap-4 text-left hover:border-gold/30 transition-colors cursor-pointer" onClick={confirmMatch}>
                            <img src={matchResult.image} alt={matchResult.name} className="w-16 h-16 rounded-full object-cover border-2 border-gold/50" />
                            <div>
                                <h3 className="text-lg font-bold text-white">{matchResult.name}</h3>
                                <p className="text-gold font-mono text-sm">ELO {matchResult.elo}</p>
                                <div className="flex gap-1 mt-1">
                                    {matchResult.tags.slice(0, 2).map(t => (
                                        <span key={t} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-text-secondary">{t}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setMatchResult(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-text-muted hover:text-white hover:bg-white/5 transition-colors font-bold text-sm">
                                Volver
                            </button>
                            <button onClick={confirmMatch} className="flex-1 py-3 rounded-xl bg-gold text-black hover:bg-gold-hover font-bold text-sm shadow-lg hover:shadow-gold/20 transition-all">
                                Conectar
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-2xl animate-enter relative z-20">
                    <button
                        onClick={() => setShowWizard(false)}
                        className="mb-8 text-text-muted hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors"
                    >
                        ← Volver al inicio
                    </button>
                    <div className="glass-panel rounded-3xl p-1 overflow-hidden shadow-2xl">
                        <MatchWizard onComplete={handleWizardComplete} onCancel={() => setShowWizard(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
