import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';

import Board, { BoardHandle } from '../components/Board';
import { useClassroom } from './Classroom/hooks/useClassroom';
import ClassroomHeader from './Classroom/components/ClassroomHeader';
import ClassroomPlayerInfo from './Classroom/components/ClassroomPlayerInfo';
import ClassroomSidebar from './Classroom/components/ClassroomSidebar';
import { ChevronRight, ChevronLeft } from 'lucide-react';

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
        gameState,
        handleGameStateChange,
        handleSendMessage,
        loadChapter,
        importStudy,
        injectPgnFen,
        userRole,
        currentUserId
    } = useClassroom(teacherId);

    const [activeTab, setActiveTab] = useState('game');
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const boardRef = useRef<BoardHandle>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const resetStudy = () => {
        boardRef.current?.reset();
    };

    return (
        <div className="h-[100dvh] flex flex-col bg-[#0c0b0a] text-white overflow-hidden selection:bg-gold/30">
            <ClassroomHeader
                isAudioEnabled={isAudioEnabled}
                setIsAudioEnabled={setIsAudioEnabled}
                userRole={userRole}
                teacherId={teacherId || ""}
                onResetStudy={resetStudy}
            />

            <div className="flex-grow flex flex-col lg:flex-row min-h-0 relative">
                <div className="flex-grow flex flex-col min-w-0 bg-[#0c0b0a] relative">
                    <LiveKitRoom
                        video={false}
                        audio={isAudioEnabled}
                        token={token}
                        serverUrl={import.meta.env.VITE_LIVEKIT_URL}
                        connect={isAudioEnabled && !!token}
                        className="flex-grow flex flex-col min-w-0"
                    >
                        <main className="flex-grow p-4 md:p-6 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

                            <div className="w-full max-w-[1200px] flex flex-col gap-6 md:gap-8 relative z-10 h-full justify-center">
                                {/* Top Player Info (Teacher) */}
                                <ClassroomPlayerInfo
                                    type="top"
                                    teacherProfile={teacherProfile}
                                />

                                {/* Interactive Board Section */}
                                <div className="flex-grow flex items-center justify-center min-h-0">
                                    <div className="h-[min(68vh,68vw)] w-[min(68vh,68vw)] relative group flex-none">
                                        <div className="absolute -inset-4 bg-gold/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                        <Board
                                            ref={boardRef}
                                            teacherId={teacherId!}
                                            onGameStateChange={handleGameStateChange}
                                            isAnalysisEnabled={isAnalysisEnabled}
                                        />
                                    </div>
                                </div>

                                {/* Bottom Player Info (Student) */}
                                <ClassroomPlayerInfo
                                    type="bottom"
                                    currentUserId={currentUserId}
                                />
                            </div>
                        </main>
                    </LiveKitRoom>

                    {/* Side Panel Toggle (Desktop) */}
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-gold/10 border border-gold/20 text-gold rounded-full hover:bg-gold/20 transition-all hidden lg:flex items-center justify-center shadow-xl backdrop-blur-md ${isSidePanelOpen ? 'rotate-0' : 'rotate-180'}`}
                    >
                        {isSidePanelOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>

                    {/* Analysis Toggle */}
                    <button
                        onClick={() => setIsAnalysisEnabled(!isAnalysisEnabled)}
                        className={`absolute left-6 bottom-24 lg:bottom-10 z-50 p-3 rounded-2xl border transition-all flex items-center gap-2 group shadow-xl backdrop-blur-md font-black text-[10px] uppercase tracking-widest ${isAnalysisEnabled
                            ? 'bg-gold text-black border-gold shadow-gold/20'
                            : 'bg-black/40 text-white/40 border-white/5 hover:border-gold/30 hover:text-white'
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full ${isAnalysisEnabled ? 'bg-black animate-pulse' : 'bg-white/20'}`} />
                        {isAnalysisEnabled ? 'Análisis ON' : 'Activar Análisis'}
                    </button>
                </div>

                <ClassroomSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isSidePanelOpen={isSidePanelOpen}
                    messages={messages}
                    userRole={userRole}
                    onSendMessage={handleSendMessage}
                    gameState={gameState}
                    roomChapters={roomChapters}
                    activeChapterIndex={activeChapterIndex}
                    onLoadChapter={loadChapter}
                    currentComment={currentComment}
                    lichessStudies={lichessStudies}
                    onImportStudy={importStudy}
                    teacherProfile={teacherProfile}
                    onInjectPgnFen={injectPgnFen}
                />
            </div>
        </div>
    );
};

export default Classroom;
