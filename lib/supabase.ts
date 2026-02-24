import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Non-null when env vars are missing. Check this before using `supabase`.
 */
export const supabaseConfigError: string | null =
    (!supabaseUrl || !supabaseAnonKey)
        ? 'Variáveis VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não encontradas. Crie um arquivo .env.local na raiz do projeto com essas variáveis.'
        : null;

export const supabase: SupabaseClient = supabaseConfigError
    ? createClient('https://placeholder.supabase.co', 'placeholder-key')
    : createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            // Required for reset-password / magic-link flows (reads tokens from URL hash)
            detectSessionInUrl: true,
            // Isolates localStorage key from other Supabase apps on the same origin
            storageKey: 'blackcenter-auth',
        },
    });
