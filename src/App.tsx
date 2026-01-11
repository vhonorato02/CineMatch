import { useState, useEffect, useRef } from 'react'
import { usePeer } from './hooks/usePeer'
import { fetchMoviesByMood, Movie } from './services/movies'

type Screen = 'name' | 'mood' | 'pairing' | 'swiping' | 'decision' | 'final'
type Mood = 'light' | 'tense' | 'romantic' | 'deep'

const SESSION_LIMIT = 20
const SESSION_TIME_MS = 6 * 60 * 1000 // 6 minutes

function App() {
    const [name, setName] = useState('')
    const [screen, setScreen] = useState<Screen>('name')
    const [mood, setMood] = useState<Mood>('light')
    const [movies, setMovies] = useState<Movie[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [myLikes, setMyLikes] = useState<string[]>([])
    const [mySuperLikes, setMySuperLikes] = useState<string[]>([])
    const [myMaybes, setMyMaybes] = useState<string[]>([])
    const [partnerLikes, setPartnerLikes] = useState<string[]>([])
    const [matches, setMatches] = useState<Movie[]>([])
    const [targetId, setTargetId] = useState('')
    const [usedSuperLike, setUsedSuperLike] = useState(false)
    const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
    const [timeRemaining, setTimeRemaining] = useState(SESSION_TIME_MS)

    const { peerId, partnerName, connected, message, connect, send } = usePeer(name)

    // Timer countdown
    useEffect(() => {
        if (screen !== 'swiping' || !sessionStartTime) return

        const interval = setInterval(() => {
            const elapsed = Date.now() - sessionStartTime
            const remaining = SESSION_TIME_MS - elapsed

            if (remaining <= 0) {
                setScreen('decision')
                clearInterval(interval)
            } else {
                setTimeRemaining(remaining)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [screen, sessionStartTime])

    // Load movies when mood is selected
    useEffect(() => {
        if (screen === 'swiping' && movies.length === 0) {
            fetchMoviesByMood(mood, SESSION_LIMIT).then(m => {
                setMovies(m)
                setSessionStartTime(Date.now())
            })
        }
    }, [screen, mood, movies.length])

    // Handle P2P messages
    useEffect(() => {
        if (message?.type === 'like') {
            setPartnerLikes(prev => [...prev, message.movieId])
            // Check for match
            if (myLikes.includes(message.movieId) || mySuperLikes.includes(message.movieId)) {
                const movie = movies.find(m => m.id === message.movieId)
                if (movie && !matches.find(m => m.id === movie.id)) {
                    setMatches(prev => [...prev, movie])
                }
            }
        }
    }, [message, myLikes, mySuperLikes, movies, matches])

    // Auto-transition at 5 matches (Rule of 5)
    useEffect(() => {
        if (matches.length >= 5 && screen === 'swiping') {
            setScreen('decision')
        }
    }, [matches.length, screen])

    const handleSwipe = (direction: 'left' | 'right' | 'up' | 'maybe') => {
        const movie = movies[currentIndex]
        if (!movie) return

        if (direction === 'up' && !usedSuperLike) {
            // Super Like
            setMySuperLikes(prev => [...prev, movie.id])
            setMyLikes(prev => [...prev, movie.id])
            setUsedSuperLike(true)
            send({ type: 'like', movieId: movie.id, isSuper: true })

            if (partnerLikes.includes(movie.id)) {
                if (!matches.find(m => m.id === movie.id)) {
                    setMatches(prev => [...prev, movie])
                }
            }
        } else if (direction === 'right') {
            // Regular Like
            setMyLikes(prev => [...prev, movie.id])
            send({ type: 'like', movieId: movie.id, isSuper: false })

            if (partnerLikes.includes(movie.id)) {
                if (!matches.find(m => m.id === movie.id)) {
                    setMatches(prev => [...prev, movie])
                }
            }
        } else if (direction === 'maybe') {
            // Maybe pile
            setMyMaybes(prev => [...prev, movie.id])
        }

        // Move to next or end
        if (currentIndex + 1 >= movies.length) {
            setScreen('decision')
        } else {
            setCurrentIndex(prev => prev + 1)
        }
    }

    const handleFinalChoice = (movie: Movie) => {
        setScreen('final')
        // Lock for 60s
        setTimeout(() => {
            // Could add "Go back" after lockout
        }, 60000)
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
                    onKeyPress={(e) => e.key === 'Enter' && name.trim() && setScreen('mood')}
                />

                <button className="btn" onClick={() => name.trim() && setScreen('mood')}>
                    Continue
                </button>

                <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: 'var(--gray)', fontStyle: 'italic', maxWidth: '400px', textAlign: 'center' }}>
                    "20 films. 6 minutes. Zero regrets."
                </p>
            </div>
        )
    }

    // === MOOD SELECTOR ===
    if (screen === 'mood') {
        const moods: { id: Mood; name: string; desc: string }[] = [
            { id: 'light', name: 'Light', desc: 'Comedy, family-friendly, feel-good' },
            { id: 'tense', name: 'Tense', desc: 'Thriller, horror, crime' },
            { id: 'romantic', name: 'Romantic', desc: 'Love stories, drama' },
            { id: 'deep', name: 'Deep', desc: 'Mind-bending, mysterious, complex' }
        ]

        return (
            <div className="container fade-in">
                <h2 className="title" style={{ fontSize: '2rem' }}>Tonight's Mood?</h2>
                <p className="subtitle">We'll find {SESSION_LIMIT} films that match</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', maxWidth: '500px', marginBottom: '2rem' }}>
                    {moods.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMood(m.id)}
                            className={mood === m.id ? '' : ''}
                            style={{
                                padding: '1.5rem',
                                border: `2px solid ${mood === m.id ? 'var(--white)' : 'var(--gray)'}`,
                                background: mood === m.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{m.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{m.desc}</div>
                        </button>
                    ))}
                </div>

                <button className="btn" onClick={() => setScreen('pairing')}>
                    Continue
                </button>
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
        const progress = Math.round((currentIndex / SESSION_LIMIT) * 100)
        const timeMin = Math.floor(timeRemaining / 60000)
        const timeSec = Math.floor((timeRemaining % 60000) / 1000)

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
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                        {currentIndex + 1}/{SESSION_LIMIT} • {timeMin}:{timeSec.toString().padStart(2, '0')}
                    </span>
                    {partnerName && <span style={{ fontSize: '0.75rem', color: 'var(--silver)' }}>💚 {partnerName}</span>}
                    <button className="btn" onClick={() => setScreen('decision')} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                        Decide Now ({matches.length})
                    </button>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '4px', background: 'var(--dark)' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--white)', transition: 'width 0.3s' }} />
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
                                {currentMovie.year} • ⭐ {currentMovie.rating}/10 • {currentMovie.runtime}min
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                {currentMovie.genres.slice(0, 3).map(g => (
                                    <span key={g} style={{
                                        padding: '0.25rem 0.75rem',
                                        border: '1px solid var(--gray)',
                                        fontSize: '0.75rem',
                                        color: 'var(--silver)'
                                    }}>{g}</span>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--silver)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {currentMovie.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px solid var(--dark)', flexWrap: 'wrap' }}>
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
                    >
                        ✕
                    </button>

                    <button
                        onClick={() => handleSwipe('maybe')}
                        style={{
                            width: '60px',
                            height: '60px',
                            border: '2px solid var(--gray)',
                            borderRadius: '50%',
                            background: 'transparent',
                            fontSize: '1.25rem',
                            color: 'var(--gray)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        ?
                    </button>

                    <button
                        onClick={() => handleSwipe('up')}
                        disabled={usedSuperLike}
                        style={{
                            width: '70px',
                            height: '70px',
                            border: `2px solid ${usedSuperLike ? 'var(--gray)' : 'var(--white)'}`,
                            borderRadius: '50%',
                            background: 'transparent',
                            fontSize: '1.75rem',
                            color: usedSuperLike ? 'var(--gray)' : 'var(--white)',
                            cursor: usedSuperLike ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: usedSuperLike ? 0.3 : 1
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
                    >
                        ♥
                    </button>
                </div>
            </div>
        )
    }

    // === DECISION SCREEN (Top 3) ===
    if (screen === 'decision') {
        const topMatches = matches.slice(0, 3)

        return (
            <div className="container fade-in">
                <h2 className="title" style={{ fontSize: '2rem' }}>Top 3 Matches</h2>
                <p className="subtitle">Pick one. No second-guessing.</p>

                {topMatches.length === 0 ? (
                    <div>
                        <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>No matches yet! Try the Maybe pile?</p>
                        <button className="btn" onClick={() => setScreen('swiping')}>
                            Back to Swiping
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: topMatches.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', maxWidth: '900px', marginBottom: '2rem' }}>
                            {topMatches.map((movie, idx) => (
                                <button
                                    key={movie.id}
                                    onClick={() => handleFinalChoice(movie)}
                                    style={{
                                        padding: '0',
                                        border: '2px solid var(--gray)',
                                        background: 'var(--charcoal)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textAlign: 'left',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '300px', objectFit: 'cover', filter: 'grayscale(100%)' }} />
                                    <div style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.25rem' }}>{idx + 1}</div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{movie.title}</h3>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                                            {movie.year} • {movie.runtime}min • ⭐ {movie.rating}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button className="btn" onClick={() => setScreen('swiping')} style={{ opacity: 0.5 }}>
                            Back to Swiping
                        </button>
                    </>
                )}
            </div>
        )
    }

    // === FINAL CHOICE ===
    if (screen === 'final') {
        return (
            <div className="container fade-in">
                <h2 className="title" style={{ fontSize: '2.5rem' }}>Decision Made!</h2>
                <p className="subtitle">Enjoy your movie.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', fontStyle: 'italic', marginTop: '2rem' }}>
                    "No takebacks for 60 seconds. Live with it."
                </p>
            </div>
        )
    }

    return null
}

export default App
