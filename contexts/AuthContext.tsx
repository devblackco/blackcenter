import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole, UserStatus } from '../types';

// Re-export for backward compatibility
export type { Profile, UserRole, UserStatus };

// ─── Error Categories ────────────────────────────────────────────────────────
export type ProfileError =
    | 'NOT_FOUND'     // profile row does not exist in user_profiles
    | 'ACCESS_DENIED' // RLS/401/403 blocked the SELECT
    | 'NETWORK'       // real network error (not a block)
    | 'ENV_MISSING'   // VITE_SUPABASE_* vars not set
    | 'BLOCKED'       // browser extension / VPN / adblock intercepted before request went out
    | null;

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

// ─── Fetch timeout (ms) ──────────────────────────────────────────────────────
// Each attempt() aborts after this time so a frozen promise can never hang forever.
const FETCH_TIMEOUT_MS = 8_000;

// ─── Safety timeout (ms) ─────────────────────────────────────────────────────
// If the entire fetchProfile (attempt + retry) takes longer than this, force unblock.
const SAFETY_TIMEOUT_MS = 12_000;

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
     * That case is handled by the caller. This function only receives actual error objects.
     */
    const categoriseError = useCallback((error: any): ProfileError => {
        if (!error) return 'NETWORK';

        // Abort / Timeout — request hung and was forcibly cancelled
        if (error?.name === 'AbortError' || error?.code === 'ABORT') return 'BLOCKED';

        // Browser extension / VPN / adblock intercepted before the request went out
        if (
            error?.message?.toLowerCase?.().includes('blocked') ||
            error?.message?.toLowerCase?.().includes('err_blocked') ||
            error?.message?.toLowerCase?.().includes('net::err')
        ) return 'BLOCKED';

        // Placeholder client = ENV vars missing in the deploy
        if (error?.message?.includes?.('placeholder')) return 'ENV_MISSING';

        // PGRST116 = .single() with no row (defensive – we use .maybeSingle())
        if (error?.code === 'PGRST116') return 'NOT_FOUND';

        // 401/403 from RLS
        if (error?.status === 401 || error?.status === 403) return 'ACCESS_DENIED';

        // Generic network/fetch failures
        if (
            error?.message?.toLowerCase?.().includes('fetch') ||
            error?.message?.toLowerCase?.().includes('network') ||
            error?.message?.toLowerCase?.().includes('failed to')
        ) return 'NETWORK';

        return 'NETWORK';
    }, []);

    /**
     * Single attempt to fetch user_profiles with an AbortController timeout.
     * Returns { data, error } — never throws. If the fetch hangs or is blocked,
     * it is forcibly aborted after FETCH_TIMEOUT_MS and returns error.code='ABORT'.
     */
    const attempt = useCallback(async (userId: string): Promise<{ data: Profile | null; error: any }> => {
        const ac = new AbortController();
        const abortTimer = setTimeout(() => {
            ac.abort('timeout');
        }, FETCH_TIMEOUT_MS);

        try {
            const { data, error } = await (supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle() as any).abortSignal(ac.signal);

            return { data: data as Profile | null, error };
        } catch (err: any) {
            // AbortError fires when ac.abort() is called (timeout or deliberate)
            if (err?.name === 'AbortError') {
                console.warn(`[Auth][attempt] aborted after ${FETCH_TIMEOUT_MS / 1000} s — likely blocked by browser/extension/VPN`);
                return { data: null, error: { name: 'AbortError', code: 'ABORT', message: `Request abortada após ${FETCH_TIMEOUT_MS / 1000} s (browser pode estar bloqueando requests ao Supabase)` } };
            }
            // TypeError: Failed to fetch — request never left the browser
            if (err?.name === 'TypeError') {
                console.warn('[Auth][attempt] TypeError (Failed to fetch) — request intercepted before leaving browser:', err.message);
                return { data: null, error: { name: 'TypeError', code: 'BLOCKED', message: err.message } };
            }
            return { data: null, error: err };
        } finally {
            clearTimeout(abortTimer);
        }
    }, []);

    /**
     * Fetches and commits the profile. Returns profile or null.
     * Uses fetchRequestRef to discard stale (race-condition) responses.
     * Retries once after 1.5 s to handle slow triggers after signup.
     */
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        const myRequestId = ++fetchRequestRef.current;
        const startedAt = Date.now();

        console.log(`[Auth][fetchProfile] START userId=${userId} requestId=${myRequestId} t=0ms`);

        try {
            let { data, error } = await attempt(userId);

            const t1 = Date.now() - startedAt;
            console.log(`[Auth][fetchProfile] attempt-1 done in ${t1}ms — data=${!!data} error=${error?.code ?? error?.message ?? 'none'}`);

            // Retry once if: errors, abort, or no data (trigger may be slow after signup)
            if (!data) {
                const reason = error
                    ? `code=${error.code ?? error.name} msg="${error.message}"`
                    : 'row not found (maybeSingle returned null)';
                console.log(`[Auth][fetchProfile] retrying in 1.5 s — ${reason} (requestId=${myRequestId})`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                ({ data, error } = await attempt(userId));

                const t2 = Date.now() - startedAt;
                console.log(`[Auth][fetchProfile] attempt-2 done in ${t2}ms — data=${!!data} error=${error?.code ?? error?.message ?? 'none'}`);
            }

            // Stale response — a newer fetchProfile already completed
            if (myRequestId !== fetchRequestRef.current) {
                console.log(`[Auth][fetchProfile] stale response discarded (requestId=${myRequestId})`);
                return null;
            }

            if (data) {
                console.log(`[Auth][fetchProfile] SUCCESS status=${data.status} role=${data.role} t=${Date.now() - startedAt}ms`);
                setProfile(data);
                setProfileError(null);
                return data;
            }

            // Profile row definitely missing (maybeSingle: data=null, error=null)
            if (!data && !error) {
                console.warn(`[Auth][fetchProfile] MISSING — no row in user_profiles for userId=${userId}`);
                setProfile(null);
                setProfileError('NOT_FOUND');
                return null;
            }

            // Real error: RLS, block, network, etc.
            const category = categoriseError(error);
            console.warn(`[Auth][fetchProfile] FAILED category=${category} code=${error?.code} status=${error?.status} msg="${error?.message}" t=${Date.now() - startedAt}ms`);
            setProfile(null);
            setProfileError(category);
            return null;

        } catch (err: any) {
            if (myRequestId !== fetchRequestRef.current) return null;
            console.error('[Auth][fetchProfile] unexpected exception:', err);
            setProfile(null);
            setProfileError(categoriseError(err));
            return null;
        }
    }, [attempt, categoriseError]);

    /**
     * Public silent refresh (no retry, no loading spinner).
     * Used for manual retry button and Pending page polling.
     */
    const refreshProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await attempt(userId);

            if (data) {
                setProfile(data as Profile);
                setProfileError(null);
                return data as Profile;
            }

            if (!data && !error) {
                setProfileError('NOT_FOUND');
                return null;
            }

            setProfileError(categoriseError(error));
            return null;
        } catch (err) {
            console.error('[Auth] refreshProfile error:', err);
            setProfileError(categoriseError(err));
            return null;
        }
    }, [attempt, categoriseError]);

    // ─── Bootstrap ──────────────────────────────────────────────────────────
    //
    // SINGLE SOURCE OF TRUTH: onAuthStateChange is the only place that reads
    // the session and fetches the profile. We intentionally do NOT call
    // supabase.auth.getSession() separately — the listener fires INITIAL_SESSION
    // on mount, eliminating the main race condition.

    useEffect(() => {
        // Boot safety: if onAuthStateChange never fires (e.g. Supabase fully unreachable)
        let bootSafetyTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
            console.warn('[Auth] Boot safety timeout (12 s) — Supabase likely unreachable at init');
            setProfileError('BLOCKED');
            setLoading(false);
            bootSafetyTimer = null;
        }, SAFETY_TIMEOUT_MS);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log(`[Auth][${event}] userId=${currentSession?.user?.id ?? 'none'}`);

            // Clear the one-shot boot timer on the very first event
            if (bootSafetyTimer !== null) {
                clearTimeout(bootSafetyTimer);
                bootSafetyTimer = null;
            }

            let callSafetyTimer: ReturnType<typeof setTimeout> | null = null;

            try {
                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setProfileError(null);
                    setLoading(false);
                    return; // skip finally
                }

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                        setLoading(true);

                        // Per-call fallback: if fetchProfile hangs past SAFETY_TIMEOUT_MS,
                        // force-unblock AND set an error so the UI shows something actionable.
                        callSafetyTimer = setTimeout(() => {
                            console.warn(`[Auth][${event}] Per-call safety timeout (${SAFETY_TIMEOUT_MS / 1000} s) — setting BLOCKED`);
                            setProfileError('BLOCKED');
                            setLoading(false);
                        }, SAFETY_TIMEOUT_MS);

                        await fetchProfile(currentSession.user.id);

                    } else if (event === 'TOKEN_REFRESHED') {
                        // Token refresh only rotates the JWT — profile on disk hasn't changed.
                        // Do NOT re-fetch or set loading=true to avoid stuck spinner after ~1 h.
                        console.log('[Auth][TOKEN_REFRESHED] session rotated — profile kept as-is');
                    }
                } else {
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setProfileError(null);
                }
            } catch (err) {
                console.error(`[Auth][${event}] handler error:`, err);
                setProfileError(categoriseError(err));
            } finally {
                if (callSafetyTimer !== null) clearTimeout(callSafetyTimer);
                setLoading(false);
            }
        });

        return () => {
            if (bootSafetyTimer !== null) clearTimeout(bootSafetyTimer);
            subscription.unsubscribe();
        };
    }, [fetchProfile, categoriseError]);

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
