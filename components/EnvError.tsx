import React from 'react';
import { AlertCircle } from 'lucide-react';

interface EnvErrorProps {
    message: string;
}

export const EnvError: React.FC<EnvErrorProps> = ({ message }) => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-yellow-200 p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <h1 className="text-xl font-bold text-slate-900">
                    Configuração Ausente
                </h1>
            </div>

            <p className="text-slate-600 mb-4">{message}</p>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">Como corrigir:</p>
                <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                    <li>Crie um arquivo <code className="bg-slate-200 px-1 rounded">.env.local</code> na raiz do projeto</li>
                    <li>Adicione as variáveis:
                        <pre className="bg-slate-200 rounded p-2 mt-1 text-xs overflow-auto">
                            {`VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui`}
                        </pre>
                    </li>
                    <li>Reinicie o servidor de desenvolvimento (<code className="bg-slate-200 px-1 rounded">npm run dev</code>)</li>
                </ol>
            </div>
        </div>
    </div>
);
