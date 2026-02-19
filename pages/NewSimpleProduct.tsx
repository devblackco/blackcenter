import React, { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, RefreshCw, Upload, X, Info, Lightbulb,
    Save, Ban, AlertCircle, CheckCircle, Loader2, Image as ImageIcon,
} from 'lucide-react';
import {
    buildSku, validateSkuLength, SKU_MAX_LENGTH,
    KIT_OPTIONS, SIZE_OPTIONS, type SizeOption,
} from '../utils/sku';
import {
    fetchBrands, fetchCategories, generateNextLegacyId,
    checkSkuUnique, checkLegacyIdUnique,
    uploadProductImage, createSimpleProduct,
    type Brand, type Category,
} from '../services/productService';
import { supabaseConfigError } from '../lib/supabase';

// ─── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';
interface ToastMsg { type: ToastType; text: string }

const Toast = ({ toast, onClose }: { toast: ToastMsg; onClose: () => void }) => {
    useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
    const colors = {
        success: 'bg-emerald-50 border-emerald-300 text-emerald-800',
        error: 'bg-red-50 border-red-300 text-red-800',
        info: 'bg-blue-50 border-blue-300 text-blue-800',
    };
    const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : Info;
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm ${colors[toast.type]}`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium flex-1">{toast.text}</span>
            <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
};

// ─── Card wrapper ───────────────────────────────────────────────────────────────
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {icon && <span className="text-slate-400">{icon}</span>}
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────
const NewSimpleProduct = () => {
    const navigate = useNavigate();

    // ── Lookup data ──
    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingInit, setLoadingInit] = useState(true);

    // ── Basic fields ──
    const [nome, setNome] = useState('');
    const [brandId, setBrandId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [status, setStatus] = useState<'ATIVO' | 'RASCUNHO'>('ATIVO');

    // ── SKU fields ──
    const [legacyId, setLegacyId] = useState('');
    const [kitCode, setKitCode] = useState('');
    const [size, setSize] = useState<SizeOption>('');
    const [skuFinal, setSkuFinal] = useState('');
    const [skuEdited, setSkuEdited] = useState(false); // user manually edited SKU

    // ── Image ──
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── UI state ──
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<ToastMsg | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // ── Derived helpers ──
    const selectedBrand = brands.find(b => b.id === brandId);
    const selectedCategory = categories.find(c => c.id === categoryId);
    const skuLen = skuFinal.length;
    const skuOverLimit = skuLen > SKU_MAX_LENGTH;

    // ─── Init ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const init = async () => {
            const [b, c, nextId] = await Promise.all([
                fetchBrands(),
                fetchCategories(),
                generateNextLegacyId(),
            ]);
            setBrands(b);
            setCategories(c);
            setLegacyId(nextId);
            setLoadingInit(false);
        };
        init();
    }, []);

    // ─── Auto-build SKU when inputs change (unless user manually edited) ──────
    const rebuildSku = useCallback(() => {
        if (!selectedBrand || !selectedCategory || !legacyId) return;
        const auto = buildSku(
            selectedBrand.code,
            kitCode,
            selectedCategory.code,
            legacyId,
            size,
        );
        setSkuFinal(auto);
        setSkuEdited(false);
    }, [selectedBrand, selectedCategory, legacyId, kitCode, size]);

    useEffect(() => {
        if (!skuEdited) rebuildSku();
    }, [skuEdited, rebuildSku]);

    // ─── ID regenerate ────────────────────────────────────────────────────────
    const handleRegenerateId = async () => {
        const nextId = await generateNextLegacyId();
        setLegacyId(nextId);
        setSkuEdited(false);
    };

    // ─── Image handling ───────────────────────────────────────────────────────
    const handleImageFile = (file: File) => {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = e => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleImageFile(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ─── Validation ───────────────────────────────────────────────────────────
    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!nome.trim()) errs.nome = 'Nome do produto é obrigatório.';
        if (!brandId) errs.brand = 'Selecione uma marca.';
        if (!categoryId) errs.category = 'Selecione uma categoria.';
        if (!legacyId.trim()) errs.legacyId = 'ID do modelo é obrigatório.';
        if (!skuFinal.trim()) errs.sku = 'SKU final é obrigatório.';
        if (skuOverLimit) errs.sku = `SKU excede ${SKU_MAX_LENGTH} caracteres.`;
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ─── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) return;

        setIsSaving(true);
        setToast(null);

        // Uniqueness checks
        const [skuUnique, idUnique] = await Promise.all([
            checkSkuUnique(skuFinal),
            checkLegacyIdUnique(legacyId),
        ]);

        if (!skuUnique) {
            setErrors(e => ({ ...e, sku: 'Este SKU já está cadastrado no sistema.' }));
            setIsSaving(false);
            return;
        }
        if (!idUnique) {
            setErrors(e => ({ ...e, legacyId: 'Este ID de modelo já está em uso.' }));
            setIsSaving(false);
            return;
        }

        // Optional image upload
        let imagePath: string | null = null;
        if (imageFile) {
            try {
                const { path } = await uploadProductImage(skuFinal, imageFile);
                imagePath = path;
            } catch (err: any) {
                setToast({ type: 'error', text: `Upload falhou: ${err.message}. Produto será salvo sem imagem.` });
            }
        }

        const { error } = await createSimpleProduct({
            nome: nome.trim(),
            sku: skuFinal,
            tipo: 'SIMPLES',
            marca: selectedBrand!.code,
            categoria: selectedCategory!.code,
            status,
            modelo_id_4: legacyId,
            image_path: imagePath,
        });

        if (error) {
            setToast({ type: 'error', text: `Erro ao salvar produto: ${error}` });
            setIsSaving(false);
            return;
        }

        setToast({ type: 'success', text: `Produto "${skuFinal}" criado com sucesso!` });
        setTimeout(() => navigate(`/produtos?q=${encodeURIComponent(skuFinal)}`), 1200);
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    if (loadingInit) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-[#f6f6f8]">
            {/* ── Toast ── */}
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

            {/* ── Env error banner ── */}
            {supabaseConfigError && (
                <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {supabaseConfigError}
                </div>
            )}

            {/* ── Header ── */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1">
                        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/produtos')}>Produtos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-slate-800 font-medium">Novo Produto Simples</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Novo Produto Simples</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/produtos')}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <Ban className="w-4 h-4" /> Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || skuOverLimit}
                        className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Produto
                    </button>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 p-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left column (2/3) ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* CARD: Dados Básicos */}
                        <Card>
                            <CardHeader title="Dados Básicos" icon={<Info className="w-4 h-4" />} />
                            <div className="p-6 space-y-5">

                                {/* Nome */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                        Nome do Produto <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={e => setNome(e.target.value)}
                                        placeholder="Ex: Camiseta Básica Algodão"
                                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${errors.nome ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                            }`}
                                    />
                                    {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome}</p>}
                                </div>

                                {/* Marca + Categoria */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Marca</label>
                                        <select
                                            value={brandId}
                                            onChange={e => { setBrandId(e.target.value); setSkuEdited(false); }}
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white ${errors.brand ? 'border-red-400' : 'border-slate-300'
                                                }`}
                                        >
                                            <option value="">Selecione uma marca...</option>
                                            {brands.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Código interno: {selectedBrand ? <strong>{selectedBrand.code}</strong> : '–'}
                                        </p>
                                        {errors.brand && <p className="text-xs text-red-600">{errors.brand}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
                                        <select
                                            value={categoryId}
                                            onChange={e => { setCategoryId(e.target.value); setSkuEdited(false); }}
                                            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white ${errors.category ? 'border-red-400' : 'border-slate-300'
                                                }`}
                                        >
                                            <option value="">Selecione uma categoria...</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-slate-500">
                                            Código interno: {selectedCategory ? <strong>{selectedCategory.code}</strong> : '–'}
                                        </p>
                                        {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                                    <select
                                        value={status}
                                        onChange={e => setStatus(e.target.value as 'ATIVO' | 'RASCUNHO')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                    >
                                        <option value="ATIVO">Ativo</option>
                                        <option value="RASCUNHO">Rascunho</option>
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* CARD: Identificação e SKU */}
                        <Card>
                            <CardHeader title="Identificação e SKU" />
                            <div className="p-6 space-y-6">

                                {/* ID do Modelo + Kit */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">ID do Modelo</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={legacyId}
                                                onChange={e => { setLegacyId(e.target.value.replace(/\D/g, '').slice(0, 4)); setSkuEdited(false); }}
                                                maxLength={4}
                                                className={`flex-1 px-3 py-2 border rounded-lg text-sm text-center font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent ${errors.legacyId ? 'border-red-400 bg-red-50' : 'border-slate-300'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRegenerateId}
                                                title="Gerar novo ID"
                                                className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-400">Geração sequencial automática</p>
                                        {errors.legacyId && <p className="text-xs text-red-600">{errors.legacyId}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Kit (Opcional)</label>
                                        <select
                                            value={kitCode}
                                            onChange={e => { setKitCode(e.target.value); setSkuEdited(false); }}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                                        >
                                            {KIT_OPTIONS.map(o => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Tamanho chips */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tamanho (Opcional)</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {SIZE_OPTIONS.map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => { setSize(size === s ? '' : s); setSkuEdited(false); }}
                                                className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${size === s
                                                        ? 'bg-primary text-white border-primary shadow-sm'
                                                        : 'bg-white text-slate-700 border-slate-300 hover:border-primary hover:text-primary'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* SKU Final */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-medium text-slate-700">SKU Final</label>
                                        {skuOverLimit && (
                                            <span className="text-xs font-semibold text-red-600">SKU excedeu {SKU_MAX_LENGTH} caracteres</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={skuFinal}
                                                onChange={e => { setSkuFinal(e.target.value.toUpperCase()); setSkuEdited(true); }}
                                                className={`w-full px-3 py-2 pr-14 border rounded-lg text-sm font-mono tracking-wide focus:ring-2 focus:ring-primary focus:border-transparent ${skuOverLimit
                                                        ? 'border-red-400 bg-red-50 text-red-700'
                                                        : errors.sku
                                                            ? 'border-red-400 bg-red-50'
                                                            : 'border-slate-300'
                                                    }`}
                                            />
                                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold tabular-nums ${skuOverLimit ? 'text-red-600' : 'text-slate-400'}`}>
                                                {skuLen}/{SKU_MAX_LENGTH}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setSkuEdited(false); rebuildSku(); }}
                                            title="Recalcular SKU"
                                            className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {errors.sku && !skuOverLimit && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
                                    <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                                        <Info className="w-3 h-3 flex-shrink-0" />
                                        Regra: MARCA·CATEGORIA·ID[·KIT][·TAMANHO]. O SKU deve ser único no sistema.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* ── Right column (1/3) ── */}
                    <div className="space-y-6">

                        {/* CARD: Mídia */}
                        <Card>
                            <CardHeader title="Mídia" icon={<ImageIcon className="w-4 h-4" />} />
                            <div className="p-6 space-y-4">
                                <p className="text-xs font-medium text-slate-600">Foto do Produto</p>

                                {/* Drop zone */}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors flex flex-col items-center justify-center py-8 px-4 text-center ${isDragging
                                            ? 'border-primary bg-primary/5'
                                            : imagePreview
                                                ? 'border-slate-200 bg-slate-50'
                                                : 'border-slate-200 hover:border-primary hover:bg-primary/5'
                                        }`}
                                >
                                    {imagePreview ? (
                                        <>
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="h-28 w-full object-contain rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={e => { e.stopPropagation(); handleRemoveImage(); }}
                                                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow border border-slate-200 text-slate-500 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-slate-300 mb-2" />
                                            <p className="text-sm font-medium text-slate-600">Clique para upload</p>
                                            <p className="text-xs text-slate-400">ou arraste e solte aqui</p>
                                            <p className="text-xs text-slate-400 mt-1">Bucket: product-images</p>
                                        </>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                                />

                                {/* Thumbnail placeholders */}
                                {!imagePreview && (
                                    <div className="flex gap-2 mt-2">
                                        {[0, 1].map(i => (
                                            <div
                                                key={i}
                                                className="h-14 w-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center"
                                            >
                                                <ImageIcon className="w-5 h-5 text-slate-300" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* CARD: Dica de Cadastro */}
                        <Card>
                            <div className="p-5 flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                    <Lightbulb className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-800 mb-1">Dica de Cadastro</p>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                        Produtos simples são a base para a criação de variações e kits. Certifique-se
                                        de que o ID do modelo esteja correto antes de salvar. O SKU é gerado
                                        automaticamente conforme as regras: <strong>MARCA + [KIT] + CATEGORIA + ID + [TAMANHO]</strong>.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewSimpleProduct;
