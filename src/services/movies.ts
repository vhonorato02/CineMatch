// TMDB API integration (no key needed for popular movies)
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_KEY = '8265bd1679663a7ea12ac168da84d2e8' // Public demo key
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

export interface Movie {
    id: string
    title: string
    year: number
    rating: number
    genres: string[]
    poster: string
    description: string
    runtime?: number
    providers?: { name: string; logo: string }[]
}

const GENRE_MAP: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV',
    53: 'Thriller', 10752: 'War', 37: 'Western'
}

// Helper to get providers and runtime in parallel
async function enrichMovie(movie: any): Promise<Movie> {
    try {
        const detailsUrl = `${TMDB_BASE}/movie/${movie.id}?api_key=${TMDB_KEY}&append_to_response=watch/providers`
        const res = await fetch(detailsUrl)
        const data = await res.json()

        // Get US providers for now (simplification)
        const usProviders = data['watch/providers']?.results?.US?.flatrate || []
        const providers = usProviders.slice(0, 3).map((p: any) => ({
            name: p.provider_name,
            logo: `${TMDB_IMG}${p.logo_path}`
        }))

        return {
            id: String(movie.id),
            title: movie.title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
            rating: Math.round(movie.vote_average * 10) / 10,
            genres: movie.genre_ids.map((g: number) => GENRE_MAP[g] || 'Other').filter(Boolean),
            poster: movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : 'https://via.placeholder.com/500x750/1a1a1a/808080?text=No+Poster',
            description: movie.overview || 'No description available.',
            runtime: data.runtime || 0,
            providers: providers
        }
    } catch (e) {
        return {
            id: String(movie.id),
            title: movie.title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
            rating: Math.round(movie.vote_average * 10) / 10,
            genres: movie.genre_ids.map((g: number) => GENRE_MAP[g] || 'Other').filter(Boolean),
            poster: movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : 'https://via.placeholder.com/500x750/1a1a1a/808080?text=No+Poster',
            description: movie.overview || 'No description available.',
            runtime: 0,
            providers: []
        }
    }
}

export async function fetchMoviesByMood(
    mood: 'light' | 'tense' | 'romantic' | 'deep' = 'light',
    limit: number = 20
): Promise<Movie[]> {
    try {
        // Map moods to genres
        const moodGenres = {
            light: [35, 10751, 16], // Comedy, Family, Animation
            tense: [53, 27, 80], // Thriller, Horror, Crime
            romantic: [10749, 18], // Romance, Drama
            deep: [18, 878, 9648] // Drama, Sci-Fi, Mystery
        }

        const genres = moodGenres[mood].join(',')
        const url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&with_genres=${genres}&sort_by=popularity.desc&vote_average.gte=6.5&vote_count.gte=100&page=1`

        const res = await fetch(url)
        const data = await res.json()

        // Enrich first 'limit' movies in parallel
        const basicMovies = data.results.slice(0, limit)
        const enrichedMovies = await Promise.all(basicMovies.map((m: any) => enrichMovie(m)))

        return enrichedMovies
    } catch (error) {
        console.error('Error fetching movies:', error)
        return []
    }
}

export async function getMovieDetails(id: string): Promise<{ runtime: number; imdbId?: string } | null> {
    try {
        const url = `${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}`
        const res = await fetch(url)
        const data = await res.json()

        return {
            runtime: data.runtime || 120,
            imdbId: data.imdb_id
        }
    } catch (error) {
        console.error('Error fetching movie details:', error)
        return null
    }
}
