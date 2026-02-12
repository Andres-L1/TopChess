import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockDB } from '../services/mockDatabase';
import { AuthContext } from '../App';
import Board from '../components/Board';
// LiveKit imports
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

import ChessRules from '../components/ChessRules';
import Logo from '../components/Logo';
import MoveHistory from '../components/MoveHistory';
import CapturedPieces from '../components/CapturedPieces';
import { MessageSquare, Mic, BookOpen, LogOut, ChevronRight, ScrollText } from 'lucide-react';

const Classroom = () => {
    const { teacherId } = useParams();
    const { userRole, currentUserId } = React.useContext(AuthContext);
    const [token, setToken] = useState("");
    const [activeTab, setActiveTab] = useState('game'); // Default to Game tab
    const [gameState, setGameState] = useState({
        fen: 'start',
        history: [],
        turn: 'w',
        isGameOver: false,
        orientation: 'white'
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (userRole === 'student') {
            const s = mockDB.getRequestStatus(currentUserId, teacherId);
            if (s !== 'approved') {
                alert("Debes solicitar acceso al profesor primero.");
                navigate(`/chat/${teacherId}`);
                return;
            }
        }
        setToken("ey_MOCK_TOKEN_FOR_MVP_PURPOSES_ONLY_ey");
    }, [userRole, currentUserId, teacherId, navigate]);

    const handleGameStateChange = (newState) => {
        setGameState(prev => ({ ...prev, ...newState }));
    };

    if (!token) return (
        <div className="flex flex-col items-center justify-center h-screen bg-dark-bg text-gold font-bold uppercase tracking-widest text-xs animate-pulse gap-4">
            <Logo className="w-16 h-16 animate-bounce" />
            <span>Conectando...</span>
        </div>
    );

    const TabButton = ({ id, icon: Icon, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 md:py-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 rounded-lg transition-all duration-300 border ${activeTab === id ? 'bg-gold/10 border-gold/40 text-gold shadow-[0_0_15px_rgba(212,175,55,0.1)]' : 'border-transparent text-text-muted hover:text-text-primary hover:bg-white/5'}`}
        >
            <Icon size={16} strokeWidth={2} />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="flex flex-col h-[100dvh] bg-dark-bg overflow-hidden text-text-primary font-sans selection:bg-gold selection:text-black">
            {/* Header - Luxury Minimalist */}
            <div className="flex-none h-14 bg-dark-bg border-b border-white/5 flex items-center justify-between px-4 md:px-6 z-10 shadow-lg relative">
                {/* Gold Shine on Bottom Border */}
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-50"></div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                        <Logo className="w-8 h-8 text-gold drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]" />
                        <h1 className="hidden md:block font-bold text-lg tracking-tighter text-white">
                            TOP<span className="text-gold font-light">CHESS</span>
                        </h1>
                    </div>
                    <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></span>
                        <h2 className="text-xs font-medium text-text-secondary uppercase tracking-widest">
                            Aula <span className="text-white font-bold">{teacherId}</span>
                        </h2>
                    </div>
                </div>

                <button
                    onClick={() => navigate(userRole === 'teacher' ? '/dashboard' : '/')}
                    className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/20 transition-all hover:border-red-500/40"
                >
                    <LogOut size={12} />
                    <span className="hidden md:inline">Salir</span>
                </button>
            </div>

            {/* Main Content Areas */}
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">

                {/* BOARD AREA */}
                <div className="flex-grow flex flex-col items-center justify-center bg-[#0a0a0a] relative md:border-r border-white/5">
                    {/* Subtle Radial Gradient Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-20 pointer-events-none"></div>

                    <div className="w-full h-full p-2 md:p-8 flex items-center justify-center z-10">
                        <Board teacherId={teacherId} onGameStateChange={handleGameStateChange} />
                    </div>
                </div>

                {/* RIGHT PANEL - Glassmorphism */}
                <div className="flex-none h-[35vh] md:h-auto md:w-[400px] bg-dark-panel/95 backdrop-blur-xl flex flex-col border-t md:border-t-0 border-white/5 relative z-20 shadow-2xl">

                    {/* Tab Navigation */}
                    <div className="flex p-3 gap-2 bg-dark-bg/50 border-b border-white/5">
                        <TabButton id="game" icon={ScrollText} label="Partida" />
                        <TabButton id="chat" icon={MessageSquare} label="Chat" />
                        <TabButton id="audio" icon={Mic} label="Audio" />
                        <TabButton id="rules" icon={BookOpen} label="Reglas" />
                    </div>

                    {/* Content Area */}
                    <div className="flex-grow overflow-hidden bg-transparent relative">
                        {activeTab === 'game' && (
                            <div className="h-full flex flex-col p-4 gap-4 animate-fade-in">
                                {/* Captured Pieces */}
                                <div className="flex-none">
                                    <h3 className="text-[10px] font-bold text-gold uppercase tracking-widest mb-2 opacity-80">Material</h3>
                                    <CapturedPieces fen={gameState.fen} orientation={gameState.orientation} />
                                </div>
                                {/* Move History */}
                                <div className="flex-grow overflow-hidden relative">
                                    <MoveHistory moves={gameState.history} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'audio' && (
                            <div className="h-full flex flex-col justify-center items-center p-8 text-center animate-fade-in relative">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,175,55,0.05)_0%,_transparent_70%)]"></div>

                                <div className="w-24 h-24 rounded-full bg-dark-bg border border-gold/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative group">
                                    <div className="absolute inset-0 rounded-full border border-gold/10 animate-ping opacity-20"></div>
                                    <Mic size={32} className="text-gold opacity-90 group-hover:scale-110 transition-transform duration-500" />
                                </div>

                                <h3 className="text-gold font-bold text-lg uppercase tracking-widest mb-2 text-shadow-sm">Canal de Voz</h3>
                                <p className="text-text-secondary text-xs font-light tracking-wide mb-6">Conexión de alta fidelidad establecida</p>

                                <div className="flex flex-wrap justify-center gap-3">
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-text-muted border border-white/5">Opus 48kHz</span>
                                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-text-muted border border-white/5">Stereo</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="h-full flex flex-col animate-fade-in relative bg-dark-bg/30">
                                <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar">
                                    <div className="text-xs md:text-sm p-3 rounded-lg bg-dark-bg border border-gold/10 shadow-sm relative group hover:border-gold/30 transition-colors">
                                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gold rounded-l-lg"></div>
                                        <span className="font-bold text-gold block text-[10px] uppercase mb-1 tracking-wider flex items-center gap-1">
                                            GM {teacherId} <span className="text-[8px] bg-gold text-black px-1 rounded font-black">PRO</span>
                                        </span>
                                        <span className="text-text-secondary leading-relaxed font-light">Bienvenidos a la clase. Hoy analizaremos la estructura de peones en la Siciliana.</span>
                                    </div>

                                    <div className="text-xs md:text-sm p-3 rounded-lg bg-white/5 border border-white/5 ml-8 relative">
                                        <span className="font-bold text-blue-400 block text-[10px] uppercase mb-1 tracking-wider text-right">Tú</span>
                                        <span className="text-text-primary block text-right">¿Podemos ver la variante Najdorf?</span>
                                    </div>
                                </div>
                                <div className="p-3 border-t border-white/5 bg-dark-bg/80 backdrop-blur-md">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Escribe un mensaje..."
                                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-4 pr-10 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-gold/50 focus:bg-white/10 transition-all placeholder-text-muted/50"
                                        />
                                        <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gold hover:text-white transition-colors">
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'rules' && (
                            <div className="h-full overflow-hidden animate-fade-in">
                                <ChessRules />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Classroom;
