import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole, UserStatus } from '../types';

// Re-export for backward compatibility
export type { Profile, UserRole, UserStatus };

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
    resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
    updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
    /** Manually re-fetches the profile from the DB. Useful for polling (e.g. pending approval). */
    refreshProfile: (userId: string) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const initDone = useRef(false);

    /**
     * Unified profile fetcher. Tries once, if not found waits 1.5s and retries
     * (handles slow trigger after signup). Never throws — returns null on failure.
     */
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data) {
                setProfile(data as Profile);
                return data as Profile;
            }

            if (error) {
                console.log('[Auth] Profile not found on first try, retrying in 1.5s...');
            }

            // Retry once — trigger may be slow after signup
            await new Promise(resolve => setTimeout(resolve, 1500));

            const { data: retryData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (retryData) {
                setProfile(retryData as Profile);
                return retryData as Profile;
            }

            console.warn('[Auth] Profile still missing after retry for user:', userId);
            setProfile(null);
            return null;
        } catch (err) {
            console.error('[Auth] fetchProfile error:', err);
            setProfile(null);
            return null;
        }
    }, []);

    /**
     * Public version of fetchProfile — no retry delay.
     * Used for manual/polling refreshes (e.g. the Pending page).
     */
    const refreshProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        try {
            const { data } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data) {
                setProfile(data as Profile);
                return data as Profile;
            }
            return null;
        } catch (err) {
            console.error('[Auth] refreshProfile error:', err);
            return null;
        }
    }, []);

    useEffect(() => {
        // Safety timeout — if loading is still true after 8s, force it off.
        // Prevents infinite spinner when DB trigger is slow or profile is missing.
        const safetyTimer = setTimeout(() => {
            if (!initDone.current) {
                console.warn('[Auth] Safety timeout reached. Forcing loading=false.');
                setLoading(false);
                initDone.current = true;
            }
        }, 8000);

        // 1. Set up auth listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log('[Auth] onAuthStateChange:', event);

            try {
                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    return;
                }

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    // For sign-in and initial session, fetch profile.
                    // Set loading=true first so ProtectedRoute shows spinner
                    // and never sees an intermediate profile=null state.
                    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                        setLoading(true);
                        await fetchProfile(currentSession.user.id);
                    }
                } else {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                }
            } catch (err) {
                console.error('[Auth] onAuthStateChange handler error:', err);
            } finally {
                setLoading(false);
                initDone.current = true;
            }
        });

        // 2. Bootstrap with getSession (fires onAuthStateChange with INITIAL_SESSION)
        const initSession = async () => {
            try {
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[Auth] getSession error:', error);
                }

                // If onAuthStateChange already handled everything, skip
                if (initDone.current) return;

                if (initialSession) {
                    setSession(initialSession);
                    setUser(initialSession.user);
                    await fetchProfile(initialSession.user.id);
                }
            } catch (err) {
                console.error('[Auth] initSession error:', err);
            } finally {
                if (!initDone.current) {
                    setLoading(false);
                    initDone.current = true;
                }
            }
        };

        initSession();

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    const signIn = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signUp = async (email: string, password: string, name: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } }
        });
        return { error };
    };

    const signOut = async () => {
        try {
            // Clear local state immediately for instant UI feedback
            setProfile(null);
            setUser(null);
            setSession(null);
            setLoading(false);
            await supabase.auth.signOut();
        } catch (error) {
            console.error('[Auth] signOut error:', error);
        }
    };

    const updateProfile = async (updates: Partial<Profile>) => {
        if (!user) return { error: 'Usuário não autenticado' };

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('user_id', user.id);

            if (!error) {
                await fetchProfile(user.id);
            }

            return { error };
        } catch (error) {
            console.error('[Auth] updateProfile error:', error);
            return { error };
        }
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        return { error };
    };

    const updatePassword = async (password: string) => {
        try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            if (!currentSession) {
                return {
                    error: {
                        message: 'Sessão não encontrada ou expirada. Solicite um novo link de recuperação.',
                        status: 401,
                    } as AuthError,
                };
            }
            const { error } = await supabase.auth.updateUser({ password });
            return { error };
        } catch (err) {
            const error = err as Error | AuthError;
            console.error('[Auth] updatePassword error:', error);
            return {
                error: {
                    message: error.message || 'Erro inesperado ao atualizar senha',
                } as AuthError,
            };
        }
    };

    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        resetPassword,
        updatePassword,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
