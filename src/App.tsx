import { useState, useEffect, useRef } from 'react'
import { usePeer } from './hooks/usePeer'
import { fetchMoviesByMood, Movie } from './services/movies'
import { QRCodeSVG } from 'qrcode.react'

type Screen = 'name' | 'mood' | 'pairing' | 'swiping' | 'decision' | 'final'
type Mood = 'light' | 'tense' | 'romantic' | 'deep' | 'lightning'
type Avatar = '🕵️‍♂️' | '🕶️' | '🥃' | '🗡️'

const RANKS = [
    { name: 'Rookie', min: 0 },
    { name: 'Private Eye', min: 3 },
    { name: 'Chief Inspector', min: 10 }
]

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
    const [avatar, setAvatar] = useState<Avatar>(() => (localStorage.getItem('cm_avatar') as Avatar) || '🕵️‍♂️')
    const [casesSolved, setCasesSolved] = useState(() => parseInt(localStorage.getItem('cm_cases_solved') || '0'))

    const [showMatchAnimation, setShowMatchAnimation] = useState<Movie | null>(null)

    // Derived State
    const currentRank = RANKS.slice().reverse().find(r => casesSolved >= r.min) || RANKS[0]
    const nextRank = RANKS.find(r => r.min > casesSolved)

    // Filters
    const [onlyShort, setOnlyShort] = useState(false)
    const [runtimeRange, setRuntimeRange] = useState<[number, number]>([60, 180]) // Default 60m - 180m
    const [noHorror, setNoHorror] = useState(false)
    const [superLikeAnim, setSuperLikeAnim] = useState(false)

    // URL Join Logic
    const [autoJoinId, setAutoJoinId] = useState<string | null>(null)

    const [copyFeedback, setCopyFeedback] = useState('')

    // Rewind History
    const [history, setHistory] = useState<{ direction: string, movieId: string }[]>([])

    // P2P Hook with Profile Data
    const { peerId, caseNumber, partnerName, partnerAvatar, partnerRank, connected, message, connect, connectToCase, send } = usePeer(name, avatar, currentRank.name)

    useEffect(() => {
        if (name) localStorage.setItem('cm_name', name)
        localStorage.setItem('cm_avatar', avatar)
        localStorage.setItem('cm_cases_solved', casesSolved.toString())
    }, [name, avatar, casesSolved])

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
            // Updated Logic: Support both 'cm-PIN' and raw 'PIN'
            if (autoJoinId.startsWith('cm-')) {
                connect(autoJoinId)
            } else {
                // Assert it's a case number
                connectToCase(autoJoinId)
            }
        }
    }, [screen, autoJoinId, connected, connect, connectToCase])

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
                    filtered = filtered.filter(m => {
                        const r = m.runtime || 100
                        return r >= runtimeRange[0] && r <= runtimeRange[1]
                    })

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
                    handleNewMatch(movie)
                }
            }
        } else if (message?.type === 'undo_like') {
            // Partner undid a like
            setPartnerLikes(prev => prev.filter(id => id !== message.movieId))
            // Remove match if it exists (very rare edge case where you match then immediately undo)
            setMatches(prev => prev.filter(m => m.id !== message.movieId))
        }
    }, [message, myLikes, mySuperLikes, movies, matches])

    // Auto-transition Logic
    useEffect(() => {
        const limit = mood === 'lightning' ? 3 : 5
        if (matches.length >= limit && screen === 'swiping') {
            // Wait a bit if we are showing match animation
            if (!showMatchAnimation) {
                setScreen('decision')
            }
        }
    }, [matches.length, screen, mood, showMatchAnimation])

    const handleNewMatch = (movie: Movie) => {
        setMatches(prev => [...prev, movie])
        // Trigger Match Animation
        setShowMatchAnimation(movie)
        setTimeout(() => setShowMatchAnimation(null), 2500)
    }

    const handleSwipe = (direction: 'left' | 'right' | 'up' | 'maybe' | 'seen') => {
        const movie = movies[currentIndex]
        if (!movie) return

        // Add to history
        setHistory(prev => [...prev, { direction, movieId: movie.id }])

        if (direction === 'up' && !usedSuperLike) {
            setMySuperLikes(prev => [...prev, movie.id])
            setMyLikes(prev => [...prev, movie.id])
            setUsedSuperLike(true)
            setSuperLikeAnim(true)
            setTimeout(() => setSuperLikeAnim(false), 1500)
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

    const handleRewind = () => {
        if (history.length === 0 || currentIndex === 0) return

        const lastAction = history[history.length - 1]
        const { direction, movieId } = lastAction

        // Revert State
        if (direction === 'up') {
            setMySuperLikes(prev => prev.filter(id => id !== movieId))
            setMyLikes(prev => prev.filter(id => id !== movieId))
            setUsedSuperLike(false)
            send({ type: 'undo_like', movieId })
        } else if (direction === 'right') {
            setMyLikes(prev => prev.filter(id => id !== movieId))
            send({ type: 'undo_like', movieId })
        } else if (direction === 'maybe') {
            setMyMaybes(prev => prev.filter(id => id !== movieId))
        } else if (direction === 'seen') {
            setSeenMovies(prev => prev.filter(id => id !== movieId))
        }

        // Remove match if exists locally
        setMatches(prev => prev.filter(m => m.id !== movieId))

        // Update History & Index
        setHistory(prev => prev.slice(0, -1))
        setCurrentIndex(prev => prev - 1)
    }

    const checkMatch = (movieId: string) => {
        if (partnerLikes.includes(movieId)) {
            const movie = movies.find(m => m.id === movieId)
            if (movie && !matches.find(m => m.id === movie.id)) {
                handleNewMatch(movie)
            }
        }
    }

    const handleFinalChoice = (movie: Movie) => {
        setSeenMovies(prev => [...prev, movie.id]) // Mark as seen automatically
        setCasesSolved(prev => prev + 1) // Increment rank progress
        setScreen('final')
    }

    const handleSmartShare = async () => {
        const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?join=${caseNumber}`

        // Try Native Share First
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CineMatch Case #' + caseNumber,
                    text: '🕵️‍♂️ New Case File Assigned. Join investigation immediately.',
                    url: url
                })
                return
            } catch (err) {
                // User cancelled or not supported, fall back to copy
                console.log('Share cancelled, falling back to copy')
            }
        }

        // Fallback: Copy to Clipboard
        try {
            await navigator.clipboard.writeText(url)
            setCopyFeedback('Link Copied!')
            if (navigator.vibrate) navigator.vibrate(50) // Haptic feedback
            setTimeout(() => setCopyFeedback(''), 2000)
        } catch (err) {
            setCopyFeedback('Failed to copy')
        }
    }

    // === NAME SCREEN ===
    if (screen === 'name') {
        return (
            <div className="container fade-in">
                <h1 className="title">CineMatch</h1>
                <p className="subtitle">Film Noir Edition</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    {['🕵️‍♂️', '🕶️', '🥃', '🗡️'].map((a) => (
                        <button
                            key={a}
                            onClick={() => setAvatar(a as Avatar)}
                            style={{
                                fontSize: '2rem',
                                padding: '0.5rem',
                                border: avatar === a ? '2px solid var(--white)' : '2px solid transparent',
                                borderRadius: '50%',
                                background: avatar === a ? 'rgba(255,255,255,0.1)' : 'transparent',
                                transition: 'all 0.2s'
                            }}
                        >
                            {a}
                        </button>
                    ))}
                </div>

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
                        marginBottom: '1rem'
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && name.trim() && setScreen(autoJoinId ? 'pairing' : 'mood')}
                />

                <div style={{ marginBottom: '2rem', fontSize: '0.8rem', color: 'var(--gray)', textAlign: 'center' }}>
                    <div style={{ textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--blue)', fontWeight: 900 }}>{currentRank.name}</div>
                    <div>Cases Solved: {casesSolved} {nextRank && `(Next Rank: ${nextRank.min})`}</div>
                </div>

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
                    <div style={{ width: '100%', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--gray)' }}>
                            <span>Runtime: {runtimeRange[0]}m - {runtimeRange[1]}m</span>
                        </div>
                        <input
                            type="range"
                            min="60"
                            max="180"
                            step="10"
                            value={runtimeRange[1]} // Simplified single slider for max duration for now to avoid complex UI dependency
                            onChange={(e) => setRuntimeRange([60, parseInt(e.target.value)])}
                            style={{ width: '100%', accentColor: 'var(--white)' }}
                        />
                    </div>

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
                        <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 0.5s infinite alternate' }}>{partnerAvatar}</div>
                        <p className="subtitle">Connected with Agent {partnerName}</p>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.2rem 0.6rem',
                            border: '1px solid var(--blue)',
                            color: 'var(--blue)',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            fontWeight: 900,
                            marginBottom: '2rem'
                        }}>
                            {partnerRank}
                        </div>
                        <div className="noir-loader" style={{ margin: '0 auto' }}></div>
                        <p style={{ fontStyle: 'italic', color: 'var(--gray)', marginTop: '2rem' }}>Synchronizing case files...</p>
                    </div>
                ) : (
                    !autoJoinId && (
                        <>
                            <div style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: '4px',
                                marginBottom: '2rem',
                                boxShadow: '0 0 20px rgba(255,255,255,0.2)'
                            }}>
                                <QRCodeSVG value={`${window.location.protocol}//${window.location.host}${window.location.pathname}?join=${caseNumber}`} size={180} />
                            </div>

                            {/* Case Number Display */}
                            <div style={{ margin: '0 0 1.5rem 0', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>CASE FILE #</p>
                                <div style={{
                                    fontSize: '3.5rem',
                                    fontWeight: 900,
                                    fontFamily: 'monospace',
                                    letterSpacing: '5px',
                                    textShadow: '0 0 10px rgba(255,255,255,0.3)',
                                    lineHeight: 1
                                }}>
                                    {caseNumber || '...'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
                                <button
                                    className="btn"
                                    onClick={handleSmartShare}
                                    style={{
                                        padding: '1rem',
                                        background: copyFeedback ? 'var(--white)' : 'var(--dark)',
                                        color: copyFeedback ? 'var(--black)' : 'var(--white)',
                                        border: '1px solid var(--white)',
                                        borderRadius: '8px',
                                        fontSize: '1.2rem',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {copyFeedback ? (
                                        <><span>✓</span> {copyFeedback}</>
                                    ) : (
                                        <><span>🔗</span> Share Case Link</>
                                    )}
                                </button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
                                    <div style={{ height: '1px', background: 'var(--gray)', flex: 1, opacity: 0.3 }}></div>
                                    <span style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>OR ENTER CODE</span>
                                    <div style={{ height: '1px', background: 'var(--gray)', flex: 1, opacity: 0.3 }}></div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="PIN"
                                        value={targetId}
                                        maxLength={6}
                                        onChange={e => setTargetId(e.target.value)}
                                        style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid var(--gray)',
                                            borderRadius: '8px',
                                            padding: '1rem',
                                            textAlign: 'center',
                                            flex: 1,
                                            fontSize: '1.2rem',
                                            fontFamily: 'monospace',
                                            letterSpacing: '2px',
                                            color: 'white',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        className="btn"
                                        onClick={() => targetId && connectToCase(targetId)}
                                        style={{ width: 'auto', padding: '0 1.5rem', borderRadius: '8px' }}
                                    >
                                        JOIN
                                    </button>
                                </div>

                                <button
                                    onClick={() => setScreen('swiping')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'var(--gray)',
                                        fontSize: '0.8rem',
                                        marginTop: '1rem',
                                        cursor: 'pointer',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Start Solo Investigation &rarr;
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
            <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>

                {/* Match Animation Overlay */}
                {showMatchAnimation && (
                    <div style={{
                        position: 'absolute', zIndex: 999, top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s'
                    }}>
                        <div style={{
                            border: '4px solid white', padding: '1rem',
                            transform: 'rotate(-5deg)',
                            background: 'rgba(255,255,255,0.1)',
                            backdropFilter: 'blur(5px)'
                        }}>
                            <h1 style={{
                                fontSize: '4rem', fontStyle: 'italic', fontWeight: 900,
                                margin: 0,
                                textShadow: '0 0 20px rgba(255,255,255,0.5)',
                                animation: 'stamp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                            }}>
                                MATCH
                            </h1>
                        </div>
                        <p style={{ marginTop: '2rem', fontSize: '1.5rem', color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                            CASE FILE UPDATED
                        </p>
                        <p style={{ marginTop: '0.5rem', fontSize: '1rem', fontStyle: 'italic' }}>{showMatchAnimation.title}</p>
                    </div>
                )}

                {/* Super Like Overlay */}
                {superLikeAnim && (
                    <div style={{
                        position: 'absolute', zIndex: 998, top: 0, left: 0, right: 0, bottom: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            border: '4px solid var(--blue)', color: 'var(--blue)',
                            padding: '1rem 2rem', fontSize: '3rem', fontWeight: 900,
                            transform: 'rotate(15deg) scale(1.5)',
                            textShadow: '0 0 20px var(--blue)',
                            opacity: 0,
                            animation: 'stampFade 1.5s ease-out forwards'
                        }}>
                            PRIME SUSPECT
                        </div>
                    </div>
                )}

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

                            {/* Streaming Providers */}
                            {currentMovie.providers && currentMovie.providers.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--gray)', textTransform: 'uppercase' }}>Watch on:</span>
                                    {currentMovie.providers.map(p => (
                                        <img key={p.name} src={p.logo} alt={p.name} title={p.name} style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Swipe Controls */}
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', borderTop: '1px solid var(--dark)', alignItems: 'center' }}>
                    <button
                        onClick={handleRewind}
                        className={`action-btn ${history.length === 0 ? 'disabled' : ''}`}
                        disabled={history.length === 0}
                        style={{ width: '45px', height: '45px', fontSize: '0.8rem', color: 'var(--yellow)' }}
                        title="Rewind"
                    >
                        ↺
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

                    <button onClick={() => handleSwipe('seen')} className="action-btn" style={{ width: '45px', height: '45px', fontSize: '0.8rem' }} title="Already Seen">
                        👁
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
