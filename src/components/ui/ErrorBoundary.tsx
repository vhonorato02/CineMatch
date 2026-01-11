import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                        <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
                    </div>
                    <h1 className="text-2xl font-black uppercase mb-4">Ops! Algo deu errado</h1>
                    <p className="text-slate-400 mb-8 max-w-md">
                        {this.state.error?.message || 'Erro inesperado. Tente recarregar a página.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-rose-500 px-8 py-4 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all"
                    >
                        Recarregar App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
