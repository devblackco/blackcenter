import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole, UserStatus } from '../types';

// Re-export for backward compatibility
export type { Profile, UserRole, UserStatus };

// ─── Error Categories ────────────────────────────────────────────────────────
export type ProfileError = 'NOT_FOUND' | 'ACCESS_DENIED' | 'NETWORK' | 'ENV_MISSING' | null;

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
     * NOTE: when using .maybeSingle(), a missing row returns data=null, error=null.
     * That case is handled by the caller (not passed here). This function only
     * receives actual error objects.
     */
    const categoriseError = (error: any): ProfileError => {
        if (!error) return 'NETWORK'; // should not happen, but safe fallback
        // Placeholder client = ENV vars missing in the deploy
        if (error?.message?.includes?.('placeholder')) return 'ENV_MISSING';
        // PGRST116 = .single() with no row (should not happen with .maybeSingle, but defensive)
        if (error?.code === 'PGRST116') return 'NOT_FOUND';
        // 401/403 from RLS
        if (error?.status === 401 || error?.status === 403) return 'ACCESS_DENIED';
        // Network / fetch failures
        if (error?.message?.toLowerCase?.().includes('fetch') ||
            error?.message?.toLowerCase?.().includes('network') ||
            error?.message?.toLowerCase?.().includes('failed to')) return 'NETWORK';
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
            // .maybeSingle() returns { data: null, error: null } when no row exists.
            // .single() would throw PGRST116, which is misleading and harder to distinguish from RLS.
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            return { data: data as Profile | null, error };
        };

        try {
            let { data, error } = await attempt();

            // Retry once if: there's an error OR data is null (profile not found yet — trigger may be slow)
            if (!data) {
                const reason = error ? `error: ${error.code ?? error.message}` : 'row not found (maybeSingle)';
                console.log(`[Auth][fetchProfile] first attempt returned no data (${reason}) — retrying in 1.5 s (requestId=${myRequestId})`);
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

            // Profile definitely does not exist (data=null, error=null from maybeSingle)
            if (!data && !error) {
                console.warn(`[Auth][fetchProfile] profile row missing for userId=${userId}`);
                setProfile(null);
                setProfileError('NOT_FOUND');
                return null;
            }

            // Actual error (RLS, network, etc.)
            const category = categoriseError(error);
            console.warn(`[Auth][fetchProfile] failed — category=${category} code=${error?.code} status=${error?.status}`, error);
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
        // Silent refresh — does NOT touch the global `loading` flag so we never
        // flash the full-screen spinner during polling (e.g. Pending page every 20 s).
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (data) {
                setProfile(data as Profile);
                setProfileError(null);
                return data as Profile;
            }

            if (!data && !error) {
                setProfileError('NOT_FOUND');
                return null;
            }

            const category = categoriseError(error);
            setProfileError(category);
            return null;
        } catch (err) {
            console.error('[Auth] refreshProfile error:', err);
            setProfileError('NETWORK');
            return null;
        }
    }, []);

    // ─── Bootstrap ──────────────────────────────────────────────────────────
    //
    // SINGLE SOURCE OF TRUTH: onAuthStateChange is the only place that reads
    // the session and fetches the profile. We intentionally do NOT call
    // supabase.auth.getSession() separately — the listener fires INITIAL_SESSION
    // on mount which covers that case, eliminating the main race condition.

    useEffect(() => {
        // The initial safety timer only covers the very first boot (INITIAL_SESSION).
        // For subsequent events we use per-call timers (see handler below).
        let bootSafetyTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
            console.warn('[Auth] Boot safety timeout (12 s) — forcing loading=false');
            setLoading(false);
            bootSafetyTimer = null;
        }, 12_000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log(`[Auth][${event}] userId=${currentSession?.user?.id ?? 'none'}`);

            // Clear the one-shot boot timer on the very first event.
            if (bootSafetyTimer !== null) {
                clearTimeout(bootSafetyTimer);
                bootSafetyTimer = null;
            }

            // Per-invocation safety timer. Only created when we actually set loading=true,
            // so TOKEN_REFRESHED events that don't touch loading never leave it stuck.
            let callSafetyTimer: ReturnType<typeof setTimeout> | null = null;

            try {
                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setProfileError(null);
                    setLoading(false);
                    return; // skip finally's setLoading(false) — already done
                }

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                        // These events require a fresh profile load — show spinner.
                        setLoading(true);

                        // Per-call fallback: if fetchProfile hangs, unblock after 12 s.
                        callSafetyTimer = setTimeout(() => {
                            console.warn(`[Auth][${event}] Per-call safety timeout — forcing loading=false`);
                            setLoading(false);
                        }, 12_000);

                        await fetchProfile(currentSession.user.id);

                    } else if (event === 'TOKEN_REFRESHED') {
                        // Token refresh only rotates the JWT — the profile on disk hasn't changed.
                        // Do NOT set loading=true here; that was the root cause of the stuck spinner
                        // after ~1 h (when Supabase silently refreshes the token).
                        console.log('[Auth][TOKEN_REFRESHED] session updated, skipping profile re-fetch');
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
                if (callSafetyTimer !== null) {
                    clearTimeout(callSafetyTimer);
                }
                setLoading(false);
            }
        });

        return () => {
            if (bootSafetyTimer !== null) clearTimeout(bootSafetyTimer);
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
