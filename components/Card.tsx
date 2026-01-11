
import React, { useState, useCallback, useMemo } from 'react';
import { Movie, SwipeDirection } from '../types';

interface CardProps {
  movie: Movie;
  onSwipe: (direction: SwipeDirection) => void;
  isActive: boolean;
}

const Card: React.FC<CardProps> = ({ movie, onSwipe, isActive }) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [layer, setLayer] = useState<'poster' | 'details' | 'trivia'>('poster');
  const [showTeaser, setShowTeaser] = useState(false);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!isActive || showTeaser) return;
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  }, [isActive, showTeaser]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    setOffset({ x: clientX - startPos.x, y: clientY - startPos.y });
  }, [isDragging, startPos]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 120;
    if (offset.y < -threshold && Math.abs(offset.x) < 80) onSwipe(SwipeDirection.UP);
    else if (offset.x > threshold) onSwipe(SwipeDirection.RIGHT);
    else if (offset.x < -threshold) onSwipe(SwipeDirection.LEFT);
    else if (Math.abs(offset.x) < 10 && Math.abs(offset.y) < 10) {
        if (layer === 'poster') setLayer('details');
        else if (layer === 'details') setLayer('trivia');
        else setLayer('poster');
    }
    
    setOffset({ x: 0, y: 0 });
  }, [isDragging, offset, onSwipe, layer]);

  const cardStyle = useMemo((): React.CSSProperties => {
    const rotation = offset.x / 18;
    return {
      transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
      transition: isDragging ? 'none' : 'transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      zIndex: isActive ? 10 : 0,
      opacity: isActive ? 1 : 0.2,
      pointerEvents: isActive ? 'auto' : 'none',
      visibility: isActive ? 'visible' : 'hidden',
    };
  }, [offset, isDragging, isActive]);

  const badgeOpacity = Math.min(Math.abs(offset.x) / 100, 1);

  return (
    <>
      <div
        className="absolute inset-0 flex items-center justify-center p-8 swipe-card cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={handleEnd}
      >
        <div 
          style={cardStyle}
          className="w-full max-w-sm h-[680px] bg-slate-900 rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 flex flex-col relative select-none group"
        >
          {/* Swipe Badges Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 pointer-events-none p-12 flex flex-col justify-start">
               {offset.x > 30 && (
                 <div style={{ opacity: badgeOpacity }} className="self-start border-4 border-green-500 rounded-3xl px-8 py-3 -rotate-12 bg-green-500/10 backdrop-blur-md">
                   <span className="text-5xl font-black text-green-500 uppercase italic">MATCH</span>
                 </div>
               )}
               {offset.x < -30 && (
                 <div style={{ opacity: badgeOpacity }} className="self-end border-4 border-red-500 rounded-3xl px-8 py-3 rotate-12 bg-red-500/10 backdrop-blur-md">
                   <span className="text-5xl font-black text-red-500 uppercase italic">NOPE</span>
                 </div>
               )}
            </div>
          )}

          {layer === 'poster' && (
            <div className="h-full w-full relative">
              <img src={movie.imageUrl} className="w-full h-full object-cover transform scale-105 group-hover:scale-100 transition-transform duration-1000" alt="poster" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
              
              <div className="absolute top-8 left-8 right-8 z-20 flex flex-col gap-3">
                 {movie.aiReasoning && (
                   <div className="bg-rose-500/80 backdrop-blur-3xl p-5 rounded-[2rem] border border-white/20 shadow-2xl animate-in slide-in-from-top duration-500">
                      <p className="text-[9px] font-black uppercase text-white/70 mb-2 tracking-[0.4em] flex items-center gap-2">
                        <i className="fas fa-sparkles"></i> CineAI Insight
                      </p>
                      <p className="text-[11px] font-bold text-white leading-tight italic">"{movie.aiReasoning}"</p>
                   </div>
                 )}
                 {movie.snackSuggestion && (
                   <div className="bg-orange-500/80 backdrop-blur-3xl p-4 rounded-[1.5rem] border border-white/20 shadow-2xl animate-in slide-in-from-top delay-200 duration-500 flex items-center gap-4 self-start">
                      <span className="text-xl">🍿</span>
                      <div>
                        <p className="text-[8px] font-black uppercase text-white/70 tracking-widest">Snack Ideal</p>
                        <p className="text-[10px] font-black text-white">{movie.snackSuggestion}</p>
                      </div>
                   </div>
                 )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-12">
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-5xl font-black italic tracking-tighter leading-none uppercase drop-shadow-2xl">{movie.title}</h2>
                  <div className="bg-yellow-500 text-black px-4 py-2 rounded-2xl text-[11px] font-black shadow-2xl shadow-yellow-500/40">{movie.rating.toFixed(1)}</div>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
                   <span>{movie.year}</span>
                   <span className="w-2 h-2 bg-slate-700 rounded-full"></span>
                   <span>{movie.duration} min</span>
                   <span className="w-2 h-2 bg-slate-700 rounded-full"></span>
                   <span className="text-rose-500">{movie.genres[0]}</span>
                </div>
                
                <div className="flex gap-3 mt-10">
                   {movie.streamingOn?.map(s => (
                     <span key={s} className="bg-white/10 backdrop-blur-3xl px-5 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10 shadow-xl">{s}</span>
                   ))}
                </div>
              </div>
            </div>
          )}

          {layer === 'details' && (
            <div className="p-12 flex flex-col h-full bg-slate-950/98 backdrop-blur-[60px] animate-in fade-in zoom-in duration-500">
               <div className="flex justify-between items-start mb-12">
                  <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">A História.</h3>
                  <button onClick={(e) => { e.stopPropagation(); setLayer('poster'); }} className="w-14 h-14 bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-slate-500 hover:text-white transition shadow-2xl"><i className="fas fa-times"></i></button>
               </div>
               <p className="text-slate-300 text-lg font-medium leading-relaxed mb-12 italic opacity-90">"{movie.description}"</p>
               
               <div className="grid grid-cols-1 gap-4 mb-auto">
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vibe da Noite</span>
                     <span className="text-xs font-black uppercase text-rose-500">{movie.vibe}</span>
                  </div>
                  <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gênero Principal</span>
                     <span className="text-xs font-black uppercase text-white">{movie.genres[0]}</span>
                  </div>
               </div>

               <div className="flex flex-col gap-5 mt-12">
                  <button onClick={(e) => { e.stopPropagation(); setShowTeaser(true); }} className="w-full bg-rose-500 py-7 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-[0_20px_40px_rgba(244,63,94,0.3)] active:scale-95 transition flex items-center justify-center gap-4">
                    <i className="fas fa-play text-xs"></i> Assistir Teaser
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setLayer('trivia'); }} className="w-full bg-slate-800 py-7 rounded-[2rem] font-black uppercase text-xs tracking-widest border border-white/5 flex items-center justify-center gap-4 active:scale-95 transition">
                    <i className="fas fa-lightbulb text-xs"></i> Curiosidades
                  </button>
               </div>
            </div>
          )}

          {layer === 'trivia' && (
            <div className="p-12 flex flex-col h-full bg-indigo-950/98 backdrop-blur-[60px] animate-in slide-in-from-right duration-500">
               <div className="flex justify-between items-start mb-16">
                  <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Trivia.</h3>
                  <button onClick={(e) => { e.stopPropagation(); setLayer('poster'); }} className="w-14 h-14 bg-white/10 rounded-[1.5rem] flex items-center justify-center text-white/50 hover:text-white transition shadow-2xl"><i className="fas fa-times"></i></button>
               </div>
               
               <div className="flex-1 flex flex-col justify-center items-center text-center">
                  <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center text-3xl text-yellow-500 mb-8 animate-bounce">
                    <i className="fas fa-lightbulb"></i>
                  </div>
                  <p className="text-xl font-black italic text-white/90 leading-relaxed mb-12">"{movie.trivia}"</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Toque para voltar ao pôster</p>
               </div>
               
               <button onClick={(e) => { e.stopPropagation(); setLayer('poster'); }} className="w-full py-8 text-[10px] font-black uppercase tracking-widest text-indigo-400">Voltar para a escolha</button>
            </div>
          )}
        </div>
      </div>

      {showTeaser && (
        <div className="fixed inset-0 z-[1100] bg-black/98 flex items-center justify-center p-8 animate-in zoom-in duration-500" onClick={() => setShowTeaser(false)}>
           <div className="w-full max-w-2xl aspect-video bg-black rounded-[3.5rem] overflow-hidden shadow-[0_0_150px_rgba(244,63,94,0.2)] relative border border-white/10">
              <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${movie.youtubeVideoId}?autoplay=1&controls=0&modestbranding=1&rel=0`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen title="teaser"></iframe>
              <button onClick={() => setShowTeaser(false)} className="absolute top-10 right-10 w-16 h-16 bg-black/60 backdrop-blur-3xl rounded-full flex items-center justify-center text-white shadow-2xl border border-white/10 hover:scale-110 transition-transform"><i className="fas fa-times"></i></button>
           </div>
        </div>
      )}
    </>
  );
};

export default Card;
