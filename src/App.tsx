import { useState, useEffect, useRef } from 'react'
import { usePeer } from './hooks/usePeer'
import { fetchMoviesByMood, Movie } from './services/movies'
import QRCode from 'react-qr-code'

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

    // URL Join Logic
    const [autoJoinId, setAutoJoinId] = useState<string | null>(null)

    const { peerId, partnerName, connected, message, connect, send } = usePeer(name)

    // Auto-connect from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const joinId = params.get('join')
        if (joinId) {
            setAutoJoinId(joinId)
        }
    }, [])

    // Handle auto-connection after name is set
    useEffect(() => {
        if (screen === 'pairing' && autoJoinId && !connected) {
            setTargetId(autoJoinId)
            connect(autoJoinId)
        }
    }, [screen, autoJoinId, connected, connect])

    // Auto-advance if connected
    useEffect(() => {
        if (connected && screen === 'pairing') {
            // Just a small delay to show confirmation
            const timer = setTimeout(() => {
                setScreen('swiping')
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [connected, screen])


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
    }

    const handleShare = async () => {
        const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?join=${peerId}`
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CineMatch Session',
                    text: 'Join my movie session!',
                    url: url
                })
            } catch (err) {
                console.error(err)
            }
        } else {
            navigator.clipboard.writeText(url)
            alert('Link copied to clipboard!')
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
                    onKeyPress={(e) => e.key === 'Enter' && name.trim() && setScreen(autoJoinId ? 'pairing' : 'mood')}
                />

                <button className="btn" onClick={() => name.trim() && setScreen(autoJoinId ? 'pairing' : 'mood')}>
                    {autoJoinId ? 'Join Session' : 'Start Session'}
                </button>
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
                    Generate Session
                </button>
            </div>
        )
    }

    // === PAIRING SCREEN (QR / SHARE) ===
    if (screen === 'pairing') {
        return (
            <div className="container fade-in">
                <h2 className="title" style={{ fontSize: '2rem' }}>
                    {connected ? 'Connected!' : (autoJoinId ? 'Joining...' : 'Invite Partner')}
                </h2>

                {connected ? (
                    <div style={{ textAlign: 'center' }}>
                        <p className="subtitle">Connected with {partnerName}</p>
                        <div className="noir-loader" style={{ margin: '2rem auto' }}></div>
                        <p style={{ fontStyle: 'italic', color: 'var(--gray)' }}>Starting session...</p>
                    </div>
                ) : (
                    !autoJoinId && (
                        <>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                                <QRCode value={`${window.location.protocol}//${window.location.host}${window.location.pathname}?join=${peerId}`} size={180} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
                                <button className="btn" onClick={handleShare}>
                                    Share Invite Link
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                                    <div style={{ height: '1px', background: 'var(--gray)', flex: 1 }}></div>
                                    <span style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>OR MANUAL</span>
                                    <div style={{ height: '1px', background: 'var(--gray)', flex: 1 }}></div>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Enter Peer ID"
                                    value={targetId}
                                    onChange={e => setTargetId(e.target.value)}
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--gray)',
                                        padding: '1rem',
                                        textAlign: 'center',
                                        marginBottom: '1rem'
                                    }}
                                />
                                <button className="btn" onClick={() => targetId && connect(targetId)}>
                                    Connect Manually
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => setScreen('swiping')}
                                    style={{ opacity: 0.5, marginTop: '1rem' }}
                                >
                                    Skip (Solo Mode)
                                </button>
                            </div>
                        </>
                    )
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
                    <div className="noir-loader"></div>
                    <p style={{ marginTop: '1rem' }}>Loading films...</p>
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
                        Matches ({matches.length})
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
                        overflow: 'hidden',
                        position: 'relative'
                    }} className="fade-in">
                        <img
                            src={currentMovie.poster}
                            alt={currentMovie.title}
                            style={{ width: '100%', height: '500px', objectFit: 'cover', filter: 'grayscale(100%)' }}
                        />

                        {/* Overlay Info */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                            padding: '2rem 1.5rem',
                            paddingTop: '4rem'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{currentMovie.title}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--light)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>{currentMovie.year}</span>
                                <span>•</span>
                                <span>⭐ {currentMovie.rating}</span>
                                <span>•</span>
                                <span>{currentMovie.runtime}min</span>
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                {currentMovie.genres.slice(0, 3).map(g => (
                                    <span key={g} style={{
                                        padding: '0.2rem 0.5rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(4px)',
                                        fontSize: '0.7rem',
                                        color: 'var(--white)',
                                        borderRadius: '4px'
                                    }}>{g}</span>
                                ))}
                            </div>
                        </div>

                        {/* Full description on tap/hover could go here, for now simpler */}
                    </div>
                </div>

                {/* Swipe Controls */}
                <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', borderTop: '1px solid var(--dark)', alignItems: 'center' }}>
                    <button
                        onClick={() => handleSwipe('left')}
                        className="action-btn"
                    >
                        ✕
                    </button>

                    <button
                        onClick={() => handleSwipe('maybe')}
                        className="action-btn"
                        style={{ width: '50px', height: '50px', fontSize: '1rem' }}
                    >
                        ?
                    </button>

                    <button
                        onClick={() => handleSwipe('up')}
                        disabled={usedSuperLike}
                        className={`action-btn super ${usedSuperLike ? 'disabled' : ''}`}
                    >
                        ★
                    </button>

                    <button
                        onClick={() => handleSwipe('right')}
                        className="action-btn"
                    >
                        ♥
                    </button>
                </div>
            </div>
        )
    }

    // === DECISION SCREEN (Side by Side) ===
    if (screen === 'decision') {
        const topMatches = matches.length > 0 ? matches.slice(0, 2) : [] // Take top 2 for compare

        return (
            <div className="container fade-in">
                <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center' }}>Final Decision</h2>
                <p className="subtitle" style={{ textAlign: 'center' }}>Compare and pick the winner.</p>

                {topMatches.length === 0 ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>No matches yet! Check the Maybe pile or keep looking.</p>
                        <button className="btn" onClick={() => setScreen('swiping')}>
                            Back to Swiping
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '1rem', width: '100%', overflowX: 'auto', paddingBottom: '1rem', justifyContent: 'center' }}>
                            {/*  Show up to 2 movies side-by-side for comparison */}
                            {matches.slice(0, 2).map((movie) => (
                                <div key={movie.id} style={{ flex: 1, maxWidth: '350px', background: 'var(--charcoal)', border: '1px solid var(--dark)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '200px', objectFit: 'cover', filter: 'grayscale(100%)' }} />
                                    <div style={{ padding: '1rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>{movie.title}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--silver)' }}>
                                            <div>⭐ {movie.rating}</div>
                                            <div style={{ textAlign: 'right' }}>{movie.runtime} min</div>
                                            <div>{movie.year}</div>
                                            <div style={{ textAlign: 'right' }}>{movie.genres[0]}</div>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.4, height: '60px', overflow: 'hidden', marginBottom: '1rem' }}>
                                            {movie.description}
                                        </p>
                                        <button className="btn" style={{ width: '100%', background: 'var(--white)', color: 'var(--black)' }} onClick={() => handleFinalChoice(movie)}>
                                            Pick This
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {matches.length > 2 && (
                            <p style={{ textAlign: 'center', color: 'var(--gray)', marginTop: '1rem', fontSize: '0.8rem' }}>
                                + {matches.length - 2} other matches hidden
                            </p>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button className="btn" onClick={() => setScreen('swiping')} style={{ opacity: 0.5 }}>
                                Keep Looking
                            </button>
                        </div>
                    </>
                )}
            </div>
        )
    }

    // === FINAL CHOICE ===
    if (screen === 'final') {
        return (
            <div className="container fade-in">
                <h2 className="title" style={{ fontSize: '2.5rem' }}>It's Decided.</h2>
                <div style={{ width: '100px', height: '100px', border: '4px solid var(--white)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2rem 0' }}>
                    <span style={{ fontSize: '3rem' }}>✓</span>
                </div>
                <p className="subtitle">Put the phone away.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', fontStyle: 'italic', marginTop: '2rem' }}>
                    "No takebacks for 60 seconds. Live with it."
                </p>
            </div>
        )
    }

    return null
}

export default App
