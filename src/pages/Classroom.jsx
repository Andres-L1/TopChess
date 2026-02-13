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
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true); // Zen mode toggle
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

                {/* BOARD AREA - Cockpit Style */}
                <div className="flex-grow flex flex-col items-center justify-center bg-[#0a0a0a] relative md:border-r border-white/5 p-2 md:p-4 transition-all duration-300 overflow-hidden">
                    {/* Background Grid/Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 to-transparent opacity-40 pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>

                    {/* Toggle Button - Floating on the right edge of the board area */}
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-dark-panel border-y border-l border-white/10 text-gold p-2 rounded-l-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-gold hover:text-black transition-all duration-300
                            ${!isSidePanelOpen ? 'translate-x-0' : 'translate-x-full opacity-0 pointer-events-none'}
                        `}
                        title="Mostrar Herramientas"
                    >
                        <MessageSquare size={20} />
                    </button>

                    {/* Main Game Container - Constrained to prevent Clipping */}
                    <div className="flex flex-col w-full max-w-[100%] md:max-w-3xl h-full max-h-[calc(100dvh-60px)] justify-center relative z-10 transition-all duration-300 gap-2 md:gap-4">

                        {/* Top Player (Opponent/Teacher) */}
                        <div className="flex-none flex items-center justify-between px-3 py-2 text-text-secondary bg-black/40 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center shadow-lg relative">
                                    <span className="text-gold font-bold text-xs md:text-sm">{teacherId?.substring(0, 2).toUpperCase()}</span>
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-dark-bg border border-white/10 flex items-center justify-center rounded-full">
                                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs md:text-sm font-bold text-white tracking-wide flex items-center gap-2">
                                        GM {teacherId}
                                        <span className="px-1 py-0.5 bg-gold/20 text-gold text-[8px] rounded font-black tracking-widest border border-gold/20">PRO</span>
                                    </span>
                                    <span className="text-[10px] text-gold/80 font-mono flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full border border-gold/50"></span>
                                        2850 ELO
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs md:text-sm font-mono text-white/90 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">10:00</div>
                        </div>

                        {/* Chess Board Container - Auto Scale */}
                        <div className="flex-grow flex items-center justify-center w-full min-h-0">
                            <div className="aspect-square h-full max-h-full rounded-lg shadow-2xl shadow-black/80 overflow-hidden border border-white/5">
                                <Board teacherId={teacherId} onGameStateChange={handleGameStateChange} />
                            </div>
                        </div>

                        {/* Bottom Player (You) */}
                        <div className="flex-none flex items-center justify-between px-3 py-2 text-text-secondary bg-black/40 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg w-full mt-auto">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 flex items-center justify-center shadow-lg">
                                    <span className="text-green-500 font-bold text-xs md:text-sm">{currentUserId?.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs md:text-sm font-bold text-white tracking-wide">{currentUserId || 'Tú'}</span>
                                    <span className="text-[10px] text-green-400/80 font-mono">1500 ELO</span>
                                </div>
                            </div>
                            <div className="text-xs md:text-sm font-mono text-white bg-black/50 px-3 py-1.5 rounded-lg border-b-2 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]">09:45</div>
                        </div>

                    </div>
                </div>

                {/* RIGHT PANEL - Glassmorphism, Collapsible */}
                <div className={`flex-none bg-dark-panel/95 backdrop-blur-xl flex flex-col border-t md:border-t-0 md:border-l border-white/5 relative z-20 shadow-2xl transition-all duration-300 ease-in-out
                    ${isSidePanelOpen ? 'h-[35vh] md:h-auto md:w-[400px] opacity-100' : 'h-0 md:h-auto md:w-0 overflow-hidden opacity-0'}
                `}>

                    {/* Close Button (Internal) */}
                    <button
                        onClick={() => setIsSidePanelOpen(false)}
                        className="absolute top-2 right-2 text-text-muted hover:text-white p-2 z-50 md:hidden"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* Toggle Button for Desktop (Collapsing) */}
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className="hidden md:flex absolute top-4 -left-4 bg-dark-panel border border-white/5 border-r-0 text-gold p-1.5 rounded-l-lg shadow-lg z-50 hover:bg-white/5 transition-colors items-center justify-center"
                        title="Ocultar Herramientas"
                    >
                        <ChevronRight size={16} />
                    </button>

                    {/* Tab Navigation */}
                    <div className="flex p-3 gap-2 bg-dark-bg/50 border-b border-white/5 overflow-x-auto custom-scrollbar">
                        <TabButton id="game" icon={ScrollText} label="Partida" />
                        <TabButton id="chat" icon={MessageSquare} label="Chat" />
                        <TabButton id="analysis" icon={BookOpen} label="Análisis" />
                        <TabButton id="tools" icon={BookOpen} label="Herramientas" />
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

                        {activeTab === 'analysis' && (
                            <div className="h-full flex flex-col p-4 gap-6 animate-fade-in">
                                <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-4">
                                    <h3 className="text-gold font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={14} /> Importar Estudio
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="text-[10px] text-text-muted">Pega la URL de un estudio de Lichess para cargar la partida.</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                id="lichess-url"
                                                placeholder="https://lichess.org/study/..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-gold/50 outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    const url = document.getElementById('lichess-url').value;
                                                    if (!url) return;
                                                    // Simple fetch logic
                                                    const match = url.match(/study\/([a-zA-Z0-9]+)/);
                                                    if (match) {
                                                        const studyId = match[1];
                                                        // Lichess API usually allows direct PGN export
                                                        // CORS might block, let's try opening in new tab or mock import
                                                        // Real implementation: Proxy or serverless function
                                                        alert(`Simulando importación del estudio ${studyId}... (CORS previene fetch directo en cliente puro)`);
                                                        // Mock loading a famous game PGN
                                                        const mockPgn = '[Event "Mock Game"]\n[Site "Lichess"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6';
                                                        mockDB.updateRoom(teacherId, { pgn: mockPgn, fen: 'r1bqkbnr/1ppp1ppp/p1n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4' });
                                                    } else {
                                                        alert("URL inválida");
                                                    }
                                                }}
                                                className="px-3 py-1 bg-gold/10 text-gold border border-gold/30 rounded text-xs font-bold hover:bg-gold hover:text-black transition-colors"
                                            >
                                                Cargar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-dark-bg p-4 rounded-xl border border-white/5 space-y-4">
                                    <h3 className="text-blue-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={14} /> Motor de Análisis
                                    </h3>
                                    <div className="p-3 bg-black/20 rounded border border-white/5 flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">Stockfish 16 Lite</span>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="h-24 flex items-center justify-center text-text-muted text-xs italic border border-dashed border-white/10 rounded">
                                        Evaluación: +0.45 (Profundidad 12)
                                    </div>
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
