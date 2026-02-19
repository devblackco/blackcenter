import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, RefreshCw, Save, Ban, AlertCircle, CheckCircle,
    Loader2, Info, Lightbulb,
} from 'lucide-react';
import {
    buildSku, validateSkuLength, SKU_MAX_LENGTH,
} from '../utils/sku';
import {
    fetchBrands, fetchCategories, generateNextLegacyId,
    checkSkuUnique, checkLegacyIdUnique,
    type Brand, type Category,
} from '../services/productService';
import { supabase } from '../lib/supabase';

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
        </div>
    );
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ title, icon }: { title: string; icon?: React.ReactNode }) => (
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {icon && <span className="text-slate-400">{icon}</span>}
    </div>
);

const NewParentProduct = () => {
    const navigate = useNavigate();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingInit, setLoadingInit] = useState(true);

    const [nome, setNome] = useState('');
    const [brandId, setBrandId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [status, setStatus] = useState<'ATIVO' | 'RASCUNHO'>('ATIVO');
    const [legacyId, setLegacyId] = useState('');
    const [skuFinal, setSkuFinal] = useState('');
    const [skuEdited, setSkuEdited] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<ToastMsg | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedBrand = brands.find(b => b.id === brandId);
    const selectedCategory = categories.find(c => c.id === categoryId);
    const skuLen = skuFinal.length;
    const skuOverLimit = skuLen > SKU_MAX_LENGTH;

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

    const rebuildSku = useCallback(() => {
        if (!selectedBrand || !selectedCategory || !legacyId) return;
        const auto = `PAI-${selectedBrand.code}${selectedCategory.code}${legacyId}`;
        setSkuFinal(auto);
        setSkuEdited(false);
    }, [selectedBrand, selectedCategory, legacyId]);

    useEffect(() => {
        if (!skuEdited) rebuildSku();
    }, [skuEdited, rebuildSku]);

    const handleRegenerateId = async () => {
        const nextId = await generateNextLegacyId();
        setLegacyId(nextId);
        setSkuEdited(false);
    };

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

    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        setToast(null);

        const [skuUnique, idUnique] = await Promise.all([
            checkSkuUnique(skuFinal),
            checkLegacyIdUnique(legacyId),
        ]);

        if (!skuUnique) { setErrors(e => ({ ...e, sku: 'Este SKU já está cadastrado.' })); setIsSaving(false); return; }
        if (!idUnique) { setErrors(e => ({ ...e, legacyId: 'Este ID já está em uso.' })); setIsSaving(false); return; }

        const { error } = await supabase.from('sku').insert({
            sku: skuFinal,
            tipo: 'PAI',
            nome: nome.trim(),
            marca: selectedBrand!.code,
            categoria: selectedCategory!.code,
            status,
            modelo_id_4: legacyId,
        }).select().single();

        if (error) {
            setToast({ type: 'error', text: `Erro ao salvar: ${error.message}` });
            setIsSaving(false);
            return;
        }

        setToast({ type: 'success', text: `Produto Pai "${skuFinal}" criado com sucesso!` });
        setTimeout(() => navigate('/produtos'), 1200);
    };

    if (loadingInit) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col min-h-full bg-[#f6f6f8]">
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1">
                        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/produtos')}>Produtos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-slate-800 font-medium">Novo Produto Pai</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Novo Produto Pai</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/produtos')} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Ban className="w-4 h-4" /> Cancelar
                    </button>
                    <button onClick={handleSave} disabled={isSaving || skuOverLimit} className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Produto Pai
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-6">

                    <Card>
                        <CardHeader title="Dados Básicos" icon={<Info className="w-4 h-4" />} />
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Produto Pai <span className="text-red-500">*</span></label>
                                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Camisa Polo Tech" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.nome ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                                {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Marca <span className="text-red-500">*</span></label>
                                    <select value={brandId} onChange={e => { setBrandId(e.target.value); setSkuEdited(false); }} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${errors.brand ? 'border-red-400' : 'border-slate-300'}`}>
                                        <option value="">Selecione uma marca...</option>
                                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                    {errors.brand && <p className="text-xs text-red-600">{errors.brand}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria <span className="text-red-500">*</span></label>
                                    <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSkuEdited(false); }} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${errors.category ? 'border-red-400' : 'border-slate-300'}`}>
                                        <option value="">Selecione uma categoria...</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    {errors.category && <p className="text-xs text-red-600">{errors.category}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value as 'ATIVO' | 'RASCUNHO')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                    <option value="ATIVO">Ativo</option>
                                    <option value="RASCUNHO">Rascunho</option>
                                </select>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <CardHeader title="Identificação e SKU" />
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">ID do Modelo</label>
                                <div className="flex items-center gap-2">
                                    <input type="text" value={legacyId} onChange={e => { setLegacyId(e.target.value.replace(/\D/g, '').slice(0, 4)); setSkuEdited(false); }} maxLength={4} className={`flex-1 px-3 py-2 border rounded-lg text-sm text-center font-mono tracking-widest ${errors.legacyId ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                                    <button type="button" onClick={handleRegenerateId} title="Gerar novo ID" className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                                {errors.legacyId && <p className="text-xs text-red-600">{errors.legacyId}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">SKU Final</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input type="text" value={skuFinal} onChange={e => { setSkuFinal(e.target.value.toUpperCase()); setSkuEdited(true); }} className={`w-full px-3 py-2 pr-14 border rounded-lg text-sm font-mono tracking-wide ${skuOverLimit ? 'border-red-400 bg-red-50 text-red-700' : errors.sku ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${skuOverLimit ? 'text-red-600' : 'text-slate-400'}`}>{skuLen}/{SKU_MAX_LENGTH}</span>
                                    </div>
                                    <button type="button" onClick={() => { setSkuEdited(false); rebuildSku(); }} className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                                {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
                                <p className="mt-1.5 text-xs text-slate-400 flex items-center gap-1">
                                    <Info className="w-3 h-3" /> Produtos pai usam o prefixo PAI- seguido de MARCA + CATEGORIA + ID.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-5 flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0"><Lightbulb className="w-4 h-4 text-blue-600" /></div>
                            <div>
                                <p className="text-sm font-semibold text-blue-800 mb-1">Dica</p>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Produtos Pai são a base que agrupa variações. Após criar o pai, você poderá
                                    adicionar variações (tamanho, cor) a partir da tela de variações.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default NewParentProduct;
