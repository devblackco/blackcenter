import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const AccessDenied = () => {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="bg-red-50 p-4 rounded-full mb-4">
                <ShieldAlert className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Acesso Negado</h1>
            <p className="text-slate-500 text-center max-w-md mb-6">
                Você não tem permissão para acessar esta página. Entre em contato com um administrador se acredita que isso é um erro.
            </p>
            <Link
                to="/"
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg transition-colors"
            >
                Voltar ao Dashboard
            </Link>
        </div>
    );
};

export default AccessDenied;
