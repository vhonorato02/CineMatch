import React from 'react';
import { Movie, SwipeDirection } from '../../shared/types';
import Card from '../Card';

interface DiscoveryProps {
    movies: Movie[];
    currentIndex: number;
    loading: boolean;
    onSwipe: (direction: SwipeDirection) => void;
    onReaction: (emoji: string) => void;
}

const Discovery: React.FC<DiscoveryProps> = ({ movies, currentIndex, loading, onSwipe, onReaction }) => {
    if (loading) {
        return (
            <div className="w-full h-full flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-black uppercase text-rose-500 animate-pulse">Consultando Oráculo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="relative w-full h-full flex flex-col">
                <div className="relative flex-1">
                    {movies.map((m, idx) => (
                        idx >= currentIndex && idx <= currentIndex + 1 && (
                            <Card key={m.id} movie={m} isActive={currentIndex === idx} onSwipe={onSwipe} />
                        )
                    )).reverse()}
                </div>

                {/* Controles de Reação */}
                <div className="flex justify-center gap-4 py-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-md rounded-t-[2rem]">
                    <button onClick={() => onReaction('🔥')} className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl active:scale-125 transition-transform">🔥</button>
                    <button onClick={() => onReaction('😱')} className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl active:scale-125 transition-transform">😱</button>
                    <button onClick={() => onReaction('🍿')} className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl active:scale-125 transition-transform">🍿</button>
                    <button onClick={() => onReaction('👎')} className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl active:scale-125 transition-transform">👎</button>
                </div>
            </div>
        </div>
    );
};

export default Discovery;
