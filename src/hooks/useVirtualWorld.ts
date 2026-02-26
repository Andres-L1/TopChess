import { useState, useEffect, useCallback } from 'react';
import { rtdb } from '../firebase';
import { ref, set, onValue, onDisconnect, remove } from 'firebase/database';

export interface WorldUser {
    id: string;
    name: string;
    x: number;
    y: number;
    color: string;
    roomId: string; // 'lobby' or teacherId
    status: 'online' | 'in_class' | 'offline';
    lastUpdate: number;
}

export const useVirtualWorld = (userId: string | undefined, currentRoomId: string, initialX: number, initialY: number) => {
    const [users, setUsers] = useState<Record<string, WorldUser>>({});

    // 1. Listen to users in the CURRENT room
    useEffect(() => {
        if (!currentRoomId) return;

        const roomRef = ref(rtdb, `virtual_world/rooms/${currentRoomId}`);

        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val() as Record<string, WorldUser>;
                // Filter out stale users (e.g. not updated in 30 seconds)
                const now = Date.now();
                const activeUsers = Object.entries(data).reduce((acc, [uid, user]) => {
                    if (now - user.lastUpdate < 30000) {
                        acc[uid] = user;
                    }
                    return acc;
                }, {} as Record<string, WorldUser>);

                setUsers(activeUsers);
            } else {
                setUsers({});
            }
        });

        return () => unsubscribe();
    }, [currentRoomId]);

    // 2. Handle joining/leaving rooms
    useEffect(() => {
        if (!userId || !currentRoomId) return;

        const userRef = ref(rtdb, `virtual_world/rooms/${currentRoomId}/${userId}`);

        // Automatically remove user from RTDB when they disconnect
        onDisconnect(userRef).remove();

        // Clean up when changing rooms or unmounting
        return () => {
            // Remove from old room before leaving
            remove(userRef).catch(console.error);
        };
    }, [userId, currentRoomId]);

    // 3. Update Position Function
    const updatePosition = useCallback((x: number, y: number, name: string, status: WorldUser['status'], color: string) => {
        if (!userId || !currentRoomId) return;

        const userRef = ref(rtdb, `virtual_world/rooms/${currentRoomId}/${userId}`);

        const userData: WorldUser = {
            id: userId,
            name,
            x,
            y,
            color,
            roomId: currentRoomId,
            status,
            lastUpdate: Date.now()
        };

        set(userRef, userData).catch(console.error);
    }, [userId, currentRoomId]);

    return { users, updatePosition };
};
