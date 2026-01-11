// Shared Notes on Movies

import { storage } from './storage';

export interface MovieNote {
    movieId: string;
    note: string;
    createdBy: string;
    timestamp: number;
}

const NOTES_KEY = 'cm_movie_notes';

class NotesManager {
    private notes: Map<string, MovieNote[]> = new Map();

    constructor() {
        this.load();
    }

    private load() {
        const saved = storage.get<Record<string, MovieNote[]>>(NOTES_KEY, {});
        this.notes = new Map(Object.entries(saved));
    }

    private save() {
        const obj = Object.fromEntries(this.notes);
        storage.set(NOTES_KEY, obj);
    }

    addNote(movieId: string, note: string, createdBy: string) {
        const existing = this.notes.get(movieId) || [];
        existing.push({
            movieId,
            note,
            createdBy,
            timestamp: Date.now(),
        });
        this.notes.set(movieId, existing);
        this.save();
    }

    getNotes(movieId: string): MovieNote[] {
        return this.notes.get(movieId) || [];
    }

    deleteNote(movieId: string, timestamp: number) {
        const existing = this.notes.get(movieId) || [];
        const filtered = existing.filter(n => n.timestamp !== timestamp);
        this.notes.set(movieId, filtered);
        this.save();
    }
}

export const notesManager = new NotesManager();
