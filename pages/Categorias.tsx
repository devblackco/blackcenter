import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FolderOpen, Plus, Pencil, Trash2, X, Save, Loader2, Search, AlertCircle, CheckCircle } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    code: string;
    created_at?: string;
}

type ToastType = 'success' | 'error';
interface ToastMsg { type: ToastType; text: string }

const Toast = ({ toast, onClose }: { toast: ToastMsg; onClose: () => void }) => {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    const colors = toast.type === 'success'
        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
        : 'bg-red-50 border-red-300 text-red-800';
    const Icon = toast.type === 'success' ? CheckCircle : AlertCircle;
    return (
        <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm ${colors}`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm font-medium flex-1">{toast.text}</span>
            <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
};

const Categorias = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<ToastMsg | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);
    const [formName, setFormName] = useState('');
    const [formCode, setFormCode] = useState('');
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('categories').select('*').order('name');
        if (error) {
            setToast({ type: 'error', text: 'Erro ao carregar categorias: ' + error.message });
        }
        setCategories((data as Category[]) ?? []);
        setLoading(false);
    };

    useEffect(() => { fetchCategories(); }, []);

    const openCreate = () => {
        setEditing(null);
        setFormName('');
        setFormCode('');
        setModalOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditing(cat);
        setFormName(cat.name);
        setFormCode(cat.code);
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!formName.trim() || !formCode.trim()) return;
        setSaving(true);

        if (editing) {
            const { error } = await supabase.from('categories').update({ name: formName.trim(), code: formCode.trim().toUpperCase() }).eq('id', editing.id);
            if (error) { setToast({ type: 'error', text: 'Erro ao atualizar: ' + error.message }); }
            else { setToast({ type: 'success', text: `Categoria "${formName}" atualizada!` }); }
        } else {
            const { error } = await supabase.from('categories').insert({ name: formName.trim(), code: formCode.trim().toUpperCase() });
            if (error) { setToast({ type: 'error', text: 'Erro ao criar: ' + error.message }); }
            else { setToast({ type: 'success', text: `Categoria "${formName}" criada!` }); }
        }

        setSaving(false);
        setModalOpen(false);
        fetchCategories();
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) { setToast({ type: 'error', text: 'Erro ao excluir: ' + error.message }); }
        else { setToast({ type: 'success', text: 'Categoria excluída.' }); }
        setDeleteConfirm(null);
        fetchCategories();
    };

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 w-full max-w-5xl mx-auto">
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Categorias</h2>
                    <p className="mt-1 text-sm text-slate-500">Gerencie as categorias dos produtos cadastrados.</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Categoria
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou código..."
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhuma categoria encontrada</p>
                        <p className="text-slate-400 text-sm mt-1">Clique em "Nova Categoria" para cadastrar.</p>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filtered.map(cat => (
                                <tr key={cat.id} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{cat.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{cat.code}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(cat)} className="p-1.5 text-slate-400 hover:text-primary transition-colors" title="Editar">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {deleteConfirm === cat.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleDelete(cat.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition-colors">Confirmar</button>
                                                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors">Cancelar</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Excluir">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-3 text-xs text-slate-400 text-center">{filtered.length} categoria(s) cadastrada(s)</div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                            <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome da Categoria</label>
                                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Ex: Vestuário" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Código (2-4 letras)</label>
                                <input value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))} placeholder="Ex: VS" maxLength={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent" />
                                <p className="mt-1 text-xs text-slate-400">Código usado na formação do SKU.</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                            <button onClick={handleSave} disabled={saving || !formName.trim() || !formCode.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Categorias;
