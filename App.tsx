
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Movie, SwipeDirection, SessionPhase, SessionConfig, P2PMessage, UserProfile } from './types';
import { fetchMovies } from './services/movieService';
import Card from './components/Card';

declare var Peer: any;

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb&backgroundColor=d1d4f9",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Eden&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Lily&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=ffdfbf",
];

const BACK_POSTERS = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1200",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1200",
  "https://images.unsplash.com/photo-1542204172-3c1399430260?q=80&w=1200",
];

const App: React.FC = () => {
  const [phase, setPhase] = useState<SessionPhase>('splash');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [partnerLikes, setPartnerLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [matchCeremony, setMatchCeremony] = useState<Movie | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [peerId, setPeerId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);

  const [sessionConfig, setSessionConfig] = useState<SessionConfig>({
    mode: 'tonight',
    maxTime: 120,
    energy: 'low',
    vibe: 'romantic',
    courage: 3,
    dealbreakers: [],
    safety: { noGore: true, noSex: false }
  });

  const peerRef = useRef<any>(null);
  const connectionRef = useRef<any>(null);

  // Initialize PeerJS
  useEffect(() => {
    if (typeof Peer === 'undefined') return;

    const savedProfile = localStorage.getItem('cm_profile');
    const initialProfile = savedProfile ? JSON.parse(savedProfile) : null;
    if (initialProfile) setProfile(initialProfile);

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id: string) => {
      setPeerId(id);
    });

    peer.on('connection', (conn: any) => {
      connectionRef.current = conn;
      setupConnection(conn);
    });

    return () => {
      peer.destroy();
    };
  }, []);

  const setupConnection = (conn: any) => {
    conn.on('open', () => {
      setIsConnecting(false);
      if (profile) {
        conn.send({ type: 'HEARTBEAT', profile });
      }
    });

    conn.on('data', (data: P2PMessage) => {
      if (data.type === 'HEARTBEAT') {
        setPartner(data.profile);
        setPhase('vibe_check');
      }
      if (data.type === 'SWIPE' && (data.direction === SwipeDirection.RIGHT || data.direction === SwipeDirection.UP)) {
        setPartnerLikes(prev => [...new Set([...prev, data.movieId])]);
      }
      if (data.type === 'READY_TO_START') {
        setSessionConfig(data.config);
        startDiscovery(false);
      }
    });

    conn.on('close', () => {
      setPartner(null);
      setPhase('pairing');
    });
  };

  const connectToPartner = () => {
    if (!targetId || !peerRef.current) return;
    setIsConnecting(true);
    const conn = peerRef.current.connect(targetId);
    connectionRef.current = conn;
    setupConnection(conn);
  };

  useEffect(() => {
    if (phase === 'splash') {
      const timer = setTimeout(() => {
        const saved = localStorage.getItem('cm_profile');
        const onboarded = localStorage.getItem('cm_onboarded');
        if (!saved) setPhase('profile_setup');
        else if (!onboarded) setPhase('onboarding');
        else setPhase('pairing');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const startDiscovery = async (isInitiator: boolean = true) => {
    setLoading(true);
    try {
      if (isInitiator && connectionRef.current) {
        connectionRef.current.send({ type: 'READY_TO_START', config: sessionConfig });
      }
      const data = await fetchMovies([], sessionConfig);
      setMovies(data);
      setPhase('discovery');
    } catch (e) {
      alert("Erro ao buscar filmes. Verifique sua chave API.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    const movie = movies[currentIndex];
    if (!movie) return;

    if (connectionRef.current) {
      connectionRef.current.send({ type: 'SWIPE', movieId: movie.id, direction });
    }

    if (direction === SwipeDirection.RIGHT || direction === SwipeDirection.UP) {
      setLikedIds(prev => [...prev, movie.id]);
      if (partnerLikes.includes(movie.id)) {
        setMatchCeremony(movie);
      }
    }

    if (currentIndex + 1 >= movies.length) setPhase('decision');
    else setCurrentIndex(prev => prev + 1);
  }, [movies, currentIndex, partnerLikes]);

  const Logo = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => (
    <div className={`flex items-center gap-4 font-black italic tracking-tighter uppercase ${size === 'lg' ? 'text-7xl' : size === 'md' ? 'text-3xl' : 'text-xl'}`}>
      <div className={`${size === 'lg' ? 'w-24 h-24' : 'w-10 h-10'} bg-gradient-to-br from-rose-500 to-rose-700 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-rose-500/30 rotate-12 transition-all hover:rotate-0`}>
        <i className="fas fa-play ml-1"></i>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-white">Cine</span>
        <span className="text-rose-500">Match</span>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-950 text-white overflow-hidden flex flex-col font-sans select-none relative">
      
      {/* Background FX */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-950/90 z-10 backdrop-blur-md"></div>
        <div className="grid grid-cols-2 grid-rows-2 h-full gap-10 p-20 blur-[120px] opacity-30 scale-125">
          {BACK_POSTERS.map((p, i) => (
            <div key={i} className="w-full h-full bg-cover bg-center rounded-full" style={{ backgroundImage: `url(${p})` }}></div>
          ))}
        </div>
      </div>

      <main className="flex-1 relative z-10 flex flex-col max-w-md mx-auto w-full h-full">
        
        {phase === 'splash' && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-1000">
            <Logo size="lg" />
            <div className="mt-20 flex flex-col items-center gap-6">
              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-rose-500 w-full animate-progress"></div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-500 animate-pulse">Iniciando Projetores</span>
            </div>
          </div>
        )}

        {phase === 'profile_setup' && (
          <div className="h-full flex flex-col p-10 justify-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2 leading-none">Quem é <span className="text-rose-500">Você?</span></h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-12 italic">Sua identidade no cinema</p>
            
            <div className="mb-12">
              <label className="text-[10px] font-black uppercase text-slate-500 mb-6 block tracking-widest">Avatar do Match</label>
              <div className="grid grid-cols-4 gap-4">
                {AVATARS.map((a, i) => (
                  <button 
                    key={i} 
                    onClick={() => setProfile({ name: profile?.name || '', avatar: a })}
                    className={`w-full aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-500 ${profile?.avatar === a ? 'border-rose-500 scale-110 shadow-2xl shadow-rose-500/40' : 'border-white/5 opacity-30 hover:opacity-100'}`}
                  >
                    <img src={a} className="w-full h-full" alt="avatar" />
                  </button>
                ))}
              </div>
            </div>

            <input 
              value={profile?.name || ''}
              onChange={(e) => setProfile(p => ({ avatar: p?.avatar || AVATARS[0], name: e.target.value }))}
              placeholder="Digite seu nome..."
              className="w-full bg-slate-900/60 backdrop-blur-3xl border border-white/5 p-7 rounded-[2rem] text-sm font-black focus:outline-none focus:border-rose-500 transition shadow-2xl mb-12"
            />

            <button 
              onClick={() => {
                if (profile?.name) {
                  localStorage.setItem('cm_profile', JSON.stringify(profile));
                  setPhase('onboarding');
                }
              }}
              disabled={!profile?.name}
              className="w-full bg-white text-black font-black py-7 rounded-[2.5rem] shadow-2xl active:scale-95 transition uppercase tracking-widest text-xs disabled:opacity-10"
            >
              Próximo
            </button>
          </div>
        )}

        {phase === 'pairing' && (
          <div className="h-full flex flex-col p-10 justify-center items-center animate-in zoom-in duration-700">
            <Logo />
            <div className="mt-16 mb-16 text-center">
              <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4 leading-none">Parear <span className="text-rose-500">Casal</span></h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">Mostre seu ID ou digite o do parceiro</p>
            </div>

            <div className="w-full bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 mb-8 text-center shadow-2xl">
              <span className="text-[10px] font-black uppercase text-slate-500 mb-4 block tracking-widest">Seu ID de Pareamento</span>
              <div className="bg-black/40 p-4 rounded-2xl font-mono text-xs font-bold text-rose-500 border border-rose-500/20 mb-6">
                {peerId || 'Gerando...'}
              </div>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${peerId}&color=f43f5e&bgcolor=00000000`} 
                className="w-40 h-40 mx-auto rounded-3xl border-4 border-white/5 p-2 bg-white/5" 
                alt="QR ID"
              />
            </div>

            <div className="w-full space-y-4">
              <input 
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="ID do Parceiro..."
                className="w-full bg-slate-900/40 border border-white/5 p-6 rounded-[2rem] text-center font-mono text-xs focus:border-rose-500 transition outline-none"
              />
              <button 
                onClick={connectToPartner}
                disabled={!targetId || isConnecting}
                className="w-full bg-rose-500 text-white font-black py-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isConnecting ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-link"></i>}
                {isConnecting ? 'Conectando...' : 'Conectar com Parceiro'}
              </button>
            </div>
            
            <button onClick={() => setPhase('vibe_check')} className="mt-8 text-slate-500 font-black uppercase text-[9px] tracking-[0.4em] hover:text-white transition-all">Pular para Modo Solo</button>
          </div>
        )}

        {phase === 'vibe_check' && (
          <div className="h-full flex flex-col p-10 justify-center animate-in slide-in-from-right duration-700">
            <header className="mb-12 flex items-center gap-6">
              <img src={profile?.avatar} className="w-16 h-16 rounded-3xl border-2 border-rose-500 shadow-2xl" />
              <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
              {partner && <img src={partner.avatar} className="w-16 h-16 rounded-3xl border-2 border-slate-700 opacity-50" />}
            </header>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-3 leading-none">Vibe da <span className="text-rose-500">Noite.</span></h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-12 italic">O que vocês estão sentindo?</p>
            
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'romantic', label: 'Romântico', emoji: '🕯️', color: 'from-pink-600' },
                { id: 'scary', label: 'Terror', emoji: '💀', color: 'from-purple-900' },
                { id: 'action', label: 'Ação', emoji: '🔥', color: 'from-orange-600' },
              ].map(v => (
                <button 
                  key={v.id}
                  onClick={() => { setSessionConfig(p => ({ ...p, vibe: v.id })); setPhase('setup'); }}
                  className={`relative overflow-hidden p-8 rounded-[2.5rem] flex items-center justify-between border border-white/5 bg-gradient-to-r ${v.color} to-slate-900 shadow-2xl active:scale-95 transition-all`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-4xl">{v.emoji}</span>
                    <span className="font-black uppercase text-sm tracking-widest">{v.label}</span>
                  </div>
                  <i className="fas fa-chevron-right opacity-30"></i>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'setup' && (
          <div className="h-full flex flex-col p-10 justify-center animate-in fade-in duration-700">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4 leading-none">Tudo <span className="text-rose-500">Pronto?</span></h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-16">Configurando a experiência do casal</p>
            
            <div className="space-y-12 mb-20">
               <section>
                 <label className="text-[10px] font-black uppercase text-slate-500 mb-6 block tracking-widest">Duração Máxima</label>
                 <div className="flex justify-between items-center bg-slate-900/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/5 shadow-inner">
                    <button onClick={() => setSessionConfig(p => ({...p, maxTime: Math.max(60, p.maxTime - 30)}))} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-rose-500 active:scale-75 transition"><i className="fas fa-minus"></i></button>
                    <span className="text-4xl font-black italic">{sessionConfig.maxTime}m</span>
                    <button onClick={() => setSessionConfig(p => ({...p, maxTime: p.maxTime + 30}))} className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-rose-500 active:scale-75 transition"><i className="fas fa-plus"></i></button>
                 </div>
               </section>
            </div>

            <button onClick={() => startDiscovery(true)} className="w-full bg-rose-500 text-white font-black py-8 rounded-[3rem] shadow-[0_20px_50px_rgba(244,63,94,0.3)] active:scale-95 transition uppercase tracking-widest text-xs flex items-center justify-center gap-4">
              {loading ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-film"></i>}
              {loading ? 'CineAI buscando...' : 'Começar Sessão'}
            </button>
          </div>
        )}

        {phase === 'discovery' && (
          <div className="h-full relative overflow-hidden flex flex-col">
            <header className="p-8 z-50 flex justify-between items-center">
               <div className="bg-black/60 backdrop-blur-3xl border border-white/10 px-5 py-3 rounded-full flex items-center gap-4 shadow-2xl">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{currentIndex + 1} / {movies.length} FILMES</span>
               </div>
               {partner && (
                 <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                    <img src={partner.avatar} className="w-6 h-6 rounded-full border border-slate-700" alt="partner" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{partner.name} ONLINE</span>
                 </div>
               )}
            </header>

            <div className="flex-1 relative mb-32">
              {movies.slice(currentIndex, currentIndex + 2).reverse().map((movie) => (
                <Card 
                  key={movie.id} 
                  movie={movie} 
                  isActive={movies[currentIndex]?.id === movie.id} 
                  onSwipe={handleSwipe} 
                />
              ))}
            </div>

            <footer className="p-10 pb-16 flex justify-between items-center z-50">
                <button onClick={() => handleSwipe(SwipeDirection.LEFT)} className="w-20 h-20 bg-slate-950 border border-white/10 rounded-full flex items-center justify-center text-red-500 shadow-2xl active:scale-75 transition-all hover:bg-red-500/10">
                  <i className="fas fa-times text-2xl"></i>
                </button>
                <button onClick={() => handleSwipe(SwipeDirection.RIGHT)} className="w-20 h-20 bg-slate-950 border border-white/10 rounded-full flex items-center justify-center text-green-500 shadow-2xl active:scale-75 transition-all hover:bg-green-500/10">
                  <i className="fas fa-heart text-2xl"></i>
                </button>
            </footer>
          </div>
        )}

        {phase === 'decision' && (
          <div className="h-full flex flex-col p-10 overflow-y-auto pb-40 animate-in slide-in-from-bottom-12">
             <div className="mb-12 text-center">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">Seus Matches.</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.6em]">Interesses mútuos</p>
             </div>
             
             <div className="space-y-6">
                {likedIds.length > 0 ? likedIds.map(id => {
                  const m = movies.find(movie => movie.id === id);
                  if (!m) return null;
                  const isMutual = partnerLikes.includes(id);
                  return (
                    <div key={m.id} className={`p-6 rounded-[3rem] border transition-all flex items-center gap-6 ${isMutual ? 'bg-rose-500/10 border-rose-500/20 shadow-2xl' : 'bg-slate-900/40 border-white/5 opacity-80'}`}>
                       <img src={m.imageUrl} className="w-20 h-28 object-cover rounded-[1.5rem] shadow-2xl" alt="poster" />
                       <div className="flex-1">
                          <h3 className="font-black text-sm uppercase leading-tight mb-2 tracking-tight">{m.title}</h3>
                          <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest">
                             <span className="text-yellow-500">★ {m.rating}</span>
                             {isMutual && <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[6px]">MUTUAL MATCH</span>}
                          </div>
                       </div>
                       <button onClick={() => setPhase('result')} className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl active:scale-90 transition"><i className="fas fa-play ml-1"></i></button>
                    </div>
                  );
                }) : (
                  <div className="text-center py-20 opacity-20">
                    <i className="fas fa-heart-crack text-6xl mb-6"></i>
                    <p className="font-black uppercase text-[10px] tracking-widest">Nenhum like ainda</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {phase === 'onboarding' && (
          <div className="h-full flex flex-col p-12 justify-center items-center text-center animate-in zoom-in duration-700">
            <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center text-4xl text-rose-500 mb-12 border border-rose-500/20 shadow-2xl">
              <i className={['fas fa-link', 'fas fa-heart', 'fas fa-popcorn'][onboardingStep]}></i>
            </div>
            <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-6 leading-none">
              {['Conecte', 'Escolha', 'Relaxe'][onboardingStep]}
            </h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-16 opacity-80 max-w-xs mx-auto">
              {[
                "Use o QR Code para conectar com seu parceiro em tempo real.",
                "Deslize para a direita nos filmes que quer ver. O match é instantâneo!",
                "Deixe que a CineAI resolva o impasse da noite para vocês."
              ][onboardingStep]}
            </p>
            
            <div className="flex gap-4 mb-20">
              {[0, 1, 2].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${onboardingStep === i ? 'w-12 bg-rose-500' : 'w-2 bg-slate-800'}`}></div>
              ))}
            </div>

            <button 
              onClick={() => onboardingStep < 2 ? setOnboardingStep(onboardingStep + 1) : (localStorage.setItem('cm_onboarded', 'true'), setPhase('pairing'))}
              className="w-full bg-white text-black font-black py-7 rounded-[2.5rem] shadow-2xl active:scale-95 transition uppercase tracking-widest text-[10px]"
            >
              {onboardingStep === 2 ? "Bora lá!" : "Continuar"}
            </button>
          </div>
        )}

      </main>

      {/* Match Ceremony */}
      {matchCeremony && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-[60px] flex items-center justify-center p-12 text-center animate-in fade-in duration-500">
           <div className="absolute inset-0 overflow-hidden opacity-30">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1500px] h-[1500px] bg-rose-600 rounded-full blur-[400px] animate-pulse"></div>
           </div>
           <div className="relative z-10 animate-in bounce-in duration-1000">
              <div className="flex justify-center gap-6 mb-16">
                <img src={matchCeremony.imageUrl} className="w-40 h-60 bg-slate-800 rounded-[2.5rem] rotate-[-8deg] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-2 border-white/20" alt="match" />
                <img src={matchCeremony.imageUrl} className="w-40 h-60 bg-slate-800 rounded-[2.5rem] rotate-[8deg] shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-2 border-white/20" alt="match" />
              </div>
              <h2 className="text-7xl font-black italic tracking-tighter text-white mb-4 uppercase leading-none drop-shadow-2xl">IT'S A<br/><span className="text-rose-500 text-8xl">MATCH!</span></h2>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[1em] mb-20 opacity-80">Conexão CineAI</p>
              <button onClick={() => setMatchCeremony(null)} className="w-full bg-rose-500 text-white font-black py-8 rounded-[3rem] shadow-2xl active:scale-95 transition uppercase tracking-widest text-xs">Continuar Match</button>
           </div>
        </div>
      )}

      {phase === 'result' && (
           <div className="fixed inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-700">
              <div className="w-32 h-32 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-6xl mb-12 shadow-[0_0_120px_rgba(34,197,94,0.4)] animate-bounce">
                 <i className="fas fa-check"></i>
              </div>
              <h2 className="text-6xl font-black italic tracking-tighter uppercase mb-6 leading-tight">Filme<br/><span className="text-rose-500">Pronto!</span></h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.6em] mb-12 leading-relaxed">Apague as luzes e <br/>pegue a pipoca.</p>
              <button onClick={() => window.location.reload()} className="bg-white text-black px-16 py-6 rounded-[3rem] font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all">Nova Sessão</button>
           </div>
        )}
    </div>
  );
};

export default App;
