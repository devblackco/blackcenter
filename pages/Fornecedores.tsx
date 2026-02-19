import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Building2, Plus, Pencil, Trash2, X, Save, Loader2, Search, AlertCircle, CheckCircle, Phone, Mail, MapPin } from 'lucide-react';

interface Supplier {
    id: string;
    nome: string;
    cnpj: string;
    email: string;
    telefone: string;
    contato: string;
    endereco: string;
    status: 'ATIVO' | 'INATIVO';
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

const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

type FormState = { nome: string; cnpj: string; email: string; telefone: string; contato: string; endereco: string; status: 'ATIVO' | 'INATIVO' };
const emptyForm: FormState = { nome: '', cnpj: '', email: '', telefone: '', contato: '', endereco: '', status: 'ATIVO' };

const Fornecedores = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<ToastMsg | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const fetchSuppliers = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('suppliers').select('*').order('nome');
        if (error) {
            setToast({ type: 'error', text: 'Erro ao carregar fornecedores: ' + error.message });
        }
        setSuppliers((data as Supplier[]) ?? []);
        setLoading(false);
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setModalOpen(true);
    };

    const openEdit = (s: Supplier) => {
        setEditing(s);
        setForm({ nome: s.nome, cnpj: s.cnpj, email: s.email, telefone: s.telefone, contato: s.contato, endereco: s.endereco, status: s.status });
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.nome.trim()) return;
        setSaving(true);

        const payload = {
            nome: form.nome.trim(),
            cnpj: form.cnpj.trim(),
            email: form.email.trim(),
            telefone: form.telefone.trim(),
            contato: form.contato.trim(),
            endereco: form.endereco.trim(),
            status: form.status,
        };

        if (editing) {
            const { error } = await supabase.from('suppliers').update(payload).eq('id', editing.id);
            if (error) { setToast({ type: 'error', text: 'Erro ao atualizar: ' + error.message }); }
            else { setToast({ type: 'success', text: `Fornecedor "${form.nome}" atualizado!` }); }
        } else {
            const { error } = await supabase.from('suppliers').insert(payload);
            if (error) { setToast({ type: 'error', text: 'Erro ao criar: ' + error.message }); }
            else { setToast({ type: 'success', text: `Fornecedor "${form.nome}" criado!` }); }
        }

        setSaving(false);
        setModalOpen(false);
        fetchSuppliers();
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) { setToast({ type: 'error', text: 'Erro ao excluir: ' + error.message }); }
        else { setToast({ type: 'success', text: 'Fornecedor excluído.' }); }
        setDeleteConfirm(null);
        fetchSuppliers();
    };

    const filtered = suppliers.filter(s =>
        s.nome.toLowerCase().includes(search.toLowerCase()) ||
        s.cnpj.includes(search) ||
        s.contato.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
            {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Fornecedores</h2>
                    <p className="mt-1 text-sm text-slate-500">Cadastro e gestão de fornecedores da operação.</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Fornecedor
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg"><Building2 className="w-6 h-6 text-primary" /></div>
                    <div>
                        <p className="text-sm text-slate-500">Total Fornecedores</p>
                        <p className="text-xl font-bold text-slate-900">{suppliers.length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
                    <div>
                        <p className="text-sm text-slate-500">Ativos</p>
                        <p className="text-xl font-bold text-slate-900">{suppliers.filter(s => s.status === 'ATIVO').length}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-slate-100 rounded-lg"><AlertCircle className="w-6 h-6 text-slate-400" /></div>
                    <div>
                        <p className="text-sm text-slate-500">Inativos</p>
                        <p className="text-xl font-bold text-slate-900">{suppliers.filter(s => s.status === 'INATIVO').length}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome, CNPJ ou contato..." className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Nenhum fornecedor encontrado</p>
                        <p className="text-slate-400 text-sm mt-1">Clique em "Novo Fornecedor" para cadastrar.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CNPJ</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contato</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filtered.map(s => (
                                    <tr key={s.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{s.nome}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-mono">{s.cnpj || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{s.contato || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{s.email || '—'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'ATIVO' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-primary transition-colors"><Pencil className="w-4 h-4" /></button>
                                                {deleteConfirm === s.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleDelete(s.id)} className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600">Confirmar</button>
                                                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200">Cancelar</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                            <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Razão Social / Nome <span className="text-red-500">*</span></label>
                                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Distribuidora ABC Ltda" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">CNPJ</label>
                                    <input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: formatCNPJ(e.target.value) })} placeholder="00.000.000/0000-00" maxLength={18} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'ATIVO' | 'INATIVO' })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary focus:border-transparent">
                                        <option value="ATIVO">Ativo</option>
                                        <option value="INATIVO">Inativo</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome do Contato</label>
                                <input value={form.contato} onChange={e => setForm({ ...form, contato: e.target.value })} placeholder="Ex: João Silva" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="contato@empresa.com" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
                                    <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Endereço</label>
                                <input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} placeholder="Rua, número, bairro, cidade - UF" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                            <button onClick={handleSave} disabled={saving || !form.nome.trim()} className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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

export default Fornecedores;
