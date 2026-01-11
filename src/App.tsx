import { useState, useEffect, useRef } from 'react'
import { usePeer } from './hooks/usePeer'
import { fetchMoviesByMood, Movie } from './services/movies'
import QRCode from 'react-qr-code'

type Screen = 'name' | 'mood' | 'pairing' | 'swiping' | 'decision' | 'final'
type Mood = 'light' | 'tense' | 'romantic' | 'deep' | 'lightning'

const SESSION_LIMIT = 20
const LIGHTNING_LIMIT = 12
const SESSION_TIME_MS = 6 * 60 * 1000 // 6 minutes
const LIGHTNING_TIME_MS = 2 * 60 * 1000 // 2 minutes

function App() {
    const [name, setName] = useState(() => localStorage.getItem('cm_name') || '')
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
    const [seenMovies, setSeenMovies] = useState<string[]>(() => {
        const saved = localStorage.getItem('cm_seen_movies')
        return saved ? JSON.parse(saved) : []
    })

    // Filters
    const [onlyShort, setOnlyShort] = useState(false)
    const [noHorror, setNoHorror] = useState(false)

    // URL Join Logic
    const [autoJoinId, setAutoJoinId] = useState<string | null>(null)

    const { peerId, partnerName, connected, message, connect, send } = usePeer(name)

    useEffect(() => {
        if (name) localStorage.setItem('cm_name', name)
    }, [name])

    useEffect(() => {
        localStorage.setItem('cm_seen_movies', JSON.stringify(seenMovies))
    }, [seenMovies])

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
            const timer = setTimeout(() => {
                setScreen('swiping')
            }, 1500)
            return () => clearTimeout(timer)
        }
    }, [connected, screen])


    // Timer countdown
    useEffect(() => {
        if (screen !== 'swiping' || !sessionStartTime) return

        const timeLimit = mood === 'lightning' ? LIGHTNING_TIME_MS : SESSION_TIME_MS

        const interval = setInterval(() => {
            const elapsed = Date.now() - sessionStartTime
            const remaining = timeLimit - elapsed

            if (remaining <= 0) {
                setScreen('decision')
                clearInterval(interval)
            } else {
                setTimeRemaining(remaining)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [screen, sessionStartTime, mood])

    // Load movies when mood is selected
    useEffect(() => {
        if (screen === 'swiping' && movies.length === 0) {
            const limit = mood === 'lightning' ? LIGHTNING_LIMIT : SESSION_LIMIT
            fetchMoviesByMood(mood === 'lightning' ? 'light' : mood, limit * 2) // Fetch more to filter
                .then(fetched => {
                    let filtered = fetched

                    // Apply Client-Side Filters
                    if (onlyShort) {
                        filtered = filtered.filter(m => (m.runtime || 120) < 100)
                    }
                    if (noHorror) {
                        filtered = filtered.filter(m => !m.genres.includes('Horror') && !m.genres.includes('Thriller'))
                    }

                    // Remove already seen
                    filtered = filtered.filter(m => !seenMovies.includes(m.id))

                    setMovies(filtered.slice(0, limit))
                    setSessionStartTime(Date.now())
                })
        }
    }, [screen, mood, movies.length, onlyShort, noHorror, seenMovies])

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

    // Auto-transition Logic
    useEffect(() => {
        const limit = mood === 'lightning' ? 3 : 5
        if (matches.length >= limit && screen === 'swiping') {
            setScreen('decision')
        }
    }, [matches.length, screen, mood])

    const handleSwipe = (direction: 'left' | 'right' | 'up' | 'maybe' | 'seen') => {
        const movie = movies[currentIndex]
        if (!movie) return

        if (direction === 'up' && !usedSuperLike) {
            setMySuperLikes(prev => [...prev, movie.id])
            setMyLikes(prev => [...prev, movie.id])
            setUsedSuperLike(true)
            send({ type: 'like', movieId: movie.id, isSuper: true })
            checkMatch(movie.id)
        } else if (direction === 'right') {
            setMyLikes(prev => [...prev, movie.id])
            send({ type: 'like', movieId: movie.id, isSuper: false })
            checkMatch(movie.id)
        } else if (direction === 'maybe') {
            setMyMaybes(prev => [...prev, movie.id])
        } else if (direction === 'seen') {
            setSeenMovies(prev => [...prev, movie.id])
        }

        // Move to next or end
        if (currentIndex + 1 >= movies.length) {
            setScreen('decision')
        } else {
            setCurrentIndex(prev => prev + 1)
        }
    }

    const checkMatch = (movieId: string) => {
        if (partnerLikes.includes(movieId)) {
            const movie = movies.find(m => m.id === movieId)
            if (movie && !matches.find(m => m.id === movie.id)) {
                setMatches(prev => [...prev, movie])
            }
        }
    }

    const handleFinalChoice = (movie: Movie) => {
        setSeenMovies(prev => [...prev, movie.id]) // Mark as seen automatically
        setScreen('final')
    }

    const handleShare = async () => {
        const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?join=${peerId}`
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CineMatch Case File',
                    text: 'I have a new case for us. High priority.',
                    url: url
                })
            } catch (err) {
                console.error(err)
            }
        } else {
            navigator.clipboard.writeText(url)
            alert('Case file link copied.')
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
                    placeholder="Agent Name..."
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
                    {autoJoinId ? 'Join Case' : 'New Case'}
                </button>
            </div>
        )
    }

    // === MOOD SELECTOR ===
    if (screen === 'mood') {
        const moods: { id: Mood; name: string; desc: string }[] = [
            { id: 'light', name: 'Light', desc: 'Comedy, family, easy watching' },
            { id: 'tense', name: 'Tense', desc: 'Thriller, crime, noir' },
            { id: 'romantic', name: 'Romantic', desc: 'Drama, love, connection' },
            { id: 'deep', name: 'Deep', desc: 'Sci-fi, mystery, complex' },
            { id: 'lightning', name: 'Lightning', desc: '12 cards, 2 mins. Speed run.' }
        ]

        return (
            <div className="container fade-in" style={{ paddingBottom: '4rem' }}>
                <h2 className="title" style={{ fontSize: '2rem' }}>Case Profile</h2>
                <p className="subtitle">Select the investigation parameters.</p>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => setOnlyShort(!onlyShort)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: `1px solid ${onlyShort ? 'var(--white)' : 'var(--gray)'}`,
                            borderRadius: '20px',
                            color: onlyShort ? 'var(--white)' : 'var(--gray)',
                            fontSize: '0.8rem'
                        }}
                    >
                        {onlyShort ? '✓ Short (<100m)' : 'Short Only'}
                    </button>
                    <button
                        onClick={() => setNoHorror(!noHorror)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: `1px solid ${noHorror ? 'var(--white)' : 'var(--gray)'}`,
                            borderRadius: '20px',
                            color: noHorror ? 'var(--white)' : 'var(--gray)',
                            fontSize: '0.8rem'
                        }}
                    >
                        {noHorror ? '✓ No Drama/Horror' : 'Cut the Drama'}
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '1rem', maxWidth: '400px', width: '100%', marginBottom: '2rem' }}>
                    {moods.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMood(m.id)}
                            className={mood === m.id ? '' : ''}
                            style={{
                                padding: '1rem',
                                border: `1px solid ${mood === m.id ? 'var(--white)' : 'var(--gray)'}`,
                                background: mood === m.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 700 }}>{m.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{m.desc}</div>
                            </div>
                            {mood === m.id && <span>✓</span>}
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
                    {connected ? 'Partner Found' : (autoJoinId ? 'Establishing Link...' : 'Recruit Partner')}
                </h2>

                {connected ? (
                    <div style={{ textAlign: 'center' }}>
                        <p className="subtitle">Connected with Agent {partnerName}</p>
                        <div className="noir-loader" style={{ margin: '2rem auto' }}></div>
                        <p style={{ fontStyle: 'italic', color: 'var(--gray)' }}>Synchronizing case files...</p>
                    </div>
                ) : (
                    !autoJoinId && (
                        <>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '4px', marginBottom: '2rem' }}>
                                <QRCode value={`${window.location.protocol}//${window.location.host}${window.location.pathname}?join=${peerId}`} size={160} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
                                <button className="btn" onClick={handleShare}>
                                    Share Case File
                                </button>

                                <button className="btn" onClick={() => targetId && connect(targetId)} style={{ fontSize: '0.8rem', padding: '0.5rem', border: 'none', color: 'var(--gray)' }}>
                                    Use Manual ID
                                </button>

                                <button
                                    className="btn"
                                    onClick={() => setScreen('swiping')}
                                    style={{ opacity: 0.5, marginTop: '1rem' }}
                                >
                                    Solo Investigation
                                </button>
                            </div>

                            {/* Hidden input for manual override */}
                            <input
                                type="text"
                                placeholder="Manual Peer ID"
                                value={targetId}
                                onChange={e => setTargetId(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--charcoal)',
                                    color: 'var(--black)',
                                    marginTop: '2rem',
                                    textAlign: 'center',
                                    fontSize: '0.7rem'
                                }}
                            />
                        </>
                    )
                )}
            </div>
        )
    }

    // === SWIPING SCREEN ===
    if (screen === 'swiping') {
        const currentMovie = movies[currentIndex]
        const limit = mood === 'lightning' ? LIGHTNING_LIMIT : SESSION_LIMIT
        const progress = Math.round((currentIndex / limit) * 100)
        const timeMin = Math.floor(timeRemaining / 60000)
        const timeSec = Math.floor((timeRemaining % 60000) / 1000)

        if (!currentMovie) {
            if (movies.length === 0 && currentIndex === 0) {
                return (
                    <div className="container">
                        <div className="noir-loader"></div>
                        <p style={{ marginTop: '1rem' }}>Compiling evidence...</p>
                    </div>
                )
            } else {
                // Ran out of movies
                setScreen('decision')
                return null
            }
        }

        return (
            <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                        EVIDENCE {currentIndex + 1}/{limit}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: timeRemaining < 30000 ? 'red' : 'var(--white)' }}>
                        {timeMin}:{timeSec.toString().padStart(2, '0')}
                    </span>
                    <button className="btn" onClick={() => setScreen('decision')} style={{ padding: '0.3rem 0.8rem', fontSize: '0.7rem', border: '1px solid var(--gray)' }}>
                        LEADS ({matches.length})
                    </button>
                </div>

                {/* Progress Bar */}
                <div style={{ height: '2px', background: 'var(--dark)' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--white)', transition: 'width 0.3s' }} />
                </div>

                {/* Card */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '400px',
                        height: '100%',
                        maxHeight: '600px',
                        background: 'var(--charcoal)',
                        border: '1px solid var(--dark)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        position: 'relative'
                    }} className="fade-in">
                        <img
                            src={currentMovie.poster}
                            alt={currentMovie.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%) contrast(1.1)' }}
                        />

                        {/* Overlay Info */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.6) 50%, transparent)',
                            padding: '1.5rem',
                            paddingTop: '6rem'
                        }}>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.5rem', lineHeight: 1.1 }}>{currentMovie.title}</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--light)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontFamily: 'monospace' }}>
                                <span>{currentMovie.year}</span>
                                <span>⭐ {currentMovie.rating}</span>
                                <span>{currentMovie.runtime}m</span>
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {currentMovie.genres.slice(0, 3).map(g => (
                                    <span key={g} style={{
                                        padding: '0.2rem 0.6rem',
                                        border: '1px solid var(--gray)',
                                        fontSize: '0.7rem',
                                        color: 'var(--white)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>{g}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Swipe Controls */}
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px solid var(--dark)', alignItems: 'center' }}>
                    <button onClick={() => handleSwipe('seen')} className="action-btn" style={{ width: '45px', height: '45px', fontSize: '0.8rem' }} title="Already Seen">
                        👁
                    </button>

                    <button onClick={() => handleSwipe('left')} className="action-btn">
                        ✕
                    </button>

                    <button onClick={() => handleSwipe('up')} disabled={usedSuperLike} className={`action-btn super ${usedSuperLike ? 'disabled' : ''}`}>
                        ★
                    </button>

                    <button onClick={() => handleSwipe('right')} className="action-btn">
                        ♥
                    </button>

                    <button onClick={() => handleSwipe('maybe')} className="action-btn" style={{ width: '45px', height: '45px', fontSize: '0.8rem' }} title="Maybe">
                        ?
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
                <h2 className="title" style={{ fontSize: '2rem', textAlign: 'center' }}>Suspects Identified</h2>
                <p className="subtitle" style={{ textAlign: 'center' }}>Make the final call.</p>

                {topMatches.length === 0 ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>Investigation inconclusive.</p>
                        <button className="btn" onClick={() => setScreen('swiping')}>
                            Review Evidence Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '1rem', width: '100%', overflowX: 'auto', paddingBottom: '1rem', justifyContent: 'center' }}>
                            {/*  Show up to 2 movies side-by-side for comparison */}
                            {matches.slice(0, 2).map((movie) => (
                                <div key={movie.id} style={{ flex: 1, maxWidth: '350px', background: 'var(--charcoal)', border: matches.length === 1 ? '1px solid var(--white)' : '1px solid var(--dark)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '220px', objectFit: 'cover', filter: matches.length === 1 ? 'grayscale(0%)' : 'grayscale(100%)' }} />
                                    <div style={{ padding: '1rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem' }}>{movie.title}</h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--silver)', fontFamily: 'monospace' }}>
                                            <div>⭐ {movie.rating}</div>
                                            <div style={{ textAlign: 'right' }}>{movie.runtime}m</div>
                                            <div>{movie.year}</div>
                                            <div style={{ textAlign: 'right' }}>{movie.genres[0]}</div>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--gray)', lineHeight: 1.4, height: '60px', overflow: 'hidden', marginBottom: '1rem' }}>
                                            {movie.description}
                                        </p>
                                        <button className="btn" style={{ width: '100%', background: 'var(--white)', color: 'var(--black)' }} onClick={() => handleFinalChoice(movie)}>
                                            Case Closed
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {matches.length > 2 && (
                            <p style={{ textAlign: 'center', color: 'var(--gray)', marginTop: '1rem', fontSize: '0.8rem' }}>
                                + {matches.length - 2} other potential leads
                            </p>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button className="btn" onClick={() => setScreen('swiping')} style={{ opacity: 0.5 }}>
                                Continue Investigation
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
                <h2 className="title" style={{ fontSize: '2.5rem' }}>Case Closed.</h2>
                <div style={{ width: '100px', height: '100px', border: '4px solid var(--white)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2rem 0' }}>
                    <span style={{ fontSize: '3rem' }}>📁</span>
                </div>
                <p className="subtitle">Enjoy the show, detectives.</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', fontStyle: 'italic', marginTop: '2rem' }}>
                    "This room is locked for 60 seconds."
                </p>
            </div>
        )
    }

    return null
}

export default App
