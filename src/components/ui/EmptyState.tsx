import React from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, actionLabel, onAction }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl"></div>
                <i className={`${icon} text-4xl text-slate-600 relative z-10`}></i>
            </div>
            <h3 className="text-xl font-black uppercase mb-3 text-slate-300">{title}</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="bg-rose-500 px-6 py-3 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 transition-all"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
