import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

export const useRole = () => {
    const { profile, loading } = useAuth();

    const hasRole = (requiredRole: UserRole | UserRole[]) => {
        if (loading || !profile) return false;

        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        return roles.includes(profile.role);
    };

    /**
     * Checks if the user has at least the required permission level.
     * Hierarchy: admin > expedicao > leitor
     */
    const hasPermission = (requiredLevel: UserRole) => {
        if (loading || !profile) return false;

        // Permissions logic
        const levels = {
            'ADMIN': 3,
            'EXPEDICAO': 2,
            'LEITOR': 1
        };

        const userLevel = levels[profile.role] || 0;
        const required = levels[requiredLevel] || 0;

        return userLevel >= required;
    };

    return {
        role: profile?.role,
        loading,
        hasRole,
        hasPermission,
        isAdmin: profile?.role === 'ADMIN',
        isExpedicao: profile?.role === 'EXPEDICAO',
        isLeitor: profile?.role === 'LEITOR'
    };
};
