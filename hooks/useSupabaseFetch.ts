import { useState, useCallback, useRef, useEffect } from 'react';

const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

interface FetchState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

/**
 * A resilient hook for Supabase data fetching with:
 * - 10 s AbortController timeout (no more infinite spinners)
 * - Error state with human-readable messages
 * - Retry support via `refetch()`
 * - Race-condition protection via request ID tracking
 */
export function useSupabaseFetch<T>(
    fetchFn: (signal: AbortSignal) => Promise<{ data: T | null; error: any }>,
    deps: any[] = []
) {
    const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });
    const requestIdRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const execute = useCallback(async () => {
        const myRequestId = ++requestIdRef.current;
        setState(prev => ({ ...prev, loading: true, error: null }));

        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort('timeout'), FETCH_TIMEOUT_MS);

        try {
            const { data, error } = await fetchFn(ac.signal);

            if (!mountedRef.current || myRequestId !== requestIdRef.current) return;

            clearTimeout(timer);

            if (error) {
                console.error('[useSupabaseFetch] Supabase error:', error);
                setState({ data: null, loading: false, error: error.message || 'Erro ao carregar dados.' });
                return;
            }

            setState({ data, loading: false, error: null });
        } catch (err: any) {
            if (!mountedRef.current || myRequestId !== requestIdRef.current) return;
            clearTimeout(timer);

            if (err?.name === 'AbortError' || err?.code === 20) {
                console.warn('[useSupabaseFetch] Request timed out after', FETCH_TIMEOUT_MS / 1000, 's');
                setState({
                    data: null,
                    loading: false,
                    error: 'A conexão demorou demais (timeout). Verifique sua internet e tente novamente.',
                });
                return;
            }

            console.error('[useSupabaseFetch] Unexpected error:', err);
            setState({
                data: null,
                loading: false,
                error: err?.message || 'Erro inesperado ao buscar dados.',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        execute();
    }, [execute]);

    return { ...state, refetch: execute };
}
