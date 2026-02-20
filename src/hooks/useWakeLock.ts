import { useEffect, useRef } from 'react';

export const useWakeLock = () => {
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        const requestWakeLock = async () => {
            if ('wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await navigator.wakeLock.request('screen');
                    console.log('Wake Lock is active');
                } catch (err) {
                    console.error(`${(err as Error).name}, ${(err as Error).message}`);
                }
            }
        };

        requestWakeLock();

        const handleVisibilityChange = async () => {
            if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
                await requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (wakeLockRef.current) {
                wakeLockRef.current.release()
                    .then(() => {
                        wakeLockRef.current = null;
                        console.log('Wake Lock released');
                    });
            }
        };
    }, []);
};
