import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { lichessService } from '../services/lichessService';
import { firebaseService } from '../services/firebaseService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';

const LichessCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { currentUserId } = useAuth();
    const calledRef = React.useRef(false);

    useEffect(() => {
        // Prevent double execution in React Strict Mode which consumes the code twice
        if (calledRef.current) return;

        const handleCallback = async () => {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                toast.error("Error al autorizar con Lichess");
                navigate('/dashboard');
                return;
            }

            if (!code) return;
            calledRef.current = true;

            // Retrieve code verifier from session storage
            const codeVerifier = sessionStorage.getItem('lichess_code_verifier');
            if (!codeVerifier) {
                toast.error("Sesión de autenticación expirada");
                navigate('/dashboard');
                return;
            }

            try {
                const token = await lichessService.exchangeCodeForToken(code, codeVerifier);
                if (token) {
                    // Fetch user info to get the username
                    const lichessUser = await lichessService.getAuthUser(token);

                    if (lichessUser) {
                        await firebaseService.updateTeacher(currentUserId, {
                            lichessAccessToken: token,
                            lichessUsername: lichessUser.username
                        });
                        toast.success(`¡Conectado como ${lichessUser.username}!`);
                    } else {
                        throw new Error("No se pudo obtener el perfil de Lichess");
                    }

                    sessionStorage.removeItem('lichess_code_verifier');
                } else {
                    toast.error("No se pudo obtener el token de acceso");
                }
            } catch (e) {
                console.error(e);
                toast.error("Error en la sincronización");
            } finally {
                navigate('/dashboard');
            }
        };

        handleCallback();
    }, [searchParams, navigate, currentUserId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin"></div>
            <p className="text-white/60 font-medium animate-pulse">Estableciendo conexión segura con Lichess...</p>
        </div>
    );
};

export default LichessCallback;
