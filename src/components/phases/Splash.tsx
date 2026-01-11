import React from 'react';

const Splash: React.FC = () => {
    return (
        <div className="text-center animate-pulse">
            <div className="w-20 h-20 bg-rose-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-[0_0_50px_rgba(244,63,94,0.4)]">
                <i className="fas fa-heart"></i>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-widest italic">Iniciando...</h1>
        </div>
    );
};

export default Splash;
