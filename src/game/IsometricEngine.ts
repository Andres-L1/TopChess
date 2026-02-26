import { Point } from './Pathfinding';

export class IsometricEngine {
    private tileWidth: number;
    private tileHeight: number;
    private originX: number; // Screen center X for the grid
    private originY: number; // Screen start Y for the grid

    constructor(tileWidth: number, tileHeight: number, originX: number, originY: number) {
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.originX = originX;
        this.originY = originY;
    }

    /**
     * Converts grid coordinates (e.g. 0,1) to isometric screen coordinates.
     */
    public gridToScreen(grid: Point): Point {
        const screenX = this.originX + (grid.x - grid.y) * (this.tileWidth / 2);
        const screenY = this.originY + (grid.x + grid.y) * (this.tileHeight / 2);
        return { x: screenX, y: screenY };
    }

    /**
     * Converts isometric screen coordinates back to grid coordinates (useful for clicks).
     */
    public screenToGrid(screen: Point): Point {
        const adjustedX = screen.x - this.originX;
        const adjustedY = screen.y - this.originY;

        const gridX = Math.floor((adjustedX / (this.tileWidth / 2) + adjustedY / (this.tileHeight / 2)) / 2);
        const gridY = Math.floor((adjustedY / (this.tileHeight / 2) - adjustedX / (this.tileWidth / 2)) / 2);

        return { x: gridX, y: gridY };
    }

    /**
     * Get Z-index based on grid position (lower Y and X = drawn first, higher Y and X drawn later/on top)
     */
    public getDepth(grid: Point): number {
        return grid.x + grid.y;
    }
}
