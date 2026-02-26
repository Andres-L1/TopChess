import { ref, onValue, set, onDisconnect, remove, get } from 'firebase/database';
import { rtdb } from '../firebase';
import { AvatarConfig } from '../types';

export interface Position {
    x: number;
    y: number;
}

export interface PlayerState {
    uid: string;
    displayName: string;
    photoURL?: string | null;
    role: 'student' | 'teacher' | 'club_director' | 'admin';
    position: Position;
    targetPosition?: Position; // For animating movement
    isMoving: boolean;
    lastUpdated: number;
    elo?: number;       // For student avatars
    earnings?: number;  // For teacher avatars
    avatar?: AvatarConfig; // Custom player visuals
    chatBubble?: {
        text: string;
        timestamp: number;
    } | null;
}

export interface PlayerJoinData {
    uid: string;
    displayName: string;
    role: 'student' | 'teacher' | 'club_director' | 'admin';
    photoURL?: string | null;
    elo?: number;
    earnings?: number;
    avatar?: AvatarConfig; // Metaverse avatar
}

class MultiplayerService {
    private currentRoom: string | null = null;
    private currentUid: string | null = null;
    private roomListeners: (() => void)[] = [];

    /**
     * Join a specific room (e.g. a teacher's classroom ID).
     * This sets up the user's initial presence and disconnect handlers.
     */
    joinRoom(roomId: string, user: PlayerJoinData, initialPos: Position) {
        if (this.currentRoom && this.currentUid) {
            this.leaveRoom();
        }

        this.currentRoom = roomId;
        this.currentUid = user.uid;

        const playerRef = ref(rtdb, `rooms/${roomId}/players/${user.uid}`);

        const initialState: PlayerState = {
            uid: user.uid,
            displayName: user.displayName || 'Unknown',
            photoURL: user.photoURL,
            role: user.role,
            position: initialPos,
            targetPosition: initialPos,
            isMoving: false,
            lastUpdated: Date.now(),
            elo: user.elo, // Student specific
            earnings: user.earnings, // Teacher specific
            avatar: user.avatar // Metaverse customizable avatar
        };

        // Set initial state
        set(playerRef, initialState);

        // Remove from room on disconnect
        onDisconnect(playerRef).remove();
    }

    /**
     * Leave the current room.
     */
    leaveRoom() {
        if (this.currentRoom && this.currentUid) {
            const playerRef = ref(rtdb, `rooms/${this.currentRoom}/players/${this.currentUid}`);
            remove(playerRef);

            // Clean up old onDisconnect if possible (usually standard JS SDK handles this if we overwrite or disconnect)
            onDisconnect(playerRef).cancel();

            this.currentRoom = null;
            this.currentUid = null;
        }

        this.roomListeners.forEach(unsub => unsub());
        this.roomListeners = [];
    }

    /**
     * Update the player's target position to move towards.
     */
    moveTo(targetPos: Position) {
        if (!this.currentRoom || !this.currentUid) return;

        const targetRef = ref(rtdb, `rooms/${this.currentRoom}/players/${this.currentUid}/targetPosition`);
        const movingRef = ref(rtdb, `rooms/${this.currentRoom}/players/${this.currentUid}/isMoving`);
        const timeRef = ref(rtdb, `rooms/${this.currentRoom}/players/${this.currentUid}/lastUpdated`);

        set(targetRef, targetPos);
        set(movingRef, true);
        set(timeRef, Date.now());
    }

    /**
     * Update exact position (usually called locally when interpolation finishes)
     */
    updatePosition(pos: Position) {
        if (!this.currentRoom || !this.currentUid) return;

        const posRef = ref(rtdb, `rooms/${this.currentRoom}/players/${this.currentUid}/position`);
        const movingRef = ref(rtdb, `rooms/${this.currentRoom}/players/${this.currentUid}/isMoving`);

        set(posRef, pos);
        set(movingRef, false);
    }

    /**
     * Send a chat bubble message that appears over the avatar.
     */
    sendChatBubble(text: string) {
        if (!this.currentRoom || !this.currentUid) return;

        const bubbleRef = ref(rtdb, `rooms/${this.currentRoom}/players/${this.currentUid}/chatBubble`);
        set(bubbleRef, {
            text,
            timestamp: Date.now()
        });
    }

    /**
     * Listen to all players in a specific room.
     */
    onRoomPlayersChanged(roomId: string, callback: (players: Record<string, PlayerState>) => void) {
        const roomRef = ref(rtdb, `rooms/${roomId}/players`);

        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            callback(data || {});
        });

        this.roomListeners.push(() => {
            // Unsubscribe logic (firebase/database onValue returns an unsubscribe function)
            unsubscribe();
        });

        return unsubscribe;
    }
}

export const multiplayerService = new MultiplayerService();
