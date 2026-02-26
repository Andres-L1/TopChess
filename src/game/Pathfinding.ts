export interface Point {
    x: number;
    y: number;
}

export class Pathfinding {
    private grid: number[][]; // 0 = walkable, 1 = obstacle
    private width: number;
    private height: number;

    constructor(width: number, height: number, obstacles: Point[]) {
        this.width = width;
        this.height = height;
        this.grid = Array(height).fill(0).map(() => Array(width).fill(0));

        obstacles.forEach(obs => {
            if (obs.x >= 0 && obs.x < width && obs.y >= 0 && obs.y < height) {
                this.grid[obs.y][obs.x] = 1;
            }
        });
    }

    private isValid(p: Point): boolean {
        return p.x >= 0 && p.x < this.width && p.y >= 0 && p.y < this.height && this.grid[p.y][p.x] === 0;
    }

    private heuristic(a: Point, b: Point): number {
        // Manhattan distance
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    public findPath(start: Point, end: Point): Point[] {
        if (!this.isValid(end)) {
            // End is an obstacle, find nearest valid neighbor
            const neighbors = this.getNeighbors(end).filter(n => this.isValid(n));
            if (neighbors.length === 0) return [];
            end = neighbors.sort((a, b) => this.heuristic(start, a) - this.heuristic(start, b))[0];
        }

        const openSet: { point: Point, f: number, g: number, h: number, parent: any }[] = [];
        const closedSet = new Set<string>();

        openSet.push({ point: start, f: 0, g: 0, h: this.heuristic(start, end), parent: null });

        while (openSet.length > 0) {
            // Get node with lowest f score
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift()!;

            if (current.point.x === end.x && current.point.y === end.y) {
                // Path found, reconstruct
                const path: Point[] = [];
                let currNode = current;
                while (currNode) {
                    path.unshift(currNode.point);
                    currNode = currNode.parent;
                }
                return path; // Includes start point, often safe to slice(1) in the caller
            }

            closedSet.add(`${current.point.x},${current.point.y}`);

            const neighbors = this.getNeighbors(current.point);
            for (const neighbor of neighbors) {
                if (!this.isValid(neighbor) || closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

                const gScore = current.g + 1;
                const existingNode = openSet.find(n => n.point.x === neighbor.x && n.point.y === neighbor.y);

                if (!existingNode) {
                    const hScore = this.heuristic(neighbor, end);
                    openSet.push({
                        point: neighbor,
                        g: gScore,
                        h: hScore,
                        f: gScore + hScore,
                        parent: current
                    });
                } else if (gScore < existingNode.g) {
                    existingNode.g = gScore;
                    existingNode.f = gScore + existingNode.h;
                    existingNode.parent = current;
                }
            }
        }

        return []; // No path found
    }

    private getNeighbors(p: Point): Point[] {
        return [
            { x: p.x + 1, y: p.y },
            { x: p.x - 1, y: p.y },
            { x: p.x, y: p.y + 1 },
            { x: p.x, y: p.y - 1 },
        ];
    }
}
