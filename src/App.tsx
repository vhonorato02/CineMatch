import { useState } from 'react'

function App() {
    const [name, setName] = useState('')
    const [started, setStarted] = useState(false)

    const handleStart = () => {
        if (name.trim()) {
            setStarted(true)
        }
    }

    if (!started) {
        return (
            <div className="container fade-in">
                <h1 className="title">CineMatch</h1>
                <p className="subtitle">Film Noir Edition</p>

                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
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
                            textAlign: 'center'
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                    />
                </div>

                <button className="btn" onClick={handleStart}>
                    Start
                </button>

                <p style={{
                    marginTop: '3rem',
                    fontSize: '0.75rem',
                    color: 'var(--gray)',
                    fontStyle: 'italic',
                    maxWidth: '400px',
                    textAlign: 'center'
                }}>
                    "In a world of infinite choices, we're just two people who can't decide what to watch."
                </p>
            </div>
        )
    }

    return (
        <div className="container fade-in">
            <h2 className="title" style={{ fontSize: '2rem' }}>
                Welcome, {name}
            </h2>
            <p className="subtitle">The app is working! 🎬</p>

            <button
                className="btn"
                onClick={() => setStarted(false)}
                style={{ marginTop: '2rem' }}
            >
                Go Back
            </button>
        </div>
    )
}

export default App
