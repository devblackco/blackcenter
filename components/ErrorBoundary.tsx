import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    declare props: ErrorBoundaryProps;
    declare state: ErrorBoundaryState;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-red-200 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            Erro Inesperado
                        </h1>
                        <p className="text-slate-500 mb-4">
                            Algo deu errado ao renderizar a aplicação.
                        </p>
                        <pre className="bg-slate-100 rounded-lg p-4 text-left text-sm text-red-700 overflow-auto max-h-40 mb-6">
                            {this.state.error?.message || 'Erro desconhecido'}
                        </pre>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition-all"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
