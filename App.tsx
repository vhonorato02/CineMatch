
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
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [partnerLikes, setPartnerLikes] = useState<string[]>([]);
  const [match, setMatch] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  // Inicializar Perfil e Peer
  useEffect(() => {
    const saved = localStorage.getItem('cinematch_user');
    if (saved) setProfile(JSON.parse(saved));

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id: string) => setPeerId(id));
    peer.on('connection', (conn: any) => {
      connRef.current = conn;
      handleConnection(conn);
    });

    peer.on('error', (err: any) => {
      console.error("PeerJS Error:", err);
      setStatus('error');
    });

    setTimeout(() => {
      if (!saved) setPhase('profile_setup');
      else setPhase('pairing');
    }, 2000);

    return () => peer.destroy();
  }, []);

  const handleConnection = (conn: any) => {
    connRef.current = conn;
    setStatus('connecting');

    conn.on('open', () => {
      setStatus('connected');
      setIsConnecting(false);
      if (profile) conn.send({ type: 'HANDSHAKE', profile });
    });

    conn.on('data', (data: P2PMessage) => {
      switch (data.type) {
        case 'HANDSHAKE':
          setPartner(data.profile);
          setPhase('vibe_check');
          break;
        case 'START_SESSION':
          setMovies(data.movies);
          setPhase('discovery');
          break;
        case 'SWIPE_UPDATE':
          if (data.direction === SwipeDirection.RIGHT) {
            setPartnerLikes(prev => [...prev, data.movieId]);
          }
          break;
      }
    });

    conn.on('close', () => setStatus('idle'));
  };

  const connectToPartner = () => {
    if (!targetId || !peerRef.current) return;
    setIsConnecting(true);
    const conn = peerRef.current.connect(targetId);
    handleConnection(conn);
  };

  const shareLink = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CineMatch', text: `Bora ver um filme? Meu ID: ${peerId}`, url });
      } catch (e) { console.log(e); }
    } else {
      navigator.clipboard.writeText(peerId);
      alert("ID Copiado!");
    }
  };

  const startDiscovery = async (vibe: string) => {
    setLoading(true);
    const movieData = await fetchMovies({ vibe, maxTime: 120 });
    setMovies(movieData);
    if (connRef.current) {
      connRef.current.send({ type: 'START_SESSION', movies: movieData, config: { vibe, maxTime: 120 } });
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
      
      {/* HUD Superior */}
      <header className="p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center rotate-12 shadow-lg shadow-rose-500/20">
            <i className="fas fa-play text-xs"></i>
          </div>
          <span className="font-black italic text-xl uppercase tracking-tighter">CineMatch</span>
        </div>
        {status === 'connected' && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-green-500">Pareado</span>
          </div>
        )}
      </header>

      <main className="flex-1 relative flex flex-col items-center justify-center p-6">
        
        {phase === 'splash' && (
          <div className="text-center animate-pulse">
            <div className="w-20 h-20 bg-rose-500 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl rotate-12">
              <i className="fas fa-heart"></i>
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Preparando<br/>o Cinema</h1>
          </div>
        )}

        {phase === 'profile_setup' && (
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-8">Quem é<br/><span className="text-rose-500">Você?</span></h2>
            
            <div className="grid grid-cols-3 gap-3 mb-8">
              {AVATARS.map(a => (
                <button 
                  key={a}
                  onClick={() => setProfile(p => ({ name: p?.name || '', avatar: a }))}
                  className={`aspect-square rounded-2xl border-4 transition-all overflow-hidden ${profile?.avatar === a ? 'border-rose-500 scale-105' : 'border-white/5 opacity-40'}`}
                >
                  <img src={a} className="w-full h-full" alt="avatar" />
                </button>
              ))}
            </div>

            <input 
              value={profile?.name || ''}
              onChange={e => setProfile(p => ({ avatar: p?.avatar || AVATARS[0], name: e.target.value }))}
              placeholder="Digite seu nome..."
              className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl mb-6 font-black uppercase text-xs outline-none focus:border-rose-500 transition-all"
            />
            
            <button 
              onClick={() => {
                if (profile?.name && profile.avatar) {
                  localStorage.setItem('cinematch_user', JSON.stringify(profile));
                  setPhase('pairing');
                }
              }}
              disabled={!profile?.name}
              className="w-full bg-rose-500 py-6 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-20"
            >
              Criar Perfil
            </button>
          </div>
        )}

        {phase === 'pairing' && (
          <div className="w-full max-w-sm text-center animate-in zoom-in duration-500">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-12 leading-none">Conectar<br/><span className="text-rose-500">Casal</span></h2>
            
            <div className="bg-slate-900 border border-white/5 p-8 rounded-[3rem] mb-10 relative">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-4">Seu Código de Match</span>
              <div className="font-mono text-rose-500 font-bold text-xl mb-6">{peerId || '...'}</div>
              <button 
                onClick={shareLink}
                className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl transition-all"
              >
                <i className="fas fa-share-alt mr-2"></i> Enviar link para o parceiro
              </button>
            </div>

            <div className="space-y-4">
              <input 
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                placeholder="Código do parceiro..."
                className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-mono text-xs text-center uppercase outline-none"
              />
              <button 
                onClick={connectToPartner}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                {isConnecting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-link"></i>}
                {isConnecting ? 'Conectando...' : 'Parear Agora'}
              </button>
              <button onClick={() => setPhase('vibe_check')} className="text-[9px] font-black uppercase text-slate-600 tracking-widest py-4">Pular para Modo Solo</button>
            </div>
          </div>
        )}

        {phase === 'vibe_check' && (
          <div className="w-full max-w-sm animate-in slide-in-from-right duration-500">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-10">Qual a<br/><span className="text-rose-500">Vibe?</span></h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'romance', name: 'Noite Romântica', icon: '🕯️' },
                { id: 'horror', name: 'Terror & Susto', icon: '💀' },
                { id: 'comedy', name: 'Só Risadas', icon: '😂' },
                { id: 'action', name: 'Ação Total', icon: '🔥' },
              ].map(v => (
                <button 
                  key={v.id}
                  onClick={() => startDiscovery(v.name)}
                  className="bg-white/5 border border-white/10 p-8 rounded-[2rem] flex items-center justify-between group hover:bg-rose-500 transition-all active:scale-95 shadow-xl"
                >
                  <div className="flex items-center gap-6">
                    <span className="text-3xl">{v.icon}</span>
                    <span className="font-black uppercase tracking-widest text-xs group-hover:text-white">{v.name}</span>
                  </div>
                  <i className="fas fa-chevron-right opacity-30 group-hover:opacity-100"></i>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'discovery' && (
          <div className="w-full h-full flex flex-col items-center">
            {loading ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="font-black uppercase tracking-widest text-[10px] animate-pulse text-rose-500">CineAI Escaneando Filmes...</p>
              </div>
            ) : (
              <div className="relative w-full h-full max-w-sm">
                {movies.length > 0 && movies.slice(currentIndex, currentIndex + 2).reverse().map((m) => (
                  <Card 
                    key={m.id}
                    movie={m}
                    isActive={currentIndex === movies.findIndex(movie => movie.id === m.id)}
                    onSwipe={handleSwipe}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Match Ceremony */}
      {match && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-500">
           <div className="relative mb-12">
              <div className="absolute inset-0 bg-rose-500 rounded-full blur-[120px] opacity-40 animate-pulse"></div>
              <img src={match.imageUrl} className="w-56 h-80 object-cover rounded-[3rem] border-4 border-rose-500 shadow-2xl relative z-10" alt="" />
           </div>
           <h2 className="text-7xl font-black italic uppercase tracking-tighter leading-none mb-4 animate-bounce">MATCH!</h2>
           <p className="text-slate-400 font-bold uppercase tracking-[0.8em] text-[10px] mb-12">Preparem a pipoca</p>
           <h3 className="text-2xl font-black uppercase italic mb-16">{match.title}</h3>
           <button onClick={() => setMatch(null)} className="w-full max-w-xs bg-rose-500 py-6 rounded-full font-black uppercase tracking-widest text-xs">Continuar</button>
        </div>
      )}

      {phase === 'session_end' && (
        <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center p-12 text-center">
           <i className="fas fa-film text-6xl text-slate-800 mb-8"></i>
           <h2 className="text-4xl font-black uppercase italic mb-4">Fim da Lista</h2>
           <p className="text-slate-500 text-xs font-bold mb-10 leading-relaxed uppercase tracking-widest">Infelizmente nenhum match por enquanto.<br/>Tente uma nova vibe!</p>
           <button onClick={() => window.location.reload()} className="bg-white text-black px-12 py-5 rounded-full font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Nova Sessão</button>
        </div>
      )}
    </div>
  );
};

export default App;
