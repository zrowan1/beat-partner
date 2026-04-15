import { useState } from "react";
import {
  GENRE_PROGRESSIONS,
  progressionToChords,
  type NoteName,
} from "./theoryData";

interface ProgressionSuggestionsProps {
  rootNote: NoteName;
}

export function ProgressionSuggestions({ rootNote }: ProgressionSuggestionsProps) {
  const [selectedGenre, setSelectedGenre] = useState(GENRE_PROGRESSIONS[0]);

  return (
    <div className="flex flex-col gap-4">
      {/* Genre selector */}
      <div className="flex gap-2 flex-wrap">
        {GENRE_PROGRESSIONS.map((genre) => (
          <button
            key={genre.genre}
            onClick={() => setSelectedGenre(genre)}
            className={`glass-interactive px-3 py-1.5 rounded-lg text-body transition-all duration-200 ${
              selectedGenre.genre === genre.genre
                ? "active text-white/90"
                : "text-white/50"
            }`}
          >
            {genre.genre}
          </button>
        ))}
      </div>

      {/* Progressions */}
      <div className="flex flex-col gap-3">
        {selectedGenre.progressions.map((progression, i) => {
          const chords = progressionToChords(progression.numerals, rootNote);

          return (
            <div key={i} className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-body text-white/70">{progression.name}</span>
                <span className="text-label text-white/30 font-mono">
                  {progression.numerals}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {chords.map((chord, j) => (
                  <div
                    key={j}
                    className="glass-interactive px-4 py-2 rounded-lg text-body font-mono text-accent-cyan"
                  >
                    {chord}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
