import { FurniturePlacement } from '../components/RoomView';
import { Point } from '../game/Pathfinding';
import { getTeacherTier, getStudentTier } from './progression';

export interface RoomLayout {
    width: number;
    height: number;
    furniturePlacements: FurniturePlacement[];
    obstacles: Point[];
}

export const getTeacherRoomLayout = (earnings: number): RoomLayout => {
    const tier = getTeacherTier(earnings).tier;

    switch (tier) {
        case 5: // Academia (Tier 5)
            return {
                width: 14,
                height: 12,
                furniturePlacements: [
                    { type: 'desk', gridX: 6, gridY: 2, label: 'Mesa Principal' },
                    { type: 'register', gridX: 2, gridY: 1, label: 'Caja Registradora' },
                    { type: 'chalkboard', gridX: 6, gridY: 0, label: 'Pizarra Magna' },
                    { type: 'chess_table', gridX: 4, gridY: 6, label: 'Mesa 1' },
                    { type: 'chess_table', gridX: 8, gridY: 6, label: 'Mesa 2' },
                    { type: 'chess_table', gridX: 4, gridY: 9, label: 'Mesa 3' },
                    { type: 'chess_table', gridX: 8, gridY: 9, label: 'Mesa 4' },
                    { type: 'door', gridX: 0, gridY: 11, label: 'Salir' }
                ],
                obstacles: [
                    { x: 6, y: 2 }, { x: 2, y: 1 }, { x: 6, y: 0 },
                    { x: 4, y: 6 }, { x: 8, y: 6 }, { x: 4, y: 9 }, { x: 8, y: 9 },
                    { x: 0, y: 11 }
                ]
            };
        case 4: // Gran Maestro (Tier 4)
            return {
                width: 12,
                height: 10,
                furniturePlacements: [
                    { type: 'desk', gridX: 6, gridY: 1, label: 'Mesa Profesor' },
                    { type: 'register', gridX: 2, gridY: 1, label: 'Caja' },
                    { type: 'chalkboard', gridX: 6, gridY: 0, label: 'Pizarra' },
                    { type: 'chess_table', gridX: 4, gridY: 5, label: 'Mesa 1' },
                    { type: 'chess_table', gridX: 8, gridY: 5, label: 'Mesa 2' },
                    { type: 'door', gridX: 0, gridY: 9, label: 'Salir' }
                ],
                obstacles: [
                    { x: 6, y: 1 }, { x: 2, y: 1 }, { x: 6, y: 0 },
                    { x: 4, y: 5 }, { x: 8, y: 5 }, { x: 0, y: 9 }
                ]
            };
        case 3: // Maestro (Tier 3)
            return {
                width: 10,
                height: 10,
                furniturePlacements: [
                    { type: 'desk', gridX: 5, gridY: 2, label: 'Escritorio' },
                    { type: 'register', gridX: 2, gridY: 1, label: 'Pagos' },
                    { type: 'chalkboard', gridX: 5, gridY: 0, label: 'Pizarra' },
                    { type: 'chess_table', gridX: 5, gridY: 6, label: 'Mesa Central' },
                    { type: 'door', gridX: 0, gridY: 9, label: 'Salir' }
                ],
                obstacles: [
                    { x: 5, y: 2 }, { x: 2, y: 1 }, { x: 5, y: 0 },
                    { x: 5, y: 6 }, { x: 0, y: 9 }
                ]
            };
        case 2: // Instructor (Tier 2)
            return {
                width: 8,
                height: 8,
                furniturePlacements: [
                    { type: 'desk', gridX: 4, gridY: 1, label: 'Mesa' },
                    { type: 'chalkboard', gridX: 4, gridY: 0, label: 'Pizarra' },
                    { type: 'chess_table', gridX: 4, gridY: 5, label: 'A Jugar' },
                    { type: 'door', gridX: 0, gridY: 7, label: 'Salir' }
                ],
                obstacles: [
                    { x: 4, y: 1 }, { x: 4, y: 0 }, { x: 4, y: 5 }, { x: 0, y: 7 }
                ]
            };
        case 1: // Tutor (Tier 1)
        default:
            return {
                width: 8,
                height: 6,
                furniturePlacements: [
                    { type: 'desk', gridX: 4, gridY: 1, label: 'Tutor' },
                    { type: 'chalkboard', gridX: 4, gridY: 0, label: 'Pizarra' },
                    { type: 'door', gridX: 0, gridY: 5, label: 'Salir' }
                ],
                obstacles: [
                    { x: 4, y: 1 }, { x: 4, y: 0 }, { x: 0, y: 5 }
                ]
            };
    }
};

export const getStudentRoomLayout = (elo: number): RoomLayout => {
    const tier = getStudentTier(elo).tier;

    // Students have smaller rooms that grow with ELO, but they don't have registers or chalkboards by default
    switch (tier) {
        case 6: // Maestro
        case 5: // Experto
            return {
                width: 10,
                height: 8,
                furniturePlacements: [
                    { type: 'chess_table', gridX: 5, gridY: 4, label: 'Entrenar' },
                    { type: 'door', gridX: 0, gridY: 7, label: 'Mapa' }
                ],
                obstacles: [
                    { x: 5, y: 4 }, { x: 0, y: 7 }
                ]
            };
        case 4: // Avanzado
        case 3: // Intermedio
            return {
                width: 8,
                height: 8,
                furniturePlacements: [
                    { type: 'chess_table', gridX: 4, gridY: 4, label: 'Entrenar' },
                    { type: 'door', gridX: 0, gridY: 7, label: 'Mapa' }
                ],
                obstacles: [
                    { x: 4, y: 4 }, { x: 0, y: 7 }
                ]
            };
        case 2: // Novato
        case 1: // Principiante
        default:
            return {
                width: 6,
                height: 6,
                furniturePlacements: [
                    { type: 'door', gridX: 0, gridY: 5, label: 'Mapa' }
                ],
                obstacles: [
                    { x: 0, y: 5 }
                ]
            };
    }
};
