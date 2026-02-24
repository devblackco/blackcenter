import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole, UserStatus } from '../types';

// Re-export for backward compatibility
export type { Profile, UserRole, UserStatus };

// ─── Error Categories ────────────────────────────────────────────────────────
export type ProfileError = 'NOT_FOUND' | 'ACCESS_DENIED' | 'NETWORK' | null;

// ─── Context Shape ───────────────────────────────────────────────────────────
interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    profileError: ProfileError;
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
    const [profileError, setProfileError] = useState<ProfileError>(null);

    // Incremented on every fetchProfile call.
    // Only the response matching the latest ID may commit to state (prevents stale writes).
    const fetchRequestRef = useRef(0);

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Categorise a Supabase PostgREST error into a ProfileError enum value.
     */
    const categoriseError = (error: any): ProfileError => {
        // PGRST116 = "JSON object requested, multiple (or no) rows returned" → row missing
        if (error?.code === 'PGRST116' || error?.details?.includes?.('0 rows')) return 'NOT_FOUND';
        // 401/403 from RLS
        if (error?.status === 401 || error?.status === 403) return 'ACCESS_DENIED';
        // Anything that looks like a network/fetch error
        if (error?.message?.toLowerCase?.().includes('fetch') ||
            error?.message?.toLowerCase?.().includes('network')) return 'NETWORK';
        // Empty result without explicit error code → treat as not found
        if (!error) return 'NOT_FOUND';
        return 'NETWORK';
    };

    /**
     * Fetches and commits the profile. Returns profile or null.
     * Uses fetchRequestRef to discard stale (race-condition) responses.
     * Retries once (1.5 s delay) to handle slow trigger after signup.
     */
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        const myRequestId = ++fetchRequestRef.current;

        console.log(`[Auth][fetchProfile] attempt — userId=${userId} requestId=${myRequestId}`);

        const attempt = async (): Promise<{ data: Profile | null; error: any }> => {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();
            return { data: data as Profile | null, error };
        };

        try {
            let { data, error } = await attempt();

            // Retry once if the trigger hasn't run yet (slow signup)
            if (!data && error) {
                console.log(`[Auth][fetchProfile] not found on first try — retrying in 1.5 s (requestId=${myRequestId})`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                ({ data, error } = await attempt());
            }

            // Stale response — a newer fetchProfile already completed
            if (myRequestId !== fetchRequestRef.current) {
                console.log(`[Auth][fetchProfile] stale response discarded (requestId=${myRequestId})`);
                return null;
            }

            if (data) {
                console.log(`[Auth][fetchProfile] success — status=${data.status} role=${data.role}`);
                setProfile(data);
                setProfileError(null);
                return data;
            }

            // Persistent error after retry
            const category = categoriseError(error);
            console.warn(`[Auth][fetchProfile] failed — category=${category}`, error);
            setProfile(null);
            setProfileError(category);
            return null;

        } catch (err) {
            if (myRequestId !== fetchRequestRef.current) return null;
            console.error('[Auth][fetchProfile] exception:', err);
            setProfile(null);
            setProfileError('NETWORK');
            return null;
        }
    }, []);

    /**
     * Public refresh (no retry delay). Used for polling on the Pending page.
     */
    const refreshProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (data) {
                setProfile(data as Profile);
                setProfileError(null);
                return data as Profile;
            }

            const category = categoriseError(error);
            setProfileError(category);
            return null;
        } catch (err) {
            console.error('[Auth] refreshProfile error:', err);
            setProfileError('NETWORK');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ─── Bootstrap ──────────────────────────────────────────────────────────
    //
    // SINGLE SOURCE OF TRUTH: onAuthStateChange is the only place that reads
    // the session and fetches the profile. We intentionally do NOT call
    // supabase.auth.getSession() separately — the listener fires INITIAL_SESSION
    // on mount which covers that case, eliminating the main race condition.

    useEffect(() => {
        // Safety net: if something silently fails and loading is never cleared, unblock after 10 s.
        const safetyTimer = setTimeout(() => {
            console.warn('[Auth] Safety timeout (10 s) — forcing loading=false');
            setLoading(false);
        }, 10_000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log(`[Auth][${event}] userId=${currentSession?.user?.id ?? 'none'}`);

            try {
                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setProfileError(null);
                    return;
                }

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    // Fetch profile on sign-in, initial session load, and token refresh
                    if (
                        event === 'SIGNED_IN' ||
                        event === 'INITIAL_SESSION' ||
                        event === 'TOKEN_REFRESHED'
                    ) {
                        setLoading(true);
                        await fetchProfile(currentSession.user.id);
                    }
                } else {
                    // currentSession is null — user is logged out
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setProfileError(null);
                }
            } catch (err) {
                console.error(`[Auth][${event}] handler error:`, err);
                setProfileError('NETWORK');
            } finally {
                clearTimeout(safetyTimer);
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(safetyTimer);
            subscription.unsubscribe();
        };
    }, [fetchProfile]);

    // ─── Auth Actions ────────────────────────────────────────────────────────

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
            setProfile(null);
            setUser(null);
            setSession(null);
            setLoading(false);
            setProfileError(null);
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

    // ─── Context Value ───────────────────────────────────────────────────────

    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        profileError,
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
