import { useState, useEffect, useRef } from 'react'
import Peer from 'peerjs'

// Generate a "Case Number" style ID (e.g. 849201)
// This is not cryptographically secure but fine for this use case with PeerJS
const generateCaseId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export function usePeer(userName: string) {
    const [peerId, setPeerId] = useState<string>('')
    const [caseNumber, setCaseNumber] = useState<string>('')
    const [partnerId, setPartnerId] = useState<string>('')
    const [partnerName, setPartnerName] = useState<string>('')
    const [connected, setConnected] = useState(false)
    const [message, setMessage] = useState<any>(null)

    const peerRef = useRef<Peer | null>(null)
    const connRef = useRef<any>(null)
    const isHost = useRef<boolean>(false)

    useEffect(() => {
        // Try to register a short ID. 
        // In a real high-traffic app, this might collide, but for this scale it's fine.
        // We prefix with 'cm-' to namespace it on the public PeerJS server
        const shortId = generateCaseId()
        const fullId = `cm-${shortId}`

        setCaseNumber(shortId)

        const peer = new Peer(fullId)
        peerRef.current = peer

        peer.on('open', (id) => {
            setPeerId(id)
        })

        peer.on('connection', (conn) => {
            handleConnection(conn)
        })

        peer.on('error', (err) => {
            // If ID is taken, would theoretically need to retry, but probability is low for <1000 users
            console.error("Peer error:", err)
        })

        return () => {
            peer.destroy()
        }
    }, [userName])

    const handleConnection = (conn: any) => {
        connRef.current = conn

        conn.on('open', () => {
            setConnected(true)
            // Send handshake immediately
            conn.send({ type: 'handshake', name: userName })
        })

        conn.on('data', (data: any) => {
            if (data.type === 'handshake') {
                setPartnerName(data.name)
                if (conn.peer) setPartnerId(conn.peer)
            }
            setMessage(data)
        })

        conn.on('close', () => {
            setConnected(false)
            setPartnerName('')
        })

        conn.on('error', (err: any) => {
            console.error('Connection error:', err)
            setConnected(false)
        })
    }

    // Helper to connect using just the short code
    const connectToCase = (code: string) => {
        const fullId = `cm-${code}`
        connect(fullId)
    }

    const connect = (targetId: string) => {
        if (!peerRef.current) return

        // Close existing connection if any
        if (connRef.current) {
            connRef.current.close()
        }

        const conn = peerRef.current.connect(targetId)
        handleConnection(conn)
        setPartnerId(targetId)
    }

    const send = (data: any) => {
        if (connRef.current && connected) {
            connRef.current.send(data)
        }
    }

    return {
        peerId,       // The full ID (cm-123456)
        caseNumber,   // The short PIN (123456)
        partnerId,
        partnerName,
        connected,
        message,
        connect,
        connectToCase, // New function for PIN connection
        send
    }
}
