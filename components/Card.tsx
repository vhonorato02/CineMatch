
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
    setPos({ x, y, rot: x / 18 });
  };

  const onEnd = () => {
    if (!dragging) return;
    setDragging(false);
    const threshold = 130;
    if (pos.x > threshold) onSwipe(SwipeDirection.RIGHT);
    else if (pos.x < -threshold) onSwipe(SwipeDirection.LEFT);
    else setPos({ x: 0, y: 0, rot: 0 });
  };

  const style = {
    transform: `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rot}deg)`,
    transition: dragging ? 'none' : 'transform 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
    zIndex: isActive ? 50 : 0,
    opacity: isActive ? 1 : 0.6,
    visibility: isActive ? 'visible' : 'hidden' as any,
    scale: isActive ? '1' : '0.9'
  };

  return (
    <div 
      style={style}
      onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      className="absolute inset-0 w-full h-[65vh] flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
    >
      <div className="w-full h-full bg-slate-900 rounded-[3rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-white/5 relative flex flex-col">
        {/* Poster Section */}
        <div className="flex-[1.5] relative bg-slate-800 overflow-hidden">
            <img src={movie.imageUrl} className="w-full h-full object-cover opacity-80" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
            
            <div className="absolute inset-0 flex flex-col justify-end p-8 text-center">
                <div className="mb-4">
                  <span className="bg-rose-500/90 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                    {movie.compatibility}% Compatível
                  </span>
                </div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-2 drop-shadow-2xl">{movie.title}</h2>
                <div className="flex items-center justify-center gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <span>{movie.year}</span>
                  <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
                  <span>{movie.duration} min</span>
                </div>
            </div>
        </div>

        {/* Info Section */}
        <div className="p-8 pb-10 bg-slate-950 border-t border-white/5">
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                {movie.genres.map(g => (
                    <span key={g} className="flex-shrink-0 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase text-slate-400 tracking-widest">
                      {g}
                    </span>
                ))}
            </div>
            <p className="text-slate-400 text-[13px] font-medium leading-relaxed italic line-clamp-2 mb-6">"{movie.description}"</p>
            <div className="flex items-center gap-4">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${movie.rating * 10}%` }}></div>
                </div>
                <span className="text-[10px] font-black text-rose-500 tracking-widest">{movie.rating.toFixed(1)} IMDB</span>
            </div>
        </div>

        {/* Feedback de Swipe */}
        {dragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                {pos.x > 60 && <div className="p-8 border-4 border-green-500 rounded-full bg-green-500/20 text-green-500 font-black text-4xl uppercase italic -rotate-12 animate-in zoom-in">MATCH</div>}
                {pos.x < -60 && <div className="p-8 border-4 border-red-500 rounded-full bg-red-500/20 text-red-500 font-black text-4xl uppercase italic rotate-12 animate-in zoom-in">NOPE</div>}
            </div>
        )}
      </div>
    </div>
  );
};

export default Card;
