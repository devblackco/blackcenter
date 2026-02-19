import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, RefreshCw, Save, Ban, AlertCircle, CheckCircle,
    Loader2, X, Plus, Trash2, Package,
} from 'lucide-react';
import { KIT_OPTIONS, SKU_MAX_LENGTH } from '../utils/sku';
import { fetchBrands, fetchCategories, generateNextLegacyId, checkSkuUnique, checkLegacyIdUnique, type Brand, type Category } from '../services/productService';
import { supabase } from '../lib/supabase';

type ToastType = 'success' | 'error';
interface ToastMsg { type: ToastType; text: string }

const Toast = ({ toast, onClose }: { toast: ToastMsg; onClose: () => void }) => {
    useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
    const colors = toast.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800';
    const Icon = toast.type === 'success' ? CheckCircle : AlertCircle;
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm ${colors}`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium flex-1">{toast.text}</span>
            <button onClick={onClose}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
        </div>
    );
};

interface KitItem { sku_filho: string; quantidade: number; }

const NewKit = () => {
    const navigate = useNavigate();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingInit, setLoadingInit] = useState(true);

    const [nome, setNome] = useState('');
    const [brandId, setBrandId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [kitCode, setKitCode] = useState('');
    const [status, setStatus] = useState<'ATIVO' | 'RASCUNHO'>('ATIVO');
    const [legacyId, setLegacyId] = useState('');
    const [skuFinal, setSkuFinal] = useState('');
    const [skuEdited, setSkuEdited] = useState(false);
    const [items, setItems] = useState<KitItem[]>([{ sku_filho: '', quantidade: 1 }]);

    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<ToastMsg | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedBrand = brands.find(b => b.id === brandId);
    const selectedCategory = categories.find(c => c.id === categoryId);
    const skuLen = skuFinal.length;
    const skuOverLimit = skuLen > SKU_MAX_LENGTH;

    useEffect(() => {
        const init = async () => {
            const [b, c, nextId] = await Promise.all([fetchBrands(), fetchCategories(), generateNextLegacyId()]);
            setBrands(b);
            setCategories(c);
            setLegacyId(nextId);
            setLoadingInit(false);
        };
        init();
    }, []);

    const rebuildSku = useCallback(() => {
        if (!selectedBrand || !selectedCategory || !legacyId) return;
        const auto = `${selectedBrand.code}${kitCode}${selectedCategory.code}${legacyId}`;
        setSkuFinal(auto);
        setSkuEdited(false);
    }, [selectedBrand, selectedCategory, legacyId, kitCode]);

    useEffect(() => {
        if (!skuEdited) rebuildSku();
    }, [skuEdited, rebuildSku]);

    const handleRegenerateId = async () => {
        const nextId = await generateNextLegacyId();
        setLegacyId(nextId);
        setSkuEdited(false);
    };

    const addItem = () => setItems(prev => [...prev, { sku_filho: '', quantidade: 1 }]);
    const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
    const updateItem = (i: number, field: keyof KitItem, value: string | number) => {
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!nome.trim()) errs.nome = 'Nome é obrigatório.';
        if (!brandId) errs.brand = 'Selecione uma marca.';
        if (!categoryId) errs.category = 'Selecione uma categoria.';
        if (!kitCode) errs.kitCode = 'Selecione o tipo de kit.';
        if (!legacyId.trim()) errs.legacyId = 'ID do modelo é obrigatório.';
        if (!skuFinal.trim()) errs.sku = 'SKU final é obrigatório.';
        if (skuOverLimit) errs.sku = `SKU excede ${SKU_MAX_LENGTH} caracteres.`;
        if (items.some(it => !it.sku_filho.trim())) errs.items = 'Todos os itens do kit precisam ter um SKU.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setIsSaving(true);
        setToast(null);

        const [skuUnique, idUnique] = await Promise.all([checkSkuUnique(skuFinal), checkLegacyIdUnique(legacyId)]);
        if (!skuUnique) { setErrors(e => ({ ...e, sku: 'Este SKU já está cadastrado.' })); setIsSaving(false); return; }
        if (!idUnique) { setErrors(e => ({ ...e, legacyId: 'Este ID já está em uso.' })); setIsSaving(false); return; }

        const { data: kitData, error: kitError } = await supabase.from('sku').insert({
            sku: skuFinal,
            tipo: 'KIT',
            nome: nome.trim(),
            marca: selectedBrand!.code,
            categoria: selectedCategory!.code,
            status,
            modelo_id_4: legacyId,
        }).select().single();

        if (kitError) {
            setToast({ type: 'error', text: `Erro ao salvar kit: ${kitError.message}` });
            setIsSaving(false);
            return;
        }

        setToast({ type: 'success', text: `Kit "${skuFinal}" criado com sucesso!` });
        setTimeout(() => navigate('/kits'), 1200);
    };

    if (loadingInit) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col min-h-full bg-[#f6f6f8]">
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-1">
                        <span className="hover:text-primary cursor-pointer" onClick={() => navigate('/kits')}>Kits</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-slate-800 font-medium">Novo Kit</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Novo Kit Virtual</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/kits')} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Ban className="w-4 h-4" /> Cancelar
                    </button>
                    <button onClick={handleSave} disabled={isSaving || skuOverLimit} className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Kit
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-slate-800">Dados do Kit</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Kit <span className="text-red-500">*</span></label>
                                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Kit Camisas Polo 6 Peças" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.nome ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
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
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Kit <span className="text-red-500">*</span></label>
                                    <select value={kitCode} onChange={e => { setKitCode(e.target.value); setSkuEdited(false); }} className={`w-full px-3 py-2 border rounded-lg text-sm bg-white ${errors.kitCode ? 'border-red-400' : 'border-slate-300'}`}>
                                        <option value="">Selecione...</option>
                                        {KIT_OPTIONS.filter(k => k.value).map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                                    </select>
                                    {errors.kitCode && <p className="text-xs text-red-600">{errors.kitCode}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value as 'ATIVO' | 'RASCUNHO')} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
                                        <option value="ATIVO">Ativo</option>
                                        <option value="RASCUNHO">Rascunho</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SKU */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-slate-800">SKU do Kit</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">ID do Modelo</label>
                                <div className="flex items-center gap-2">
                                    <input type="text" value={legacyId} onChange={e => { setLegacyId(e.target.value.replace(/\D/g, '').slice(0, 4)); setSkuEdited(false); }} maxLength={4} className={`flex-1 px-3 py-2 border rounded-lg text-sm text-center font-mono tracking-widest ${errors.legacyId ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                                    <button type="button" onClick={handleRegenerateId} className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">SKU Final</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input type="text" value={skuFinal} onChange={e => { setSkuFinal(e.target.value.toUpperCase()); setSkuEdited(true); }} className={`w-full px-3 py-2 pr-14 border rounded-lg text-sm font-mono tracking-wide ${skuOverLimit ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold ${skuOverLimit ? 'text-red-600' : 'text-slate-400'}`}>{skuLen}/{SKU_MAX_LENGTH}</span>
                                    </div>
                                    <button type="button" onClick={() => { setSkuEdited(false); rebuildSku(); }} className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
                                        <RefreshCw className="w-4 h-4" />
                                    </button>
                                </div>
                                {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Kit Items */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-slate-800">Itens do Kit</h2>
                                <p className="text-xs text-slate-500 mt-0.5">SKUs filhos que compõem este kit.</p>
                            </div>
                            <button type="button" onClick={addItem} className="text-sm text-primary flex items-center gap-1 font-medium hover:underline">
                                <Plus className="w-4 h-4" /> Adicionar Item
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            {items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold flex-shrink-0">{i + 1}</div>
                                    <div className="flex-1">
                                        <input type="text" value={item.sku_filho} onChange={e => updateItem(i, 'sku_filho', e.target.value.toUpperCase())} placeholder="SKU do produto filho" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary focus:border-transparent" />
                                    </div>
                                    <div className="flex items-center gap-1 border border-slate-300 rounded-lg overflow-hidden">
                                        <button type="button" onClick={() => updateItem(i, 'quantidade', Math.max(1, item.quantidade - 1))} className="px-2 py-2 text-slate-500 hover:bg-slate-50">−</button>
                                        <span className="w-8 text-center text-sm font-semibold text-slate-800">{item.quantidade}</span>
                                        <button type="button" onClick={() => updateItem(i, 'quantidade', item.quantidade + 1)} className="px-2 py-2 text-slate-500 hover:bg-slate-50">+</button>
                                    </div>
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {errors.items && <p className="text-xs text-red-600">{errors.items}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewKit;
