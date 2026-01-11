// Firebase configuration for free tier
// Using Firestore for real-time sync

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Free tier Firebase config (replace with your own)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // User will need to add this
    authDomain: "cinematch.firebaseapp.com",
    projectId: "cinematch",
    storageBucket: "cinematch.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
let app: any = null;
let db: any = null;
let auth: any = null;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
} catch (error) {
    console.warn('Firebase not configured. Using local-only mode.');
}

export interface SyncedSession {
    id: string;
    users: string[];
    currentMovieIndex: number;
    swipes: Record<string, { movieId: string; direction: string }[]>;
    matches: string[];
    lastUpdated: number;
}

class FirebaseSync {
    private userId: string | null = null;
    private sessionId: string | null = null;
    private unsubscribe: (() => void) | null = null;

    async init() {
        if (!auth) return null;

        try {
            const userCredential = await signInAnonymously(auth);
            this.userId = userCredential.user.uid;
            return this.userId;
        } catch (error) {
            console.error('Firebase auth error:', error);
            return null;
        }
    }

    async createSession(sessionId: string): Promise<boolean> {
        if (!db || !this.userId) return false;

        try {
            this.sessionId = sessionId;
            const sessionRef = doc(db, 'sessions', sessionId);
            await setDoc(sessionRef, {
                id: sessionId,
                users: [this.userId],
                currentMovieIndex: 0,
                swipes: {},
                matches: [],
                lastUpdated: Date.now(),
            });
            return true;
        } catch (error) {
            console.error('Error creating session:', error);
            return false;
        }
    }

    subscribeToSession(sessionId: string, callback: (session: SyncedSession) => void) {
        if (!db) return;

        this.sessionId = sessionId;
        const sessionRef = doc(db, 'sessions', sessionId);

        this.unsubscribe = onSnapshot(sessionRef, (doc) => {
            if (doc.exists()) {
                callback(doc.data() as SyncedSession);
            }
        });
    }

    async updateSession(updates: Partial<SyncedSession>) {
        if (!db || !this.sessionId) return false;

        try {
            const sessionRef = doc(db, 'sessions', this.sessionId);
            await setDoc(sessionRef, {
                ...updates,
                lastUpdated: Date.now(),
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error updating session:', error);
            return false;
        }
    }

    disconnect() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
}

export const firebaseSync = new FirebaseSync();
