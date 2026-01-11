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
}

const GENRE_MAP: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV',
    53: 'Thriller', 10752: 'War', 37: 'Western'
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

        const movies: Movie[] = data.results.slice(0, limit).map((m: any) => ({
            id: String(m.id),
            title: m.title,
            year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
            rating: Math.round(m.vote_average * 10) / 10,
            genres: m.genre_ids.map((g: number) => GENRE_MAP[g] || 'Other').filter(Boolean),
            poster: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : 'https://via.placeholder.com/500x750/1a1a1a/808080?text=No+Poster',
            description: m.overview || 'No description available.',
            runtime: 120 // Mock for now
        }))

        return movies
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
