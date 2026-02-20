import { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import toast from 'react-hot-toast';

export const usePeerAudio = (
    myId: string | undefined,
    targetId: string | undefined, // For student: the teacher's ID. For teacher: unused? No, teacher listens.
    userRole: 'teacher' | 'student',
    isEnabled: boolean
) => {
    const peerRef = useRef<Peer | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const connectionsRef = useRef<MediaConnection[]>([]); // Teacher might have multiple students? No, 1-on-1 for now.

    useEffect(() => {
        // Create audio element for remote stream
        const audio = new Audio();
        audio.autoplay = true;
        remoteAudioRef.current = audio;

        return () => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.pause();
                remoteAudioRef.current = null;
            }
        };
    }, []);

    // 1. Initialize Peer
    useEffect(() => {
        if (!isEnabled || !myId) {
            // Cleanup if disabled
            peerRef.current?.destroy();
            peerRef.current = null;
            setIsConnected(false);
            return;
        }

        const peer = new Peer(myId, {
            debug: 1,
        });

        peer.on('open', (id) => {
            console.log('My Peer ID:', id);
            // If student, connect to teacher
            if (userRole === 'student' && targetId) {
                connectToPeer(peer, targetId);
            }
        });

        // Handle incoming calls (Teacher receives from Student, or vice-versa)
        peer.on('call', async (call) => {
            console.log('Incoming call from:', call.peer);
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;
                call.answer(stream); // Answer with our stream
                handleCallStream(call);
            } catch (err) {
                console.error('Failed to get local stream to answer:', err);
                toast.error('Error al acceder al micrófono');
            }
        });

        peer.on('error', (err) => {
            console.error('PeerJS Error:', err);
            // Ignore trivial errors
            if (err.type === 'peer-unavailable') {
                // Retry?
                console.log('Peer unavailable, maybe retrying?');
            }
        });

        peerRef.current = peer;

        return () => {
            peer.destroy();
            localStreamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [isEnabled, myId, targetId, userRole]);

    const connectToPeer = async (peer: Peer, destId: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;

            // Call the teacher
            const call = peer.call(destId, stream);
            handleCallStream(call);

        } catch (err) {
            console.error('Failed to call:', err);
            toast.error('No se pudo acceder al micrófono');
        }
    };

    const handleCallStream = (call: MediaConnection) => {
        connectionsRef.current.push(call);

        call.on('stream', (remoteStream) => {
            console.log('Received remote stream');
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                remoteAudioRef.current.play().catch(e => console.error("Audio play error", e));
                setIsConnected(true);
            }
        });

        call.on('close', () => {
            console.log("Call closed");
            setIsConnected(false);
        });

        call.on('error', (e) => {
            console.log("Call error", e);
            setIsConnected(false);
        });
    };

    const [isMuted, setIsMuted] = useState(false);

    // Toggle Mute function
    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    return { isConnected, isMuted, toggleMute };
};
