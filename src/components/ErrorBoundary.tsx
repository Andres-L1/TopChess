import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-6 bg-[#0a0a0a]">
                    <div className="glass-panel p-8 rounded-2xl border border-red-500/20 bg-gradient-to-br from-[#1b1a17] to-red-900/10 max-w-md w-full text-center shadow-2xl">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto flex items-center justify-center mb-6 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <AlertCircle size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Algo salió mal</h2>
                        <p className="text-sm text-white/50 mb-8 leading-relaxed">
                            Ha ocurrido un error inesperado al cargar este componente. Nuestro equipo ha sido notificado.
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false })}
                            className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5 flex items-center justify-center gap-3 mx-auto w-full group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                            Intentar de nuevo
                        </button>
                        {this.state.error && (
                            <div className="mt-6 text-left p-4 bg-black/40 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
                                <p className="text-xs font-mono text-red-400 truncate">{this.state.error.message}</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
