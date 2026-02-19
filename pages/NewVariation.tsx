import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronRight, RefreshCw, Save, Ban, AlertCircle, CheckCircle,
    Loader2, Info, Search, X,
} from 'lucide-react';
import { buildSku, validateSkuLength, SKU_MAX_LENGTH, SIZE_OPTIONS, type SizeOption } from '../utils/sku';
import {
    fetchBrands, fetchCategories, generateNextLegacyId,
    checkSkuUnique, checkLegacyIdUnique,
    type Brand, type Category,
} from '../services/productService';
import { supabase } from '../lib/supabase';

type ToastType = 'success' | 'error';
interface ToastMsg { type: ToastType; text: string }

const Toast = ({ toast, onClose }: { toast: ToastMsg; onClose: () => void }) => {
    useEffect(() => { const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [onClose]);
    const colors = toast.type === 'success'
        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
        : 'bg-red-50 border-red-300 text-red-800';
    const Icon = toast.type === 'success' ? CheckCircle : AlertCircle;
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm ${colors}`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium flex-1">{toast.text}</span>
            <button onClick={onClose}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
        </div>
    );
};

interface ParentProduct { id: string; sku: string; nome: string; marca: string; categoria: string; modelo_id_4: string; }

const NewVariation = () => {
    const navigate = useNavigate();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [parents, setParents] = useState<ParentProduct[]>([]);
    const [loadingInit, setLoadingInit] = useState(true);

    // Parent search
    const [parentSearch, setParentSearch] = useState('');
    const [selectedParent, setSelectedParent] = useState<ParentProduct | null>(null);

    // Variation fields
    const [nome, setNome] = useState('');
    const [size, setSize] = useState<SizeOption>('');
    const [color, setColor] = useState('');
    const [status, setStatus] = useState<'ATIVO' | 'RASCUNHO'>('ATIVO');
    const [legacyId, setLegacyId] = useState('');
    const [skuFinal, setSkuFinal] = useState('');
    const [skuEdited, setSkuEdited] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<ToastMsg | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const skuLen = skuFinal.length;
    const skuOverLimit = skuLen > SKU_MAX_LENGTH;

    useEffect(() => {
        const init = async () => {
            const [b, c, nextId, { data }] = await Promise.all([
                fetchBrands(),
                fetchCategories(),
                generateNextLegacyId(),
                supabase.from('sku').select('id, sku, nome, marca, categoria, modelo_id_4').eq('tipo', 'PAI').order('nome'),
            ]);
            setBrands(b);
            setCategories(c);
            setLegacyId(nextId);
            setParents((data as ParentProduct[]) ?? []);
            setLoadingInit(false);
        };
        init();
    }, []);

    const rebuildSku = useCallback(() => {
        if (!selectedParent) return;
        const brand = brands.find(b => b.code === selectedParent.marca);
        const category = categories.find(c => c.code === selectedParent.categoria);
        if (!brand || !category) return;
        const auto = buildSku(brand.code, '', category.code, legacyId, size);
        setSkuFinal(auto);
        setSkuEdited(false);
    }, [selectedParent, brands, categories, legacyId, size]);

    useEffect(() => {
        if (!skuEdited) rebuildSku();
    }, [skuEdited, rebuildSku]);

    const filteredParents = parents.filter(p =>
        p.sku.toLowerCase().includes(parentSearch.toLowerCase()) ||
        p.nome.toLowerCase().includes(parentSearch.toLowerCase())
    );

    const handleRegenerateId = async () => {
        const nextId = await generateNextLegacyId();
        setLegacyId(nextId);
        setSkuEdited(false);
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!selectedParent) errs.parent = 'Selecione o produto pai.';
        if (!nome.trim()) errs.nome = 'Nome da variação é obrigatório.';
        if (!size) errs.size = 'Selecione o tamanho.';
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
            tipo: 'VARIACAO',
            nome: nome.trim(),
            marca: selectedParent!.marca,
            categoria: selectedParent!.categoria,
            status,
            modelo_id_4: legacyId,
            parent_sku: selectedParent!.sku,
            tamanho: size || null,
            cor: color.trim() || null,
        });

        if (error) {
            setToast({ type: 'error', text: `Erro ao salvar: ${error.message}` });
            setIsSaving(false);
            return;
        }

        setToast({ type: 'success', text: `Variação "${skuFinal}" criada com sucesso!` });
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
                        <span className="text-slate-800 font-medium">Nova Variação</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Nova Variação</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/produtos')} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Ban className="w-4 h-4" /> Cancelar
                    </button>
                    <button onClick={handleSave} disabled={isSaving || skuOverLimit} className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Variação
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Parent Product */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-slate-800">Produto Pai</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Selecione o produto pai ao qual esta variação será vinculada.</p>
                        </div>
                        <div className="p-6">
                            {selectedParent ? (
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <p className="font-semibold text-slate-900">{selectedParent.nome}</p>
                                        <p className="text-sm text-slate-500 font-mono">{selectedParent.sku}</p>
                                    </div>
                                    <button onClick={() => { setSelectedParent(null); setSkuFinal(''); }} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            value={parentSearch}
                                            onChange={e => setParentSearch(e.target.value)}
                                            placeholder="Buscar produto pai por SKU ou nome..."
                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    {parentSearch && (
                                        <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                                            {filteredParents.length === 0 ? (
                                                <div className="p-4 text-center text-sm text-slate-400">Nenhum produto pai encontrado.</div>
                                            ) : filteredParents.map(p => (
                                                <button key={p.id} onClick={() => { setSelectedParent(p); setParentSearch(''); setSkuEdited(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                                                    <p className="text-sm font-medium text-slate-900">{p.nome}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{p.sku}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {errors.parent && <p className="mt-1.5 text-xs text-red-600">{errors.parent}</p>}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Variation Details */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-slate-800">Detalhes da Variação</h2>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da Variação <span className="text-red-500">*</span></label>
                                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Camisa Polo Tech Azul G" className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent ${errors.nome ? 'border-red-400 bg-red-50' : 'border-slate-300'}`} />
                                {errors.nome && <p className="mt-1 text-xs text-red-600">{errors.nome}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tamanho <span className="text-red-500">*</span></label>
                                    <div className="flex flex-wrap gap-2">
                                        {SIZE_OPTIONS.map(s => (
                                            <button key={s} type="button" onClick={() => { setSize(s); setSkuEdited(false); }} className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${size === s ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-300 hover:border-primary'}`}>{s}</button>
                                        ))}
                                    </div>
                                    {errors.size && <p className="mt-1 text-xs text-red-600">{errors.size}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Cor <span className="text-slate-400 text-xs">(opcional)</span></label>
                                    <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Ex: Azul Marinho" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                                    <p className="mt-1 text-xs text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" /> Cor não entra no SKU.</p>
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
                    </div>

                    {/* SKU */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-semibold text-slate-800">Identificação e SKU</h2>
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewVariation;
