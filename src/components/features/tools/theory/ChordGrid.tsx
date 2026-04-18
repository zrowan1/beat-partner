import { useState } from "react";
import { getDiatonicChords, type NoteName } from "./theoryData";
import { PianoKeyboard } from "./PianoKeyboard";
import { GuitarChordDiagram } from "./GuitarChordDiagram";
import { getGuitarVoicings } from "./guitarVoicings";
import { Music, Guitar } from "lucide-react";

interface ChordGridProps {
  rootNote: NoteName;
}

export function ChordGrid({ rootNote }: ChordGridProps) {
  const [mode, setMode] = useState<"major" | "minor">("major");
  const [selectedChordIndex, setSelectedChordIndex] = useState<number | null>(null);
  const [visualization, setVisualization] = useState<"piano" | "guitar">("piano");

  const chords = getDiatonicChords(rootNote, mode);
  const selectedChord = selectedChordIndex !== null ? chords[selectedChordIndex] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode("major"); setSelectedChordIndex(null); }}
          className={`glass-interactive px-4 py-2 rounded-lg text-body transition-all duration-200 ${
            mode === "major" ? "active text-white/90" : "text-white/50"
          }`}
        >
          Major
        </button>
        <button
          onClick={() => { setMode("minor"); setSelectedChordIndex(null); }}
          className={`glass-interactive px-4 py-2 rounded-lg text-body transition-all duration-200 ${
            mode === "minor" ? "active text-white/90" : "text-white/50"
          }`}
        >
          Minor
        </button>
      </div>

      {/* Chord grid */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
        {chords.map((chord, i) => (
          <button
            key={i}
            onClick={() => setSelectedChordIndex(selectedChordIndex === i ? null : i)}
            className={`glass-interactive p-3 rounded-xl text-center transition-all duration-200 ${
              selectedChordIndex === i ? "active border border-accent-cyan/30" : ""
            }`}
          >
            <div className="text-label text-white/40 mb-1">{chord.degree}</div>
            <div className="text-body font-mono text-white/80">{chord.symbol}</div>
          </button>
        ))}
      </div>

      {/* Selected chord detail */}
      {selectedChord && (
        <div className="flex flex-col gap-3">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-heading font-mono text-accent-cyan">
                {selectedChord.symbol}
              </span>
              <span className="text-label text-white/40">{selectedChord.degree}</span>
            </div>
            <div className="flex gap-2">
              {selectedChord.notes.map((note, i) => (
                <div
                  key={i}
                  className="glass-interactive px-3 py-2 rounded-lg text-center min-w-[56px]"
                >
                  <div className="text-body font-mono text-white/80">{note}</div>
                  <div className="text-[10px] font-mono text-white/40 mt-0.5">
                    {selectedChord.intervals[i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visualization toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setVisualization("piano")}
              className={`glass-interactive flex items-center gap-2 px-4 py-2 rounded-lg text-body transition-all duration-200 ${
                visualization === "piano" ? "active text-white/90" : "text-white/50"
              }`}
            >
              <Music size={16} strokeWidth={1.5} />
              Piano
            </button>
            <button
              onClick={() => setVisualization("guitar")}
              className={`glass-interactive flex items-center gap-2 px-4 py-2 rounded-lg text-body transition-all duration-200 ${
                visualization === "guitar" ? "active text-white/90" : "text-white/50"
              }`}
            >
              <Guitar size={16} strokeWidth={1.5} />
              Guitar
            </button>
          </div>

          {/* Piano visualization */}
          {visualization === "piano" && (
            <div className="glass-card p-4 rounded-xl overflow-x-auto">
              <PianoKeyboard
                highlightedNotes={selectedChord.notes}
                rootNote={selectedChord.root}
              />
            </div>
          )}

          {/* Guitar visualizations */}
          {visualization === "guitar" && (
            <div className="glass-card p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getGuitarVoicings(selectedChord.root, selectedChord.chordTypeName).map(
                  (voicing, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                        voicing.recommended
                          ? "border-accent-cyan/20 bg-accent-cyan/5"
                          : "border-white/5 bg-white/[0.02]"
                      }`}
                    >
                      <GuitarChordDiagram voicing={voicing} />
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
