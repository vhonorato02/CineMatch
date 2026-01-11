import React from 'react';
import { Movie } from '../../shared/types';

interface WatchlistProps {
    watchlist: Movie[];
    onBack: () => void;
    onRemove: (id: string) => void;
}

const Watchlist: React.FC<WatchlistProps> = ({ watchlist, onBack, onRemove }) => {
    return (
        <div className="w-full h-full flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black uppercase italic">Meus <span className="text-rose-500">Matches</span></h2>
                <button onClick={onBack} className="text-xs font-black uppercase text-slate-500">Voltar</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                {watchlist.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                        <i className="fas fa-ghost text-5xl mb-4"></i>
                        <p className="font-bold uppercase text-[10px]">Nada por aqui ainda...</p>
                    </div>
                ) : (
                    watchlist.map(m => (
                        <div key={m.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 items-center">
                            <img src={m.imageUrl} className="w-16 h-20 object-cover rounded-lg shadow-lg" alt="" />
                            <div className="flex-1">
                                <h4 className="font-black text-sm uppercase italic line-clamp-1">{m.title}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{m.year} • {m.genres[0]}</p>
                                <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${m.title}+trailer`, '_blank')} className="mt-2 text-[8px] font-black uppercase text-rose-500">Assistir Trailer</button>
                            </div>
                            <button onClick={() => onRemove(m.id)} className="p-2 text-slate-800 hover:text-red-500">
                                <i className="fas fa-trash text-xs"></i>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Watchlist;
