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
        const peer = new Peer()
        peerRef.current = peer

        peer.on('open', (id) => {
            setPeerId(id)
        })

        peer.on('connection', (conn) => {
            connRef.current = conn

            conn.on('open', () => {
                setConnected(true)
                conn.send({ type: 'handshake', name: userName })
            })

            conn.on('data', (data: any) => {
                if (data.type === 'handshake') {
                    setPartnerName(data.name)
                    setPartnerId(conn.peer)
                }
                setMessage(data)
            })

            conn.on('close', () => {
                setConnected(false)
                setPartnerName('')
            })
        })

        return () => {
            peer.destroy()
        }
    }, [userName])

    const connect = (targetId: string) => {
        if (!peerRef.current) return

        const conn = peerRef.current.connect(targetId)
        connRef.current = conn

        conn.on('open', () => {
            setConnected(true)
            setPartnerId(targetId)
            conn.send({ type: 'handshake', name: userName })
        })

        conn.on('data', (data: any) => {
            if (data.type === 'handshake') {
                setPartnerName(data.name)
            }
            setMessage(data)
        })

        conn.on('close', () => {
            setConnected(false)
            setPartnerName('')
        })
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
