import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, UserRole, UserStatus } from '../contexts/AuthContext';
import { Check, X, Shield, ShieldAlert, User as UserIcon } from 'lucide-react';

interface UserProfile extends Profile {
    // extending just in case we need extra fields not in context type
}

const AdminUsers = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const roleLabels: Record<UserRole, string> = {
        ADMIN: 'Admin',
        EXPEDICAO: 'Expedição',
        LEITOR: 'Leitor'
    };

    const statusLabels: Record<UserStatus, string> = {
        ATIVO: 'Ativo',
        PENDENTE: 'Pendente',
        BLOQUEADO: 'Bloqueado'
    };

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data as UserProfile[] || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateStatus = async (userId: string, status: UserStatus) => {
        // Safety: Prevent suspending self
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id === userId && status !== 'ATIVO') {
            alert('Você não pode alterar seu próprio status.');
            return;
        }

        setActionLoading(userId);
        const { error } = await supabase
            .from('user_profiles')
            .update({ status })
            .eq('user_id', userId);

        if (error) {
            alert('Erro ao atualizar status: ' + error.message);
        } else {
            fetchUsers();
        }
        setActionLoading(null);
    };

    const handleUpdateRole = async (userId: string, role: UserRole) => {
        // Safety: Prevent changing own role
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id === userId) {
            alert('Você não pode alterar sua própria permissão de segurança.');
            return;
        }

        // Safety: Prevent removing last admin
        if (role !== 'ADMIN') {
            const { count } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'ADMIN')
                .eq('status', 'ATIVO');

            if (count !== null && count <= 1) {
                alert('Operação bloqueada: O sistema deve ter pelo menos um Administrador ativo.');
                return;
            }
        }

        setActionLoading(userId);
        const { error } = await supabase
            .from('user_profiles')
            .update({ role })
            .eq('user_id', userId);

        if (error) {
            alert('Erro ao atualizar permissão: ' + error.message);
        } else {
            fetchUsers();
        }
        setActionLoading(null);
    };

    const pendingUsers = users.filter(u => u.status === 'PENDENTE');
    const activeUsers = users.filter(u => u.status !== 'PENDENTE');

    const renderUserCard = (user: UserProfile) => (
        <div key={user.user_id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                    ${user.role === 'ADMIN' ? 'bg-purple-600' : user.role === 'EXPEDICAO' ? 'bg-blue-600' : 'bg-slate-400'}`}>
                    {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <p className="font-medium text-slate-900">{user.email}</p>
                    <div className="flex items-center gap-2 text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded-full font-medium
                            ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'EXPEDICAO' ? 'bg-blue-100 text-blue-700' :
                                    'bg-slate-100 text-slate-700'}`}>
                            {roleLabels[user.role]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-medium
                            ${user.status === 'ATIVO' ? 'bg-green-100 text-green-700' :
                                user.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'}`}>
                            {statusLabels[user.status]}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {user.status === 'PENDENTE' && (
                    <button
                        onClick={() => handleUpdateStatus(user.user_id, 'ATIVO')}
                        disabled={actionLoading === user.user_id}
                        className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        title="Aprovar"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                )}

                <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.user_id, e.target.value as UserRole)}
                    disabled={actionLoading === user.user_id}
                    className="text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary"
                >
                    <option value="LEITOR">Leitor</option>
                    <option value="EXPEDICAO">Expedição</option>
                    <option value="ADMIN">Admin</option>
                </select>

                <select
                    value={user.status}
                    onChange={(e) => handleUpdateStatus(user.user_id, e.target.value as UserStatus)}
                    disabled={actionLoading === user.user_id}
                    className="text-sm border-slate-200 rounded-lg focus:ring-primary focus:border-primary"
                >
                    <option value="PENDENTE">Pendente</option>
                    <option value="ATIVO">Ativo</option>
                    <option value="BLOQUEADO">Bloqueado</option>
                </select>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                Gerenciamento de Usuários
            </h1>

            {loading ? (
                <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Pendentes */}
                    {pendingUsers.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-yellow-600" />
                                Pendentes de Aprovação
                            </h2>
                            <div className="grid gap-4">
                                {pendingUsers.map(user => renderUserCard(user))}
                            </div>
                        </div>
                    )}

                    {/* Todos */}
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-slate-600" />
                            Usuários Ativos e Bloqueados
                        </h2>
                        <div className="grid gap-4">
                            {activeUsers.map(user => renderUserCard(user))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
