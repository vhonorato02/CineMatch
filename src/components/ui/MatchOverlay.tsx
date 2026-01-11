import React from 'react';
import { Movie } from '../../shared/types';

interface MatchOverlayProps {
    match: Movie;
    onClose: () => void;
}

const MatchOverlay: React.FC<MatchOverlayProps> = ({ match, onClose }) => {
    return (
        <div className="fixed inset-0 z-[2000] glass flex flex-col items-center justify-center p-10 text-center animate-in zoom-in">
            <div className="relative mb-10">
                <div className="absolute -inset-4 bg-rose-500 rounded-[3rem] blur-3xl opacity-50 animate-pulse"></div>
                <img src={match.imageUrl} className="w-56 h-80 object-cover rounded-[2.5rem] border-4 border-white shadow-2xl relative z-10" alt="" />
                <div className="absolute -top-4 -right-4 bg-rose-500 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl z-20 shadow-xl border-4 border-slate-950 rotate-12">
                    <i className="fas fa-heart"></i>
                </div>
            </div>
            <h2 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">É MATCH!</h2>
            <h3 className="text-xl font-bold uppercase italic text-slate-300 mb-12">{match.title}</h3>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <button onClick={onClose} className="bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Continuar</button>
                <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${match.title}+trailer`, '_blank')} className="bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Trailer</button>
            </div>
        </div>
    );
};

export default MatchOverlay;
