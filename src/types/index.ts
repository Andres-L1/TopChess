export interface Teacher {
    id: string;
    name: string;
    elo: number;
    price: number; // This will now be the monthly rate
    currency: 'EUR' | 'USD';
    region: 'EU' | 'LATAM' | 'OTHER';
    commissionRate: number; // 0.5 to 0.85
    classesGiven: number;
    earnings: number;
    description: string;
    image: string;
    tags: string[];
    teachingStyle: string;
    curriculum: string;
    experienceYears: number;
    achievements: string[];
    isVerified?: boolean;
    title?: string;
    role?: 'student' | 'teacher' | 'admin' | 'club_director';
    lichessUsername?: string;
    lichessAccessToken?: string;
    onlineStatus?: 'offline' | 'online' | 'in_class';
    lastActive?: number;
    clubId?: string;
}

export interface TeacherAvailability {
    [key: string]: string[]; // "0-10": ["Available"]
}

export interface Request {
    id: string;
    studentId: string;
    studentName: string;
    teacherId: string;
    status: 'pending' | 'approved' | 'rejected';
    timestamp: number;
    message?: string;
    classCredits?: number;
}

export interface Homework {
    id: string;
    teacherId: string;
    studentId: string;
    studentName?: string; // Optional for display
    title: string;
    description?: string;
    type: 'lichess_study' | 'custom_fen' | 'puzzle';
    referenceData: string; // URL, ID, or FEN string
    status: 'pending' | 'completed';
    assignedAt: number;
    completedAt?: number;
    dueDate?: number;
}

export interface Message {
    id: string;
    studentId: string;
    teacherId: string;
    text: string;
    sender: 'student' | 'teacher' | 'admin' | 'club_director';
    timestamp: number;
    type?: 'text' | 'payment_request' | 'game_invite';
    amount?: number;
    paymentStatus?: 'pending' | 'paid';
}

export interface RoomData {
    fen: string;
    pgn?: string;
    orientation: 'white' | 'black';
    lastMove?: [string, string]; // Keeping string for now, will map to Key in Board
    history?: string[];
    fenHistory?: string[];
    currentIndex?: number;
    shapes?: any[];
    chapters?: { name: string, pgn: string }[];
    activeChapterIndex?: number;
    comment?: string;
    comments?: Record<number, string>;
}

export interface WalletData {
    balance: number;
    currency: string;
}

export interface Transaction {
    id: string;
    type: 'deposit' | 'payment_sent' | 'payment_received';
    description: string;
    amount: number;
    timestamp: number;
    fromId: string;
    toId: string;
    country?: string; // For analytics
}

export interface Profile {
    name: string;
    bio: string;
    image: string;
    elo: number;
}

export interface Booking {
    id: string;
    studentId: string;
    teacherId: string;
    slotId: string;
    date: string;
    time: string;
    status: 'confirmed' | 'cancelled';
    timestamp: number;
    meetingLink: string;
}

export interface GameState {
    fen: string;
    history: string[];
    turn: 'w' | 'b';
    isGameOver: boolean;
    orientation?: 'white' | 'black';
    currentIndex?: number;
}

export interface AppUser {
    id: string;
    email: string;
    name: string;
    role: 'student' | 'teacher' | 'admin' | 'club_director';
    status?: 'active' | 'banned';
    photoURL?: string;
    createdAt: number;
    walletBalance: number;
    currency: string;
    // Presence
    onlineStatus?: 'offline' | 'online' | 'in_class';
    lastActive?: number;
    // Student specific fields
    elo?: number;
    learningGoals?: string[];
    preferredStyle?: string;
}

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'match' | 'message' | 'booking' | 'system';
    read: boolean;
    timestamp: number;
    link?: string;
}

export interface Club {
    id: string;
    name: string;
    directorId: string;
    teacherIds: string[];
    createdAt: number;
}
