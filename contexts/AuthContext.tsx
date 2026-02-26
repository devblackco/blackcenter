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
    /** Manually re-fetches the profile from the DB. Used for retry button and Pending page polling. */
    refreshProfile: (userId: string) => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Timeouts ────────────────────────────────────────────────────────────────
/** Each fetch attempt is aborted if it doesn't respond within this time. */
const FETCH_TIMEOUT_MS = 8_000;
/** If the entire fetchProfile sequence (attempt + retry) exceeds this, force-unblock. */
const SAFETY_TIMEOUT_MS = 12_000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileError, setProfileError] = useState<ProfileError>(null);

    // ─── Refs ────────────────────────────────────────────────────────────────

    /** Guards against React state updates after unmount. */
    const mountedRef = useRef(true);
    useEffect(() => { return () => { mountedRef.current = false; }; }, []);

    /** Incremented on every fetchProfile call. Stale responses are discarded. */
    const fetchRequestRef = useRef(0);

    /** Last profile that completed successfully. Never wiped by transient errors. */
    const lastGoodProfileRef = useRef<Profile | null>(null);

    /**
     * Mirror of profileError as a ref so the TOKEN_REFRESHED handler inside useEffect
     * can read the *current* value without a stale closure.
     */
    const profileErrorRef = useRef<ProfileError>(null);

    /** Wrapper that keeps the ref in sync with the state setter. */
    const setProfileErrorSynced = useCallback((err: ProfileError) => {
        profileErrorRef.current = err;
        setProfileError(err);
    }, []);

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Map a raw error object to a ProfileError category.
     * Called only when there is an actual error object — not for data=null/error=null.
     */
    const categoriseError = useCallback((error: any): ProfileError => {
        if (!error) return 'NETWORK';

        // AbortError: our AbortController fired (timeout or deliberate cancel)
        if (error?.name === 'AbortError' || error?.code === 'ABORT') return 'BLOCKED';

        // Browser/extension/VPN intercepted the request before it left the browser
        if (
            error?.message?.toLowerCase?.().includes('blocked') ||
            error?.message?.toLowerCase?.().includes('err_blocked') ||
            error?.message?.toLowerCase?.().includes('net::err')
        ) return 'BLOCKED';

        // Placeholder Supabase client = ENV vars missing in the deploy
        if (error?.message?.includes?.('placeholder')) return 'ENV_MISSING';

        // PGRST116: .single() with no row (defensive — we use .maybeSingle())
        if (error?.code === 'PGRST116') return 'NOT_FOUND';

        // RLS denial
        if (error?.status === 401 || error?.status === 403) return 'ACCESS_DENIED';

        // Generic network/fetch failures (TypeError: Failed to fetch, etc.)
        if (
            error?.name === 'TypeError' ||
            error?.message?.toLowerCase?.().includes('fetch') ||
            error?.message?.toLowerCase?.().includes('network') ||
            error?.message?.toLowerCase?.().includes('failed to')
        ) return 'BLOCKED'; // "Failed to fetch" = browser didn't send the request

        return 'NETWORK';
    }, []);

    /**
     * Single fetch attempt with an AbortController timeout.
     * Returns { data, error } — never throws.
     * If the promise is frozen (blocked by extension/VPN) it is aborted after FETCH_TIMEOUT_MS.
     */
    const attempt = useCallback(async (userId: string): Promise<{ data: Profile | null; error: any }> => {
        const ac = new AbortController();
        const abortTimer = setTimeout(() => ac.abort('timeout'), FETCH_TIMEOUT_MS);

        try {
            const { data, error } = await (supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle() as any).abortSignal(ac.signal);

            return { data: data as Profile | null, error };
        } catch (err: any) {
            if (err?.name === 'AbortError') {
                console.warn(`[Auth][attempt] aborted after ${FETCH_TIMEOUT_MS / 1000} s — likely blocked by browser/extension/VPN`);
                return {
                    data: null,
                    error: { name: 'AbortError', code: 'ABORT', message: `Request abortada após ${FETCH_TIMEOUT_MS / 1000} s (browser pode estar bloqueando o Supabase via VPN/extensão)` },
                };
            }
            if (err?.name === 'TypeError') {
                console.warn('[Auth][attempt] TypeError (Failed to fetch) — request never left browser:', err.message);
                return { data: null, error: { name: 'TypeError', code: 'BLOCKED', message: err.message } };
            }
            return { data: null, error: err };
        } finally {
            clearTimeout(abortTimer);
        }
    }, []);

    /**
     * Fetches and commits the profile for a given userId.
     * - Retries once after 1.5 s (handles slow signup trigger).
     * - On transient errors (BLOCKED/NETWORK): preserves the last-good profile in memory
     *   so a working session isn't destroyed by a momentary blip.
     * - Uses fetchRequestRef to discard stale concurrent responses.
     */
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        const myRequestId = ++fetchRequestRef.current;
        const startedAt = Date.now();

        console.log(`[Auth][fetchProfile] START userId=${userId} requestId=${myRequestId} t=0ms`);

        try {
            let { data, error } = await attempt(userId);

            const t1 = Date.now() - startedAt;
            console.log(`[Auth][fetchProfile] attempt-1 in ${t1}ms — data=${!!data} error=${error?.code ?? error?.message ?? 'none'}`);

            // Retry once when no data yet (slow trigger or transient failure)
            if (!data) {
                const reason = error
                    ? `code=${error.code ?? error.name} msg="${error.message}"`
                    : 'maybeSingle returned null (row may not exist yet)';
                console.log(`[Auth][fetchProfile] retrying in 1.5 s — ${reason} (requestId=${myRequestId})`);
                await new Promise(resolve => setTimeout(resolve, 1500));
                ({ data, error } = await attempt(userId));

                const t2 = Date.now() - startedAt;
                console.log(`[Auth][fetchProfile] attempt-2 in ${t2}ms — data=${!!data} error=${error?.code ?? error?.message ?? 'none'}`);
            }

            // Discard result if a newer call already resolved or component unmounted
            if (myRequestId !== fetchRequestRef.current || !mountedRef.current) {
                console.log(`[Auth][fetchProfile] stale/unmounted response discarded (requestId=${myRequestId})`);
                return null;
            }

            if (data) {
                console.log(`[Auth][fetchProfile] SUCCESS status=${data.status} role=${data.role} t=${Date.now() - startedAt}ms`);
                lastGoodProfileRef.current = data;
                setProfile(data);
                setProfileErrorSynced(null);
                return data;
            }

            // data=null, error=null → row definitively missing
            if (!error) {
                console.warn(`[Auth][fetchProfile] MISSING — no user_profiles row for userId=${userId}`);
                lastGoodProfileRef.current = null;
                setProfile(null);
                setProfileErrorSynced('NOT_FOUND');
                return null;
            }

            // Real error (BLOCKED, NETWORK, ACCESS_DENIED, etc.)
            const category = categoriseError(error);
            console.warn(`[Auth][fetchProfile] FAILED category=${category} code=${error?.code} status=${error?.status} msg="${error?.message}" t=${Date.now() - startedAt}ms`);

            if (lastGoodProfileRef.current) {
                // Transient failure with cached profile: keep user logged in, show soft error
                console.log('[Auth][fetchProfile] preserving last-good profile — session stays alive');
                setProfileErrorSynced(category);
            } else {
                // First load with no cache: must surface the error fully
                setProfile(null);
                setProfileErrorSynced(category);
            }
            return null;

        } catch (err: any) {
            if (myRequestId !== fetchRequestRef.current || !mountedRef.current) return null;
            console.error('[Auth][fetchProfile] unexpected exception:', err);
            const category = categoriseError(err);
            if (lastGoodProfileRef.current) {
                setProfileErrorSynced(category);
            } else {
                setProfile(null);
                setProfileErrorSynced(category);
            }
            return null;
        }
    }, [attempt, categoriseError, setProfileErrorSynced]);

    /**
     * Silent refresh — no spinner, no retry delay.
     * Used by the "Tentar novamente" button and Pending page polling.
     */
    const refreshProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await attempt(userId);

            if (data) {
                lastGoodProfileRef.current = data;
                setProfile(data as Profile);
                setProfileErrorSynced(null);
                return data as Profile;
            }

            if (!error) {
                setProfileErrorSynced('NOT_FOUND');
                return null;
            }

            setProfileErrorSynced(categoriseError(error));
            return null;
        } catch (err) {
            console.error('[Auth] refreshProfile error:', err);
            setProfileErrorSynced(categoriseError(err));
            return null;
        }
    }, [attempt, categoriseError, setProfileErrorSynced]);

    // ─── Bootstrap ──────────────────────────────────────────────────────────
    //
    // SINGLE SOURCE OF TRUTH: onAuthStateChange is the only place that reads
    // the session and fetches the profile. We do NOT call getSession() separately —
    // the listener fires INITIAL_SESSION on mount, which covers that case and
    // eliminates the double-fetch race condition.

    useEffect(() => {
        // Boot safety: fires only if onAuthStateChange never delivers a first event
        // (e.g. Supabase is completely unreachable at startup).
        let bootSafetyTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
            if (!mountedRef.current) return;
            console.warn('[Auth] Boot safety timeout (12 s) — Supabase unreachable at init');
            setProfileErrorSynced('BLOCKED');
            setLoading(false);
            bootSafetyTimer = null;
        }, SAFETY_TIMEOUT_MS);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            console.log(`[Auth][${event}] userId=${currentSession?.user?.id ?? 'none'}`);

            // One-shot: cancel boot timer as soon as we get any event
            if (bootSafetyTimer !== null) {
                clearTimeout(bootSafetyTimer);
                bootSafetyTimer = null;
            }

            // Per-invocation safety timer (only armed when loading=true)
            let callSafetyTimer: ReturnType<typeof setTimeout> | null = null;

            try {
                if (event === 'SIGNED_OUT') {
                    lastGoodProfileRef.current = null;
                    setSession(null);
                    setUser(null);
                    setProfile(null);
                    setProfileErrorSynced(null);
                    setLoading(false);
                    return; // skip finally
                }

                if (currentSession) {
                    setSession(currentSession);
                    setUser(currentSession.user);

                    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                        setLoading(true);

                        // If fetchProfile hangs (e.g. all attempts blocked), force-unblock
                        // and surface BLOCKED so the UI shows an actionable error.
                        callSafetyTimer = setTimeout(() => {
                            if (!mountedRef.current) return;
                            console.warn(`[Auth][${event}] Per-call safety timeout (${SAFETY_TIMEOUT_MS / 1000} s) — BLOCKED`);
                            setProfileErrorSynced('BLOCKED');
                            setLoading(false);
                        }, SAFETY_TIMEOUT_MS);

                        await fetchProfile(currentSession.user.id);

                    } else if (event === 'TOKEN_REFRESHED') {
                        // JWT rotated. Profile data hasn't changed — no need to re-fetch normally.
                        // EXCEPTION: use TOKEN_REFRESHED as recovery opportunity when the profile
                        // is missing or in error state (e.g. the SIGNED_IN fetch was blocked earlier).
                        const profileIsStale = !lastGoodProfileRef.current;
                        const hasError = profileErrorRef.current !== null;

                        if (profileIsStale || hasError) {
                            console.log(`[Auth][TOKEN_REFRESHED] recovery re-fetch — profileStale=${profileIsStale} hasError=${hasError}`);
                            await refreshProfile(currentSession.user.id);
                        } else {
                            console.log('[Auth][TOKEN_REFRESHED] session rotated — profile intact, skipping re-fetch');
                        }
                    }

                } else {
                    // currentSession === null could be a brief Supabase blip before TOKEN_REFRESHED.
                    // Only wipe state if there is no confirmed good profile to preserve.
                    if (lastGoodProfileRef.current) {
                        console.warn('[Auth] currentSession=null with cached profile — likely transient; waiting for TOKEN_REFRESHED');
                    } else {
                        setSession(null);
                        setUser(null);
                        setProfile(null);
                        setProfileErrorSynced(null);
                    }
                }

            } catch (err) {
                console.error(`[Auth][${event}] handler error:`, err);
                setProfileErrorSynced(categoriseError(err));
            } finally {
                if (callSafetyTimer !== null) clearTimeout(callSafetyTimer);
                setLoading(false);
            }
        });

        return () => {
            if (bootSafetyTimer !== null) clearTimeout(bootSafetyTimer);
            subscription.unsubscribe();
        };
    }, [fetchProfile, refreshProfile, categoriseError, setProfileErrorSynced]);

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
            lastGoodProfileRef.current = null;
            setProfile(null);
            setUser(null);
            setSession(null);
            setLoading(false);
            setProfileErrorSynced(null);
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
