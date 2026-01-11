import React, { useState, useEffect, useCallback } from 'react';
import { Movie, SwipeDirection, SessionPhase, SessionConfig, UserProfile } from './shared/types';
import { fetchMovies } from './services/movieService';
import { usePeer } from './hooks/usePeer';
import { storage, STORAGE_KEYS } from './services/storage';
import { movieCache } from './services/movieCache';
import { gamification } from './services/gamification';
import { soundManager } from './services/soundManager';

// Components
import Header from './components/layout/Header';
import Splash from './components/phases/Splash';
import ProfileSetup from './components/phases/ProfileSetup';
import Pairing from './components/phases/Pairing';
import VibeCheck from './components/phases/VibeCheck';
import Discovery from './components/phases/Discovery';
import Watchlist from './components/phases/Watchlist';
import MatchOverlay from './components/ui/MatchOverlay';
import EmptyState from './components/ui/EmptyState';
import SkeletonCard from './components/ui/SkeletonCard';
import ConfirmDialog from './components/ui/ConfirmDialog';
import StatsModal from './components/ui/StatsModal';
import SettingsModal from './components/ui/SettingsModal';

declare var confetti: any;

const App: React.FC = () => {
  // --- Estados do App ---
  const [phase, setPhase] = useState<SessionPhase>('splash');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [isTyping, setIsTyping] = useState(false); // partner typing
  const [reactions, setReactions] = useState<{ id: number, emoji: string }[]>([]);

  // --- Estados de Cinema ---
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [partnerLikes, setPartnerLikes] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [match, setMatch] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);

  // --- Hooks ---
  const {
    peerId,
    connStatus,
    connectToPartner,
    sendMessage,
    lastMessage,
    resetConnection
  } = usePeer(profile);

  // --- Inicialização & Persistência ---
  useEffect(() => {
    const savedProfile = storage.get(STORAGE_KEYS.PROFILE, null);
    const savedWatchlist = storage.get(STORAGE_KEYS.WATCHLIST, []);
    const savedIndex = storage.get(STORAGE_KEYS.CURRENT_INDEX, 0);

    if (savedProfile) setProfile(savedProfile);
    if (savedWatchlist) setWatchlist(savedWatchlist);
    if (savedIndex) setCurrentIndex(savedIndex);

    setTimeout(() => {
      setPhase(savedProfile ? 'pairing' : 'profile_setup');
    }, 2000);
  }, []);

  // --- Invite Link Logic ---
  useEffect(() => {
    if (phase === 'pairing' && profile) {
      const params = new URLSearchParams(window.location.search);
      const inviteId = params.get('peer');
      if (inviteId && inviteId !== peerId) {
        // Clear param to avoid loop? Or just connect.
        console.log("Found invite link, connecting to:", inviteId);
        connectToPartner(inviteId);
      }
    }
  }, [phase, profile, peerId, connectToPartner]);


  // --- P2P Message Handling ---
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'HANDSHAKE':
        setPartner(lastMessage.profile);
        setPhase('vibe_check');
        break;
      case 'REACTION':
        triggerReaction(lastMessage.emoji, false);
        break;
      case 'TYPING_STATUS':
        setIsTyping(lastMessage.isTyping);
        break;
      case 'START_SESSION':
        setMovies(lastMessage.movies);
        setPhase('discovery');
        break;
      case 'SWIPE_UPDATE':
        if (lastMessage.direction === SwipeDirection.RIGHT || lastMessage.direction === SwipeDirection.UP) {
          setPartnerLikes(prev => {
            const newLikes = [...prev, lastMessage.movieId];
            // Late join match check? 
            // Ideally we check match whenever myLikes or partnerLikes changes.
            return newLikes;
          });
        }
        break;
    }
  }, [lastMessage]);

  // Check for Match when Likes update
  useEffect(() => {
    if (phase !== 'discovery') return;

    // Check if any of my likes are in partner likes
    // But we only want to trigger match if it wasn't triggered before?
    // Actually, usually we trigger on swap.
    // If I just swiped right, I check partner likes.
    // If partner swiped right (received message), I check my likes.

    // optimization: only check the last addition?
    // For now simple intersection check on every update is fine for < 15 items.

    const matches = movies.filter(m => myLikes.includes(m.id) && partnerLikes.includes(m.id));
    if (matches.length > 0) {
      // Find the most recent one or the one not in watchlist yet?
      // Simplified: if current movie satisfies condition.

      matches.forEach(m => {
        // Check if already in watchlist to avoid double trigger?
        // Actually triggerMatch handles UI.

        // But we want to trigger ONLY when the event happens.
        // So this Effect might be too broad.
        // Let's rely on handleSwipe and existing Message handler.
      });
    }
  }, [myLikes, partnerLikes, movies, phase]);

  // Special handler for partner swipe triggering match
  useEffect(() => {
    if (lastMessage?.type === 'SWIPE_UPDATE' &&
      (lastMessage.direction === SwipeDirection.RIGHT || lastMessage.direction === SwipeDirection.UP)) {

      if (myLikes.includes(lastMessage.movieId)) {
        const movie = movies.find(m => m.id === lastMessage.movieId);
        if (movie) triggerMatch(movie);
      }
    }
  }, [lastMessage, myLikes, movies]);


  // --- Ações ---
  const handleProfileComplete = (p: UserProfile) => {
    setProfile(p);
    storage.set(STORAGE_KEYS.PROFILE, p);
    setPhase('pairing');
  };

  const startSession = async (vibeName: string) => {
    setLoading(true);

    // Check cache first
    const cached = movieCache.get(vibeName);
    if (cached && cached.length > 0) {
      setMovies(cached);
      sendMessage({ type: 'START_SESSION', movies: cached, config: { vibe: vibeName, maxTime: 120 } });
      setPhase('discovery');
      setLoading(false);
      return;
    }

    const actualConfig: SessionConfig = { vibe: vibeName, maxTime: 120 };
    const fetched = await fetchMovies(actualConfig);

    // Cache the results
    if (fetched.length > 0) {
      movieCache.set(vibeName, fetched);
    }

    setMovies(fetched);
    sendMessage({ type: 'START_SESSION', movies: fetched, config: actualConfig });
    setPhase('discovery');
    setLoading(false);
  };

  const handleSwipe = useCallback((direction: SwipeDirection) => {
    const movie = movies[currentIndex];
    if (!movie) return;

    // Record swipe for gamification
    gamification.recordSwipe();

    if (direction !== SwipeDirection.LEFT) {
      setMyLikes(prev => [...prev, movie.id]);
      if (partnerLikes.includes(movie.id)) {
        triggerMatch(movie);
      }

      // Sound effects
      if (direction === SwipeDirection.UP) {
        soundManager.play('superlike');
        gamification.recordSuperLike();
      } else {
        soundManager.play('swipe');
      }
    }

    sendMessage({ type: 'SWIPE_UPDATE', movieId: movie.id, direction });

    if (navigator.vibrate) navigator.vibrate(direction === SwipeDirection.LEFT ? 10 : 30);

    if (currentIndex + 1 >= movies.length) {
      // End of list?
      // setPhase('session_end'); 
      // or just stay there.
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [movies, currentIndex, partnerLikes, sendMessage]);

  const triggerMatch = (movie: Movie) => {
    setMatch(movie);
    setWatchlist(prev => {
      const updated = [...prev, movie];
      storage.set(STORAGE_KEYS.WATCHLIST, updated);
      return updated;
    });

    // Gamification
    gamification.recordMatch(movie.genres);
    soundManager.play('match');

    if (typeof confetti !== 'undefined') {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#f43f5e', '#ffffff'] });
    }
  };

  const triggerReaction = (emoji: string, send = true) => {
    const id = Date.now();
    setReactions(prev => [...prev, { id, emoji }]);
    if (send) sendMessage({ type: 'REACTION', emoji });
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2500);
  };

  // --- Render ---
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

      <Header
        connStatus={connStatus}
        profile={profile}
        partner={partner}
        onOpenWatchlist={() => setPhase('watchlist')}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full relative">

        {phase === 'splash' && <Splash />}

        {phase === 'profile_setup' && <ProfileSetup onComplete={handleProfileComplete} />}

        {phase === 'pairing' && (
          <Pairing
            myPeerId={peerId}
            onConnect={connectToPartner}
            onSkip={() => setPhase('vibe_check')}
          />
        )}

        {phase === 'vibe_check' && (
          <VibeCheck
            onStartSession={startSession}
            onTyping={(typing) => sendMessage({ type: 'TYPING_STATUS', isTyping: typing })}
            isPartnerTyping={isTyping}
          />
        )}

        {phase === 'discovery' && (
          <Discovery
            movies={movies}
            currentIndex={currentIndex}
            loading={loading}
            onSwipe={handleSwipe}
            onReaction={triggerReaction}
          />
        )}

        {phase === 'watchlist' && (
          <Watchlist
            watchlist={watchlist}
            onBack={() => setPhase(movies.length > 0 ? 'discovery' : 'vibe_check')}
            onRemove={(id) => {
              setWatchlist(prev => {
                const updated = prev.filter(m => m.id !== id);
                localStorage.setItem('cm_watchlist', JSON.stringify(updated));
                return updated;
              });
            }}
          />
        )}
      </main>

      {match && <MatchOverlay match={match} onClose={() => setMatch(null)} />}
    </div>
  );
};

export default App;
