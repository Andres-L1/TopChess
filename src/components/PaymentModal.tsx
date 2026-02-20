import React, { useState } from 'react';
import { X, CreditCard, DollarSign, ShieldCheck, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import toast from 'react-hot-toast';

// Placeholder for Stripe Public Key - In production this should be in env vars
const STRIPE_PUBLIC_KEY = 'pk_test_TYooMQauvdEDq54NiTphI7jx';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (method: 'stripe' | 'mercadopago') => Promise<void>;
    teacher: any;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, teacher }) => {
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState<'stripe' | 'mercadopago'>('stripe');

    if (!isOpen || !teacher) return null;

    const isEur = teacher.region === 'EU';
    const amount = isEur ? 59 : 39;
    const currency = isEur ? '€' : '$';
    const suffix = isEur ? '' : ' USD';

    const handlePayment = async () => {
        setLoading(true);
        try {
            // SIMULATION OF PAYMENT PROCESSING
            await new Promise(resolve => setTimeout(resolve, 800));

            // Success!
            await onSuccess(method);
            onClose();
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("Error al procesar el pago. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-dark-panel border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors">
                    <X size={24} />
                </button>

                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-gold/10 to-transparent">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <CreditCard className="text-gold" size={24} />
                        Plan Mensual (4 Clases)
                    </h2>
                    <p className="text-sm text-text-muted mt-1">Suscripción para clases con <span className="text-white font-bold">{teacher.name}</span></p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Price Display */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-6 text-center shadow-inner">
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Total a Pagar</p>
                        <div className="text-4xl font-black text-white">
                            {currency}{amount}{suffix}
                        </div>
                        <p className="text-xs text-gold/80 mt-2 font-medium">Equivale a 4 reservas en el calendario</p>
                    </div>

                    {/* Method Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider block">Método de Pago</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setMethod('stripe')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'stripe' ? 'bg-white/10 border-gold/50' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}
                            >
                                <div className="text-white font-bold">Stripe</div>
                                <div className="text-[10px] text-text-muted">Tarjeta de Crédito</div>
                            </button>
                            <button
                                onClick={() => setMethod('mercadopago')}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'mercadopago' ? 'bg-white/10 border-blue-500/50' : 'bg-white/5 border-white/10 opacity-60 hover:opacity-100'}`}
                            >
                                <div className="text-blue-400 font-bold">MercadoPago</div>
                                <div className="text-[10px] text-text-muted">Latinoamérica</div>
                            </button>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                        <AlertCircle className="text-orange-500 shrink-0" size={18} />
                        <p className="text-xs text-orange-200/80">
                            Estás en modo seguro. Los pagos son procesados por proveedores certificados.
                        </p>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-gold hover:bg-gold/80 hover:brightness-110 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(212,175,55,0.2)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <ShieldCheck size={18} />
                                Activar Suscripción
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
