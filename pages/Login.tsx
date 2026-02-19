import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, Mail, AlertCircle } from 'lucide-react';
import { PasswordInput } from '../components/PasswordInput';
import { translateError } from '../lib/translations';

const Login = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading, signIn, signUp, resetPassword } = useAuth();
    const navigate = useNavigate();

    // Auto-redirect if already logged in
    React.useEffect(() => {
        if (!authLoading && user) {
            navigate('/', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isForgotPassword) {
                const { error } = await resetPassword(email);
                if (error) {
                    setError(translateError(error.message));
                } else {
                    setError('Link de recuperação enviado! Verifique seu email.');
                    setIsForgotPassword(false);
                }
            } else {
                const { error } = isSignUp
                    ? await signUp(email, password, name)
                    : await signIn(email, password);

                if (error) {
                    setError(translateError(error.message));
                } else {
                    if (isSignUp) {
                        setError('Conta criada! Aguarde aprovação de um administrador.');
                    }
                    // On successful sign-in, onAuthStateChange fires SIGNED_IN,
                    // fetches the profile, then the useEffect below redirects.
                    // Do NOT navigate() here — that races with fetchProfile.
                }
            }
        } catch (err) {
            setError('Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            B
                        </div>
                        <span className="font-bold text-2xl text-slate-900">BlackCenter</span>
                    </div>
                    <p className="text-slate-500 text-sm">Sistema de Gestão Empresarial</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        <button
                            onClick={() => { setIsSignUp(false); setIsForgotPassword(false); setError(null); }}
                            className={`flex-1 py-4 text-sm font-semibold transition-all ${!isSignUp && !isForgotPassword
                                ? 'text-primary border-b-2 border-primary bg-blue-50'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <LogIn className="w-4 h-4 inline mr-2" />
                            Login
                        </button>
                        <button
                            onClick={() => { setIsSignUp(true); setIsForgotPassword(false); setError(null); }}
                            className={`flex-1 py-4 text-sm font-semibold transition-all ${isSignUp
                                ? 'text-primary border-b-2 border-primary bg-blue-50'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <UserPlus className="w-4 h-4 inline mr-2" />
                            Cadastro
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${error.includes('criada')
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {isSignUp && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Nome Completo
                                </label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder-slate-400"
                                        placeholder="Seu nome"
                                        required={isSignUp}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder-slate-400"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <PasswordInput
                                label="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={isSignUp ? 'Mínimo 6 caracteres' : '••••••••'}
                                required={!isForgotPassword}
                                minLength={6}
                            />
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {isForgotPassword ? 'Enviando link...' : isSignUp ? 'Criando conta...' : 'Entrando...'}
                                </>
                            ) : (
                                <>
                                    {isForgotPassword ? <Mail className="w-5 h-5" /> : isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                                    {isForgotPassword ? 'Recuperar Senha' : isSignUp ? 'Criar Conta' : 'Entrar'}
                                </>
                            )}
                        </button>

                        {!isSignUp && (
                            <div className="text-center">
                                <button
                                    type="button"
                                    className="text-sm text-primary hover:underline"
                                    onClick={() => setIsForgotPassword(!isForgotPassword)}
                                >
                                    {isForgotPassword ? 'Voltar para o login' : 'Esqueceu sua senha?'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-6">
                    © 2024 BlackCenter ERP - Todos os direitos reservados
                </p>
            </div>
        </div>
    );
};

export default Login;
