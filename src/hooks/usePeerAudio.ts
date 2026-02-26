import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import toast from 'react-hot-toast';

export const usePeerAudio = (
    myId: string | undefined,
    targetId: string | undefined, // For student: the teacher's peer ID. For teacher: unused (waits for calls)
    userRole: 'teacher' | 'student',
    isEnabled: boolean
) => {
    const peerRef = useRef<Peer | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const connectionsRef = useRef<MediaConnection[]>([]);

    // Create a persistent audio element
    useEffect(() => {
        const audio = new Audio();
        audio.autoplay = true;
        remoteAudioRef.current = audio;
        return () => {
            audio.pause();
            audio.srcObject = null;
            remoteAudioRef.current = null;
        };
    }, []);

    // Cleanup helper
    const cleanup = useCallback(() => {
        connectionsRef.current.forEach(c => c.close());
        connectionsRef.current = [];
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }
        peerRef.current?.destroy();
        peerRef.current = null;
        setIsConnected(false);
        setIsMuted(false);
    }, []);

    // Helper: handle an established call stream
    const handleCallStream = useCallback((call: MediaConnection) => {
        connectionsRef.current.push(call);

        call.on('stream', (remoteStream) => {
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
                remoteAudioRef.current.play().catch(e => console.warn("Audio play error", e));
                setIsConnected(true);
            }
        });

        call.on('close', () => { setIsConnected(false); });
        call.on('error', () => { setIsConnected(false); });
    }, []);

    // Main effect: initialize Peer + request mic permissions eagerly
    useEffect(() => {
        if (!isEnabled || !myId) {
            cleanup();
            return;
        }

        let cancelled = false;

        const init = async () => {
            // 🔑 Eagerly request mic permission so the browser dialog appears immediately
            try {
                if (!localStreamRef.current) {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    if (cancelled) {
                        stream.getTracks().forEach(t => t.stop());
                        return;
                    }
                    localStreamRef.current = stream;
                }
            } catch (err) {
                console.error('Mic permission denied:', err);
                toast.error('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
                return;
            }

            // Build Peer with a sanitized ID (PeerJS IDs cannot contain special chars)
            const safePeerId = myId.replace(/[^a-zA-Z0-9\-_]/g, '-');
            const peer = new Peer(safePeerId, { debug: 1 });

            peer.on('open', (id) => {
                console.debug('[PeerAudio] My ID:', id);
                if (cancelled) { peer.destroy(); return; }

                // Student initiates the call to the teacher
                if (userRole === 'student' && targetId) {
                    const safeTargetId = targetId.replace(/[^a-zA-Z0-9\-_]/g, '-');
                    const stream = localStreamRef.current!;
                    const call = peer.call(safeTargetId, stream);
                    handleCallStream(call);
                }
                // Teacher: mark as "ready" to receive — not yet connected until a call arrives
            });

            // Both roles: answer incoming calls
            peer.on('call', (call) => {
                console.debug('[PeerAudio] Incoming call from:', call.peer);
                const stream = localStreamRef.current;
                if (stream) {
                    call.answer(stream);
                    handleCallStream(call);
                } else {
                    // Shouldn't normally happen since we requested mic above
                    navigator.mediaDevices.getUserMedia({ audio: true }).then(s => {
                        localStreamRef.current = s;
                        call.answer(s);
                        handleCallStream(call);
                    }).catch(() => toast.error('Error al responder la llamada'));
                }
            });

            peer.on('error', (err) => {
                console.error('[PeerAudio] Error:', err);
                if (err.type === 'peer-unavailable') {
                    // Other peer hasn't connected yet — normal during class setup
                    console.debug('[PeerAudio] Peer unavailable, waiting for call...');
                } else if (err.type === 'browser-incompatible') {
                    toast.error('Tu navegador no soporta audio en tiempo real');
                }
            });

            if (!cancelled) peerRef.current = peer;
        };

        init();

        return () => {
            cancelled = true;
            cleanup();
        };
    }, [isEnabled, myId, targetId, userRole, handleCallStream, cleanup]);

    const toggleMute = useCallback(() => {
        const tracks = localStreamRef.current?.getAudioTracks();
        if (!tracks?.length) return;
        const newMuted = !isMuted;
        tracks.forEach(t => { t.enabled = !newMuted; });
        setIsMuted(newMuted);
    }, [isMuted]);

    return { isConnected, isMuted, toggleMute };
};
