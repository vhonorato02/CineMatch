// Movie cache service to avoid re-fetching same vibe

import { Movie } from '../shared/types';

interface CachedMovies {
    vibe: string;
    movies: Movie[];
    timestamp: number;
}

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const CACHE_KEY = 'cm_movie_cache';

export const movieCache = {
    get(vibe: string): Movie[] | null {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const data: CachedMovies = JSON.parse(cached);

            // Check if cache is for same vibe and not expired
            if (data.vibe === vibe && Date.now() - data.timestamp < CACHE_DURATION) {
                console.log('Using cached movies for vibe:', vibe);
                return data.movies;
            }

            return null;
        } catch (error) {
            console.error('Error reading movie cache:', error);
            return null;
        }
    },

    set(vibe: string, movies: Movie[]): void {
        try {
            const data: CachedMovies = {
                vibe,
                movies,
                timestamp: Date.now(),
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error writing movie cache:', error);
        }
    },

    clear(): void {
        localStorage.removeItem(CACHE_KEY);
    },
};
