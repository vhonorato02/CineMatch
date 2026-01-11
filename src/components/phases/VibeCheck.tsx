import React, { useState } from 'react';

interface VibeCheckProps {
    onStartSession: (vibe: string) => void;
    onTyping: (isTyping: boolean) => void;
    isPartnerTyping: boolean;
}

const VIBES = [
    { id: 'romance', label: 'Noite Romântica', emoji: '🕯️', color: 'from-pink-600' },
    { id: 'horror', label: 'Terror Psicológico', emoji: '🧠', color: 'from-purple-900' },
    { id: 'scifi', label: 'Ficção & Futuro', emoji: '🚀', color: 'from-cyan-900' },
    { id: 'comedy', label: 'Chorar de Rir', emoji: '🍿', color: 'from-orange-600' },
];

const VibeCheck: React.FC<VibeCheckProps> = ({ onStartSession, onTyping, isPartnerTyping }) => {
    const [customVibe, setCustomVibe] = useState('');

    return (
        <div className="w-full space-y-6 overflow-y-auto no-scrollbar max-h-[80vh] pb-10">
            <div className="flex justify-between items-end mb-8">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Qual a<br /><span className="text-rose-500">Vibe?</span></h2>
                {isPartnerTyping && <span className="text-[10px] text-rose-500 font-black animate-pulse uppercase">O parceiro está escolhendo...</span>}
            </div>
            <div className="grid grid-cols-1 gap-3">
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/10">
                    <input
                        value={customVibe}
                        onChange={e => {
                            setCustomVibe(e.target.value);
                            onTyping(e.target.value.length > 0);
                        }}
                        placeholder="Ou digite sua própria vibe..."
                        className="w-full bg-transparent p-2 outline-none font-bold text-sm"
                    />
                    {customVibe && (
                        <button onClick={() => onStartSession(customVibe)} className="mt-4 w-full bg-rose-500 py-3 rounded-xl text-[10px] font-black uppercase">Gerar com IA</button>
                    )}
                </div>
                {VIBES.map(v => (
                    <button
                        key={v.id} onClick={() => onStartSession(v.label)}
                        className={`relative p-6 rounded-2xl bg-gradient-to-r ${v.color} to-slate-900 border border-white/10 flex items-center justify-between group overflow-hidden shadow-lg active:scale-95 transition-all`}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <span className="text-2xl">{v.emoji}</span>
                            <span className="font-black uppercase tracking-widest text-[11px]">{v.label}</span>
                        </div>
                        <i className="fas fa-arrow-right text-[10px] opacity-20 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default VibeCheck;
