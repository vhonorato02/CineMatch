import { useState, useEffect } from 'react'
import { usePeer } from './hooks/usePeer'
import { getMovies, Movie } from './services/movies'

type Screen = 'name' | 'pairing' | 'swiping' | 'matches'

function App() {
    const [name, setName] = useState('')
    const [screen, setScreen] = useState<Screen>('name')
    const [movies, setMovies] = useState<Movie[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [myLikes, setMyLikes] = useState<string[]>([])
    const [partnerLikes, setPartnerLikes] = useState<string[]>([])
    const [matches, setMatches] = useState<Movie[]>([])
    const [targetId, setTargetId] = useState('')

    const { peerId, partnerName, connected, message, connect, send } = usePeer(name)

    // Load movies
    useEffect(() => {
        if (screen === 'swiping' && movies.length === 0) {
            getMovies().then(setMovies)
        }
    }, [screen, movies.length])

    // Handle P2P messages
    useEffect(() => {
        if (message?.type === 'like') {
            setPartnerLikes(prev => [...prev, message.movieId])
            // Check for match
            if (myLikes.includes(message.movieId)) {
                const movie = movies.find(m => m.id === message.movieId)
                if (movie && !matches.find(m => m.id === movie.id)) {
                    setMatches(prev => [...prev, movie])
                }
            }
        }
    }, [message, myLikes, movies, matches])

    const handleSwipe = (direction: 'left' | 'right' | 'up') => {
        const movie = movies[currentIndex]
        if (!movie) return

        if (direction === 'right' || direction === 'up') {
            setMyLikes(prev => [...prev, movie.id])
            send({ type: 'like', movieId: movie.id, isSuper: direction === 'up' })

            // Check for match
            if (partnerLikes.includes(movie.id)) {
                if (!matches.find(m => m.id === movie.id)) {
                    setMatches(prev => [...prev, movie])
                }
            }
        }

        if (currentIndex + 1 >= movies.length) {
            setScreen('matches')
        } else {
            setCurrentIndex(prev => prev + 1)
        }
    }

    // === NAME SCREEN ===
    if (screen === 'name') {
        return (
            <div className="container fade-in">
                <h1 className="title">CineMatch</h1>
                <p className="subtitle">Film Noir Edition</p>

                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name..."
                    style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid var(--gray)',
                        padding: '0.75rem 0',
                        fontSize: '1rem',
                        width: '300px',
                        outline: 'none',
                        textAlign: 'center',
                        marginBottom: '2rem'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && name.trim() && setScreen('pairing')}
                />

                <button className="btn" onClick={() => name.trim() && setScreen('pairing')}>
                    Continue
                </button>

                <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: 'var(--gray)', fontStyle: 'italic', maxWidth: '400px', textAlign: 'center' }}>
                    "In a world of infinite choices, we're just two people who can't decide what to watch."
                </p>
            </div>
        )
    }

    // === PAIRING SCREEN ===
    if (screen === 'pairing') {
        return (
            <div className="container fade-in">
                <h2 className="title" style={{ fontSize: '2rem' }}>Welcome, {name}</h2>

                {!connected ? (
                    <>
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.5rem' }}>Your ID:</p>
                            <code style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--charcoal)',
                                border: '1px solid var(--dark)',
                                fontSize: '0.875rem',
                                fontFamily: 'monospace'
                            }}>
                                {peerId || 'Loading...'}
                            </code>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <input
                                type="text"
                                value={targetId}
                                onChange={(e) => setTargetId(e.target.value)}
                                placeholder="Partner's ID..."
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--gray)',
                                    padding: '0.75rem 0',
                                    fontSize: '0.875rem',
                                    width: '300px',
                                    outline: 'none',
                                    textAlign: 'center',
                                    marginBottom: '1rem'
                                }}
                            />
                        </div>

                        <button className="btn" onClick={() => targetId && connect(targetId)}>
                            Connect
                        </button>

                        <button
                            className="btn"
                            onClick={() => setScreen('swiping')}
                            style={{ marginTop: '1rem', opacity: 0.5 }}
                        >
                            Skip (Solo Mode)
                        </button>
                    </>
                ) : (
                    <>
                        <p style={{ color: 'var(--silver)', marginBottom: '2rem' }}>
                            Connected with <strong>{partnerName}</strong>
                        </p>
                        <button className="btn" onClick={() => setScreen('swiping')}>
                            Start Swiping
                        </button>
                    </>
                )}
            </div>
        )
    }

    // === SWIPING SCREEN ===
    if (screen === 'swiping') {
        const currentMovie = movies[currentIndex]

        if (!currentMovie) {
            return (
                <div className="container">
                    <p>Loading movies...</p>
                </div>
            )
        }

        return (
            <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>{name}</span>
                    {partnerName && <span style={{ fontSize: '0.875rem', color: 'var(--gray)' }}>💚 {partnerName}</span>}
                    <button className="btn" onClick={() => setScreen('matches')} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                        Matches ({matches.length})
                    </button>
                </div>

                {/* Card */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '400px',
                        background: 'var(--charcoal)',
                        border: '1px solid var(--dark)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }} className="fade-in">
                        <img
                            src={currentMovie.poster}
                            alt={currentMovie.title}
                            style={{ width: '100%', height: '500px', objectFit: 'cover', filter: 'grayscale(100%)' }}
                        />
                        <div style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{currentMovie.title}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--gray)', marginBottom: '1rem' }}>
                                {currentMovie.year} • ⭐ {currentMovie.rating}/10
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {currentMovie.genres.map(g => (
                                    <span key={g} style={{
                                        padding: '0.25rem 0.75rem',
                                        border: '1px solid var(--gray)',
                                        fontSize: '0.75rem',
                                        color: 'var(--silver)'
                                    }}>{g}</span>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--silver)', lineHeight: 1.6 }}>
                                {currentMovie.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', gap: '2rem', borderTop: '1px solid var(--dark)' }}>
                    <button
                        onClick={() => handleSwipe('left')}
                        style={{
                            width: '60px',
                            height: '60px',
                            border: '2px solid var(--gray)',
                            borderRadius: '50%',
                            background: 'transparent',
                            fontSize: '1.5rem',
                            color: 'var(--gray)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--white)'; e.currentTarget.style.color = 'var(--white)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gray)'; e.currentTarget.style.color = 'var(--gray)' }}
                    >
                        ✕
                    </button>

                    <button
                        onClick={() => handleSwipe('up')}
                        style={{
                            width: '70px',
                            height: '70px',
                            border: '2px solid var(--white)',
                            borderRadius: '50%',
                            background: 'transparent',
                            fontSize: '1.75rem',
                            color: 'var(--white)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        ★
                    </button>

                    <button
                        onClick={() => handleSwipe('right')}
                        style={{
                            width: '60px',
                            height: '60px',
                            border: '2px solid var(--gray)',
                            borderRadius: '50%',
                            background: 'transparent',
                            fontSize: '1.5rem',
                            color: 'var(--gray)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--white)'; e.currentTarget.style.color = 'var(--white)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gray)'; e.currentTarget.style.color = 'var(--gray)' }}
                    >
                        ♥
                    </button>
                </div>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray)', paddingBottom: '1rem' }}>
                    {currentIndex + 1} of {movies.length}
                </p>
            </div>
        )
    }

    // === MATCHES SCREEN ===
    if (screen === 'matches') {
        return (
            <div className="container fade-in">
                <h2 className="title" style={{ fontSize: '2rem' }}>Your Matches</h2>
                <p className="subtitle">{matches.length} films you both liked</p>

                {matches.length === 0 ? (
                    <p style={{ color: 'var(--gray)', fontStyle: 'italic', marginBottom: '2rem' }}>
                        No matches yet. Keep swiping!
                    </p>
                ) : (
                    <div style={{ marginBottom: '2rem', maxWidth: '600px', width: '100%' }}>
                        {matches.map(movie => (
                            <div key={movie.id} style={{
                                padding: '1rem',
                                borderBottom: '1px solid var(--dark)',
                                display: 'flex',
                                gap: '1rem',
                                alignItems: 'center'
                            }}>
                                <img src={movie.poster} alt={movie.title} style={{ width: '60px', height: '90px', objectFit: 'cover', filter: 'grayscale(100%)' }} />
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{movie.title}</h3>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{movie.year} • {movie.rating}/10</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <button className="btn" onClick={() => setScreen('swiping')}>
                    Back to Swiping
                </button>
            </div>
        )
    }

    return null
}

export default App
