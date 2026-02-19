import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { useRole } from '../hooks/useRole';

interface ProtectedRouteProps {
    children?: React.ReactNode;
    requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
    const { user, profile, loading, refreshProfile } = useAuth();
    const { hasPermission } = useRole();

    // Still initializing auth or fetching profile — wait, never jump to /pending prematurely
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // User is authenticated but profile failed to load (DB error, RLS issue etc.)
    // Show a retry screen instead of sending to /pending blindly.
    if (!profile) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Erro ao carregar perfil</h2>
                    <p className="text-slate-500 text-sm mb-5">
                        Não foi possível buscar seus dados. Verifique sua conexão e tente novamente.
                    </p>
                    <button
                        onClick={() => refreshProfile(user.id).then((p) => {
                            if (p?.status === 'ATIVO') window.location.reload();
                        })}
                        className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
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
