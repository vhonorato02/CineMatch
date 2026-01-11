import React, { useState, useEffect, useCallback } from 'react';
import { Movie, SwipeDirection, SessionPhase, SessionConfig, UserProfile } from './shared/types';
import { fetchMovies } from './services/movieService';
import { usePeer } from './hooks/usePeer';
import { storage, STORAGE_KEYS } from './services/storage';
import { movieCache } from './services/movieCache';
import { gamification } from './services/gamification';
import { soundManager } from './services/soundManager';
import { historyManager } from './services/historyManager';

// Noir Components
import NoirHeader from './components/layout/NoirHeader';
import NoirSplash from './components/phases/NoirSplash';
import NoirProfileSetup from './components/phases/NoirProfileSetup';
import NoirPairing from './components/phases/NoirPairing';
import NoirVibeCheck from './components/phases/NoirVibeCheck';
import NoirDiscovery from './components/phases/NoirDiscovery';
import NoirWatchlist from './components/phases/NoirWatchlist';
import NoirMatchOverlay from './components/ui/NoirMatchOverlay';
import NoirStatsModal from './components/ui/NoirStatsModal';
import NoirSettingsModal from './components/ui/NoirSettingsModal';
import MovieDetailsModal from './components/ui/MovieDetailsModal';
import NotesModal from './components/ui/NotesModal';

declare var confetti: any;

const App: React.FC = () => {
  // --- Estados do App ---
  const [phase, setPhase] = useState<SessionPhase>('splash');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerReaction, setPartnerReaction] = useState<string | null>(null);

  // --- Estados de Cinema ---
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myLikes, setMyLikes] = useState<string[]>([]);
  const [partnerLikes, setPartnerLikes] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [match, setMatch] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);

  // --- UI States ---
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieForNotes, setMovieForNotes] = useState<Movie | null>(null);

  // --- P2P Hook ---
  const {
    peerId,
    connStatus,
    connectToPartner,
    sendMessage,
    lastMessage,
  } = usePeer();

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
    }, 2500);
  }, []);

  // --- Mensagens P2P ---
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'HANDSHAKE':
        setPartner(lastMessage.profile);
        soundManager.play('notification');
        break;

      case 'SWIPE_UPDATE':
        if (lastMessage.direction !== SwipeDirection.LEFT) {
          setPartnerLikes(prev => [...prev, lastMessage.movieId]);
          const movie = movies.find(m => m.id === lastMessage.movieId);
          if (movie && myLikes.includes(lastMessage.movieId)) {
            triggerMatch(movie);
          }
        }
        break;

      case 'START_SESSION':
        setMovies(lastMessage.movies);
        setPhase('discovery');
        break;

      case 'REACTION':
        setPartnerReaction(lastMessage.emoji);
        setTimeout(() => setPartnerReaction(null), 2000);
        break;

      case 'TYPING_STATUS':
        setIsTyping(lastMessage.isTyping);
        break;
    }
  }, [lastMessage, myLikes, movies]);

  // --- Enviar Handshake ---
  useEffect(() => {
    if (profile && connStatus === 'connected') {
      sendMessage({ type: 'HANDSHAKE', profile });
    }
  }, [profile, connStatus, sendMessage]);

  // --- Ações ---
  const handleProfileComplete = (p: UserProfile) => {
    setProfile(p);
    storage.set(STORAGE_KEYS.PROFILE, p);
    setPhase('pairing');
  };

  const handleConnect = (targetId: string) => {
    connectToPartner(targetId);
  };

  const handleSkipPairing = () => {
    setPhase('vibe_check');
  };

  const startSession = async (vibeName: string) => {
    setLoading(true);

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

    // Record for history
    historyManager.addSwipe(movie, direction);

    // Gamification
    gamification.recordSwipe();

    if (direction !== SwipeDirection.LEFT) {
      setMyLikes(prev => [...prev, movie.id]);
      if (partnerLikes.includes(movie.id)) {
        triggerMatch(movie);
      }

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
      setPhase('watchlist');
    } else {
      setCurrentIndex(prev => prev + 1);
      storage.set(STORAGE_KEYS.CURRENT_INDEX, currentIndex + 1);
    }
  }, [movies, currentIndex, partnerLikes, sendMessage]);

  const handleReaction = (emoji: string) => {
    sendMessage({ type: 'REACTION', emoji });
  };

  const triggerMatch = (movie: Movie) => {
    setMatch(movie);
    setWatchlist(prev => {
      const updated = [...prev, movie];
      storage.set(STORAGE_KEYS.WATCHLIST, updated);
      return updated;
    });

    gamification.recordMatch(movie.genres);
    soundManager.play('match');

    if (typeof confetti !== 'undefined') {
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: ['#ffffff', '#000000'] });
    }
  };

  const handleRewind = () => {
    const last = historyManager.rewind();
    if (last && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      soundManager.play('notification');
    }
  };

  // --- Render ---
  return (
    <div className="w-full h-screen overflow-hidden bg-black text-white">
      {/* Header - shown on most phases */}
      {!['splash', 'profile_setup'].includes(phase) && (
        <NoirHeader
          connStatus={connStatus}
          profile={profile}
          partner={partner}
          onOpenWatchlist={() => setShowWatchlist(true)}
          onOpenStats={() => setShowStats(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Main Content */}
      <div className={!['splash', 'profile_setup'].includes(phase) ? 'h-[calc(100vh-73px)]' : 'h-screen'}>
        {phase === 'splash' && <NoirSplash />}

        {phase === 'profile_setup' && (
          <NoirProfileSetup onComplete={handleProfileComplete} />
        )}

        {phase === 'pairing' && (
          <NoirPairing
            myPeerId={peerId || ''}
            onConnect={handleConnect}
            onSkip={handleSkipPairing}
          />
        )}

        {phase === 'vibe_check' && (
          <NoirVibeCheck
            onStartSession={startSession}
            onTyping={(typing) => sendMessage({ type: 'TYPING_STATUS', isTyping: typing })}
            isPartnerTyping={isTyping}
          />
        )}

        {phase === 'discovery' && movies.length > 0 && (
          <NoirDiscovery
            movies={movies}
            currentIndex={currentIndex}
            onSwipe={handleSwipe}
            onReaction={handleReaction}
            partnerReaction={partnerReaction}
          />
        )}

        {phase === 'watchlist' || (phase === 'discovery' && currentIndex >= movies.length) ? (
          <NoirWatchlist
            movies={watchlist}
            onClose={() => setPhase('vibe_check')}
            onMovieClick={(movie) => setSelectedMovie(movie)}
          />
        ) : null}
      </div>

      {/* Modals */}
      {match && (
        <NoirMatchOverlay
          movieTitle={match.title}
          onClose={() => setMatch(null)}
        />
      )}

      {showWatchlist && (
        <div className="fixed inset-0 z-[2000]">
          <NoirWatchlist
            movies={watchlist}
            onClose={() => setShowWatchlist(false)}
            onMovieClick={(movie) => {
              setSelectedMovie(movie);
              setShowWatchlist(false);
            }}
          />
        </div>
      )}

      {showStats && (
        <NoirStatsModal onClose={() => setShowStats(false)} />
      )}

      {showSettings && (
        <NoirSettingsModal onClose={() => setShowSettings(false)} />
      )}

      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {movieForNotes && profile && (
        <NotesModal
          movie={movieForNotes}
          userName={profile.name}
          onClose={() => setMovieForNotes(null)}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[5000] bg-black/95 flex items-center justify-center">
          <div className="text-center">
            <div className="noir-loading mb-4"></div>
            <p className="text-sm text-gray-600">Finding films...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
