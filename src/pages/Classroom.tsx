import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePeerAudio } from '../hooks/usePeerAudio';
import Board, { BoardHandle } from '../components/Board';
import { useClassroom } from './Classroom/hooks/useClassroom';
import { useWakeLock } from '../hooks/useWakeLock';
import ClassroomHeader from './Classroom/components/ClassroomHeader';
import ClassroomPlayerInfo from './Classroom/components/ClassroomPlayerInfo';
import ClassroomSidebar from './Classroom/components/ClassroomSidebar';
import {
    ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight,
    FlipHorizontal2,
    BookOpen
} from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

const Classroom: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const {
        token,
        teacherProfile,
        messages,
        lichessStudies,
        roomChapters,
        activeChapterIndex,
        currentComment,
        isAudioEnabled,
        setIsAudioEnabled,
        isAnalysisEnabled,
        setIsAnalysisEnabled,
        roomData,
        gameState,
        handleGameStateChange,
        handleSendMessage,
        loadChapter,
        importStudy,
        injectPgnFen,
        exportCurrentState,
        userRole,
        currentUserId,
        comments,
        activeStudyName
    } = useClassroom(teacherId);

    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
    const boardRef = useRef<BoardHandle>(null);
    const boardAreaRef = useRef<HTMLDivElement>(null);

    // ── Resizer State ──────────────────────────────────────────────────────
    const [sidebarWidth, setSidebarWidth] = useState(360);
    const isDraggingRef = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 280 && newWidth < window.innerWidth * 0.6) {
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useWakeLock();

    // ── Presence Tracking ──────────────────────────────────────────────────
    useEffect(() => {
        if (currentUserId) {
            firebaseService.updateUserPresence(currentUserId, 'in_class').catch(console.error);
        }
        return () => {
            if (currentUserId) {
                firebaseService.updateUserPresence(currentUserId, 'online').catch(console.error);
            }
        };
    }, [currentUserId]);

    // ── Keyboard navigation (← →, Home, End) ─────────────────────────────
    // Keep a ref to gameState to access latest state inside event listeners without re-binding
    const gameStateRef = useRef(gameState);

    // Update ref on every render
    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // ── Keyboard navigation (← →, Home, End) ─────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const currentGameState = gameStateRef.current;
            const len = currentGameState.history.length;
            const cur = currentGameState.currentIndex ?? len - 1;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                boardRef.current?.goToMove(Math.max(-1, cur - 1));
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                boardRef.current?.goToMove(Math.min(len - 1, cur + 1));
            }
            if (e.key === 'Home') {
                e.preventDefault();
                boardRef.current?.goToMove(-1);
            }
            if (e.key === 'End') {
                e.preventDefault();
                boardRef.current?.goToMove(len - 1);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Empty dependency array = stable listener


    // ── Scroll-wheel on board to navigate moves (like Lichess) ───────────
    // Must register with { passive: false } — React's onWheel is passive in modern browsers
    useEffect(() => {
        const el = boardAreaRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => {
            e.preventDefault();
            const len = gameState.history.length;
            const cur = gameState.currentIndex ?? len - 1;
            if (e.deltaY > 0) boardRef.current?.goToMove(Math.min(len - 1, cur + 1));
            else boardRef.current?.goToMove(Math.max(-1, cur - 1));
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, [gameState.history.length, gameState.currentIndex]);


    const resetStudy = useCallback(() => boardRef.current?.reset(), []);

    const len = gameState.history.length;
    const cur = gameState.currentIndex ?? len - 1;

    // ── PeerJS Audio ─────────────────────────────────────────────────────
    const { isConnected, isMuted, toggleMute } = usePeerAudio(
        userRole === 'teacher' ? `teacher-${teacherId}` : `student-${currentUserId}`,
        userRole === 'student' ? `teacher-${teacherId}` : undefined,
        userRole as 'teacher' | 'student',
        isAudioEnabled
    );

    const handleMoveClick = useCallback((idx: number) => boardRef.current?.goToMove(idx), []);

    return (
        <div className="h-[100dvh] flex flex-col bg-[#161512] text-white overflow-hidden selection:bg-gold/30">
            {/* ── Top bar ────────────────────────────────────────────────── */}
            <ClassroomHeader
                isAudioEnabled={isAudioEnabled}
                setIsAudioEnabled={setIsAudioEnabled}
                isConnected={isConnected}
                isMuted={isMuted}
                toggleMute={toggleMute}
                userRole={userRole}
                teacherId={teacherId || ""}
                teacherName={teacherProfile?.name}
                onResetStudy={resetStudy}
            />

            {/* ── Main body ──────────────────────────────────────────────── */}
            <div
                className="flex-grow flex flex-col lg:flex-row min-h-0 overflow-hidden"
                style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
            >

                {/* ── LEFT: board column ─────────────────────────────────── */}
                <div className="flex-grow flex flex-col min-w-0 min-h-0 overflow-hidden">
                    {/* ── Board area (fills left column) ─────────────────── */}
                    <div className="flex-grow flex flex-col min-h-0 px-4 pt-4 pb-0 lg:px-6 lg:pt-6">

                        {/* Opponent (top) */}
                        <div className="flex-none mb-2">
                            <ClassroomPlayerInfo type="top" teacherProfile={teacherProfile} />
                        </div>

                        {/* Board — square, Lichess style */}
                        <div
                            ref={boardAreaRef}
                            className="flex-grow relative min-h-0"
                        >
                            {/* Size wrapper: fills available height staying square */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-full aspect-square max-h-full max-w-full relative">
                                    <Board
                                        ref={boardRef}
                                        teacherId={teacherId!}
                                        onGameStateChange={handleGameStateChange}
                                        isAnalysisEnabled={isAnalysisEnabled}
                                        roomData={roomData}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Self (bottom) */}
                        <div className="flex-none mt-2">
                            <ClassroomPlayerInfo type="bottom" currentUserId={currentUserId} />
                        </div>
                    </div>

                    {/* ── Controls bar (Lichess: below board, always visible) ─ */}
                    <div className="flex-none flex items-center justify-between px-4 lg:px-6 py-3 bg-[#161512] border-t border-white/5">

                        {/* Navigation controls */}
                        <div className="flex items-center gap-1">
                            {/* First move */}
                            <button
                                onClick={() => boardRef.current?.goToMove(-1)}
                                disabled={cur <= -1}
                                title="Primera jugada (Home)"
                                className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronsLeft size={18} />
                            </button>
                            {/* Prev */}
                            <button
                                onClick={() => boardRef.current?.goToMove(Math.max(-1, cur - 1))}
                                disabled={cur <= -1}
                                title="Jugada anterior (←)"
                                className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {/* Next */}
                            <button
                                onClick={() => boardRef.current?.goToMove(Math.min(len - 1, cur + 1))}
                                disabled={cur >= len - 1}
                                title="Siguiente jugada (→)"
                                className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={18} />
                            </button>
                            {/* Last move */}
                            <button
                                onClick={() => boardRef.current?.goToMove(len - 1)}
                                disabled={cur >= len - 1}
                                title="Última jugada (End)"
                                className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>

                        {/* Right: flip + analysis */}
                        <div className="flex items-center gap-2">
                            {/* Flip board */}
                            <button
                                onClick={() => boardRef.current?.toggleOrientation()}
                                title="Girar tablero"
                                className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <FlipHorizontal2 size={16} />
                            </button>

                            {/* Analysis toggle */}
                            <button
                                onClick={() => setIsAnalysisEnabled(!isAnalysisEnabled)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-[10px] font-black uppercase tracking-widest ${isAnalysisEnabled
                                    ? 'bg-gold text-black border-gold shadow-gold/20'
                                    : 'bg-white/5 text-white/40 border-white/5 hover:border-gold/30 hover:text-white'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${isAnalysisEnabled ? 'bg-black animate-pulse' : 'bg-white/20'}`} />
                                {isAnalysisEnabled ? 'Análisis ON' : 'Análisis'}
                            </button>

                            {/* Sidebar toggle (all screens) */}
                            <button
                                onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                                title={isSidePanelOpen ? 'Cerrar panel' : 'Abrir panel'}
                                className={`p-2.5 rounded-lg transition-all ${isSidePanelOpen ? 'text-gold bg-gold/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                            >
                                {isSidePanelOpen ? <ChevronRight size={16} /> : <BookOpen size={16} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── DRAG HANDLE (Desktop) ──────────────────────────────── */}
                <div
                    className="hidden lg:flex w-1.5 cursor-col-resize hover:bg-gold/50 active:bg-gold/80 bg-white/5 transition-colors z-10"
                    onMouseDown={() => {
                        isDraggingRef.current = true;
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                    }}
                />

                {/* ── RIGHT: sidebar ─────────────────────────────────────── */}
                <div className={`flex-none w-full lg:w-[var(--sidebar-width)] bg-[#1b1a17] border-t lg:border-t-0 flex flex-col min-h-0 overflow-hidden transition-all duration-300 ${isSidePanelOpen ? 'h-[40vh] lg:h-auto' : 'h-0 lg:h-auto lg:w-0 lg:hidden'}`}>
                    <ClassroomSidebar
                        isSidePanelOpen={true} // Always render internal content if this wrapper is visible
                        messages={messages}
                        userRole={userRole}
                        onSendMessage={handleSendMessage}
                        gameState={gameState}
                        roomChapters={roomChapters}
                        activeStudyName={activeStudyName}
                        activeChapterIndex={activeChapterIndex}
                        onLoadChapter={loadChapter}
                        currentComment={currentComment}
                        lichessStudies={lichessStudies}
                        onImportStudy={importStudy}
                        teacherProfile={teacherProfile}
                        onInjectPgnFen={injectPgnFen}
                        onMoveClick={handleMoveClick}
                        comments={comments}
                        onExportPgn={exportCurrentState}
                    />
                </div>
            </div>
        </div>
    );
};

export default Classroom;
