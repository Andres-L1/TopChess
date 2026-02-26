import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Avatar from '../components/game/Avatar';
import { AuthContext } from '../App';
import { firebaseService } from '../services/firebaseService';
import { useVirtualWorld } from '../hooks/useVirtualWorld';
import { Teacher } from '../types/index';
import { getTeacherTier } from '../utils/progression';

// Constants for the map
const TILE_SIZE = 40;
const MAP_WIDTH = 2000;
const MAP_HEIGHT = 2000;
const MOVEMENT_SPEED = 5; // pixels per frame

// Simple test collision rects
const COLLISION_ZONES = [
    // Examples: x, y, width, height (in pixels)
    // { x: 500, y: 500, width: 200, height: 200 }
];

const VirtualWorld: React.FC = () => {
    const auth = useContext(AuthContext);
    const navigate = useNavigate();
    const currentUserId = auth?.currentUserId || '';
    const currentUserName = auth?.currentUser?.displayName?.split(' ')[0] || 'Invitado';

    const [teachers, setTeachers] = useState<Teacher[]>([]);

    useEffect(() => {
        firebaseService.getTeachers().then(setTeachers);
    }, []);

    // Local Player State
    const [position, setPosition] = useState({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
    const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});

    // Real-time Multiplayer
    const { users, updatePosition } = useVirtualWorld(currentUserId, 'lobby', position.x, position.y);
    const lastUpdateRef = useRef<number>(0);

    // Camera/Viewport State
    const containerRef = useRef<HTMLDivElement>(null);

    // -- Movement Logic --
    useEffect(() => {
        let animationFrameId: number;

        const gameLoop = () => {
            setPosition(prev => {
                let newX = prev.x;
                let newY = prev.y;

                if (keysPressed['ArrowUp'] || keysPressed['w']) newY -= MOVEMENT_SPEED;
                if (keysPressed['ArrowDown'] || keysPressed['s']) newY += MOVEMENT_SPEED;
                if (keysPressed['ArrowLeft'] || keysPressed['a']) newX -= MOVEMENT_SPEED;
                if (keysPressed['ArrowRight'] || keysPressed['d']) newX += MOVEMENT_SPEED;

                // Map boundaries
                newX = Math.max(20, Math.min(MAP_WIDTH - 20, newX));
                newY = Math.max(60, Math.min(MAP_HEIGHT - 20, newY)); // 60 for avatar height

                // TODO: Map Collision check here

                // Throttle RTDB updates (e.g. max 10 times per second)
                const now = Date.now();
                if ((newX !== prev.x || newY !== prev.y) && now - lastUpdateRef.current > 100) {
                    updatePosition(newX, newY, currentUserName, 'online', '#22c55e');
                    lastUpdateRef.current = now;
                }

                return { x: newX, y: newY };
            });
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [keysPressed, currentUserName, updatePosition]);

    // -- Input Listeners --
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: true, [e.key]: true }));
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: false, [e.key]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // -- Center Camera on Local Player --
    useEffect(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            const viewportWidth = container.clientWidth;
            const viewportHeight = container.clientHeight;

            // Scroll to center the avatar
            container.scrollTo({
                left: position.x - viewportWidth / 2,
                top: position.y - viewportHeight / 2,
                behavior: 'auto' // Instant snap for game feel, smooth can cause lag
            });
        }
    }, [position.x, position.y]);


    // Target coordinates for point-and-click (optional, WASD is main for now)
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // This requires pathfinding (A*) if we have obstacles, 
        // for now we stick to WASD.
    };

    return (
        <div
            className="w-full h-screen bg-[#0a0a0f] overflow-hidden relative cursor-crosshair"
            ref={containerRef}
        >
            {/* UI Overlay */}
            <div className="fixed top-4 left-4 z-50 pointer-events-none">
                <h1 className="text-2xl font-black text-white drop-shadow-md">Academia Virtual</h1>
                <p className="text-white/50 text-xs">Usa WASD o Flechas para moverte</p>
            </div>

            <div className="fixed bottom-4 left-0 w-full flex justify-center z-50 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex gap-4 pointer-events-auto">
                    <button onClick={() => navigate('/')} className="text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest">
                        Salir
                    </button>
                </div>
            </div>

            {/* Game World (Scrollable Area) */}
            <div
                className="relative"
                style={{
                    width: MAP_WIDTH,
                    height: MAP_HEIGHT,
                    // Pattern background to look like a floor tile
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                    backgroundColor: '#111'
                }}
                onClick={handleMapClick}
            >
                {/* Decoration */}
                <div className="absolute top-[800px] left-[800px] w-[400px] h-[300px] bg-gold/5 border-2 border-dashed border-gold/20 rounded-3xl flex items-center justify-center pointer-events-none">
                    <span className="text-gold/50 font-black tracking-widest uppercase text-4xl transform -rotate-12">Plaza TopChess</span>
                </div>

                {/* Teacher Doors/Portals */}
                {teachers.map((teacher, index) => {
                    // Very simple grid layout for the doors
                    const cols = 5;
                    const x = 200 + (index % cols) * 300;
                    const y = 200 + Math.floor(index / cols) * 300;
                    const tier = getTeacherTier(teacher.earnings || 0);

                    return (
                        <div
                            key={teacher.id}
                            className="absolute flex flex-col items-center justify-end cursor-pointer hover:scale-105 transition-transform z-10"
                            style={{ left: x, top: y, width: 120, height: 120 }}
                            onClick={() => navigate(`/virtual-room/${teacher.id}`)}
                        >
                            <div
                                className="w-full h-full rounded-t-full shadow-2xl border-4 flex items-center justify-center flex-col"
                                style={{
                                    backgroundColor: '#1a1a1a',
                                    borderColor: tier.color,
                                    boxShadow: `0 0 30px ${tier.color}40`
                                }}
                            >
                                <span className="text-3xl mb-2">{tier.buildingEmoji}</span>
                                <span className="text-white text-[10px] uppercase font-black tracking-widest text-center px-1">Clase de<br />{teacher.name}</span>
                            </div>
                            <div className="w-full h-4 bg-black/40 rounded-full blur-sm mt-2" />
                        </div>
                    );
                })}

                {/* Local Player */}
                <Avatar
                    id={currentUserId || 'local'}
                    name={currentUserName}
                    x={position.x}
                    y={position.y}
                    color="#22c55e"
                    status="online"
                    isLocalUser={true}
                />

                {/* Other Players */}
                {Object.values(users).filter(u => u.id !== currentUserId).map(user => (
                    <Avatar
                        key={user.id}
                        id={user.id}
                        name={user.name}
                        x={user.x}
                        y={user.y}
                        color={user.color || '#3b82f6'}
                        status={user.status}
                        isLocalUser={false}
                    />
                ))}
            </div>
        </div>
    );
};

export default VirtualWorld;
