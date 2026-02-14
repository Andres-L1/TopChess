import { useCallback } from 'react';

// Simple beep sounds using Web Audio API or Audio objects would be ideal, 
// using stock Lichess-like sounds if available. 
// For this MVP, we will use short reliable .mp3 URLs or Base64.
// Here we use a few standard open-source sound effects commonly used in chess apps.

const SOUNDS = {
    move: new Audio('https://lichess1.org/assets/sound/standard/Move.mp3'),
    capture: new Audio('https://lichess1.org/assets/sound/standard/Capture.mp3'),
    check: new Audio('https://lichess1.org/assets/sound/standard/Check.mp3'),
    castle: new Audio('https://lichess1.org/assets/sound/standard/Move.mp3'),
    promote: new Audio('https://lichess1.org/assets/sound/standard/Move.mp3'),
    gameEnd: new Audio('https://lichess1.org/assets/sound/standard/GenericNotify.mp3'),
};

const useChessSound = () => {
    const play = useCallback((event) => {
        try {
            const sound = SOUNDS[event];
            if (sound) {
                // Resetting currentTime can fail if not loaded
                if (sound.readyState >= 2) {
                    sound.currentTime = 0;
                }
                const promise = sound.play();
                if (promise !== undefined) {
                    promise.catch(error => {
                        // Auto-play was prevented or source not supported
                        // console.warn("Audio play prevented:", error);
                    });
                }
            }
        } catch (error) {
            console.error("Audio error", error);
        }
    }, []);

    return { play };
};

export default useChessSound;
