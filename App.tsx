
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, SwipeDirection, SessionPhase, SessionConfig, P2PMessage, UserProfile } from './types.ts';
import { fetchMovies } from './services/movieService.ts';
import Card from './components/Card.tsx';

declare var Peer: any;
declare var confetti: any;

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=ffd5dc",
];

const App: React.FC = () => {
  // --- Estados do App ---
  const [phase, setPhase] = useState<SessionPhase>('splash');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [peerId, setPeerId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [connStatus, setConnStatus] = useState<'offline' | 'waiting' | 'connected'>('offline');
  const [isTyping, setIsTyping] = useState(false);
  const [reactions, setReactions] = useState<{id: number, emoji: string}[]>([]);

  // --- Estados de Cinema ---
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [partnerLikes, setPartnerLikes] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [match, setMatch] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [customVibe, setCustomVibe] = useState('');

  // --- Refs ---
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const heartbeatInterval = useRef<any>(null);

  // --- Inicialização & Persistência ---
  useEffect(() => {
    const savedProfile = localStorage.getItem('cm_profile');
    const savedWatchlist = localStorage.getItem('cm_watchlist');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedWatchlist) setWatchlist(JSON.parse(savedWatchlist));

    const initPeer = () => {
      if (typeof Peer === 'undefined') {
        setTimeout(initPeer, 500);
        return;
      }
      peerRef.current = new Peer();
      peerRef.current.on('open', (id: string) => {
        setPeerId(id);
        setConnStatus('waiting');
      });
      peerRef.current.on('connection', (conn: any) => {
        connRef.current = conn;
        setupConnection(conn);
      });
      setPhase(savedProfile ? 'pairing' : 'profile_setup');
    };

    setTimeout(initPeer, 1500);

    return () => {
      if (peerRef.current) peerRef.current.destroy();
      clearInterval(heartbeatInterval.current);
    };
  }, []);

  // --- Lógica P2P ---
  const setupConnection = (conn: any) => {
    conn.on('open', () => {
      setConnStatus('connected');
      if (profile) conn.send({ type: 'HANDSHAKE', profile });
      
      // Inicia Heartbeat
      heartbeatInterval.current = setInterval(() => {
        conn.send({ type: 'HEARTBEAT' });
      }, 5000);
    });

    conn.on('data', (data: P2PMessage) => {
      switch(data.type) {
        case 'HANDSHAKE':
          setPartner(data.profile);
          setPhase('vibe_check');
          break;
        case 'REACTION':
          triggerReaction(data.emoji, false);
          break;
        case 'TYPING_STATUS':
          setIsTyping(data.isTyping);
          break;
        case 'START_SESSION':
          setMovies(data.movies);
          setPhase('discovery');
          break;
        case 'SWIPE_UPDATE':
          if (data.direction === SwipeDirection.RIGHT || data.direction === SwipeDirection.UP) {
            setPartnerLikes(prev => [...prev, data.movieId]);
          }
          break;
      }
    });

    conn.on('close', () => {
      setConnStatus('offline');
      clearInterval(heartbeatInterval.current);
    });
  };

  const connectToPartner = () => {
    if (!targetId || !peerRef.current) return;
    const conn = peerRef.current.connect(targetId.trim());
    connRef.current = conn;
    setupConnection(conn);
  };

  // --- Ações de Cinema ---
  const startSession = async (vibeName: string) => {
    setLoading(true);
    const config: SessionConfig = { vibe: vibeName, maxTime: 120, customVibe: vibeName === 'custom' ? customVibe : undefined };
    const fetched = await fetchMovies(config);
    setMovies(fetched);
    if (connRef.current) connRef.current.send({ type: 'START_SESSION', movies: fetched, config });
    setPhase('discovery');
    setLoading(false);
  };

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    const movie = movies[currentIndex];
    if (!movie) return;

    if (direction !== SwipeDirection.LEFT) {
      setMyLikes(prev => [...prev, movie.id]);
      // Checa Match
      if (partnerLikes.includes(movie.id)) {
        triggerMatch(movie);
      }
    }

    if (connRef.current) {
      connRef.current.send({ type: 'SWIPE_UPDATE', movieId: movie.id, direction });
    }

    if (navigator.vibrate) navigator.vibrate(direction === SwipeDirection.LEFT ? 10 : 30);

    if (currentIndex + 1 >= movies.length) setPhase('session_end');
    else setCurrentIndex(prev => prev + 1);
  }, [movies, currentIndex, partnerLikes]);

  const triggerMatch = (movie: Movie) => {
    setMatch(movie);
    const updatedWatchlist = [...watchlist, movie];
    setWatchlist(updatedWatchlist);
    localStorage.setItem('cm_watchlist', JSON.stringify(updatedWatchlist));
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#f43f5e', '#ffffff'] });
  };

  const triggerReaction = (emoji: string, send = true) => {
    const id = Date.now();
    setReactions(prev => [...prev, { id, emoji }]);
    if (send && connRef.current) connRef.current.send({ type: 'REACTION', emoji });
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2500);
  };

  // --- Renderização ---
  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden relative pb-safe">
      
      {/* Reações Flutuantes */}
      <div className="fixed inset-0 pointer-events-none z-[1000] overflow-hidden">
        {reactions.map(r => (
          <div key={r.id} className="absolute bottom-20 left-1/2 -translate-x-1/2 text-6xl animate-float-emoji">
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Header Fino */}
      <header className="p-4 flex justify-between items-center z-50 glass mb-4 pt-safe">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center rotate-3 shadow-lg">
            <i className="fas fa-clapperboard text-[10px]"></i>
          </div>
          <span className="font-black italic tracking-tighter text-sm uppercase">CineMatch</span>
        </div>
        
        <div className="flex items-center gap-3">
          {connStatus === 'connected' && (
            <div className="flex -space-x-2">
              <img src={profile?.avatar} className="w-6 h-6 rounded-full border border-slate-900" alt="" />
              <img src={partner?.avatar} className="w-6 h-6 rounded-full border border-slate-900" alt="" />
            </div>
          )}
          <button onClick={() => setPhase('watchlist')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">
            <i className="fas fa-bookmark"></i>
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full relative">
        
        {phase === 'splash' && (
          <div className="text-center animate-pulse">
            <div className="w-20 h-20 bg-rose-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-[0_0_50px_rgba(244,63,94,0.4)]">
              <i className="fas fa-heart"></i>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-widest italic">Iniciando...</h1>
          </div>
        )}

        {phase === 'profile_setup' && (
          <div className="w-full space-y-8 animate-in slide-in-from-bottom-10">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Crie sua<br/><span className="text-rose-500">Identidade.</span></h2>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map(a => (
                <button 
                  key={a} onClick={() => setProfile({ name: profile?.name || '', avatar: a })}
                  className={`aspect-square rounded-2xl border-2 overflow-hidden transition-all ${profile?.avatar === a ? 'border-rose-500 scale-110 shadow-xl shadow-rose-500/20' : 'border-white/10 opacity-30'}`}
                >
                  <img src={a} className="w-full h-full" alt="" />
                </button>
              ))}
            </div>
            <input 
              value={profile?.name || ''} 
              onChange={e => setProfile(p => ({ avatar: p?.avatar || AVATARS[0], name: e.target.value }))}
              placeholder="Como te chamam?"
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold placeholder:text-slate-700 outline-none focus:border-rose-500/50"
            />
            <button 
              onClick={() => { if(profile?.name) { localStorage.setItem('cm_profile', JSON.stringify(profile)); setPhase('pairing'); } }}
              className="w-full bg-rose-500 p-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
            >
              Começar Jornada
            </button>
          </div>
        )}

        {phase === 'pairing' && (
          <div className="w-full text-center space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Conectar<br/>Parceiro(a)</h2>
            <div className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] space-y-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Seu código de acesso</p>
              <div className="text-xl font-mono font-bold text-rose-500 tracking-widest bg-black/40 p-4 rounded-xl truncate">
                {peerId || '...'}
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(peerId); alert("Copiado!"); }}
                className="w-full text-[10px] font-black uppercase bg-white/5 py-3 rounded-xl border border-white/5"
              >
                Copiar meu código
              </button>
            </div>
            <div className="space-y-3">
              <input 
                value={targetId} onChange={e => setTargetId(e.target.value)}
                placeholder="Cole o código dele(a)..."
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-center font-mono text-xs uppercase"
              />
              <button 
                onClick={connectToPartner}
                className="w-full bg-white text-black p-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all"
              >
                Parear Agora
              </button>
              <button onClick={() => setPhase('vibe_check')} className="text-[10px] font-black uppercase text-slate-600 tracking-widest block mx-auto pt-4">Jogar Sozinho</button>
            </div>
          </div>
        )}

        {phase === 'vibe_check' && (
          <div className="w-full space-y-6 overflow-y-auto no-scrollbar max-h-[80vh] pb-10">
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Qual a<br/><span className="text-rose-500">Vibe?</span></h2>
              {isTyping && <span className="text-[10px] text-rose-500 font-black animate-pulse uppercase">O parceiro está escolhendo...</span>}
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/10">
                <input 
                  value={customVibe}
                  onChange={e => {
                    setCustomVibe(e.target.value);
                    if(connRef.current) connRef.current.send({ type: 'TYPING_STATUS', isTyping: e.target.value.length > 0 });
                  }}
                  placeholder="Ou digite sua própria vibe..."
                  className="w-full bg-transparent p-2 outline-none font-bold text-sm"
                />
                {customVibe && (
                  <button onClick={() => startSession('custom')} className="mt-4 w-full bg-rose-500 py-3 rounded-xl text-[10px] font-black uppercase">Gerar com IA</button>
                )}
              </div>
              {[
                { id: 'romance', label: 'Noite Romântica', emoji: '🕯️', color: 'from-pink-600' },
                { id: 'horror', label: 'Terror Psicológico', emoji: '🧠', color: 'from-purple-900' },
                { id: 'scifi', label: 'Ficção & Futuro', emoji: '🚀', color: 'from-cyan-900' },
                { id: 'comedy', label: 'Chorar de Rir', emoji: '🍿', color: 'from-orange-600' },
              ].map(v => (
                <button 
                  key={v.id} onClick={() => startSession(v.label)}
                  className={`relative p-6 rounded-2xl bg-gradient-to-r ${v.color} to-slate-900 border border-white/10 flex items-center justify-between group overflow-hidden shadow-lg active:scale-95 transition-all`}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    <span className="text-2xl">{v.emoji}</span>
                    <span className="font-black uppercase tracking-widest text-[11px]">{v.label}</span>
                  </div>
                  <i className="fas fa-arrow-right text-[10px] opacity-20 group-hover:opacity-100 transition-opacity"></i>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'discovery' && (
          <div className="w-full h-full flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black uppercase text-rose-500 animate-pulse">Consultando Oráculo...</p>
              </div>
            ) : (
              <div className="relative w-full h-full flex flex-col">
                <div className="relative flex-1">
                  {movies.map((m, idx) => (
                    idx >= currentIndex && idx <= currentIndex + 1 && (
                      <Card key={m.id} movie={m} isActive={currentIndex === idx} onSwipe={handleSwipe} />
                    )
                  )).reverse()}
                </div>
                
                {/* Controles de Reação */}
                <div className="flex justify-center gap-4 py-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-md rounded-t-[2rem]">
                  <button onClick={() => triggerReaction('🔥')} className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl active:scale-125 transition-transform">🔥</button>
                  <button onClick={() => triggerReaction('😱')} className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl active:scale-125 transition-transform">😱</button>
                  <button onClick={() => triggerReaction('🍿')} className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl active:scale-125 transition-transform">🍿</button>
                  <button onClick={() => triggerReaction('👎')} className="w-12 h-12 rounded-full glass flex items-center justify-center text-xl active:scale-125 transition-transform">👎</button>
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'watchlist' && (
          <div className="w-full h-full flex flex-col animate-in slide-in-from-right">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-3xl font-black uppercase italic">Meus <span className="text-rose-500">Matches</span></h2>
               <button onClick={() => setPhase(movies.length > 0 ? 'discovery' : 'vibe_check')} className="text-xs font-black uppercase text-slate-500">Voltar</button>
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
                     <button onClick={() => {
                        const newWatch = watchlist.filter(w => w.id !== m.id);
                        setWatchlist(newWatch);
                        localStorage.setItem('cm_watchlist', JSON.stringify(newWatch));
                     }} className="p-2 text-slate-800 hover:text-red-500">
                       <i className="fas fa-trash text-xs"></i>
                     </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        )}

      </main>

      {/* Cerimônia de Match */}
      {match && (
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
              <button onClick={() => setMatch(null)} className="bg-white text-black py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Continuar</button>
              <button onClick={() => window.open(`https://www.youtube.com/results?search_query=${match.title}+trailer`, '_blank')} className="bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95">Trailer</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
