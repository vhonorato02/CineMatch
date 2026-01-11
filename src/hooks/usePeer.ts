import { useState, useEffect, useRef } from 'react'
import Peer from 'peerjs'

// Generate a "Case Number" style ID (e.g. 849201)
const generateCaseId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export function usePeer(userName: string, userAvatar: string, userRank: string) {
    const [peerId, setPeerId] = useState<string>('')
    const [caseNumber, setCaseNumber] = useState<string>('')
    const [partnerId, setPartnerId] = useState<string>('')
    const [partnerName, setPartnerName] = useState<string>('')
    const [partnerAvatar, setPartnerAvatar] = useState<string>('🕵️‍♂️')
    const [partnerRank, setPartnerRank] = useState<string>('Rookie')
    const [connected, setConnected] = useState(false)
    const [message, setMessage] = useState<any>(null)

    const peerRef = useRef<Peer | null>(null)
    const connRef = useRef<any>(null)

    // Use refs to keep latest values without triggering re-effects
    const profileRef = useRef({ name: userName, avatar: userAvatar, rank: userRank })

    useEffect(() => {
        profileRef.current = { name: userName, avatar: userAvatar, rank: userRank }
    }, [userName, userAvatar, userRank])

    useEffect(() => {
        // Create Peer only ONCE on mount
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
            console.error("Peer error:", err)
        })

        return () => {
            peer.destroy()
        }
    }, []) // Empty dependency array = Stable Peer!

    const handleConnection = (conn: any) => {
        connRef.current = conn

        conn.on('open', () => {
            setConnected(true)
            // Send handshake immediately with full profile from ref
            const { name, avatar, rank } = profileRef.current
            conn.send({ type: 'handshake', name, avatar, rank })
        })

        conn.on('data', (data: any) => {
            if (data.type === 'handshake') {
                setPartnerName(data.name || 'Unknown')
                setPartnerAvatar(data.avatar || '🕵️‍♂️')
                setPartnerRank(data.rank || 'Rookie')
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

    const connectToCase = (code: string) => {
        const fullId = `cm-${code}`
        connect(fullId)
    }

    const connect = (targetId: string) => {
        if (!peerRef.current) return
        if (connRef.current) connRef.current.close()

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
        peerId,
        caseNumber,
        partnerId,
        partnerName,
        partnerAvatar,
        partnerRank,
        connected,
        message,
        connect,
        connectToCase,
        send
    }
}
