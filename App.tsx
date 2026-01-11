
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Movie, SwipeDirection, SessionPhase, SessionConfig, P2PMessage, UserProfile } from './types';
import { fetchMovies } from './services/movieService';
import Card from './components/Card';

declare var Peer: any;

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Eden&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=b6e3f4",
];

const App: React.FC = () => {
  const [phase, setPhase] = useState<SessionPhase>('splash');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [peerId, setPeerId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connStatus, setConnStatus] = useState<'offline' | 'waiting' | 'connected'>('offline');
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [partnerLikes, setPartnerLikes] = useState<string[]>([]);
  const [match, setMatch] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  // Inicialização Robusta
  useEffect(() => {
    const saved = localStorage.getItem('cm_user_v2');
    if (saved) setProfile(JSON.parse(saved));

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      setPeerId(id);
      setConnStatus('waiting');
    });

    peer.on('connection', (conn: any) => {
      connRef.current = conn;
      setupConnection(conn);
    });

    peer.on('error', (err: any) => {
      console.error("PeerJS Error:", err);
    });

    const timer = setTimeout(() => {
      if (!saved) setPhase('profile_setup');
      else setPhase('pairing');
    }, 2500);

    return () => {
      clearTimeout(timer);
      peer.destroy();
    };
  }, []);

  const setupConnection = (conn: any) => {
    conn.on('open', () => {
      setConnStatus('connected');
      setIsConnecting(false);
      if (profile) conn.send({ type: 'HANDSHAKE', profile });
    });

    conn.on('data', (data: P2PMessage) => {
      if (data.type === 'HANDSHAKE') {
        setPartner(data.profile);
        setPhase('vibe_check');
      } else if (data.type === 'START_SESSION') {
        setMovies(data.movies);
        setPhase('discovery');
      } else if (data.type === 'SWIPE_UPDATE') {
        if (data.direction === SwipeDirection.RIGHT) {
          setPartnerLikes(prev => [...prev, data.movieId]);
        }
      }
    });

    conn.on('close', () => setConnStatus('offline'));
  };

  const connectToPartner = () => {
    if (!targetId || !peerRef.current) return;
    setIsConnecting(true);
    const conn = peerRef.current.connect(targetId);
    connRef.current = conn;
    setupConnection(conn);
  };

  const startDiscovery = async (vibe: string) => {
    setLoading(true);
    const config: SessionConfig = { vibe, maxTime: 120 };
    const fetched = await fetchMovies(config);
    setMovies(fetched);
    
    if (connRef.current) {
      connRef.current.send({ type: 'START_SESSION', movies: fetched, config });
    }
    setPhase('discovery');
    setLoading(false);
  };

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    const currentMovie = movies[currentIndex];
    if (!currentMovie) return;

    if (direction === SwipeDirection.RIGHT) {
      setMyLikes(prev => [...prev, currentMovie.id]);
      if (partnerLikes.includes(currentMovie.id)) {
        setMatch(currentMovie);
      }
    }

    if (connRef.current) {
      connRef.current.send({ type: 'SWIPE_UPDATE', movieId: currentMovie.id, direction });
    }

    if (currentIndex + 1 >= movies.length) setPhase('session_end');
    else setCurrentIndex(prev => prev + 1);
  }, [movies, currentIndex, partnerLikes]);

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* HUD de Status */}
      <header className="p-6 flex justify-between items-center z-[100] bg-gradient-to-b from-slate-950 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center rotate-12 shadow-lg shadow-rose-500/20">
            <i className="fas fa-play text-xs text-white"></i>
          </div>
          <span className="font-black italic text-xl uppercase tracking-tighter">CineMatch</span>
        </div>
        <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase flex items-center gap-2 transition-all ${
          connStatus === 'connected' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-slate-500'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${connStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`}></div>
          {connStatus === 'connected' ? 'Online' : 'Offline'}
        </div>
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        
        {phase === 'splash' && (
          <div className="text-center animate-in fade-in zoom-in duration-1000">
            <div className="w-24 h-24 bg-rose-500 rounded-[2.5rem] mx-auto mb-10 flex items-center justify-center text-4xl rotate-12 shadow-[0_20px_60px_rgba(244,63,94,0.3)]">
              <i className="fas fa-heart text-white"></i>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-4">Carregando<br/><span className="text-rose-500">CineMatch</span></h1>
            <div className="w-12 h-1 bg-white/10 mx-auto rounded-full overflow-hidden">
               <div className="h-full bg-rose-500 w-full animate-progress origin-left"></div>
            </div>
          </div>
        )}

        {phase === 'profile_setup' && (
          <div className="w-full animate-in slide-in-from-bottom-12 duration-700">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-8 leading-tight">Escolha sua<br/><span className="text-rose-500">Persona.</span></h2>
            
            <div className="grid grid-cols-3 gap-4 mb-10">
              {AVATARS.map(a => (
                <button 
                  key={a}
                  onClick={() => setProfile({ name: profile?.name || '', avatar: a })}
                  className={`aspect-square rounded-[1.5rem] border-4 transition-all overflow-hidden bg-slate-900 ${profile?.avatar === a ? 'border-rose-500 scale-105 shadow-xl' : 'border-white/5 opacity-40 hover:opacity-80'}`}
                >
                  <img src={a} className="w-full h-full" alt="avatar" />
                </button>
              ))}
            </div>

            <input 
              value={profile?.name || ''}
              onChange={e => setProfile(p => ({ avatar: p?.avatar || AVATARS[0], name: e.target.value }))}
              placeholder="Digite seu nome..."
              className="w-full bg-white/5 border border-white/10 p-7 rounded-3xl mb-8 font-black uppercase text-xs outline-none focus:border-rose-500 transition-all focus:bg-white/10"
            />
            
            <button 
              onClick={() => {
                if (profile?.name) {
                  localStorage.setItem('cm_user_v2', JSON.stringify(profile));
                  setPhase('pairing');
                }
              }}
              disabled={!profile?.name}
              className="w-full bg-rose-500 py-7 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all disabled:opacity-20"
            >
              Confirmar
            </button>
          </div>
        )}

        {phase === 'pairing' && (
          <div className="w-full text-center animate-in fade-in duration-700">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-12">Conectar<br/><span className="text-rose-500">Parceiro(a)</span></h2>
            
            <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] mb-10 shadow-2xl backdrop-blur-xl">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] block mb-4">Seu Código CineMatch</span>
              <div className="font-mono text-rose-500 font-bold text-2xl mb-8 tracking-widest">{peerId || 'Gerando...'}</div>
              <button 
                onClick={() => { navigator.clipboard.writeText(peerId); alert("ID Copiado!"); }}
                className="w-full bg-white/5 hover:bg-white/10 py-4 rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3"
              >
                <i className="fas fa-copy"></i> Copiar Código
              </button>
            </div>

            <div className="space-y-4">
              <input 
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                placeholder="Código do parceiro..."
                className="w-full bg-white/5 border border-white/10 p-6 rounded-2xl font-mono text-xs text-center uppercase outline-none focus:border-rose-500"
              />
              <button 
                onClick={connectToPartner}
                disabled={isConnecting || !targetId}
                className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-40"
              >
                {isConnecting ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-link"></i>}
                {isConnecting ? 'Pareando...' : 'Parear Agora'}
              </button>
              
              <div className="pt-8">
                 <button onClick={() => setPhase('vibe_check')} className="text-[9px] font-black uppercase text-slate-600 tracking-[0.5em] hover:text-white transition-all">Modo Solo</button>
              </div>
            </div>
          </div>
        )}

        {phase === 'vibe_check' && (
          <div className="w-full animate-in slide-in-from-right duration-500">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-10 leading-none">Vibe da<br/><span className="text-rose-500">Noite.</span></h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'romance', name: 'Noite Romântica', icon: '🕯️', color: 'from-pink-600' },
                { id: 'horror', name: 'Terror & Susto', icon: '💀', color: 'from-purple-900' },
                { id: 'comedy', name: 'Só Risadas', icon: '😂', color: 'from-yellow-600' },
                { id: 'action', name: 'Ação Total', icon: '🔥', color: 'from-red-600' },
              ].map(v => (
                <button 
                  key={v.id}
                  onClick={() => startDiscovery(v.name)}
                  className={`bg-gradient-to-r ${v.color} to-slate-900/40 border border-white/10 p-8 rounded-[2rem] flex items-center justify-between group active:scale-95 transition-all shadow-xl`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-3xl">{v.icon}</span>
                    <span className="font-black uppercase tracking-widest text-xs">{v.name}</span>
                  </div>
                  <i className="fas fa-chevron-right opacity-30"></i>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'discovery' && (
          <div className="w-full h-full flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-8"></div>
                <p className="font-black uppercase tracking-widest text-[10px] text-rose-500 animate-pulse">CineAI Gerando Opções...</p>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {movies.length > 0 ? (
                  movies.slice(currentIndex, currentIndex + 2).reverse().map((m) => (
                    <Card 
                      key={m.id}
                      movie={m}
                      isActive={currentIndex === movies.findIndex(movie => movie.id === m.id)}
                      onSwipe={handleSwipe}
                    />
                  ))
                ) : (
                  <div className="text-center">
                    <i className="fas fa-exclamation-triangle text-4xl text-rose-500 mb-6"></i>
                    <p className="font-black uppercase text-xs">Erro ao buscar filmes.</p>
                    <button onClick={() => setPhase('vibe_check')} className="mt-6 bg-white text-black px-8 py-3 rounded-full font-black uppercase text-[10px]">Tentar Outra Vibe</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Match Ceremony */}
      {match && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-500">
           <div className="absolute inset-0 bg-rose-500/20 blur-[150px] animate-pulse"></div>
           <div className="relative mb-12 animate-bounce">
              <img src={match.imageUrl} className="w-60 h-84 object-cover rounded-[3rem] border-4 border-rose-500 shadow-[0_0_80px_rgba(244,63,94,0.5)] relative z-10" alt="" />
           </div>
           <h2 className="text-7xl font-black italic uppercase tracking-tighter leading-none mb-4">MATCH!</h2>
           <p className="text-slate-400 font-bold uppercase tracking-[0.8em] text-[10px] mb-12">Vocês combinaram!</p>
           <h3 className="text-2xl font-black uppercase italic mb-16">{match.title}</h3>
           <button onClick={() => setMatch(null)} className="w-full max-w-xs bg-rose-500 py-7 rounded-full font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all">Continuar Descobrindo</button>
        </div>
      )}

      {phase === 'session_end' && (
        <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
           <i className="fas fa-popcorn text-7xl text-slate-800 mb-10"></i>
           <h2 className="text-4xl font-black uppercase italic mb-6 leading-tight">Chegamos ao fim<br/>da lista.</h2>
           <p className="text-slate-500 text-xs font-bold mb-14 leading-relaxed uppercase tracking-[0.4em]">Nenhum match por enquanto.<br/>Tente uma nova vibe!</p>
           <button onClick={() => window.location.reload()} className="bg-white text-black px-14 py-6 rounded-full font-black uppercase text-[11px] tracking-widest active:scale-95 transition-all shadow-2xl">Reiniciar Sessão</button>
        </div>
      )}
    </div>
  );
};

export default App;
