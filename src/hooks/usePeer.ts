import { useState, useEffect, useRef } from 'react'
import Peer from 'peerjs'

export function usePeer(userName: string) {
    const [peerId, setPeerId] = useState<string>('')
    const [partnerId, setPartnerId] = useState<string>('')
    const [partnerName, setPartnerName] = useState<string>('')
    const [connected, setConnected] = useState(false)
    const [message, setMessage] = useState<any>(null)

    const peerRef = useRef<Peer | null>(null)
    const connRef = useRef<any>(null)

    useEffect(() => {
        // Initialize Peer with a random ID
        const peer = new Peer()
        peerRef.current = peer

        peer.on('open', (id) => {
            setPeerId(id)
        })

        peer.on('connection', (conn) => {
            handleConnection(conn)
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
                // If we received a handshake, we are connected. 
                // We might also want to set partnerId if not already set.
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
        peerId,
        partnerId,
        partnerName,
        connected,
        message,
        connect,
        send
    }
}
