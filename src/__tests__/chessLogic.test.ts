import { describe, it, expect } from 'vitest';
import { Chess } from 'chess.js'; // Assuming chess.js is installed

describe('Chess Logic', () => {
    it('should initialize a new game correctly', () => {
        const game = new Chess();
        expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    });

    it('should allow valid moves', () => {
        const game = new Chess();
        game.move('e4');
        expect(game.fen()).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1');
    });

    it('should detect checkmate', () => {
        const game = new Chess();
        // Fool's Mate
        game.move('f3');
        game.move('e5');
        game.move('g4');
        game.move('Qh4#');
        expect(game.isCheckmate()).toBe(true);
    });
});
