// Mock movie data (we'll replace with real API later)
export interface Movie {
    id: string
    title: string
    year: number
    rating: number
    genres: string[]
    poster: string
    description: string
}

export const MOCK_MOVIES: Movie[] = [
    {
        id: '1',
        title: 'The Maltese Falcon',
        year: 1941,
        rating: 8.0,
        genres: ['Film Noir', 'Mystery'],
        poster: 'https://image.tmdb.org/t/p/w500/iFGgOBzDq9FfMQqNqSKp7c4BVb.jpg',
        description: 'A private detective takes on a case that involves him with three eccentric criminals and their quest for a priceless statuette.'
    },
    {
        id: '2',
        title: 'Casablanca',
        year: 1942,
        rating: 8.5,
        genres: ['Drama', 'Romance'],
        poster: 'https://image.tmdb.org/t/p/w500/5K7cOHoay2mZusSLezBOY0Qxh8.jpg',
        description: 'A cynical expatriate American cafe owner struggles to decide whether or not to help his former lover and her fugitive husband.'
    },
    {
        id: '3',
        title: 'Double Indemnity',
        year: 1944,
        rating: 8.3,
        genres: ['Film Noir', 'Crime'],
        poster: 'https://image.tmdb.org/t/p/w500/sllwD2Qb8kSBgv2M0W2yGu4x0r5.jpg',
        description: 'An insurance representative lets himself be talked into a murder/insurance fraud scheme.'
    },
    {
        id: '4',
        title: 'Sunset Boulevard',
        year: 1950,
        rating: 8.4,
        genres: ['Film Noir', 'Drama'],
        poster: 'https://image.tmdb.org/t/p/w500/bZZZNJy8h8pMWfSRkA8VLxaNDeg.jpg',
        description: 'A screenwriter develops a dangerous relationship with a faded film star.'
    },
    {
        id: '5',
        title: 'The Third Man',
        year: 1949,
        rating: 8.1,
        genres: ['Film Noir', 'Thriller'],
        poster: 'https://image.tmdb.org/t/p/w500/vHqJT9Hx2m8ELWTnOj5gGqxfMjh.jpg',
        description: 'Pulp novelist Holly Martins travels to shadowy, postwar Vienna, only to find himself investigating the mysterious death of an old friend.'
    }
]

export function getMovies(): Promise<Movie[]> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_MOVIES), 500)
    })
}
