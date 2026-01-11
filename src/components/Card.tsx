
import React, { useState, useEffect } from 'react';
import { Movie, SwipeDirection } from '../shared/types';

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
    if (navigator.vibrate) navigator.vibrate(5);
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
    if (pos.x > threshold) {
      onSwipe(SwipeDirection.RIGHT);
    } else if (pos.x < -threshold) {
      onSwipe(SwipeDirection.LEFT);
    } else if (pos.y < -threshold) {
      onSwipe(SwipeDirection.UP);
    } else {
      setPos({ x: 0, y: 0, rot: 0 });
    }
  };

  const style = {
    transform: `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${pos.rot}deg) scale(${dragging ? 1.05 : 1})`,
    transition: dragging ? 'none' : 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    zIndex: isActive ? 50 : 0,
    opacity: isActive ? 1 : 0,
    pointerEvents: isActive ? 'auto' : 'none' as any,
  };

  return (
    <div
      style={style}
      onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd}
      onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      className="absolute inset-0 w-full h-[65vh] flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
    >
      <div className="w-full h-full bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] border border-white/10 relative flex flex-col group">

        {/* Poster com Overlays dinâmicos */}
        <div className="flex-[1.8] relative overflow-hidden">
          <img src={movie.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

          {/* Super Like Badge */}
          {pos.y < -50 && (
            <div className="absolute top-10 left-1/2 -translate-x-1/2 border-4 border-cyan-400 bg-cyan-400/20 text-cyan-400 px-6 py-2 rounded-xl font-black italic text-2xl uppercase -rotate-6 animate-pulse z-50">
              SUPER LIKE
            </div>
          )}

          <div className="absolute bottom-6 left-6 right-6 text-left">
            <span className="inline-block bg-rose-500 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mb-3 shadow-lg">
              {movie.compatibility}% Match
            </span>
            <h2 className="text-3xl font-black uppercase italic leading-none drop-shadow-xl">{movie.title}</h2>
            <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">{movie.year} • {movie.duration} min</p>
          </div>
        </div>

        {/* Detalhes Curados */}
        <div className="p-6 bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
            {movie.genres.map(g => (
              <span key={g} className="px-3 py-1 bg-white/5 rounded-md text-[8px] font-black uppercase text-slate-500 border border-white/5">
                {g}
              </span>
            ))}
          </div>
          {movie.whyThis && (
            <p className="text-rose-400/80 text-[11px] font-bold italic mb-3">"{movie.whyThis}"</p>
          )}
          <p className="text-slate-500 text-[12px] leading-relaxed line-clamp-2">{movie.description}</p>
        </div>

        {/* Indicadores de Swipe Visuais */}
        {dragging && (
          <div className="absolute inset-0 pointer-events-none z-[100] flex items-center justify-center">
            {pos.x > 80 && <i className="fas fa-heart text-green-500 text-8xl animate-ping"></i>}
            {pos.x < -80 && <i className="fas fa-times text-red-500 text-8xl animate-ping"></i>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
