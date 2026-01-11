import React from 'react';

interface OnboardingProps {
    onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    return (
        <div className="fixed inset-0 z-[4000] glass flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-rose-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-[0_0_50px_rgba(244,63,94,0.4)] animate-pulse">
                        <i className="fas fa-heart"></i>
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Bem-vindo ao<br /><span className="text-rose-500">CineMatch!</span></h2>
                </div>

                <div className="space-y-6 mb-8">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-swatchbook text-rose-500"></i>
                        </div>
                        <div>
                            <h3 className="font-black uppercase text-sm mb-1">Deslize</h3>
                            <p className="text-slate-500 text-xs">← Não gostou | Gostou → | Super Like ↑</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-users text-rose-500"></i>
                        </div>
                        <div>
                            <h3 className="font-black uppercase text-sm mb-1">Conecte</h3>
                            <p className="text-slate-500 text-xs">Use o QR Code ou compartilhe seu ID com o parceiro</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0">
                            <i className="fas fa-fire text-rose-500"></i>
                        </div>
                        <div>
                            <h3 className="font-black uppercase text-sm mb-1">Match!</h3>
                            <p className="text-slate-500 text-xs">Quando ambos curtirem o mesmo filme, é match!</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onComplete}
                    className="w-full bg-rose-500 py-4 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all"
                >
                    Começar Agora
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
