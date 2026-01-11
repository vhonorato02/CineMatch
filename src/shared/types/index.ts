
export interface UserProfile {
  name: string;
  avatar: string;
}

export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: number;
  genres: string[];
  description: string;
  imageUrl: string;
  duration: number;
  youtubeId: string;
  compatibility: number;
  whyThis?: string; // Razão sugerida pela IA
}

export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'super'
}

export type SessionPhase = 
  | 'splash' 
  | 'profile_setup' 
  | 'pairing' 
  | 'vibe_check' 
  | 'discovery' 
  | 'match_found'
  | 'watchlist'
  | 'session_end';

export interface SessionConfig {
  vibe: string;
  maxTime: number;
  customVibe?: string;
}

export type P2PMessage = 
  | { type: 'HANDSHAKE', profile: UserProfile }
  | { type: 'SWIPE_UPDATE', movieId: string, direction: SwipeDirection }
  | { type: 'START_SESSION', movies: Movie[], config: SessionConfig }
  | { type: 'REACTION', emoji: string }
  | { type: 'TYPING_STATUS', isTyping: boolean }
  | { type: 'HEARTBEAT' }
  | { type: 'SYNC_PROGRESS', index: number };
