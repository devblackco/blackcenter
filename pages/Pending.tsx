import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Clock, CheckCircle } from 'lucide-react';

const POLL_INTERVAL_MS = 20_000; // Re-check status every 20 seconds

const Pending = () => {
    const { signOut, user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const displayEmail = profile?.email || user?.email || '—';

    // Logout handler — clears state then navigates to /login
    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('[Pending] signOut error:', error);
        } finally {
            navigate('/login', { replace: true });
        }
    };

    // Poll the profile every N seconds. If the admin approves the account,
    // the status will change from PENDENTE to ATIVO and we redirect the user.
    useEffect(() => {
        if (!user?.id) return;

        const check = async () => {
            const refreshed = await refreshProfile(user.id);
            if (refreshed?.status === 'ATIVO') {
                navigate('/', { replace: true });
            }
        };

        pollingRef.current = setInterval(check, POLL_INTERVAL_MS);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [user?.id, navigate, refreshProfile]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-yellow-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Aguardando Aprovação</h1>
                <p className="text-slate-500 mb-6">
                    Sua conta (<span className="font-medium text-slate-700">{displayEmail}</span>) foi criada com
                    sucesso e está aguardando análise de um administrador. Você receberá acesso assim que seu
                    cadastro for aprovado.
                </p>

                <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <p>
                            Avisaremos automaticamente assim que seu acesso for liberado. Você também
                            pode entrar em contato com o suporte se precisar de agilidade.
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-4 py-2 text-slate-600 hover:text-white hover:bg-red-500 font-medium transition-all rounded-lg border border-slate-200 hover:border-red-500"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da conta
                </button>
            </div>
        </div>
    );
};

export default Pending;
