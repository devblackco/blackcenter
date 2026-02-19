import { supabase } from '../lib/supabase';
import { padLegacyId } from '../utils/sku';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Brand {
    id: string;
    name: string;
    code: string;
}

export interface Category {
    id: string;
    name: string;
    code: string;
}

export interface CreateSimpleProductPayload {
    nome: string;
    sku: string;
    tipo: 'SIMPLES';
    marca: string;          // brand code
    categoria: string;      // category code
    status: 'ATIVO' | 'RASCUNHO';
    modelo_id_4: string;    // 4-digit legacy ID
    image_path?: string | null;
}

// ─── Brands ────────────────────────────────────────────────────────────────────

export async function fetchBrands(): Promise<Brand[]> {
    try {
        const { data, error } = await supabase
            .from('brands')
            .select('id, name, code')
            .order('name');
        if (error) {
            console.warn('[productService] fetchBrands error:', error.message);
            return [];
        }
        return (data as Brand[]) ?? [];
    } catch {
        return [];
    }
}

// ─── Categories ────────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('id, name, code')
            .order('name');
        if (error) {
            console.warn('[productService] fetchCategories error:', error.message);
            return [];
        }
        return (data as Category[]) ?? [];
    } catch {
        return [];
    }
}

// ─── Legacy ID Generation ──────────────────────────────────────────────────────
//
// ⚠️ TECH DEBT: This is a best-effort MAX+1 approach.
// Under concurrent saves two users could get the same ID.
// Replace with a DB-side sequence / RPC (SELECT nextval / advisory-lock) when volume grows.

export async function generateNextLegacyId(): Promise<string> {
    try {
        // Try fetching the max 4-digit modelo_id_4 that looks like a number
        const { data, error } = await supabase
            .from('sku')
            .select('modelo_id_4')
            .not('modelo_id_4', 'is', null);

        if (error) {
            console.warn('[productService] generateNextLegacyId error:', error.message);
            return padLegacyId(1);
        }

        const nums = (data ?? [])
            .map((r: any) => parseInt(r.modelo_id_4, 10))
            .filter((n: number) => !isNaN(n));

        const maxId = nums.length > 0 ? Math.max(...nums) : 0;
        return padLegacyId(maxId + 1);
    } catch {
        return padLegacyId(1);
    }
}

// ─── SKU Uniqueness ─────────────────────────────────────────────────────────────

export async function checkSkuUnique(sku: string): Promise<boolean> {
    const { data } = await supabase
        .from('sku')
        .select('id')
        .eq('sku', sku)
        .limit(1);
    return !data || data.length === 0;
}

export async function checkLegacyIdUnique(legacyId: string): Promise<boolean> {
    const { data } = await supabase
        .from('sku')
        .select('id')
        .eq('modelo_id_4', legacyId)
        .limit(1);
    return !data || data.length === 0;
}

// ─── Image Upload ───────────────────────────────────────────────────────────────

const IMAGE_BUCKET = 'product-images';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadProductImage(
    skuFinal: string,
    file: File,
): Promise<{ path: string; publicUrl: string }> {
    if (file.size > MAX_IMAGE_SIZE) throw new Error('Imagem deve ter no máximo 5 MB.');
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw new Error('Formato não suportado. Use JPG, PNG, WebP ou GIF.');

    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${skuFinal}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const { error } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

    if (error) throw new Error('Falha no upload: ' + error.message);

    const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
}

// ─── Create Product ─────────────────────────────────────────────────────────────

export async function createSimpleProduct(
    payload: CreateSimpleProductPayload,
): Promise<{ data: any; error: string | null }> {
    try {
        const { data, error } = await supabase
            .from('sku')
            .insert({
                sku: payload.sku,
                tipo: payload.tipo,
                nome: payload.nome,
                marca: payload.marca,
                categoria: payload.categoria,
                status: payload.status,
                modelo_id_4: payload.modelo_id_4,
                image_path: payload.image_path ?? null,
            })
            .select()
            .single();

        if (error) return { data: null, error: error.message };
        return { data, error: null };
    } catch (err: any) {
        return { data: null, error: err?.message ?? 'Erro desconhecido ao salvar.' };
    }
}
