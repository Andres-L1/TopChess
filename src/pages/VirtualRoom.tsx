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

// Example UI Components to render inside modals (for later implementation)
import TeacherDashboard from './TeacherDashboard';

const TILE_SIZE = 40;
const MOVEMENT_SPEED = 5;

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

    const currentUserId = auth?.currentUserId || '';
    const currentUserName = auth?.currentUser?.displayName?.split(' ')[0] || 'Invitado';

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
    const [keysPressed, setKeysPressed] = useState<{ [key: string]: boolean }>({});

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

                if (keysPressed['ArrowUp'] || keysPressed['w']) newY -= MOVEMENT_SPEED;
                if (keysPressed['ArrowDown'] || keysPressed['s']) newY += MOVEMENT_SPEED;
                if (keysPressed['ArrowLeft'] || keysPressed['a']) newX -= MOVEMENT_SPEED;
                if (keysPressed['ArrowRight'] || keysPressed['d']) newX += MOVEMENT_SPEED;

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
                }

                const now = Date.now();
                if ((newX !== prev.x || newY !== prev.y) && now - lastUpdateRef.current > 100) {
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
        const handleKeyDown = (e: KeyboardEvent) => setKeysPressed(prev => ({ ...prev, [e.key.toLowerCase()]: true, [e.key]: true }));
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

    const handleInteract = (objectId: string) => {
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
        <div className="w-full h-screen bg-[#050505] overflow-hidden relative" ref={containerRef}>

            {/* HUD overlay */}
            <div className="fixed top-4 left-4 z-50 pointer-events-none">
                <h1 className="text-2xl font-black text-white drop-shadow-md">{roomConfig.name} de {teacher?.name}</h1>
                <p className="text-white/50 text-xs">Nivel {tierInfo.tier} · Usa WASD para moverte y clic para interactuar</p>
            </div>

            <div className="fixed top-4 right-4 z-50">
                <button onClick={() => navigate('/world')} className="bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/20 uppercase tracking-widest backdrop-blur-md">
                    Volver al Mundo
                </button>
            </div>

            {/* World Space */}
            <div
                className="relative shadow-2xl mx-auto"
                style={{
                    width: roomConfig.width,
                    height: roomConfig.height,
                    backgroundColor: roomConfig.bg,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.02) 2px, transparent 2px)',
                    backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                    // Center the room visually if the window is larger than the room
                    margin: `${Math.max(0, (window.innerHeight - roomConfig.height) / 2)}px auto`
                }}
            >
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
                    color="#3b82f6"
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
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
                        onClick={() => setActiveModal(null)}
                    >
                        <div
                            className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-5xl h-[80vh] overflow-hidden overflow-y-auto relative shadow-2xl shadow-gold/10"
                            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
                        >
                            <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 z-50 text-white/50 hover:text-white bg-black/50 p-2 rounded-full">
                                X
                            </button>

                            {/* Inject the traditional UI components here based on what was clicked */}
                            {activeModal === 'teacher_dashboard' && (
                                <div className="p-8">
                                    <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-widest text-center text-gold">Panel de Gestión</h2>
                                    <p className="text-white/50 text-center mb-8">Aquí se mostraba el Dashboard tradicional con la gestión de reservas y disponibilidad.</p>
                                    {/* <TeacherDashboard /> (We would need to render this isolated from its previous full-page layout) */}
                                </div>
                            )}
                            {activeModal === 'booking' && (
                                <div className="p-8 text-center text-white">
                                    <h2 className="text-2xl font-black mb-4 uppercase tracking-widest text-gold">Reservar Clase</h2>
                                    <p>UI tradicional de Stripe y Checkout aquí.</p>
                                </div>
                            )}
                            {activeModal === 'lichess' && (
                                <div className="p-8 text-center text-white">
                                    <h2 className="text-2xl font-black mb-4 uppercase tracking-widest text-gold">Tablero Lichess</h2>
                                    <p>Iframe de Lichess interactivo integrado a esta sala.</p>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default VirtualRoom;
