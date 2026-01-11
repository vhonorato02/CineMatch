import { useState, useEffect, useRef, useCallback } from 'react';
import { P2PMessage, UserProfile } from '../shared/types';

declare var Peer: any;

export type ConnectionStatus = 'offline' | 'waiting' | 'connecting' | 'connected' | 'error';

interface UsePeerReturn {
    peerId: string;
    connStatus: ConnectionStatus;
    isHost: boolean;
    connectToPartner: (targetId: string) => void;
    sendMessage: (msg: P2PMessage) => void;
    lastMessage: P2PMessage | null;
    resetConnection: () => void;
}

export const usePeer = (profile: UserProfile | null): UsePeerReturn => {
    const [peerId, setPeerId] = useState('');
    const [connStatus, setConnStatus] = useState<ConnectionStatus>('offline');
    const [lastMessage, setLastMessage] = useState<P2PMessage | null>(null);
    const [isHost, setIsHost] = useState(false);

    const peerRef = useRef<any>(null);
    const connRef = useRef<any>(null);
    const heartbeatInterval = useRef<any>(null);
    const reconnectTimeout = useRef<any>(null);
    const mountRef = useRef(true);

    // Initialize Peer
    const initPeer = useCallback(() => {
        if (typeof Peer === 'undefined') {
            console.warn("PeerJS not loaded yet, retrying...");
            setTimeout(initPeer, 500);
            return;
        }

        if (peerRef.current && !peerRef.current.destroyed) return;

        const peer = new Peer(null, {
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                ]
            }
        });

        peer.on('open', (id: string) => {
            if (!mountRef.current) return;
            console.log('My Peer ID:', id);
            setPeerId(id);
            setConnStatus('waiting');
        });

        peer.on('connection', (conn: any) => {
            console.log('Incoming connection from:', conn.peer);
            handleConnection(conn);
            setIsHost(true);
        });

        peer.on('error', (err: any) => {
            console.error('Peer error:', err);
            // Retry connection on specific errors if needed
        });

        peer.on('disconnected', () => {
            console.log('Peer disconnected.');
            // Attempt to reconnect to signaling server
            peer.reconnect();
        });

        peerRef.current = peer;
    }, []);

    const handleConnection = (conn: any) => {
        if (connRef.current) {
            if (connRef.current.peer === conn.peer) {
                console.log("Re-connection from same peer.");
            } else {
                console.log("New peer replacing old peer.");
                connRef.current.close();
            }
        }

        connRef.current = conn;

        conn.on('open', () => {
            console.log('Connection established with:', conn.peer);
            setConnStatus('connected');

            // Start Heartbeat
            startHeartbeat();

            // Send Handshake if profile exists
            if (profile) {
                conn.send({ type: 'HANDSHAKE', profile });
            }
        });

        conn.on('data', (data: P2PMessage) => {
            if (data.type === 'HEARTBEAT') {
                // Heartbeat received, connection is alive
                return;
            }
            console.log('Received:', data);
            setLastMessage(data);
        });

        conn.on('close', () => {
            console.log('Connection closed');
            setConnStatus('waiting');
            stopHeartbeat();
            connRef.current = null;
            // Depending on logic, maybe try to reconnect if we were the initiator?
        });

        conn.on('error', (err: any) => {
            console.error('Connection error:', err);
            setConnStatus('error');
        });
    };

    const connectToPartner = useCallback((targetId: string) => {
        if (!peerRef.current) return;

        setConnStatus('connecting');
        console.log('Connecting to:', targetId);

        const conn = peerRef.current.connect(targetId, {
            reliable: true
        });

        setIsHost(false);
        handleConnection(conn);
    }, [initPeer]);

    const sendMessage = useCallback((msg: P2PMessage) => {
        if (connRef.current && connRef.current.open) {
            connRef.current.send(msg);
        } else {
            console.warn("Connection not open, cannot send message:", msg);
        }
    }, []);

    const startHeartbeat = () => {
        stopHeartbeat();
        heartbeatInterval.current = setInterval(() => {
            if (connRef.current && connRef.current.open) {
                connRef.current.send({ type: 'HEARTBEAT' });
            }
        }, 5000);
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
    };

    const resetConnection = useCallback(() => {
        if (connRef.current) connRef.current.close();
        setConnStatus('waiting');
    }, []);

    useEffect(() => {
        mountRef.current = true;
        initPeer();

        return () => {
            mountRef.current = false;
            stopHeartbeat();
            if (peerRef.current) peerRef.current.destroy();
        };
    }, [initPeer]);

    // Handle profile updates during connection
    useEffect(() => {
        if (connStatus === 'connected' && profile && isHost) {
            // If we are host and profile changed/loaded late, resend handshake? 
            // Actually usually profile is set before connection in this app flow.
        }
    }, [profile, connStatus, isHost]);

    return {
        peerId,
        connStatus,
        isHost,
        connectToPartner,
        sendMessage,
        lastMessage,
        resetConnection
    };
};
