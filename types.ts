
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
  | 'session_end';

export interface SessionConfig {
  vibe: string;
  maxTime: number;
}

export type P2PMessage = 
  | { type: 'HANDSHAKE', profile: UserProfile }
  | { type: 'SWIPE_UPDATE', movieId: string, direction: SwipeDirection }
  | { type: 'START_SESSION', movies: Movie[], config: SessionConfig }
  | { type: 'SYNC_INDEX', index: number };
