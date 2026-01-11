
export interface UserProfile {
  name: string;
  avatar: string;
  movieDNA?: string[]; // Gêneros favoritos
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
  vibe: 'light' | 'neutral' | 'intense';
  aiReasoning?: string;
  streamingOn?: string[];
  youtubeVideoId?: string;
  trailerUrl: string;
  trivia?: string;
  snackSuggestion?: string;
  compatibilityScore?: number;
  warnings: {
    gore: boolean;
    sex: boolean;
    violence: boolean;
  };
}

export enum SwipeDirection {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'super',
  NEUTRAL = 'maybe'
}

export type SessionPhase = 'splash' | 'profile_setup' | 'onboarding' | 'vibe_check' | 'pairing' | 'setup' | 'discovery' | 'decision' | 'result';

export interface SessionConfig {
  mode: 'standard' | 'tonight' | 'surprise';
  maxTime: number;
  energy: 'low' | 'high';
  courage: number;
  vibe: string;
  dealbreakers: string[];
  safety: {
    noGore: boolean;
    noSex: boolean;
  };
}

export type P2PMessage = 
  | { type: 'HEARTBEAT', profile: UserProfile }
  | { type: 'SWIPE', movieId: string, direction: SwipeDirection }
  | { type: 'MATCH', movieId: string }
  | { type: 'SYNC_PHASE', phase: SessionPhase }
  | { type: 'READY_TO_START', config: SessionConfig };
