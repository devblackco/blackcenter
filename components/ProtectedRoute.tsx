import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { useRole } from '../hooks/useRole';
import type { ProfileError } from '../contexts/AuthContext';
import { AlertTriangle, ShieldOff, WifiOff, UserX, Settings, Shield, RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    requiredRole?: UserRole;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_AUTO_RETRIES = 3;
const RETRY_DELAY_MS = 2_000;

/** Errors that should be auto-retried before showing the error card. */
const RETRYABLE_ERRORS: Set<NonNullable<ProfileError>> = new Set(['NETWORK', 'BLOCKED']);

// ─── Error state UI ──────────────────────────────────────────────────────────

const profileErrorConfig: Record<
    NonNullable<ProfileError>,
    { icon: React.ElementType; iconClass: string; title: string; body: string }
> = {
    NOT_FOUND: {
        icon: UserX,
        iconClass: 'text-yellow-500',
        title: 'Perfil não encontrado',
        body: 'Seu perfil de usuário não foi criado. Contate o administrador do sistema.',
    },
    ACCESS_DENIED: {
        icon: ShieldOff,
        iconClass: 'text-red-500',
        title: 'Sem permissão',
        body: 'Não foi possível ler seus dados de perfil. Contate o administrador (erro de permissão / RLS).',
    },
    NETWORK: {
        icon: WifiOff,
        iconClass: 'text-slate-400',
        title: 'Falha de rede',
        body: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    },
    ENV_MISSING: {
        icon: Settings,
        iconClass: 'text-orange-500',
        title: 'Configuração ausente',
        body: 'As variáveis VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não estão configuradas neste ambiente. Adicione-as nas configurações da Vercel.',
    },
    BLOCKED: {
        icon: Shield,
        iconClass: 'text-purple-500',
        title: 'Conexão bloqueada',
        body: 'O browser impediu a conexão com o servidor. Desative VPN, extensões de privacidade ou adblock e tente novamente.',
    },
};

interface ProfileErrorCardProps {
    error: NonNullable<ProfileError>;
    onRetry: () => void;
}

const ProfileErrorCard: React.FC<ProfileErrorCardProps> = ({ error, onRetry }) => {
    const { icon: Icon, iconClass, title, body } = profileErrorConfig[error];
    return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <Icon className={`w-12 h-12 mx-auto mb-4 ${iconClass}`} />
                <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
                <p className="text-slate-500 text-sm mb-6">{body}</p>
                <button
                    onClick={onRetry}
                    className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg active:scale-[0.98]"
                >
                    Tentar novamente
                </button>
            </div>
        </div>
    );
};

// ─── Component ───────────────────────────────────────────────────────────────

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, profile, loading, profileError, refreshProfile } = useAuth();
    const { hasPermission } = useRole();

    // Auto-retry state: tracks retries for NETWORK/BLOCKED errors
    const [retrying, setRetrying] = useState(false);
    const retryCountRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset retry counter whenever we get a successful profile load
    useEffect(() => {
        if (profile) {
            retryCountRef.current = 0;
            setRetrying(false);
        }
    }, [profile]);

    // Auto-retry on retryable errors (NETWORK, BLOCKED)
    useEffect(() => {
        if (
            !loading &&
            !profile &&
            profileError &&
            RETRYABLE_ERRORS.has(profileError) &&
            user &&
            retryCountRef.current < MAX_AUTO_RETRIES
        ) {
            retryCountRef.current += 1;
            const attempt = retryCountRef.current;
            console.log(`[ProtectedRoute] Auto-retry ${attempt}/${MAX_AUTO_RETRIES} for ${profileError} in ${RETRY_DELAY_MS / 1000}s`);
            setRetrying(true);

            retryTimerRef.current = setTimeout(() => {
                refreshProfile(user.id);
            }, RETRY_DELAY_MS);

            return () => {
                if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            };
        }

        // If we exhausted retries, stop the retrying state
        if (retryCountRef.current >= MAX_AUTO_RETRIES) {
            setRetrying(false);
        }
    }, [loading, profile, profileError, user, refreshProfile]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        };
    }, []);

    console.log(`[ProtectedRoute] loading=${loading} user=${user?.id ?? 'none'} profile=${profile?.status ?? 'null'} profileError=${profileError} retrying=${retrying} retryCount=${retryCountRef.current}`);

    // Still initialising auth or fetching profile — wait
    if (loading || retrying) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">
                        {retrying ? 'Reconectando...' : 'Carregando...'}
                    </p>
                    {retrying && (
                        <p className="text-slate-400 text-sm mt-2">
                            Tentativa {retryCountRef.current} de {MAX_AUTO_RETRIES}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Profile failed to load — show categorised error card (only after retries exhausted)
    if (!profile && profileError) {
        return (
            <ProfileErrorCard
                error={profileError}
                onRetry={() => {
                    retryCountRef.current = 0;
                    setRetrying(true);
                    refreshProfile(user.id);
                }}
            />
        );
    }

    // Authenticated but profile still null with no error (edge case)
    if (!profile) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-7 h-7 text-yellow-600" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Erro ao carregar perfil</h2>
                    <p className="text-slate-500 text-sm mb-6">
                        Não foi possível buscar seus dados. Verifique sua conexão e tente novamente.
                    </p>
                    <button
                        onClick={() => refreshProfile(user.id)}
                        className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg active:scale-[0.98]"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    // Check user status — non-ATIVO goes to pending
    if (profile.status !== 'ATIVO') {
        return <Navigate to="/pending" replace />;
    }

    // Role-based access check
    if (requiredRole && !hasPermission(requiredRole)) {
        return <Navigate to="/acesso-negado" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};
