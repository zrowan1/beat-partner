import { useState } from "react";
import { NOTES, SCALES, getScaleNotes, getIntervalName, type NoteName } from "./theoryData";
import { PianoKeyboard } from "./PianoKeyboard";

interface ScaleViewerProps {
  rootNote: NoteName;
  onRootChange: (note: NoteName) => void;
}

export function ScaleViewer({ rootNote, onRootChange }: ScaleViewerProps) {
  const [selectedScale, setSelectedScale] = useState(SCALES[0]);
  const scaleNotes = getScaleNotes(rootNote, selectedScale);

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-label text-white/40">Root Note</label>
          <select
            value={rootNote}
            onChange={(e) => onRootChange(e.target.value as NoteName)}
            className="glass-interactive px-3 py-2 rounded-lg text-body text-white/80 bg-transparent outline-none"
          >
            {NOTES.map((note) => (
              <option key={note} value={note} className="bg-surface-secondary">
                {note}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-label text-white/40">Scale</label>
          <select
            value={selectedScale.name}
            onChange={(e) => {
              const scale = SCALES.find((s) => s.name === e.target.value);
              if (scale) setSelectedScale(scale);
            }}
            className="glass-interactive px-3 py-2 rounded-lg text-body text-white/80 bg-transparent outline-none"
          >
            {SCALES.map((scale) => (
              <option key={scale.name} value={scale.name} className="bg-surface-secondary">
                {scale.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Piano keyboard */}
      <div className="glass-card p-4 rounded-xl overflow-x-auto">
        <PianoKeyboard highlightedNotes={scaleNotes} rootNote={rootNote} />
      </div>

      {/* Scale notes list */}
      <div className="flex gap-2 flex-wrap">
        {selectedScale.intervals.map((interval, i) => (
          <div
            key={i}
            className={`glass-interactive px-3 py-2 rounded-lg text-center min-w-[56px] ${
              i === 0 ? "border border-accent-purple/30" : ""
            }`}
          >
            <div className="text-body font-mono text-white/80">{scaleNotes[i]}</div>
            <div className="text-label text-white/40">{getIntervalName(interval)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
