import React, { useState } from 'react';
import { Movie } from '../../shared/types';
import { notesManager } from '../../services/notesManager';

interface NotesModalProps {
    movie: Movie;
    userName: string;
    onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ movie, userName, onClose }) => {
    const [notes, setNotes] = useState(notesManager.getNotes(movie.id));
    const [newNote, setNewNote] = useState('');

    const handleAddNote = () => {
        if (!newNote.trim()) return;

        notesManager.addNote(movie.id, newNote, userName);
        setNotes(notesManager.getNotes(movie.id));
        setNewNote('');
    };

    const handleDeleteNote = (timestamp: number) => {
        notesManager.deleteNote(movie.id, timestamp);
        setNotes(notesManager.getNotes(movie.id));
    };

    return (
        <div className="fixed inset-0 z-[3500] glass flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl max-h-[70vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase">Notas: {movie.title}</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <i className="fas fa-times text-sm"></i>
                    </button>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                    {notes.length === 0 ? (
                        <p className="text-center text-slate-500 text-sm py-8">Nenhuma nota ainda</p>
                    ) : (
                        notes.map(note => (
                            <div key={note.timestamp} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-rose-500">{note.createdBy}</span>
                                    <button
                                        onClick={() => handleDeleteNote(note.timestamp)}
                                        className="text-slate-500 hover:text-red-500 text-xs"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                                <p className="text-sm">{note.note}</p>
                                <p className="text-[10px] text-slate-600 mt-2">
                                    {new Date(note.timestamp).toLocaleString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Note */}
                <div className="space-y-3">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Adicione uma nota sobre este filme..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm resize-none outline-none focus:border-rose-500 transition-colors"
                        rows={3}
                    />
                    <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="w-full bg-rose-500 disabled:bg-slate-700 disabled:opacity-50 py-3 rounded-xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all"
                    >
                        Adicionar Nota
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotesModal;
