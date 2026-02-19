import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, UserRole, UserStatus } from '../types';
import {
  UserPlus, Search, Check, X, Shield, Truck, Eye, ShieldAlert,
  RefreshCw, ChevronDown
} from 'lucide-react';

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

// ---------------------------------------------------------------------------

const Usuarios = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[Usuarios] fetch error:', fetchError);
      setError('Falha ao carregar usuários. Verifique sua conexão.');
    } else {
      setUsers((data as Profile[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // ── Status update ──────────────────────────────────────────────────────
  const handleUpdateStatus = async (userId: string, status: UserStatus) => {
    if (currentUser?.id === userId && status !== 'ATIVO') {
      alert('Você não pode alterar seu próprio status.');
      return;
    }
    setActionLoading(userId);
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ status })
      .eq('user_id', userId);

    if (updateError) {
      alert('Erro ao atualizar status: ' + updateError.message);
    } else {
      await fetchUsers();
    }
    setActionLoading(null);
  };

  // ── Role update ────────────────────────────────────────────────────────
  const handleUpdateRole = async (userId: string, role: UserRole) => {
    if (currentUser?.id === userId) {
      alert('Você não pode alterar sua própria permissão.');
      return;
    }
    // Guard: prevent removing the last active admin
    if (role !== 'ADMIN') {
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'ADMIN')
        .eq('status', 'ATIVO');
      if (count !== null && count <= 1) {
        alert('Operação bloqueada: o sistema deve ter pelo menos um administrador ativo.');
        return;
      }
    }

    setActionLoading(userId);
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('user_id', userId);

    if (updateError) {
      alert('Erro ao atualizar permissão: ' + updateError.message);
    } else {
      await fetchUsers();
    }
    setActionLoading(null);
  };

  // ── Filtering ──────────────────────────────────────────────────────────
  const normalizeStr = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filteredUsers = users.filter(u => {
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

    return (
      <tr key={u.user_id} className="group hover:bg-slate-50 transition-colors">
        {/* Avatar + Nome */}
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
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
          {u.email}
        </td>

        {/* Role badge + select */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="relative inline-block">
            <select
              value={u.role}
              onChange={e => handleUpdateRole(u.user_id, e.target.value as UserRole)}
              disabled={isLoading || isSelf}
              className={`
                                appearance-none inline-flex items-center pl-2.5 pr-6 py-0.5 rounded-full text-xs font-medium border
                                cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors
                                disabled:cursor-not-allowed disabled:opacity-60
                                ${roleColors[u.role]}
                            `}
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

            {isLoading && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </td>
      </tr>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
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
            onClick={fetchUsers}
            disabled={loading}
            title="Atualizar lista"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-600 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Pending section */}
        {!loading && pendingUsers.length > 0 && (
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
                      {isLoading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
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
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : otherUsers.length === 0 && pendingUsers.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-sm">Nenhum usuário encontrado.</p>
            </div>
          ) : (
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
          )}
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