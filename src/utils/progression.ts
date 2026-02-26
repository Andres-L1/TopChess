// ─── TopChess Progression System ──────────────────────────────────────────

// ─── TEACHER TIERS (based on total earnings) ─────────────────────────────

export interface TeacherTier {
    tier: 1 | 2 | 3 | 4 | 5;
    name: string;
    title: string;          // Teacher title
    minEarnings: number;
    maxEarnings: number | null;
    maxStudents: number;
    color: string;          // Primary accent color
    glowColor: string;
    buildingEmoji: string;
    perks: string[];
}

export const TEACHER_TIERS: TeacherTier[] = [
    {
        tier: 1,
        name: 'Tutor',
        title: 'Tutor Independiente',
        minEarnings: 0,
        maxEarnings: 999,
        maxStudents: 1,
        color: '#a78bfa',
        glowColor: 'rgba(167, 139, 250, 0.3)',
        buildingEmoji: '🪑',
        perks: ['1 alumno', 'Aula básica', 'Chat integrado'],
    },
    {
        tier: 2,
        name: 'Instructor',
        title: 'Instructor Certificado',
        minEarnings: 1000,
        maxEarnings: 4999,
        maxStudents: 3,
        color: '#34d399',
        glowColor: 'rgba(52, 211, 153, 0.3)',
        buildingEmoji: '🏫',
        perks: ['3 alumnos', 'Sala de espera', 'Análisis de partidas'],
    },
    {
        tier: 3,
        name: 'Maestro',
        title: 'Maestro de Ajedrez',
        minEarnings: 5000,
        maxEarnings: 14999,
        maxStudents: 6,
        color: '#fbbf24',
        glowColor: 'rgba(251, 191, 36, 0.3)',
        buildingEmoji: '⭐',
        perks: ['6 alumnos', 'Sala de torneos', 'Material exclusivo', 'Horarios premium'],
    },
    {
        tier: 4,
        name: 'Gran Maestro',
        title: 'Gran Maestro',
        minEarnings: 15000,
        maxEarnings: 49999,
        maxStudents: 12,
        color: '#f97316',
        glowColor: 'rgba(249, 115, 22, 0.3)',
        buildingEmoji: '🏆',
        perks: ['12 alumnos', 'Edificio 2 plantas', 'Sala de análisis avanzado', 'Clases grupales'],
    },
    {
        tier: 5,
        name: 'Academia',
        title: 'Director de Academia',
        minEarnings: 50000,
        maxEarnings: null,
        maxStudents: Infinity,
        color: '#d4af37',
        glowColor: 'rgba(212, 175, 55, 0.5)',
        buildingEmoji: '👑',
        perks: ['Alumnos ilimitados', 'Escuela completa', 'Múltiples profesores', 'Torneos propios', 'Galería de campeones'],
    },
];

export function getTeacherTier(earnings: number): TeacherTier {
    for (let i = TEACHER_TIERS.length - 1; i >= 0; i--) {
        if (earnings >= TEACHER_TIERS[i].minEarnings) return TEACHER_TIERS[i];
    }
    return TEACHER_TIERS[0];
}

export function getTeacherTierProgress(earnings: number): {
    current: TeacherTier;
    next: TeacherTier | null;
    progress: number; // 0–1
    remaining: number;
} {
    const current = getTeacherTier(earnings);
    const nextIndex = TEACHER_TIERS.findIndex(t => t.tier === current.tier) + 1;
    const next = nextIndex < TEACHER_TIERS.length ? TEACHER_TIERS[nextIndex] : null;

    if (!next) return { current, next: null, progress: 1, remaining: 0 };

    const range = next.minEarnings - current.minEarnings;
    const done = earnings - current.minEarnings;
    const progress = Math.min(done / range, 1);
    const remaining = next.minEarnings - earnings;

    return { current, next, progress, remaining };
}

// ─── STUDENT TIERS (based on ELO) ────────────────────────────────────────

export interface StudentTier {
    tier: 1 | 2 | 3 | 4 | 5 | 6;
    piece: string;          // Nombre de la pieza
    pieceSymbol: string;    // Unicode chess symbol
    minElo: number;
    maxElo: number | null;
    color: string;
    title: string;
}

export const STUDENT_TIERS: StudentTier[] = [
    { tier: 1, piece: 'Peón', pieceSymbol: '♟', minElo: 0, maxElo: 799, color: '#9ca3af', title: 'Principiante' },
    { tier: 2, piece: 'Caballo', pieceSymbol: '♞', minElo: 800, maxElo: 1199, color: '#4ade80', title: 'Novato' },
    { tier: 3, piece: 'Alfil', pieceSymbol: '♝', minElo: 1200, maxElo: 1499, color: '#60a5fa', title: 'Intermedio' },
    { tier: 4, piece: 'Torre', pieceSymbol: '♜', minElo: 1500, maxElo: 1799, color: '#a78bfa', title: 'Avanzado' },
    { tier: 5, piece: 'Dama', pieceSymbol: '♛', minElo: 1800, maxElo: 2199, color: '#fbbf24', title: 'Experto' },
    { tier: 6, piece: 'Rey', pieceSymbol: '♚', minElo: 2200, maxElo: null, color: '#d4af37', title: 'Maestro' },
];

export function getStudentTier(elo: number): StudentTier {
    for (let i = STUDENT_TIERS.length - 1; i >= 0; i--) {
        if (elo >= STUDENT_TIERS[i].minElo) return STUDENT_TIERS[i];
    }
    return STUDENT_TIERS[0];
}

export function getStudentTierProgress(elo: number): {
    current: StudentTier;
    next: StudentTier | null;
    progress: number;
    remaining: number;
} {
    const current = getStudentTier(elo);
    const nextIndex = STUDENT_TIERS.findIndex(t => t.tier === current.tier) + 1;
    const next = nextIndex < STUDENT_TIERS.length ? STUDENT_TIERS[nextIndex] : null;

    if (!next) return { current, next: null, progress: 1, remaining: 0 };

    const range = next.minElo - current.minElo;
    const done = elo - current.minElo;
    const progress = Math.min(done / range, 1);
    const remaining = next.minElo - elo;

    return { current, next, progress, remaining };
}
