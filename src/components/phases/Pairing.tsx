import React, { useState } from 'react';

interface PairingProps {
    myPeerId: string;
    onConnect: (targetId: string) => void;
    onSkip: () => void;
}

const Pairing: React.FC<PairingProps> = ({ myPeerId, onConnect, onSkip }) => {
    const [targetId, setTargetId] = useState('');

    return (
        <div className="w-full text-center space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Conectar<br />Parceiro(a)</h2>
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] space-y-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Seu código de acesso</p>
                <div className="text-xl font-mono font-bold text-rose-500 tracking-widest bg-black/40 p-4 rounded-xl truncate">
                    {myPeerId || '...'}
                </div>
                <button
                    onClick={() => { navigator.clipboard.writeText(myPeerId); alert("Copiado!"); }}
                    className="w-full text-[10px] font-black uppercase bg-white/5 py-3 rounded-xl border border-white/5"
                >
                    Copiar meu código
                </button>
            </div>
            <div className="space-y-3">
                <input
                    value={targetId} onChange={e => setTargetId(e.target.value)}
                    placeholder="Cole o código dele(a)..."
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center font-mono text-xs uppercase"
                />
                <button
                    onClick={() => onConnect(targetId)}
                    className="w-full bg-white text-black p-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
                >
                    Parear Agora
                </button>
                <button onClick={onSkip} className="text-[10px] font-black uppercase text-slate-600 tracking-widest block mx-auto pt-4">Jogar Sozinho</button>
            </div>
        </div>
    );
};

export default Pairing;
