import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseFetch } from '../hooks/useSupabaseFetch';
import type { Profile, UserRole, UserStatus } from '../types';
import {
  Search, Check, X, Shield, Truck, Eye, ShieldAlert,
  RefreshCw, ChevronDown, Trash2, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';

/* ── Lookups ────────────────────────────────────────────────────────────── */

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Admin',
  EXPEDICAO: 'Expedição',
  LEITOR: 'Leitor',
};

const statusLabels: Record<UserStatus, string> = {
  ATIVO: 'Ativo',
  PENDENTE: 'Pendente',
  BLOQUEADO: 'Bloqueado',
};

const roleColors: Record<UserRole, string> = {
  ADMIN: 'bg-slate-900 text-white border-transparent',
  EXPEDICAO: 'bg-amber-50 text-amber-700 border-amber-200',
  LEITOR: 'bg-slate-100 text-slate-600 border-slate-200',
};

const statusColors: Record<UserStatus, string> = {
  ATIVO: 'bg-emerald-400',
  PENDENTE: 'bg-yellow-400',
  BLOQUEADO: 'bg-slate-300',
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

const getInitials = (name: string, email: string) => {
  if (name && name.trim()) {
    return name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

const avatarColors = [
  'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-rose-500',
  'bg-indigo-500', 'bg-orange-500', 'bg-green-600',
];

const getAvatarColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash += userId.charCodeAt(i);
  return avatarColors[hash % avatarColors.length];
};

const normalizeStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* ── Toast ──────────────────────────────────────────────────────────────── */

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

/* ── Component ──────────────────────────────────────────────────────────── */

const Usuarios = () => {
  const { user: currentUser } = useAuth();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastMsg | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // --- Resilient fetch with timeout ---
  const [fetchKey, setFetchKey] = useState(0);
  const { data: users, loading, error, refetch } = useSupabaseFetch<Profile[]>(
    async (signal) => {
      const result = await (supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false }) as any
      ).abortSignal(signal);
      return { data: (result.data as Profile[]) ?? [], error: result.error };
    },
    [fetchKey]
  );

  const triggerRefetch = () => setFetchKey(k => k + 1);

  const allUsers = users ?? [];
  const adminCount = allUsers.filter(u => u.role === 'ADMIN' && u.status === 'ATIVO').length;

  // ── Status update ──────────────────────────────────────────────────────

  const handleUpdateStatus = async (userId: string, status: UserStatus) => {
    if (currentUser?.id === userId && status !== 'ATIVO') {
      setToast({ type: 'error', text: 'Você não pode alterar seu próprio status.' });
      return;
    }
    setActionLoading(userId);
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ status })
      .eq('user_id', userId);

    if (updateError) {
      setToast({ type: 'error', text: 'Erro ao atualizar status: ' + updateError.message });
    } else {
      setToast({ type: 'success', text: `Status atualizado para ${statusLabels[status]}.` });
      triggerRefetch();
    }
    setActionLoading(null);
  };

  // ── Role update ────────────────────────────────────────────────────────

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    if (currentUser?.id === userId) {
      setToast({ type: 'error', text: 'Você não pode alterar sua própria permissão.' });
      return;
    }
    // Guard: prevent removing the last active admin
    if (role !== 'ADMIN') {
      const target = allUsers.find(u => u.user_id === userId);
      if (target?.role === 'ADMIN' && adminCount <= 1) {
        setToast({ type: 'error', text: 'O sistema deve ter pelo menos um administrador ativo.' });
        return;
      }
    }

    setActionLoading(userId);
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('user_id', userId);

    if (updateError) {
      setToast({ type: 'error', text: 'Erro ao atualizar permissão: ' + updateError.message });
    } else {
      setToast({ type: 'success', text: `Permissão atualizada para ${roleLabels[role]}.` });
      triggerRefetch();
    }
    setActionLoading(null);
  };

  // ── Delete user ────────────────────────────────────────────────────────

  const handleDeleteUser = async (userId: string) => {
    const target = allUsers.find(u => u.user_id === userId);

    // Client-side guards (server-side also checks)
    if (currentUser?.id === userId) {
      setToast({ type: 'error', text: 'Você não pode deletar sua própria conta.' });
      return;
    }
    if (target?.role === 'ADMIN' && target?.status === 'ATIVO' && adminCount <= 1) {
      setToast({ type: 'error', text: 'Não é possível deletar o último administrador ativo.' });
      return;
    }

    setActionLoading(userId);
    setDeleteConfirm(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setToast({ type: 'error', text: 'Sessão expirada. Faça login novamente.' });
        setActionLoading(null);
        return;
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`;
      const resp = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      const body = await resp.json();

      if (!resp.ok) {
        setToast({ type: 'error', text: body.error || 'Erro ao deletar usuário.' });
      } else {
        setToast({ type: 'success', text: `Usuário "${target?.full_name || target?.email}" deletado permanentemente.` });
        triggerRefetch();
      }
    } catch (err: any) {
      console.error('[Usuarios] delete error:', err);
      setToast({ type: 'error', text: 'Erro de conexão ao deletar usuário.' });
    }

    setActionLoading(null);
  };

  // ── Filtering ──────────────────────────────────────────────────────────

  const filteredUsers = allUsers.filter(u => {
    if (!search.trim()) return true;
    const q = normalizeStr(search);
    return normalizeStr(u.full_name || '').includes(q) || normalizeStr(u.email).includes(q);
  });

  const pendingUsers = filteredUsers.filter(u => u.status === 'PENDENTE');
  const otherUsers = filteredUsers.filter(u => u.status !== 'PENDENTE');

  // ── Row renderer ───────────────────────────────────────────────────────

  const renderRow = (u: Profile) => {
    const isSelf = currentUser?.id === u.user_id;
    const isLoading = actionLoading === u.user_id;
    const initials = getInitials(u.full_name, u.email);
    const avatarColor = getAvatarColor(u.user_id);
    const isLastAdmin = u.role === 'ADMIN' && u.status === 'ATIVO' && adminCount <= 1;
    const canDelete = !isSelf && !isLastAdmin;

    return (
      <tr key={u.user_id} className="group hover:bg-slate-50 transition-colors">
        {/* Avatar + Name */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm flex-shrink-0 ${avatarColor}`}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 group-hover:text-primary transition-colors">
                {u.full_name || '—'}
                {isSelf && <span className="ml-2 text-xs text-slate-400">(você)</span>}
              </p>
            </div>
          </div>
        </td>

        {/* Email */}
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{u.email}</td>

        {/* Role */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="relative inline-block">
            <select
              value={u.role}
              onChange={e => handleUpdateRole(u.user_id, e.target.value as UserRole)}
              disabled={isLoading || isSelf}
              className={`appearance-none inline-flex items-center pl-2.5 pr-6 py-0.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${roleColors[u.role]}`}
            >
              <option value="LEITOR">Leitor</option>
              <option value="EXPEDICAO">Expedição</option>
              <option value="ADMIN">Admin</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 opacity-60" />
          </div>
        </td>

        {/* Status */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${statusColors[u.status]}`} />
            <span className="text-sm text-slate-600">{statusLabels[u.status]}</span>
          </div>
        </td>

        {/* Actions */}
        <td className="px-6 py-4 whitespace-nowrap text-right">
          <div className="flex items-center justify-end gap-1">
            {u.status === 'PENDENTE' && (
              <button
                onClick={() => handleUpdateStatus(u.user_id, 'ATIVO')}
                disabled={isLoading}
                title="Aprovar conta"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 border border-green-200 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                Aprovar
              </button>
            )}

            {u.status === 'ATIVO' && !isSelf && (
              <button
                onClick={() => handleUpdateStatus(u.user_id, 'BLOQUEADO')}
                disabled={isLoading}
                title="Bloquear usuário"
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {u.status === 'BLOQUEADO' && (
              <button
                onClick={() => handleUpdateStatus(u.user_id, 'ATIVO')}
                disabled={isLoading}
                title="Reativar usuário"
                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
            )}

            {/* Delete button */}
            {canDelete && (
              deleteConfirm === u.user_id ? (
                <div className="flex items-center gap-1 ml-1">
                  <button
                    onClick={() => handleDeleteUser(u.user_id)}
                    disabled={isLoading}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    Deletar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-2 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(u.user_id)}
                  disabled={isLoading}
                  title="Deletar permanentemente"
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}

            {isLoading && (
              <Loader2 className="w-4 h-4 text-primary animate-spin ml-1" />
            )}
          </div>
        </td>
      </tr>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm"
              placeholder="Buscar por nome ou e-mail..."
              type="text"
            />
          </div>
          <button
            onClick={triggerRefetch}
            disabled={loading}
            title="Atualizar lista"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-sm text-slate-700 font-medium mb-1">Falha ao carregar usuários</p>
            <p className="text-xs text-slate-500 text-center mb-4 max-w-xs">{error}</p>
            <button onClick={refetch} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Pending section */}
        {!loading && !error && pendingUsers.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-yellow-800 flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4" />
              {pendingUsers.length} conta{pendingUsers.length > 1 ? 's' : ''} aguardando aprovação
            </h2>
            <div className="space-y-2">
              {pendingUsers.map(u => {
                const initials = getInitials(u.full_name, u.email);
                const avatarColor = getAvatarColor(u.user_id);
                const isLoading = actionLoading === u.user_id;
                return (
                  <div key={u.user_id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-yellow-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${avatarColor}`}>
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.full_name || '—'}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateStatus(u.user_id, 'ATIVO')}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(u.user_id, 'BLOQUEADO')}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-600 text-xs font-semibold rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Rejeitar
                      </button>
                      {isLoading && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !error && otherUsers.length === 0 && pendingUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">Nenhum usuário encontrado.</p>
            </div>
          ) : !error ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Perfil</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {otherUsers.map(renderRow)}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* Role legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-slate-900 w-5 h-5" />
              <h3 className="text-sm font-semibold text-slate-900">Admin</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Acesso total a configurações, usuários e gestão.</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Truck className="text-amber-600 w-5 h-5" />
              <h3 className="text-sm font-semibold text-slate-900">Expedição</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Focado em pedidos, estoque e controle logístico.</p>
          </div>
          <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="text-slate-400 w-5 h-5" />
              <h3 className="text-sm font-semibold text-slate-900">Leitor</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Visualização de catálogos e status de pedidos apenas.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Usuarios;