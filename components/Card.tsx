
import React, { useState } from 'react';
import { Movie, SwipeDirection } from '../types';

interface CardProps {
  movie: Movie;
  onSwipe: (direction: SwipeDirection) => void;
  isActive: boolean;
}

const Card: React.FC<CardProps> = ({ movie, onSwipe, isActive }) => {
  const [pos, setPos] = useState({ x: 0, y: 0, rot: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });

  const onStart = (e: any) => {
    if (!isActive) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setStart({ x: clientX - pos.x, y: clientY - pos.y });
    setDragging(true);
  };

  const onMove = (e: any) => {
    if (!dragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - start.x;
    const y = clientY - start.y;
    setPos({ x, y, rot: x / 20 });
  };

  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const threshold = 120;
    if (pos.x > threshold) onSwipe(SwipeDirection.RIGHT);
    else if (pos.x < -threshold) onSwipe(SwipeDirection.LEFT);
    else setPos({ x: 0, y: 0, rot: 0 });
  };

  const style = {
    transform: `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rot}deg)`,
    transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    zIndex: isActive ? 10 : 0,
    opacity: isActive ? 1 : 0.5,
    visibility: isActive ? 'visible' : 'hidden' as any
  };

  return (
    <div 
      style={style}
      onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      className="absolute inset-0 w-full h-[70vh] flex items-center justify-center touch-none"
    >
      <div className="w-full h-full bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950 z-10"></div>
        
        <div className="h-full flex flex-col">
            <div className="flex-1 relative overflow-hidden bg-slate-800">
                <img src={movie.imageUrl} className="w-full h-full object-cover opacity-60 scale-105" alt="" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 z-20 text-center">
                    <div className="bg-rose-500 text-white text-[9px] font-black px-5 py-1.5 rounded-full mb-4 inline-block uppercase tracking-[0.2em] shadow-lg shadow-rose-500/20">
                       {movie.compatibility}% Compatível
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2 drop-shadow-lg">{movie.title}</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{movie.year} • {movie.duration}m</p>
                </div>
            </div>

            <div className="p-8 pb-12 z-20 bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
                <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar">
                    {movie.genres.map(g => (
                        <span key={g} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-slate-400 tracking-widest">{g}</span>
                    ))}
                </div>
                <p className="text-slate-300 text-[13px] font-medium leading-relaxed italic line-clamp-3 mb-6">"{movie.description}"</p>
                <div className="flex items-center gap-4">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${movie.rating * 10}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black text-rose-500 tracking-widest">{movie.rating.toFixed(1)} IMDB</span>
                </div>
            </div>
        </div>

        {dragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                {pos.x > 50 && <div className="p-8 border-4 border-green-500 rounded-3xl -rotate-12 bg-green-500/10 backdrop-blur-sm text-green-500 font-black text-4xl uppercase italic">Match</div>}
                {pos.x < -50 && <div className="p-8 border-4 border-red-500 rounded-3xl rotate-12 bg-red-500/10 backdrop-blur-sm text-red-500 font-black text-4xl uppercase italic">Nope</div>}
            </div>
        )}
      </div>
    </div>
  );
};

export default Card;
