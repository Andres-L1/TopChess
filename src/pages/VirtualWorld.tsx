import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/game/Avatar';
import { AuthContext } from '../App';
import { firebaseService } from '../services/firebaseService';
import { useVirtualWorld } from '../hooks/useVirtualWorld';
import { Teacher } from '../types/index';
import { getTeacherTier } from '../utils/progression';
import { User, Settings, LayoutDashboard, Search, MessagesSquare, Wallet as WalletIcon } from 'lucide-react';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import TeachersDirectory from './TeachersDirectory';
import UserProfile from './UserProfile';
import Chat from './Chat';
import Wallet from './Wallet';
import toast from 'react-hot-toast';

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
    const { currentUserId, currentUser } = auth || {};
    const currentUserName = currentUser?.displayName?.split(' ')[0] || 'Invitado';
    const navigate = useNavigate();

    const [teachers, setTeachers] = useState<Teacher[]>([]);

    useEffect(() => {
        firebaseService.getTeachers().then(setTeachers);
    }, []);

    // Local Player State
    const [position, setPosition] = useState({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
    const targetPosRef = useRef<{ x: number, y: number } | null>(null);
    const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});
    const [clickEffect, setClickEffect] = useState<{ x: number, y: number, id: number } | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [activeModal, setActiveModal] = useState<'student_dashboard' | 'teacher_dashboard' | 'directory' | 'profile' | 'wallet' | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);

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
            if (!auth?.isAuthenticated && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                setShowLoginModal(true);
                return;
            }
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

        if (!auth?.isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

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

            {/* UI Overlay: Premium HUD for logged-in users */}
            {auth?.isAuthenticated && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-[#0A0A0F]/90 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">

                        {/* Avatar Mini-profile */}
                        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-xl border border-white/5 mr-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/50 to-gold/20 flex items-center justify-center border border-gold/30">
                                <User className="w-5 h-5 text-gold" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm leading-tight">{currentUserName}</span>
                                <span className="text-gold/80 text-xs font-semibold uppercase tracking-wider">
                                    {(currentUser as any)?.role === 'teacher' ? 'Profesor' : 'Estudiante'}
                                </span>
                            </div>
                        </div>

                        {/* Main Action Buttons */}
                        {(currentUser as any)?.role === 'teacher' ? (
                            <button
                                onClick={() => setActiveModal('teacher_dashboard')}
                                className="flex flex-col items-center gap-1 p-3 px-5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 group relative"
                            >
                                <div className="absolute inset-0 bg-gold/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <LayoutDashboard className="w-6 h-6 group-hover:text-gold transition-colors relative z-10" />
                                <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">Mi Academia</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setActiveModal('student_dashboard')}
                                className="flex flex-col items-center gap-1 p-3 px-5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 group relative"
                            >
                                <div className="absolute inset-0 bg-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <User className="w-6 h-6 group-hover:text-blue-400 transition-colors relative z-10" />
                                <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">Mi Perfil</span>
                            </button>
                        )}

                        <div className="w-px h-10 bg-white/10 mx-2" />

                        <button
                            onClick={() => setActiveModal('directory')}
                            className="flex flex-col items-center gap-1 p-3 px-5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 group">
                            <Search className="w-6 h-6 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Explorar</span>
                        </button>

                        <button
                            onClick={() => {
                                if (!auth?.isAuthenticated) {
                                    setShowLoginModal(true);
                                    return;
                                }
                                toast.error("Entra a la academia de un profesor para conversar con el.");
                            }}
                            className="flex flex-col items-center gap-1 p-3 px-5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 group relative"
                        >
                            <MessagesSquare className="w-6 h-6 group-hover:text-white transition-colors relative z-10" />
                            <span className="text-[10px] font-bold uppercase tracking-wider relative z-10">Chat</span>
                        </button>

                        <button
                            onClick={() => setActiveModal('profile')}
                            className="flex flex-col items-center gap-1 p-3 px-5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 group">
                            <Settings className="w-6 h-6 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
                        </button>

                        <button
                            onClick={() => setActiveModal('wallet')}
                            className="flex flex-col items-center gap-1 p-3 px-5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all active:scale-95 group">
                            <WalletIcon className="w-6 h-6 group-hover:text-white transition-colors" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Billetera</span>
                        </button>
                    </div>
                </div>
            )}

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
                            onClick={() => {
                                if (!auth?.isAuthenticated) {
                                    setShowLoginModal(true);
                                } else {
                                    navigate(`/virtual-room/${teacher.id}`);
                                }
                            }}
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

            {/* Login Modal */}
            <AnimatePresence>
                {!auth?.isAuthenticated && showLoginModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setShowLoginModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#161512] border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gold/20 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="text-center">
                                <span className="text-4xl mb-4 block">♟️</span>
                                <h2 className="text-2xl font-black text-white mb-2">Inicia Sesión</h2>
                                <p className="text-white/60 text-sm mb-8">Debes iniciar sesión para explorar la academia y hablar con los profesores.</p>

                                <button
                                    onClick={async () => {
                                        await auth?.loginWithGoogle();
                                        setShowLoginModal(false);
                                    }}
                                    className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-white/90 transition-all flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continuar con Google
                                </button>

                                <button
                                    onClick={() => setShowLoginModal(false)}
                                    className="mt-4 text-white/40 text-xs font-bold hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    Volver a mirar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Drawer */}
            <AnimatePresence>
                {activeChatId && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] z-[110] bg-[#0A0A0F] border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.8)]"
                    >
                        <Chat targetId={activeChatId} onClose={() => setActiveChatId(null)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dashboard Modals */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-[#05050A]/60"
                        onClick={() => setActiveModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0A0A0F]/90 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-7xl h-[85vh] overflow-hidden overflow-y-auto relative shadow-[0_0_50px_rgba(212,175,55,0.1)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setActiveModal(null)}
                                className="absolute top-6 right-6 z-50 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full backdrop-blur-md transition-all shadow-xl"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="p-0 relative h-full bg-[#05050A]">
                                {activeModal === 'student_dashboard' && <StudentDashboard />}
                                {activeModal === 'teacher_dashboard' && <TeacherDashboard />}
                                {activeModal === 'directory' && <TeachersDirectory />}
                                {activeModal === 'profile' && <UserProfile />}
                                {activeModal === 'wallet' && <Wallet />}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VirtualWorld;
