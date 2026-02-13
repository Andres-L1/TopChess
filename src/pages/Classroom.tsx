import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import Board from '../components/Board';
// LiveKit imports
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

import ChessRules from '../components/ChessRules';
import Logo from '../components/Logo';
import MoveHistory from '../components/MoveHistory';
import CapturedPieces from '../components/CapturedPieces';
import { MessageSquare, BookOpen, LogOut, ChevronRight, ScrollText, DollarSign, Send, Activity } from 'lucide-react';
import { GameState, Teacher, Message } from '../types/index';
import toast from 'react-hot-toast';
import { Chess } from 'chess.js';

const Classroom: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const { userRole, currentUserId } = useAuth();
    const [token, setToken] = useState("");
    const [activeTab, setActiveTab] = useState('game');
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
    const [teacherProfile, setTeacherProfile] = useState<Teacher | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");

    const [gameState, setGameState] = useState<GameState>({
        fen: 'start',
        history: [],
        turn: 'w',
        isGameOver: false,
    });

    const navigate = useNavigate();
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);

    useEffect(() => {
        const initClassroom = async () => {
            if (userRole === 'student') {
                const s = await firebaseService.getRequestStatus(currentUserId, teacherId!);
                if (s !== 'approved') {
                    toast.error("Debes solicitar acceso al profesor primero.");
                    navigate(`/chat/${teacherId}`);
                    return;
                }
            }

            // Fetch Teacher for Profile Info
            const profile = await firebaseService.getTeacherById(teacherId!);
            setTeacherProfile(profile);

            // Fetch Chat for Classroom
            const uid1 = userRole === 'student' ? currentUserId : teacherId!;
            const uid2 = userRole === 'student' ? teacherId! : currentUserId;

            const unsubChat = firebaseService.subscribeToChat(uid1, uid2, (msgs) => {
                setMessages(msgs);
            });

            setToken("ey_MOCK_TOKEN_FOR_MVP_PURPOSES_ONLY_ey");

            return () => unsubChat();
        };

        if (currentUserId && teacherId) {
            initClassroom();
        }
    }, [userRole, currentUserId, teacherId, navigate]);

    const handleGameStateChange = (newState: Partial<GameState>) => {
        setGameState(prev => ({ ...prev, ...newState }));
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        const msg: Omit<Message, 'id'> = {
            studentId: userRole === 'student' ? currentUserId : teacherId!,
            teacherId: userRole === 'student' ? teacherId! : currentUserId,
            text: inputText,
            sender: userRole || 'student',
            timestamp: Date.now(),
            type: 'text'
        };
        await firebaseService.sendMessage(msg);
        setInputText("");
    };

    if (!token) return (
        <div className="flex flex-col items-center justify-center h-screen bg-dark-bg text-gold font-bold uppercase tracking-widest text-xs animate-pulse gap-4">
            <Logo className="w-16 h-16 animate-bounce" />
            <span>Conectando Al Aula...</span>
        </div>
    );

    const TabButton = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
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
                            Aula <span className="text-white font-bold">{teacherProfile?.name || teacherId}</span>
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${isVideoEnabled ? 'bg-gold text-black border-gold' : 'bg-white/5 text-text-muted border-white/10 hover:border-white/20'}`}
                    >
                        <Activity size={12} />
                        <span className="hidden md:inline">{isVideoEnabled ? 'Cerrar Videollamada' : 'Iniciar Clase (Video)'}</span>
                    </button>

                    <button
                        onClick={() => navigate(userRole === 'teacher' ? '/dashboard' : '/student-dashboard')}
                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-1.5 px-3 rounded text-[10px] font-bold uppercase tracking-wider border border-red-500/20 transition-all hover:border-red-500/40"
                    >
                        <LogOut size={12} />
                        <span className="hidden md:inline">Salir</span>
                    </button>
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">

                {/* BOARD AREA */}
                <div className="flex-grow flex flex-col items-center justify-center bg-[#0a0a0a] relative md:border-r border-white/5 p-2 md:p-4 transition-all duration-300 overflow-hidden">
                    {/* LiveKit Video Elements (Overlay) */}
                    {isVideoEnabled && token && (
                        <div className="absolute top-4 right-4 z-50 w-64 h-48 bg-black/80 rounded-2xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
                            <LiveKitRoom
                                video={true}
                                audio={true}
                                token={token}
                                serverUrl="wss://topchess-demo-call.livekit.cloud"
                                style={{ height: '100%' }}
                            >
                                <div className="flex items-center justify-center h-full text-[10px] font-mono text-gold animate-pulse">
                                    Conectando al servidor multimedia...
                                </div>
                            </LiveKitRoom>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 to-transparent opacity-40 pointer-events-none"></div>

                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className={`absolute right-0 top-1/2 -translate-y-1/2 z-50 bg-dark-panel border-y border-l border-white/10 text-gold p-2 rounded-l-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:bg-gold hover:text-black transition-all duration-300
                            ${!isSidePanelOpen ? 'translate-x-0' : 'translate-x-full opacity-0 pointer-events-none'}
                        `}
                    >
                        <MessageSquare size={20} />
                    </button>

                    <div className="flex flex-col w-full max-w-[100%] md:max-w-3xl h-full max-h-[calc(100dvh-60px)] justify-center relative z-10 transition-all duration-300 gap-2 md:gap-4">
                        {/* Top Profile (Opponent/Teacher) */}
                        <div className="flex-none flex items-center justify-between px-3 py-2 text-text-secondary bg-black/40 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg w-full">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center shadow-lg relative overflow-hidden">
                                    {teacherProfile?.image ? (
                                        <img src={teacherProfile.image} alt={teacherProfile.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gold font-bold text-xs md:text-sm">GM</span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs md:text-sm font-bold text-white tracking-wide flex items-center gap-2">
                                        {teacherProfile?.name || 'Profesor'}
                                        <span className="px-1 py-0.5 bg-gold/20 text-gold text-[8px] rounded font-black tracking-widest border border-gold/20">GM</span>
                                    </span>
                                    <span className="text-[10px] text-gold/80 font-mono flex items-center gap-1">
                                        {teacherProfile?.elo || 2400} ELO
                                    </span>
                                </div>
                            </div>
                            <div className="text-xs md:text-sm font-mono text-white/90 bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">00:00</div>
                        </div>

                        {/* Chess Board */}
                        <div className="flex-grow flex items-center justify-center w-full min-h-0">
                            <div className="aspect-square h-full max-h-full rounded-lg shadow-2xl shadow-black/80 overflow-hidden border border-white/5">
                                <Board teacherId={teacherId!} onGameStateChange={handleGameStateChange} />
                            </div>
                        </div>

                        {/* Bottom Profile (You) */}
                        <div className="flex-none flex items-center justify-between px-3 py-2 text-text-secondary bg-black/40 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg w-full mt-auto">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 flex items-center justify-center shadow-lg">
                                    <span className="text-green-500 font-bold text-xs md:text-sm">{currentUserId?.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs md:text-sm font-bold text-white tracking-wide">Tú</span>
                                    <span className="text-[10px] text-green-400/80 font-mono">MVP Player</span>
                                </div>
                            </div>
                            <div className="text-xs md:text-sm font-mono text-white bg-black/50 px-3 py-1.5 rounded-lg border-b-2 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]">00:00</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className={`flex-none bg-dark-panel/95 backdrop-blur-xl flex flex-col border-t md:border-t-0 md:border-l border-white/5 relative z-20 shadow-2xl transition-all duration-300 ease-in-out
                    ${isSidePanelOpen ? 'h-[40vh] md:h-auto md:w-[400px] opacity-100' : 'h-0 md:h-auto md:w-0 overflow-hidden opacity-0'}
                `}>

                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className="hidden md:flex absolute top-4 -left-4 bg-dark-panel border border-white/5 border-r-0 text-gold p-1.5 rounded-l-lg shadow-lg z-50 hover:bg-white/5 transition-colors items-center justify-center"
                    >
                        <ChevronRight size={16} />
                    </button>

                    <div className="flex p-3 gap-2 bg-dark-bg/50 border-b border-white/5 overflow-x-auto custom-scrollbar">
                        <TabButton id="game" icon={ScrollText} label="Partida" />
                        <TabButton id="chat" icon={MessageSquare} label="Chat" />
                        <TabButton id="tools" icon={BookOpen} label="Estudios" />
                    </div>

                    <div className="flex-grow overflow-hidden bg-transparent relative">
                        {activeTab === 'game' && (
                            <div className="h-full flex flex-col p-4 gap-4 animate-fade-in relative">
                                <div className="flex-none">
                                    <h3 className="text-[10px] font-bold text-gold uppercase tracking-widest mb-2 opacity-80">Material</h3>
                                    <CapturedPieces fen={gameState.fen} orientation={gameState.orientation || 'white'} />
                                </div>
                                <div className="flex-grow overflow-hidden relative">
                                    <MoveHistory moves={gameState.history} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="h-full flex flex-col animate-fade-in relative bg-dark-bg/30">
                                <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex flex-col ${msg.sender === userRole ? 'items-end' : 'items-start'}`}>
                                            <div className={`text-xs p-3 rounded-xl max-w-[90%] ${msg.sender === userRole ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' : 'bg-white/5 text-text-secondary border border-white/10'}`}>
                                                <span className="font-bold text-[9px] uppercase tracking-wider mb-1 block opacity-60">
                                                    {msg.sender === 'teacher' ? (teacherProfile?.name || 'Profesor') : 'Estudiante'}
                                                </span>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-white/5 bg-dark-bg/80 backdrop-blur-md flex gap-2">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Escribe un mensaje..."
                                        className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-gold/50 transition-all"
                                    />
                                    <button onClick={handleSendMessage} className="p-2 bg-gold text-black rounded-xl hover:bg-gold-hover transition-colors">
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tools' && (
                            <div className="h-full p-4 animate-fade-in space-y-4">
                                <div className="bg-dark-bg p-4 rounded-2xl border border-white/5 space-y-4">
                                    <h3 className="text-gold font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={14} /> Importar Lichess
                                    </h3>
                                    <div className="space-y-3">
                                        <p className="text-[10px] text-text-muted">Carga el PGN de cualquier partida para analizar.</p>
                                        <textarea
                                            id="pgn-input"
                                            placeholder="[Event '...'] 1. e4 e5..."
                                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-gold/50 outline-none resize-none"
                                        />
                                        <button
                                            onClick={() => {
                                                const pgn = (document.getElementById('pgn-input') as HTMLTextAreaElement).value;
                                                if (!pgn) return;

                                                try {
                                                    const game = new Chess();
                                                    game.loadPgn(pgn);

                                                    const fen = game.fen();
                                                    const history = game.history();

                                                    firebaseService.updateRoom(teacherId!, {
                                                        pgn,
                                                        fen,
                                                        history,
                                                        lastMove: undefined // Clear last move highlight
                                                    });
                                                    toast.success("PGN cargado en el aula");
                                                } catch (e) {
                                                    console.error(e);
                                                    toast.error("Formatos PGN inválido");
                                                }
                                            }}
                                            className="w-full py-3 bg-gold text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-gold/10"
                                        >
                                            Cargar al Tablero
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Classroom;
