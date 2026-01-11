import React, { useState } from 'react';

interface PairingProps {
    myPeerId: string;
    onConnect: (targetId: string) => void;
    onSkip: () => void;
}

const Pairing: React.FC<PairingProps> = ({ myPeerId, onConnect, onSkip }) => {
    const [targetId, setTargetId] = useState('');

    const inviteUrl = `${window.location.origin}${window.location.pathname}?peer=${myPeerId}`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CineMatch - Convite para Pareamento',
                    text: 'Vem escolher um filme comigo!',
                    url: inviteUrl,
                });
            } catch (err) {
                console.error('Erro ao compartilhar:', err);
            }
        } else {
            navigator.clipboard.writeText(inviteUrl);
            alert("Link copiado!");
        }
    };

    return (
        <div className="w-full text-center space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Conectar<br />Parceiro(a)</h2>

            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] space-y-6">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Escaneie para Conectar</p>
                    <div className="bg-white p-3 rounded-2xl inline-block shadow-xl">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteUrl)}`}
                            alt="QR Code de Conexão"
                            className="w-32 h-32"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-xl font-mono font-bold text-rose-500 tracking-widest bg-black/40 p-4 rounded-xl truncate">
                        {myPeerId || '...'}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { navigator.clipboard.writeText(myPeerId); alert("Código Copiado!"); }}
                            className="text-[10px] font-black uppercase bg-white/5 py-4 rounded-xl border border-white/5"
                        >
                            Copiar ID
                        </button>
                        <button
                            onClick={handleShare}
                            className="text-[10px] font-black uppercase bg-rose-500/20 text-rose-500 py-4 rounded-xl border border-rose-500/20"
                        >
                            Enviar Link
                        </button>
                    </div>
                </div>
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
