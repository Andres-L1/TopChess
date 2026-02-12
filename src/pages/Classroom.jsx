import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Board from '../components/Board';
// LiveKit imports
import {
    LiveKitRoom,
    RoomAudioRenderer,
    ControlBar,
    useTracks,
    LayoutContextProvider
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';

const Classroom = () => {
    const { teacherId } = useParams();
    // In a real app, you would fetch a token from your backend
    const [token, setToken] = useState("");

    // MOCK TOKEN FOR MVP - This will likely fail connection without a real server/token
    // But fulfills the requirement to implement the code structure.
    const serverUrl = "wss://your-livekit-server.io";

    useEffect(() => {
        // Simulate fetching a token
        setToken("ey_MOCK_TOKEN_FOR_MVP_PURPOSES_ONLY_ey");
    }, []);

    if (!token) return <div className="text-center mt-10">Cargando aula...</div>;

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4 pt-4">
            {/* Left/Center: Board Area */}
            <div className="flex-grow bg-[#262421] rounded-lg overflow-hidden flex flex-col shadow-2xl border border-[#302e2b]">
                <div className="flex-grow relative p-4">
                    {/* Board component handles the chess logic and Firebase sync */}
                    <Board teacherId={teacherId} />
                </div>
            </div>

            {/* Right: Audio/Chat Panel */}
            <div className="w-80 flex flex-col gap-4">
                {/* LiveKit Audio Room */}
                <div className="bg-[#262421] border border-[#302e2b] rounded-lg overflow-hidden flex flex-col h-1/3">
                    <div className="bg-[#161512] p-3 border-b border-[#302e2b] flex justify-between items-center">
                        <h3 className="font-bold text-white">Sala de Audio</h3>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-xs text-[#bababa]">En línea</span>
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col justify-center items-center p-4 bg-gradient-to-b from-[#262421] to-[#1a1917]">
                        {/* Conditional Rendering: Real LiveKit Room vs Mock UI */}
                        {(token === "ey_MOCK_TOKEN_FOR_MVP_PURPOSES_ONLY_ey" || serverUrl.includes("your-livekit-server")) ? (
                            <div className="h-full flex flex-col justify-center items-center text-center p-4">
                                <div className="w-16 h-16 bg-[#363431] rounded-full mx-auto flex items-center justify-center mb-2 border-2 border-[#bf811d] animate-pulse">
                                    <span className="text-2xl">🎤</span>
                                </div>
                                <p className="text-sm text-[#bababa] font-bold">Modo Demo (Audio Simulado)</p>
                                <p className="text-xs text-[#666] mt-2">Conectado a: {teacherId}</p>
                            </div>
                        ) : (
                            <LiveKitRoom
                                video={false}
                                audio={true}
                                token={token}
                                serverUrl={serverUrl}
                                data-lk-theme="default"
                                style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                                onError={(e) => console.log("LiveKit Error:", e)}
                            >
                                <div className="mb-4 text-center">
                                    <div className="w-16 h-16 bg-[#363431] rounded-full mx-auto flex items-center justify-center mb-2 border-2 border-[#bf811d]">
                                        <span className="text-2xl">🎤</span>
                                    </div>
                                    <p className="text-sm text-[#bababa]">Conectado a: {teacherId}</p>
                                </div>
                                <RoomAudioRenderer />
                                <ControlBar variation="minimal" controls={{ microphone: true, camera: false, screenShare: false, leave: false }} />
                            </LiveKitRoom>
                        )}

                    </div>
                </div>

                {/* Chat Section */}
                <div className="bg-[#262421] border border-[#302e2b] rounded-lg flex-grow flex flex-col overflow-hidden">
                    <div className="bg-[#161512] p-3 border-b border-[#302e2b]">
                        <h3 className="font-bold text-white">Chat</h3>
                    </div>

                    <div className="flex-grow p-4 overflow-y-auto space-y-3">
                        <div className="text-sm">
                            <span className="font-bold text-[#bf811d] mr-2">GM Ana:</span>
                            <span className="text-[#bababa]">Bienvenidos a la clase de hoy. Vamos a ver la Defensa Siciliana.</span>
                        </div>
                        <div className="text-sm">
                            <span className="font-bold text-blue-400 mr-2">Alumno1:</span>
                            <span className="text-[#bababa]">¡Genial!</span>
                        </div>
                    </div>

                    <div className="p-3 border-t border-[#302e2b] bg-[#161512]">
                        <input
                            type="text"
                            placeholder="Enviar mensaje..."
                            className="w-full bg-[#262421] border border-[#302e2b] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#bf811d]"
                        />
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Classroom;
