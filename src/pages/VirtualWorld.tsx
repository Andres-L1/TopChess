import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
const MOVEMENT_SPEED = 7; // pixels per frame, increased for better fluidity

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
    const targetPosRef = useRef<{ x: number, y: number } | null>(null);
    const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});
    const [clickEffect, setClickEffect] = useState<{ x: number, y: number, id: number } | null>(null);

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
                let movedByKeyboard = false;

                if (keysPressed['ArrowUp'] || keysPressed['w']) { newY -= MOVEMENT_SPEED; movedByKeyboard = true; }
                if (keysPressed['ArrowDown'] || keysPressed['s']) { newY += MOVEMENT_SPEED; movedByKeyboard = true; }
                if (keysPressed['ArrowLeft'] || keysPressed['a']) { newX -= MOVEMENT_SPEED; movedByKeyboard = true; }
                if (keysPressed['ArrowRight'] || keysPressed['d']) { newX += MOVEMENT_SPEED; movedByKeyboard = true; }

                // Point and click movement
                if (movedByKeyboard) {
                    targetPosRef.current = null; // Cancel point-and-click if keyboard used
                } else if (targetPosRef.current) {
                    const dx = targetPosRef.current.x - prev.x;
                    const dy = targetPosRef.current.y - prev.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < MOVEMENT_SPEED) {
                        newX = targetPosRef.current.x;
                        newY = targetPosRef.current.y;
                        targetPosRef.current = null;
                    } else {
                        newX += (dx / dist) * MOVEMENT_SPEED;
                        newY += (dy / dist) * MOVEMENT_SPEED;
                    }
                }

                // Map boundaries
                newX = Math.max(20, Math.min(MAP_WIDTH - 20, newX));
                newY = Math.max(60, Math.min(MAP_HEIGHT - 20, newY)); // 60 for avatar height

                // MÁS FLUIDEZ: Stop React from re-rendering the whole map if standing still!
                if (newX === prev.x && newY === prev.y) {
                    return prev;
                }

                // Throttle RTDB updates (e.g. max 10 times per second)
                const now = Date.now();
                if (now - lastUpdateRef.current > 100) {
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
        // Prevent click if clicking on UI elements or portals
        if (e.target !== e.currentTarget) return;

        const clickX = e.nativeEvent.offsetX;
        const clickY = e.nativeEvent.offsetY;

        targetPosRef.current = { x: clickX, y: clickY };
        setClickEffect({ x: clickX, y: clickY, id: Date.now() });
    };

    return (
        <div
            className="w-full h-screen relative overflow-hidden bg-[#05050A] select-none"
            ref={containerRef}
            style={{ cursor: 'crosshair' }}
        >
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-gold/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px]" />
            </div>

            {/* UI Overlay: Header */}
            <div className="fixed top-6 left-6 z-50 pointer-events-none flex flex-col gap-1">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#e3c26b] to-yellow-200 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] tracking-tight">
                    Academia Virtual
                </h1>
                <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-widest backdrop-blur-md bg-white/5 px-3 py-1.5 rounded-full border border-white/10 w-max mt-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    WASD para moverte
                </div>
            </div>

            {/* UI Overlay: Exit Button */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => navigate('/')}
                    className="group relative overflow-hidden rounded-full p-[1px] transition-all hover:scale-105 active:scale-95"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-gold/50 via-white/20 to-gold/50 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-[#05050A]/90 backdrop-blur-xl px-10 py-3 rounded-full border border-white/5 flex items-center justify-center gap-3">
                        <svg className="w-4 h-4 text-white/70 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-white/80 group-hover:text-white font-bold text-sm tracking-[0.2em] uppercase transition-colors">
                            Salir al Lobby
                        </span>
                    </div>
                </button>
            </div>

            {/* Game World (Scrollable Area) */}
            <div
                className="relative shadow-[inset_0_0_200px_rgba(0,0,0,0.8)]"
                style={{
                    width: MAP_WIDTH,
                    height: MAP_HEIGHT,
                    // Modern premium grid floor
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
                        radial-gradient(circle at center, transparent 0%, #05050A 100%)
                    `,
                    backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px, ${TILE_SIZE}px ${TILE_SIZE}px, 100% 100%`,
                }}
                onClick={handleMapClick}
            >
                {/* Click movement indicator */}
                <AnimatePresence>
                    {clickEffect && (
                        <motion.div
                            key={clickEffect.id}
                            initial={{ opacity: 0.8, scale: 0 }}
                            animate={{ opacity: 0, scale: 2.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="absolute w-10 h-10 border-[3px] border-white/80 rounded-full z-0 pointer-events-none"
                            style={{
                                left: clickEffect.x - 20,
                                top: clickEffect.y - 20,
                                boxShadow: '0 0 15px rgba(255,255,255,0.6), inset 0 0 10px rgba(255,255,255,0.3)'
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Plaza Hub Decoration */}
                <div
                    className="absolute z-0 pointer-events-none flex flex-col items-center justify-center"
                    style={{ left: MAP_WIDTH / 2 - 300, top: MAP_HEIGHT / 2 - 300, width: 600, height: 600 }}
                >
                    <div className="absolute inset-0 border-[1px] border-gold/20 rounded-full animate-[spin_60s_linear_infinite]" />
                    <div className="absolute inset-4 border-[1px] border-dashed border-gold/10 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
                    <div className="absolute inset-0 bg-radial-gradient from-gold/5 to-transparent rounded-full opacity-50" />

                    <span className="text-gold/20 font-black tracking-[0.5em] uppercase text-6xl drop-shadow-[0_0_20px_rgba(212,175,55,0.1)] mb-4">
                        Centro
                    </span>
                    <span className="text-white/10 font-bold tracking-[0.3em] uppercase text-2xl">
                        TopChess
                    </span>
                </div>

                {/* Teacher Doors/Portals */}
                {teachers.map((teacher, index) => {
                    const cols = 5;
                    const spacing = 400;
                    // Center the grid of portals around the start point
                    const numTeachers = teachers.length;
                    const rows = Math.ceil(numTeachers / cols);
                    const startX = (MAP_WIDTH / 2) - ((Math.min(numTeachers, cols) - 1) * spacing / 2) - 60; // 60 is half width
                    const startY = (MAP_HEIGHT / 2) - 400 - (rows * spacing / 2); // Put them above the center

                    const x = startX + (index % cols) * spacing;
                    const y = startY + Math.floor(index / cols) * spacing;
                    const tier = getTeacherTier(teacher.earnings || 0);

                    return (
                        <div
                            key={teacher.id}
                            className="absolute flex flex-col items-center justify-end cursor-pointer group z-10"
                            style={{ left: x, top: y, width: 140, height: 160 }}
                            onClick={() => navigate(`/virtual-room/${teacher.id}`)}
                        >
                            {/* Portal Glow */}
                            <div
                                className="absolute inset-0 -z-10 rounded-t-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
                                style={{ backgroundColor: tier.color }}
                            />

                            {/* Door structure */}
                            <div
                                className="w-full h-[120px] rounded-t-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] border-t border-l border-r backdrop-blur-md flex items-center justify-center flex-col relative overflow-hidden transition-all duration-300 group-hover:-translate-y-2"
                                style={{
                                    backgroundColor: 'rgba(20, 20, 25, 0.8)',
                                    borderColor: `${tier.color}40`,
                                    boxShadow: `inset 0 0 20px ${tier.color}10, 0 10px 30px rgba(0,0,0,0.8)`
                                }}
                            >
                                {/* Inner portal effect */}
                                <div
                                    className="absolute inset-0 opacity-20 bg-gradient-to-b from-transparent to-black"
                                    style={{ background: `linear-gradient(to bottom, ${tier.color}20, transparent)` }}
                                />
                                <span className="text-5xl mb-2 drop-shadow-2xl translate-y-2 group-hover:scale-110 transition-transform">{tier.buildingEmoji}</span>

                                <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <h3 className="text-white text-[11px] uppercase font-black tracking-widest text-center truncate px-1">
                                        {teacher.name}
                                    </h3>
                                </div>
                            </div>

                            {/* Base / Pedestal */}
                            <div className="w-[120%] h-6 bg-gradient-to-b from-white/10 to-transparent rounded-full blur-[2px] mt-1 flex items-center justify-center">
                                <div className="w-3/4 h-2 bg-black/60 rounded-full blur-[1px]" />
                            </div>
                        </div>
                    );
                })}

                {/* Local Player */}
                <Avatar
                    id={currentUserId || 'local'}
                    name={currentUserName}
                    x={position.x}
                    y={position.y}
                    color="#D4AF37"
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
