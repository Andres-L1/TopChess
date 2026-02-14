import React, { useState } from 'react';
import { BookOpen, Layers, MessageSquare, Plus, ChevronRight, Hash, Brain, Sword, Trophy } from 'lucide-react';
import MoveHistory from '../../../components/MoveHistory';
import CapturedPieces from '../../../components/CapturedPieces';
import ClassroomChat from './ClassroomChat';
import { Message, GameState, Teacher } from '../../../types/index';

interface ClassroomSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isSidePanelOpen: boolean;
    messages: Message[];
    userRole: string;
    onSendMessage: (text: string) => void;
    gameState: GameState;
    roomChapters: any[];
    activeChapterIndex: number;
    onLoadChapter: (idx: number) => Promise<void>;
    currentComment: string;
    lichessStudies: any[];
    onImportStudy: (id: string, name: string) => Promise<void>;
    teacherProfile: Teacher | null;
    onInjectPgnFen: (val: string) => Promise<void>;
}

const ClassroomSidebar: React.FC<ClassroomSidebarProps> = ({
    activeTab,
    setActiveTab,
    isSidePanelOpen,
    messages,
    userRole,
    onSendMessage,
    gameState,
    roomChapters,
    activeChapterIndex,
    onLoadChapter,
    currentComment,
    lichessStudies,
    onImportStudy,
    teacherProfile,
    onInjectPgnFen
}) => {
    const [studyId, setStudyId] = useState('');
    const [studyName, setStudyName] = useState('');
    const [pgnInput, setPgnInput] = useState('');

    if (!isSidePanelOpen) return null;

    return (
        <aside className="flex-none lg:w-[450px] bg-black/40 backdrop-blur-3xl border-l border-white/5 flex flex-col min-h-0 relative z-40 overflow-hidden shadow-2xl">
            {/* Tab Navigation */}
            <div className="flex p-2 bg-white/5 gap-1 shrink-0">
                {[
                    { id: 'game', icon: Layers, label: 'Juego' },
                    { id: 'library', icon: BookOpen, label: 'Estudios' },
                    { id: 'chat', icon: MessageSquare, label: 'Chat' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? 'bg-gold text-black shadow-lg shadow-gold/20'
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon size={14} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-6">
                {activeTab === 'game' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* History Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-gold">
                                <Sword size={16} />
                                <h3 className="text-xs font-black uppercase tracking-widest">Historial de Partida</h3>
                            </div>
                            <div className="bg-white/5 rounded-3xl border border-white/5 p-4 overflow-hidden">
                                <MoveHistory moves={gameState.history} />
                            </div>
                        </section>

                        {/* Captured Pieces */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-gold">
                                <Trophy size={16} />
                                <h3 className="text-xs font-black uppercase tracking-widest">Material Capturado</h3>
                            </div>
                            <div className="bg-white/5 rounded-3xl border border-white/5 p-6 backdrop-blur-xl">
                                <CapturedPieces fen={gameState.fen} orientation={gameState.orientation} />
                            </div>
                        </section>

                        {/* Comment Section (Teacher) */}
                        {currentComment && (
                            <section className="space-y-4 animate-in zoom-in duration-500">
                                <div className="flex items-center gap-2 text-gold">
                                    <Brain size={16} />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Análisis del Maestro</h3>
                                </div>
                                <div className="bg-gold/10 p-5 rounded-3xl border border-gold/20 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
                                    <p className="text-sm text-gold/90 italic leading-relaxed font-medium">
                                        "{currentComment}"
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* PGN/FEN Injection (Teacher Only) */}
                        {userRole === 'teacher' && (
                            <section className="space-y-4 pt-6 mt-6 border-t border-white/5">
                                <div className="flex items-center gap-2 text-gold/60">
                                    <Plus size={16} />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Inyectar PGN/FEN</h3>
                                </div>
                                <div className="space-y-3">
                                    <textarea
                                        value={pgnInput}
                                        onChange={(e) => setPgnInput(e.target.value)}
                                        placeholder="Pegar PGN o FEN aquí..."
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-gold/50 outline-none h-32 custom-scrollbar resize-none placeholder:text-white/10 transition-all font-mono"
                                    />
                                    <button
                                        onClick={async () => {
                                            await onInjectPgnFen(pgnInput);
                                            setPgnInput('');
                                        }}
                                        className="w-full py-4 bg-gold/10 hover:bg-gold text-gold hover:text-black rounded-2xl text-xs font-black uppercase tracking-widest border border-gold/20 transition-all"
                                    >
                                        Inyectar al Tablero
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {activeTab === 'library' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        {/* Selected Chapters */}
                        {roomChapters.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-gold">
                                    <Hash size={16} />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Capítulos de la Clase</h3>
                                </div>
                                <div className="grid gap-2">
                                    {roomChapters.map((ch, idx) => (
                                        <button
                                            key={idx}
                                            disabled={userRole !== 'teacher'}
                                            onClick={() => onLoadChapter(idx)}
                                            className={`p-4 rounded-2xl text-left text-sm transition-all flex items-center justify-between border group ${activeChapterIndex === idx
                                                ? 'bg-gold text-black border-gold shadow-lg shadow-gold/20'
                                                : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10 hover:border-gold/30 hover:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${activeChapterIndex === idx ? 'bg-black text-gold' : 'bg-white/10'}`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="font-bold truncate max-w-[200px]">{ch.name}</span>
                                            </div>
                                            {activeChapterIndex === idx && <ChevronRight size={16} />}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Import Lichess Study (Teacher Only) */}
                        {userRole === 'teacher' && (
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-gold">
                                    <BookOpen size={16} />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Importar de Lichess</h3>
                                </div>

                                <div className="bg-black/60 rounded-3xl border border-white/5 p-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Nombre del Estudio</p>
                                            <input
                                                type="text"
                                                value={studyName}
                                                onChange={(e) => setStudyName(e.target.value)}
                                                placeholder="Ej: Aperturas Siciliana"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:border-gold/50 outline-none placeholder:text-white/10 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Identificador Lichess</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={studyId}
                                                    onChange={(e) => setStudyId(e.target.value)}
                                                    placeholder="ID (Ej: 8uI0O873)"
                                                    className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:border-gold/50 outline-none placeholder:text-white/10 transition-all font-mono"
                                                />
                                                <button
                                                    onClick={() => {
                                                        onImportStudy(studyId, studyName);
                                                        setStudyId('');
                                                        setStudyName('');
                                                    }}
                                                    className="px-6 bg-gold hover:bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95"
                                                >
                                                    Importar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Access from Profile */}
                                    {teacherProfile?.lichessAccessToken && (
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 ml-2">Estudios de tu Perfil</p>
                                            <div className="space-y-2">
                                                {lichessStudies.slice(0, 5).map((study) => (
                                                    <button
                                                        key={study.id}
                                                        onClick={() => onImportStudy(study.id, study.name)}
                                                        className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-gold/30 hover:bg-gold/5 text-left text-sm text-white/60 hover:text-gold transition-all flex items-center gap-3 group"
                                                    >
                                                        <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <span className="font-medium truncate">{study.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {activeTab === 'chat' && (
                    <ClassroomChat
                        messages={messages}
                        userRole={userRole}
                        onSendMessage={onSendMessage}
                    />
                )}
            </div>
        </aside>
    );
};

export default ClassroomSidebar;
