import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App';
import { multiplayerService, PlayerState, PlayerJoinData } from '../services/multiplayerService';
import { IsometricEngine } from '../game/IsometricEngine';
import { Pathfinding, Point } from '../game/Pathfinding';
import { firebaseService } from '../services/firebaseService';
import Furniture, { FurnitureType } from './Furniture';
import DynamicAvatar from './DynamicAvatar';

export interface FurniturePlacement {
    type: FurnitureType;
    gridX: number;
    gridY: number;
    label?: string;
}

interface RoomViewProps {
    roomId: string;
    width?: number;
    height?: number;
    obstacles?: Point[];
    furniturePlacements?: FurniturePlacement[];
    onFurnitureClick?: (type: FurnitureType) => void;
    onBack?: () => void;
}

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const ORIGIN_X = 400;
const ORIGIN_Y = 100;
const NEARBY_DISTANCE = 2;

export const RoomView: React.FC<RoomViewProps> = ({
    roomId,
    width = 10,
    height = 10,
    obstacles = [],
    furniturePlacements = [],
    onFurnitureClick,
    onBack
}) => {
    const auth = useAuth();
    const { currentUserId, currentUser, userRole } = auth || {};
    const [players, setPlayers] = useState<Record<string, PlayerState>>({});
    const [myPos, setMyPos] = useState<Point>({ x: 0, y: 0 });
    const [chatInput, setChatInput] = useState('');

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        multiplayerService.sendChatBubble(chatInput.trim());
        setChatInput('');
    };

    const engine = useMemo(() => new IsometricEngine(TILE_WIDTH, TILE_HEIGHT, ORIGIN_X, ORIGIN_Y), []);
    const allObstacles = useMemo(() => {
        const furn = furniturePlacements.map(f => ({ x: f.gridX, y: f.gridY }));
        // Ensure uniqueness just in case
        const combined = [...obstacles, ...furn];
        return combined.filter((v, i, a) => a.findIndex(t => t.x === v.x && t.y === v.y) === i);
    }, [obstacles, furniturePlacements]);

    const pathfinding = useMemo(() => new Pathfinding(width, height, allObstacles), [width, height, allObstacles]);

    useEffect(() => {
        if (!currentUser) return;
        const initRoom = async () => {
            const appUser = await firebaseService.getUser(currentUser.uid);
            const joinData: PlayerJoinData = {
                uid: currentUser.uid,
                displayName: currentUser.displayName || 'Unknown',
                role: userRole || 'student',
                photoURL: currentUser.photoURL,
                elo: (appUser as any)?.elo,
                earnings: (appUser as any)?.earnings
            };
            const initialPos = userRole === 'teacher' ? { x: 4, y: 3 } : { x: 0, y: height - 1 };
            multiplayerService.joinRoom(roomId, joinData, initialPos);
            setMyPos(initialPos);
        };
        initRoom();

        const unsub = multiplayerService.onRoomPlayersChanged(roomId, (newPlayers) => {
            setPlayers(newPlayers);
        });

        return () => {
            unsub();
            multiplayerService.leaveRoom();
        };
    }, [roomId, currentUser, userRole]);

    const handleFloorClick = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!currentUser) return;
        const clickX = e.nativeEvent.offsetX;
        const clickY = e.nativeEvent.offsetY;
        const targetGrid = engine.screenToGrid({ x: clickX, y: clickY });
        if (targetGrid.x >= 0 && targetGrid.x < width && targetGrid.y >= 0 && targetGrid.y < height) {
            const isObs = allObstacles.some(o => o.x === targetGrid.x && o.y === targetGrid.y);
            if (!isObs) {
                const path = pathfinding.findPath(myPos, targetGrid);
                if (path.length > 0) {
                    const finalPos = path[path.length - 1];
                    setMyPos(finalPos);
                    multiplayerService.updatePosition(finalPos);
                }
            }
        }
    };

    // Walls
    const WALL_HEIGHT = 160;
    const lwStart = engine.gridToScreen({ x: 0, y: 0 });
    const lwEnd = engine.gridToScreen({ x: 0, y: height });
    const leftWall = `${lwStart.x},${lwStart.y} ${lwEnd.x},${lwEnd.y} ${lwEnd.x},${lwEnd.y - WALL_HEIGHT} ${lwStart.x},${lwStart.y - WALL_HEIGHT}`;
    const rwEnd = engine.gridToScreen({ x: width, y: 0 });
    const rightWall = `${lwStart.x},${lwStart.y} ${rwEnd.x},${rwEnd.y} ${rwEnd.x},${rwEnd.y - WALL_HEIGHT} ${lwStart.x},${lwStart.y - WALL_HEIGHT}`;

    // Floor tiles
    const tiles: React.ReactNode[] = [];
    for (let ty = 0; ty < height; ty++) {
        for (let tx = 0; tx < width; tx++) {
            const sp = engine.gridToScreen({ x: tx, y: ty });
            const isObs = allObstacles.some(o => o.x === tx && o.y === ty);
            const pts = `${sp.x},${sp.y} ${sp.x + TILE_WIDTH / 2},${sp.y + TILE_HEIGHT / 2} ${sp.x},${sp.y + TILE_HEIGHT} ${sp.x - TILE_WIDTH / 2},${sp.y + TILE_HEIGHT / 2}`;
            tiles.push(
                <polygon
                    key={`t-${tx}-${ty}`}
                    points={pts}
                    fill={isObs ? '#1e1e1e' : ((tx + ty) % 2 === 0 ? '#3a3a3a' : '#444')}
                    stroke="#222"
                    strokeWidth="1"
                    className={isObs ? '' : 'cursor-pointer hover:opacity-80 transition-opacity'}
                />
            );
        }
    }

    const sortedFurniture = [...furniturePlacements].sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));
    const isNearFurniture = (fp: FurniturePlacement) =>
        Math.abs(fp.gridX - myPos.x) + Math.abs(fp.gridY - myPos.y) <= NEARBY_DISTANCE;

    const sortedPlayers = Object.values(players).sort((a, b) => engine.getDepth(a.position) - engine.getDepth(b.position));

    return (
        <div className="w-full h-full min-h-[600px] flex items-center justify-center relative bg-[#0a0a09] overflow-hidden rounded-3xl border border-white/5 shadow-2xl">
            {onBack && (
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 z-50 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl backdrop-blur text-sm font-bold flex items-center gap-2"
                >
                    ← Volver al Mapa
                </button>
            )}

            <svg
                width="800"
                height="600"
                viewBox="0 0 800 600"
                xmlns="http://www.w3.org/2000/svg"
                onClick={handleFloorClick}
                className="select-none"
            >
                {/* Walls */}
                <g id="walls">
                    <polygon points={leftWall} fill="#272727" stroke="#111" strokeWidth="1" />
                    <polygon points={rightWall} fill="#333333" stroke="#111" strokeWidth="1" />
                    <line x1={lwStart.x} y1={lwStart.y} x2={lwStart.x} y2={lwStart.y - WALL_HEIGHT} stroke="#111" strokeWidth="2" opacity="0.5" />
                </g>

                {/* Floor */}
                <g id="floor">{tiles}</g>

                {/* Furniture */}
                <g id="furniture">
                    {sortedFurniture.map((fp, i) => {
                        const sp = engine.gridToScreen({ x: fp.gridX, y: fp.gridY });
                        return (
                            <Furniture
                                key={`furn-${i}`}
                                type={fp.type}
                                gridX={fp.gridX}
                                gridY={fp.gridY}
                                screenX={sp.x}
                                screenY={sp.y}
                                isNearby={isNearFurniture(fp)}
                                label={fp.label}
                                onClick={(t) => onFurnitureClick && onFurnitureClick(t)}
                            />
                        );
                    })}
                </g>

                {/* Players */}
                <g id="players">
                    <AnimatePresence>
                        {sortedPlayers.map(player => {
                            const pScreen = engine.gridToScreen(player.position);
                            const sx = pScreen.x;
                            const sy = pScreen.y - 40;
                            return (
                                <motion.g
                                    key={player.uid}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, x: sx, y: sy, transition: { type: 'spring', bounce: 0, duration: 0.5 } }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <g transform="translate(-25, -70)">
                                        <foreignObject x="0" y="0" width="50" height="150" style={{ overflow: 'visible' }}>
                                            <div className="flex flex-col items-center justify-end h-full relative" style={{ overflow: 'visible', width: '50px' }}>
                                                <DynamicAvatar
                                                    config={player.avatar}
                                                    role={player.role}
                                                    elo={player.elo}
                                                    earnings={player.earnings}
                                                    name={player.displayName}
                                                    scale={0.8}
                                                    chatBubble={player.chatBubble}
                                                />
                                            </div>
                                        </foreignObject>
                                    </g>
                                </motion.g>
                            );
                        })}
                    </AnimatePresence>
                </g>
            </svg>

            {/* Chat Input overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50">
                <form onSubmit={handleSendChat} className="relative flex items-center">
                    <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-full py-2 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-gold/50 shadow-lg"
                        onFocus={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button type="submit" className="absolute right-2 text-white/50 hover:text-gold transition-colors p-1">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};
