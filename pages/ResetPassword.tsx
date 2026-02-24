import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { translateError } from '../lib/translations';

type PageState = 'VERIFYING' | 'READY' | 'ERROR' | 'SUCCESS';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageState, setPageState] = useState<PageState>('VERIFYING');

    // updatePassword helper still useful after session is set
    const { updatePassword } = useAuth();
    const navigate = useNavigate();
    const isInteracting = useRef(false);

    useEffect(() => {
        const handleAuthSession = async () => {
            if (isInteracting.current) return;
            isInteracting.current = true;

            try {
                // 1. Extrair tokens do fragmento — com BrowserRouter o Supabase entrega:
                // /reset-password#access_token=xxx&refresh_token=yyy
                // O fragmento é direto, sem prefixo de rota.
                const hash = window.location.hash.substring(1); // remove o '#' inicial
                const params = new URLSearchParams(hash);

                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');

                if (accessToken && refreshToken) {
                    console.log('ResetPassword: Tokens detectados. Estabelecendo sessão única...');

                    // A chamada abaixo é a ÚNICA que deve rodar nesta rota
                    const { data, error: sessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (!sessionError && data.session) {
                        console.log('ResetPassword: Sessão estabelecida com sucesso.');

                        // Clean URL — remove tokens do fragmento, mantém a rota limpa
                        window.history.replaceState(null, '', `${window.location.origin}${window.location.pathname}`);

                        setPageState('READY');
                        return;
                    } else {
                        console.error('ResetPassword: Erro ao setar sessão:', sessionError);
                    }
                }

                // 2. Fallback para sessão já existente (ex: já validada ou persistida)
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setPageState('READY');
                    return;
                }

                // 3. Se nada funcionar
                setPageState('ERROR');
                setError('O link de recuperação de senha é inválido ou expirou.');
            } catch (err) {
                console.error('ResetPassword: Erro na validação:', err);
                setPageState('ERROR');
                setError('Ocorreu um erro ao verificar seu link de acesso.');
            } finally {
                isInteracting.current = false;
            }
        };

        handleAuthSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            // Agora que a sessão foi setada pelo setSession acima, podemos usar updateUser
            const { error: updateError } = await supabase.auth.updateUser({ password });

            if (updateError) {
                throw updateError;
            }

            setPageState('SUCCESS');
            setTimeout(() => navigate('/'), 3000);
        } catch (err: any) {
            console.error('ResetPassword update error:', err);
            setError(translateError(err?.message || 'Erro ao atualizar senha. Verifique sua conexão.'));
        } finally {
            setLoading(false);
        }
    };

    // --- Renders (Mantendo estética premium) ---

    if (pageState === 'VERIFYING') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium text-lg">Validando seu link...</p>
                </div>
            </div>
        );
    }

    if (pageState === 'ERROR') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Sessão Inválida</h1>
                    <p className="text-slate-600 mb-8">{error}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-hover transition-all"
                    >
                        Solicitar novo link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-primary/5 p-8 text-center border-b border-slate-100">
                        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-3xl shadow-lg mx-auto mb-4">
                            B
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Nova Senha</h1>
                        <p className="text-slate-500 text-sm mt-2">Crie uma senha forte e segura</p>
                    </div>

                    <div className="p-8">
                        {pageState === 'SUCCESS' ? (
                            <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl flex flex-col items-center gap-4 animate-in fade-in duration-500">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                                <div className="text-center">
                                    <p className="font-bold text-xl mb-1">Tudo pronto!</p>
                                    <p className="text-green-700/80">Senha atualizada. Redirecionando...</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3 text-sm">
                                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                        <span className="font-medium">{error}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <PasswordInput
                                        label="Nova Senha"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="No mínimo 6 caracteres"
                                        required
                                        minLength={6}
                                    />

                                    <PasswordInput
                                        label="Confirmar Senha"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Repita a nova senha"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Redefinir Senha'
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="w-full text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
                                >
                                    Voltar para o login
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
