import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/game/Avatar';
import Furniture from '../components/game/Furniture';
import { AuthContext } from '../App';
import { firebaseService } from '../services/firebaseService';
import { useVirtualWorld } from '../hooks/useVirtualWorld';
import { Teacher } from '../types/index';
import { getTeacherTier } from '../utils/progression';

// Dashboard Components
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

const TILE_SIZE = 40;
const MOVEMENT_SPEED = 7;

// Different layouts based on teacher tier
const getRoomConfig = (tier: number) => {
    // Base configuration
    const config = { width: 1000, height: 800, name: 'Clase', bg: '#1a1a1a', furniture: [] as any[] };

    if (tier >= 1) {
        config.furniture = [
            { id: 'desk', type: 'desk', x: 400, y: 300, width: 200, height: 100, label: 'Mesa del Profesor', interactable: true }
        ];
    }
    if (tier >= 2) {
        config.width = 1200;
        config.height = 900;
        config.bg = '#1f1f1f';
        config.furniture.push(
            { id: 'board', type: 'board', x: 400, y: 100, width: 400, height: 40, label: 'Pizarra (Lichess)', interactable: true }
        );
    }
    if (tier >= 3) {
        config.name = 'Aula Magna';
        config.furniture.push(
            { id: 'plants1', type: 'plants', x: 100, y: 100, width: 60, height: 60 },
            { id: 'plants2', type: 'plants', x: 1040, y: 100, width: 60, height: 60 }
        );
    }
    if (tier >= 4) {
        config.furniture.push(
            { id: 'bookshelf', type: 'bookshelf', x: 100, y: 300, width: 60, height: 200, label: 'Biblioteca', interactable: true }
        );
    }
    if (tier >= 5) {
        config.name = 'Academia Principal';
        config.width = 1600;
        config.height = 1200;
        config.bg = '#25201c'; // Slightly darker/gold tint
        config.furniture.push(
            { id: 'chair1', type: 'chair', x: 400, y: 500, width: 60, height: 60, label: 'Alumno 1' },
            { id: 'chair2', type: 'chair', x: 540, y: 500, width: 60, height: 60, label: 'Alumno 2' }
        );
    }

    return config;
};


const VirtualRoom: React.FC = () => {
    const { teacherId } = useParams<{ teacherId: string }>();
    const auth = useContext(AuthContext);
    const navigate = useNavigate();

    const { currentUserId, currentUser } = auth || {};
    const currentUserName = currentUser?.displayName?.split(' ')[0] || 'Invitado';

    const [teacher, setTeacher] = useState<Teacher | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeModal, setActiveModal] = useState<string | null>(null);

    useEffect(() => {
        const loadClassroom = async () => {
            if (!teacherId) return;

            const teacherData = await firebaseService.getTeacherById(teacherId);
            if (teacherData) {
                setTeacher(teacherData);
            } else {
                // Fallback or not found
                navigate('/world');
            }
            setLoading(false);
        };
        loadClassroom();
    }, [teacherId, navigate]);

    // Derived configuration
    const tierInfo = teacher ? getTeacherTier(teacher.earnings || 0) : { tier: 1 };
    const roomConfig = getRoomConfig(tierInfo.tier);

    // Local Player State
    const [position, setPosition] = useState({ x: roomConfig.width / 2, y: roomConfig.height - 100 });
    const targetPosRef = useRef<{ x: number, y: number } | null>(null);
    const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});
    const [clickEffect, setClickEffect] = useState<{ x: number, y: number, id: number } | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Real-time Multiplayer (Hooked to specific room)
    const { users, updatePosition } = useVirtualWorld(currentUserId, `room_${teacherId}`, position.x, position.y);
    const lastUpdateRef = useRef<number>(0);

    const containerRef = useRef<HTMLDivElement>(null);

    // Movement Logic (Similar to VirtualWorld)
    useEffect(() => {
        if (activeModal) return; // Prevent movement when a modal is open

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
                    targetPosRef.current = null;
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
                newX = Math.max(20, Math.min(roomConfig.width - 20, newX));
                newY = Math.max(60, Math.min(roomConfig.height - 20, newY));

                // Collision logic with furniture
                let canMove = true;
                for (const furn of roomConfig.furniture) {
                    // Extremely basic AABB collision checking (Avatar is ~40x60)
                    const isColliding =
                        newX + 20 > furn.x &&
                        newX - 20 < furn.x + furn.width &&
                        newY > furn.y &&
                        newY - 60 < furn.y + furn.height;

                    if (isColliding) {
                        canMove = false;
                        break;
                    }
                }

                if (!canMove) {
                    newX = prev.x;
                    newY = prev.y;
                    targetPosRef.current = null; // Stop moving if hit wall
                }

                // MÁS FLUIDEZ: Prevent React from re-rendering the whole room if not moving
                if (newX === prev.x && newY === prev.y) {
                    return prev;
                }

                const now = Date.now();
                if (now - lastUpdateRef.current > 100) {
                    updatePosition(newX, newY, currentUserName, 'in_class', '#3b82f6');
                    lastUpdateRef.current = now;
                }

                return { x: newX, y: newY };
            });
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [keysPressed, currentUserName, updatePosition, roomConfig, activeModal]);

    // Input Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!auth?.isAuthenticated && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
                setShowLoginModal(true);
                return;
            }
            setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: true, [e.key]: true }));
        };
        const handleKeyUp = (e: KeyboardEvent) => setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: false, [e.key]: false }));

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Center Camera
    useEffect(() => {
        if (containerRef.current) {
            const container = containerRef.current;
            container.scrollTo({
                left: position.x - container.clientWidth / 2,
                top: position.y - container.clientHeight / 2,
                behavior: 'auto'
            });
        }
    }, [position.x, position.y]);

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent if clicking on UI/Furniture
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

    const handleInteract = (objectId: string) => {
        if (!auth?.isAuthenticated) {
            setShowLoginModal(true);
            return;
        }

        console.log("Interacted with", objectId);

        // Check distance before allowing interaction
        const furn = roomConfig.furniture.find(f => f.id === objectId);
        if (!furn) return;

        // Center of avatar vs center of furniture
        const dx = position.x - (furn.x + furn.width / 2);
        const dy = position.y - (furn.y + furn.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 150) {
            // Too far away, could show a toast here
            return;
        }

        if (objectId === 'desk') {
            setActiveModal(auth?.userRole === 'teacher' && auth.currentUserId === teacherId ? 'teacher_dashboard' : 'booking');
        } else if (objectId === 'board') {
            setActiveModal('lichess');
        }
    };

    if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Cargando Sala...</div>;

    return (
        <div className="w-full h-screen bg-[#05050A] overflow-hidden relative" ref={containerRef}>
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
                <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            {/* HUD overlay */}
            <div className="fixed top-6 left-6 z-50 pointer-events-none flex flex-col gap-1">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#e3c26b] to-yellow-200 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] tracking-tight">
                    {roomConfig.name} <span className="text-white">de {teacher?.name}</span>
                </h1>
                <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-widest backdrop-blur-md bg-white/5 px-3 py-1.5 rounded-full border border-white/10 w-max mt-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    Nivel {tierInfo.tier} · WASD para moverte, clic para interactuar
                </div>
            </div>

            {/* Exit Button */}
            <div className="fixed top-6 right-6 z-50">
                <button
                    onClick={() => navigate('/world')}
                    className="group relative overflow-hidden rounded-full p-[1px] transition-all hover:scale-105 active:scale-95"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/40 to-white/20 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-[#05050A]/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/5 flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                        </svg>
                        <span className="text-white/80 group-hover:text-white font-bold text-xs tracking-widest uppercase transition-colors">
                            Volver al Mundo
                        </span>
                    </div>
                </button>
            </div>

            {/* UI Overlay: HUD for logged-in users */}
            {auth?.isAuthenticated && (
                <div className="fixed bottom-8 right-8 z-50 flex gap-4">
                    {(currentUser as any)?.role === 'teacher' ? (
                        <button onClick={() => setActiveModal('teacher_dashboard')} className="px-6 py-3 bg-[#111]/90 border border-white/10 rounded-full text-white font-bold hover:bg-white/10 backdrop-blur-xl flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95">
                            <span className="text-xl">📊</span> Mi Academia
                        </button>
                    ) : (
                        <button onClick={() => setActiveModal('student_dashboard')} className="px-6 py-3 bg-[#111]/90 border border-white/10 rounded-full text-white font-bold hover:bg-white/10 backdrop-blur-xl flex items-center gap-2 shadow-2xl transition-all hover:scale-105 active:scale-95">
                            <span className="text-xl">🎒</span> Mi Perfil
                        </button>
                    )}
                </div>
            )}

            {/* World Space */}
            <div
                className="relative shadow-[0_0_100px_rgba(0,0,0,1)] ring-1 ring-white/5"
                style={{
                    width: roomConfig.width,
                    height: roomConfig.height,
                    backgroundColor: roomConfig.bg,
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
                        radial-gradient(circle at center, transparent 0%, #000 120%)
                    `,
                    backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px, ${TILE_SIZE}px ${TILE_SIZE}px, 100% 100%`,
                    margin: `${Math.max(0, (window.innerHeight - roomConfig.height) / 2)}px auto`
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
                {/* Room ambient glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                {/* Draw Furniture */}
                {roomConfig.furniture.map(furn => (
                    <Furniture
                        key={furn.id}
                        {...furn}
                        onInteract={() => handleInteract(furn.id)}
                    />
                ))}

                {/* Local Player */}
                <Avatar
                    id={currentUserId || 'local'}
                    name={currentUserName}
                    x={position.x}
                    y={position.y}
                    color="#D4AF37"
                    status="in_class"
                    isLocalUser={true}
                />

                {/* Remote Players */}
                {Object.values(users).filter(u => u.id !== currentUserId).map(user => (
                    <Avatar
                        key={user.id}
                        id={user.id}
                        name={user.name}
                        x={user.x}
                        y={user.y}
                        color={user.color || '#9ca3af'}
                        status={user.status}
                        isLocalUser={false}
                    />
                ))}
            </div>

            {/* Modals for Interactive UI (Superimposed over 2D World) */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-[#05050A]/60"
                        onClick={() => setActiveModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#0A0A0F]/90 backdrop-blur-2xl border border-white/10 rounded-3xl w-full max-w-5xl h-[80vh] overflow-hidden overflow-y-auto relative shadow-[0_0_50px_rgba(212,175,55,0.1)]"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setActiveModal(null)}
                                className="absolute top-6 right-6 z-50 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-3 rounded-full backdrop-blur-md transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Inject the traditional UI components here based on what was clicked */}
                            {activeModal === 'student_dashboard' && (
                                <div className="p-0 relative h-full bg-[#05050A]">
                                    <StudentDashboard />
                                </div>
                            )}
                            {activeModal === 'teacher_dashboard' && (
                                <div className="p-0 relative h-full bg-[#05050A]">
                                    <TeacherDashboard />
                                </div>
                            )}
                            {activeModal === 'booking' && (
                                <div className="p-12 text-center text-white relative h-full flex flex-col items-center justify-center">
                                    <div className="absolute inset-0 bg-radial-gradient from-gold/10 to-transparent pointer-events-none" />
                                    <h2 className="text-4xl font-black mb-6 uppercase tracking-[0.2em] text-gold drop-shadow-lg">
                                        Reservar Clase
                                    </h2>
                                    <div className="bg-[#111]/80 border border-white/10 rounded-2xl p-10 max-w-md w-full backdrop-blur-md shadow-2xl">
                                        <p className="text-white/60 text-lg">UI tradicional de Stripe y Checkout aquí.</p>
                                    </div>
                                </div>
                            )}
                            {activeModal === 'lichess' && (
                                <div className="p-12 text-center text-white relative h-full flex flex-col items-center">
                                    <h2 className="text-3xl font-black mb-6 uppercase tracking-[0.2em] text-white/90 drop-shadow-lg flex items-center gap-4">
                                        <span className="w-8 h-8 rounded-sm bg-white/20" /> Tablero Lichess
                                    </h2>
                                    <div className="w-full flex-1 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm flex items-center justify-center">
                                        <p className="text-white/50 text-xl font-light">Iframe de Lichess interactivo integrado a esta sala.</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                <p className="text-white/60 text-sm mb-8">Debes iniciar sesión para interactuar con la sala y hablar con los profesores.</p>

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

        </div>
    );
};

export default VirtualRoom;
