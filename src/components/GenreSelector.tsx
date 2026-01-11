
import React from 'react';

const GENRES = [
  "Action", "Comedy", "Drama", "Horror", "Sci-Fi", 
  "Romance", "Thriller", "Animation", "Documentary", 
  "Fantasy", "Mystery", "Crime", "Adventure"
];

interface GenreSelectorProps {
  selectedGenres: string[];
  onToggleGenre: (genre: string) => void;
  onClear: () => void;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({ selectedGenres, onToggleGenre, onClear }) => {
  return (
    <div className="w-full bg-slate-800/40 backdrop-blur-md border-b border-slate-700/50 overflow-hidden z-20">
      <div className="flex items-center gap-2 p-3 overflow-x-auto no-scrollbar scroll-smooth">
        <button 
          onClick={onClear}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${
            selectedGenres.length === 0 
            ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105' 
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
          }`}
        >
          All
        </button>
        {GENRES.map(genre => (
          <button
            key={genre}
            onClick={() => onToggleGenre(genre)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${
              selectedGenres.includes(genre)
              ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenreSelector;
