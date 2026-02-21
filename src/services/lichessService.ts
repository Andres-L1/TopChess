import { Teacher, Booking } from '../types/index';
import type { DrawShape } from 'chessground/draw';
import { Key } from 'chessground/types';
export interface LichessStudy {
    id: string;
    name: string;
    description: string;
    chapters?: LichessChapter[];
}

export interface LichessChapter {
    id: string;
    name: string;
}

const LICHESS_CLIENT_ID = 'topchess-app';
const REDIRECT_URI = window.location.origin + '/TopChess/lichess-callback';

export const lichessService = {
    async getUserStudies(username: string, accessToken?: string): Promise<LichessStudy[]> {
        try {
            if (!username) return [];

            const headers: HeadersInit = {};
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            // Authentication with study:read returns all studies including private ones
            const url = `https://lichess.org/api/study/by/${username}`;

            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error('Error fetching studies');

            const text = await response.text();
            return text
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try { return JSON.parse(line); } catch (e) { return null; }
                })
                .filter(Boolean) as LichessStudy[];
        } catch (error) {
            console.error("Lichess API Error:", error);
            return [];
        }
    },

    async getStudyPgn(studyId: string, accessToken?: string): Promise<string> {
        try {
            const headers: HeadersInit = {};
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch(`https://lichess.org/api/study/${studyId}.pgn`, { headers });
            if (!response.ok) throw new Error('Error fetching PGN');
            return await response.text();
        } catch (error) {
            console.error("Lichess PGN Error:", error);
            return "";
        }
    },

    async exchangeCodeForToken(code: string, codeVerifier: string): Promise<string | null> {
        try {
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                code_verifier: codeVerifier,
                redirect_uri: REDIRECT_URI,
                client_id: LICHESS_CLIENT_ID,
            });

            const response = await fetch('https://lichess.org/api/token', {
                method: 'POST',
                body,
            });

            if (!response.ok) {
                const err = await response.text();
                console.error("Token exchange failed:", err);
                return null;
            }

            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error("Lichess token error:", error);
            return null;
        }
    },

    async getAuthUser(accessToken: string): Promise<{ id: string, username: string } | null> {
        try {
            const response = await fetch('https://lichess.org/api/account', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (!response.ok) return null;
            return await response.json();
        } catch (e) { return null; }
    },

    parseChapters(pgn: string): { name: string, pgn: string }[] {
        // Regex to split by the start of a PGN block (starts with [Key "Value"])
        // We look for [Event because Lichess studies always start with [Event "Chapter Name"]
        const games = pgn.split(/\[Event /g).filter(Boolean);
        return games.map(gameStr => {
            const fullGame = '[Event ' + gameStr.trim();
            const nameMatch = fullGame.match(/\[Event "(.*)"\]/);
            return {
                name: nameMatch ? nameMatch[1] : 'Sin título',
                pgn: fullGame
            };
        });
    },

    sanitizePgn(pgn: string): string {
        if (!pgn) return '';

        // Handle potential nested JSON string
        if (pgn.trim().startsWith('{') && pgn.trim().endsWith('}')) {
            try {
                const parsed = JSON.parse(pgn);
                if (parsed && typeof parsed === 'object' && parsed.pgn) {
                    return this.sanitizePgn(parsed.pgn);
                }
                return '';
            } catch (e) { }
        }

        return pgn
            .replace(/\r/g, '')
            // Strip Lichess metadata headers (cause chess.js parse failures)
            .replace(/\[(LichessId|Variant|Annotator|SIT|Clock|UTCDate|UTCTime|ChapterMode) "[^"]*"\]\s*/g, '')
            // Normalize whitespace inside { }
            .replace(/\{\s+/g, '{ ')
            .replace(/\s+\}/g, ' }')
            // Collapse whitespace / blank lines
            .replace(/[ \t]{2,}/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    },

    parseCommentAnnotations(comment: string): { text: string, shapes: DrawShape[], glyph?: string } {
        if (!comment) return { text: '', shapes: [] };
        let text = comment;
        let shapes: DrawShape[] = [];
        let glyph: string | undefined;

        // NAGs inside comments (often exported by some tools if not using standard NAG notation)
        // Extract [%cal ...]
        const calMatch = text.match(/\[%cal ([^\]]+)\]/);
        if (calMatch) {
            const items = calMatch[1].split(',');
            items.forEach(item => {
                const colorCode = item.charAt(0);
                const colorMap: Record<string, string> = { 'G': 'green', 'R': 'red', 'B': 'blue', 'Y': 'yellow' };
                const brush = colorMap[colorCode] || 'green';
                const orig = item.substring(1, 3);
                let dest = item.substring(3, 5);
                if (orig && dest) {
                    shapes.push({ orig: orig as Key, dest: dest as Key, brush });
                }
            });
            text = text.replace(/\[%cal [^\]]+\]/, '');
        }

        // Extract [%csl ...]
        const cslMatch = text.match(/\[%csl ([^\]]+)\]/);
        if (cslMatch) {
            const items = cslMatch[1].split(',');
            items.forEach(item => {
                const colorCode = item.charAt(0);
                const colorMap: Record<string, string> = { 'G': 'green', 'R': 'red', 'B': 'blue', 'Y': 'yellow' };
                const brush = colorMap[colorCode] || 'green';
                const orig = item.substring(1, 3);
                if (orig) {
                    shapes.push({ orig: orig as Key, brush });
                }
            });
            text = text.replace(/\[%csl [^\]]+\]/, '');
        }

        // Cleanup empty annotations formatting strings
        text = text.replace(/\[%clk [^\]]+\]/g, '');
        text = text.replace(/\[%eval [^\]]+\]/g, '');
        text = text.replace(/\[%[^\]]+\]/g, ''); // catch any other annotations

        return { text: text.trim(), shapes, glyph };
    },

    getLICHESS_CLIENT_ID() { return LICHESS_CLIENT_ID; },
    getREDIRECT_URI() { return REDIRECT_URI; }
};
