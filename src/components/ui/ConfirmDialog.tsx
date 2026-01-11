import React from 'react';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    onConfirm,
    onCancel,
    danger = false,
}) => {
    return (
        <div className="fixed inset-0 z-[3000] glass flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in">
                <h3 className="text-2xl font-black uppercase mb-4">{title}</h3>
                <p className="text-slate-400 text-sm mb-8">{message}</p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onCancel}
                        className="bg-white/5 text-white py-4 rounded-xl font-black uppercase text-xs border border-white/10 active:scale-95 transition-all"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`${danger ? 'bg-red-500' : 'bg-rose-500'} text-white py-4 rounded-xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
