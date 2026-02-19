// ─── SKU Builder ──────────────────────────────────────────────────────────────
// Rule (NON-NEGOTIABLE):
//   [COD_MARCA] + [K### optional] + [COD_CATEGORIA] + [ID 4-digits] + [TAMANHO optional]
//   Example: MA + K006 + TS + 0217 + G  →  MAK006TS0217G
//   - Kit suffix comes IMMEDIATELY after brand code
//   - Size is ALWAYS the final suffix
//   - Color does NOT enter the SKU
//   - Max 20 characters

export const SKU_MAX_LENGTH = 20;

export const KIT_OPTIONS = [
    { label: 'Nenhum', value: '' },
    { label: 'K006', value: 'K006' },
    { label: 'K012', value: 'K012' },
    { label: 'K024', value: 'K024' },
    { label: 'K048', value: 'K048' },
    { label: 'K064', value: 'K064' },
    { label: 'K128', value: 'K128' },
];

export const SIZE_OPTIONS = ['P', 'M', 'G', 'GG', 'XG'] as const;
export type SizeOption = (typeof SIZE_OPTIONS)[number] | '';

/**
 * Builds a raw SKU string (no separators) from its parts.
 * Returns the concatenated string; it may exceed 20 chars if inputs are long
 * (caller must validate with validateSkuLength).
 */
export function buildSku(
    brandCode: string,
    kitCode: string | '',
    categoryCode: string,
    legacyId: string,
    size: SizeOption,
): string {
    // Normalize
    const brand = brandCode.trim().toUpperCase();
    const kit = kitCode.trim().toUpperCase();     // '' or 'K006' etc.
    const category = categoryCode.trim().toUpperCase();
    const id = legacyId.trim();
    const sz = size ? size.trim().toUpperCase() : '';

    return `${brand}${kit}${category}${id}${sz}`;
}

/** Returns true when sku is within the allowed maximum. */
export function validateSkuLength(sku: string): boolean {
    return sku.length <= SKU_MAX_LENGTH;
}

/** Pad a numeric ID to 4 digits. */
export function padLegacyId(n: number): string {
    return String(n).padStart(4, '0');
}

/** Basic format check: K followed by exactly 3 digits. */
export function isValidKitCode(code: string): boolean {
    return /^K\d{3}$/.test(code);
}
