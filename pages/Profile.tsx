import React, { useState, useEffect, useRef } from 'react';
import { useAuth, Profile } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Shield, Save, Camera, AlertCircle, CheckCircle, Lock, Loader2, KeyRound } from 'lucide-react';

// ─── Avatar Upload ─────────────────────────────────────────────────────────────

const BUCKET = 'avatars';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

async function uploadAvatar(userId: string, file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE) throw new Error('A imagem deve ter no máximo 2 MB.');
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Formato não suportado. Use JPG, PNG, WebP ou GIF.');

    const ext = file.name.split('.').pop();
    // Each user gets their own folder; overwrite so there's only one avatar per user
    const path = `${userId}/avatar.${ext}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

    if (error) throw new Error('Falha no upload: ' + error.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Bust cache with timestamp so the browser reloads the new image
    return `${data.publicUrl}?t=${Date.now()}`;
}

// ─── Role badge helper ─────────────────────────────────────────────────────────

const roleConfig = {
    ADMIN: { label: 'Admin', cls: 'bg-purple-100 text-purple-800' },
    EXPEDICAO: { label: 'Expedição', cls: 'bg-blue-100   text-blue-800' },
    LEITOR: { label: 'Leitor', cls: 'bg-slate-100  text-slate-800' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
    const { user, profile, updateProfile, resetPassword, loading } = useAuth();

    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSendingReset, setIsSendingReset] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Populate form from profile
    useEffect(() => {
        if (profile) {
            setName(profile.full_name || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    // ── Avatar click → file picker ────────────────────────────────────────
    const handleAvatarClick = () => {
        if (!isUploading) fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Reset so the same file can be re-selected
        e.target.value = '';

        setIsUploading(true);
        setMessage(null);
        try {
            const publicUrl = await uploadAvatar(user.id, file);
            // Update local preview immediately
            setAvatarUrl(publicUrl);
            // Persist to DB
            const { error } = await updateProfile({ avatar_url: publicUrl, updated_at: new Date().toISOString() });
            if (error) throw new Error('Perfil não atualizado no banco.');
            setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao fazer upload.' });
        } finally {
            setIsUploading(false);
        }
    };

    // ── Save name / other fields ──────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        const updates: Partial<Profile> = {
            full_name: name,
            updated_at: new Date().toISOString(),
        };

        const { error } = await updateProfile(updates);
        setMessage(
            error
                ? { type: 'error', text: 'Erro ao atualizar perfil.' }
                : { type: 'success', text: 'Perfil atualizado com sucesso!' }
        );
        setIsSaving(false);
    };

    // ── Password reset ────────────────────────────────────────────────────
    const handlePasswordReset = async () => {
        const email = user?.email || profile?.email;
        if (!email) {
            setPwMessage({ type: 'error', text: 'E-mail não encontrado para envio.' });
            return;
        }

        setIsSendingReset(true);
        setPwMessage(null);
        const { error } = await resetPassword(email);
        if (error) {
            setPwMessage({ type: 'error', text: 'Falha ao enviar e-mail: ' + error.message });
        } else {
            setPwMessage({ type: 'success', text: `E-mail de redefinição enviado para ${email}.` });
        }
        setIsSendingReset(false);
    };

    if (loading) return null;

    const role = profile?.role ?? 'LEITOR';
    const { label: roleLabel, cls: roleCls } = roleConfig[role] ?? roleConfig.LEITOR;

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 leading-tight">Configurações de Perfil</h1>
                <p className="mt-1 text-sm text-slate-500">Gerencie suas informações pessoais e de segurança.</p>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-6 md:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Feedback banner */}
                        {message && (
                            <div className={`p-4 rounded-lg flex items-start gap-3 text-sm ${message.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                {message.type === 'success'
                                    ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                                <span className="font-medium">{message.text}</span>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-8">

                            {/* ── Avatar section ── */}
                            <div className="flex flex-col items-center gap-3">
                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {/* Clickable avatar */}
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    disabled={isUploading}
                                    title="Clique para alterar a foto"
                                    className="relative group w-32 h-32 rounded-full focus:outline-none focus:ring-4 focus:ring-primary/30"
                                >
                                    {/* Image / initials */}
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary text-white text-4xl font-bold">
                                                {name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover overlay */}
                                    <div className={`
                                        absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center gap-1
                                        transition-opacity
                                        ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                    `}>
                                        {isUploading ? (
                                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                                        ) : (
                                            <>
                                                <Camera className="w-6 h-6 text-white" />
                                                <span className="text-white text-[10px] font-medium">Alterar foto</span>
                                            </>
                                        )}
                                    </div>
                                </button>

                                {/* Role badge */}
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${roleCls}`}>
                                    {roleLabel}
                                </span>

                                <p className="text-xs text-slate-400 text-center">JPG, PNG, WebP ou GIF · máx. 2 MB</p>
                            </div>

                            {/* ── Fields section ── */}
                            <div className="flex-1 space-y-5">

                                {/* Full name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-slate-900 placeholder-slate-400"
                                            placeholder="Seu nome completo"
                                        />
                                    </div>
                                </div>

                                {/* Email (read-only) */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                                        <input
                                            type="email"
                                            value={profile?.email || user?.email || ''}
                                            disabled
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-slate-400">O email não pode ser alterado.</p>
                                </div>

                                {/* ── Security section ── */}
                                <div className="pt-4 border-t border-slate-100">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-slate-400" />
                                        Segurança
                                    </h3>

                                    {/* Password reset feedback */}
                                    {pwMessage && (
                                        <div className={`mb-3 p-3 rounded-lg flex items-start gap-2 text-xs ${pwMessage.type === 'success'
                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                : 'bg-red-50 text-red-800 border border-red-200'
                                            }`}>
                                            {pwMessage.type === 'success'
                                                ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                                            <span className="font-medium">{pwMessage.text}</span>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handlePasswordReset}
                                        disabled={isSendingReset}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {isSendingReset ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <KeyRound className="w-4 h-4" />
                                                Enviar link de redefinição de senha
                                            </>
                                        )}
                                    </button>
                                    <p className="mt-2 text-xs text-slate-400">
                                        Um link será enviado para <strong>{profile?.email || user?.email}</strong>.
                                    </p>
                                </div>

                                {/* Save button */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSaving || isUploading}
                                        className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Salvando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Salvar Alterações
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
