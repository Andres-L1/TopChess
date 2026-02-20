import { useCallback } from 'react';

export const useVibration = () => {
    const vibrate = useCallback((pattern: number | number[] = 200) => {
        if (!navigator.vibrate) return;
        navigator.vibrate(pattern);
    }, []);

    return { vibrate };
};
