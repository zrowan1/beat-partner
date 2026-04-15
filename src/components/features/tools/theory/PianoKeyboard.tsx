import { type NoteName } from "./theoryData";

interface PianoKeyboardProps {
  highlightedNotes: string[];
  rootNote?: string;
  octaves?: number;
  onNoteClick?: (note: string) => void;
}

const WHITE_KEYS_PER_OCTAVE = 7;
const WHITE_KEY_WIDTH = 36;
const WHITE_KEY_HEIGHT = 120;
const BLACK_KEY_WIDTH = 22;
const BLACK_KEY_HEIGHT = 72;

// Black key offsets relative to white keys
const BLACK_KEY_OFFSETS = [
  { note: "C#", after: 0 },
  { note: "D#", after: 1 },
  { note: "F#", after: 3 },
  { note: "G#", after: 4 },
  { note: "A#", after: 5 },
];

export function PianoKeyboard({
  highlightedNotes,
  rootNote,
  octaves = 2,
  onNoteClick,
}: PianoKeyboardProps) {
  const totalWhiteKeys = WHITE_KEYS_PER_OCTAVE * octaves;
  const totalWidth = totalWhiteKeys * WHITE_KEY_WIDTH;

  const whiteNotes: NoteName[] = ["C", "D", "E", "F", "G", "A", "B"];

  return (
    <div className="relative overflow-x-auto">
      <svg
        width={totalWidth}
        height={WHITE_KEY_HEIGHT + 24}
        viewBox={`0 0 ${totalWidth} ${WHITE_KEY_HEIGHT + 24}`}
        className="block"
      >
        {/* White keys */}
        {Array.from({ length: totalWhiteKeys }).map((_, i) => {
          const note = whiteNotes[i % 7];
          const isHighlighted = highlightedNotes.includes(note);
          const isRoot = rootNote === note;

          return (
            <g key={`white-${i}`}>
              <rect
                x={i * WHITE_KEY_WIDTH}
                y={0}
                width={WHITE_KEY_WIDTH - 1}
                height={WHITE_KEY_HEIGHT}
                rx={4}
                fill={
                  isRoot
                    ? "rgba(167, 139, 250, 0.4)"
                    : isHighlighted
                      ? "rgba(34, 211, 238, 0.3)"
                      : "rgba(255, 255, 255, 0.08)"
                }
                stroke={
                  isRoot
                    ? "rgba(167, 139, 250, 0.6)"
                    : isHighlighted
                      ? "rgba(34, 211, 238, 0.4)"
                      : "rgba(255, 255, 255, 0.12)"
                }
                strokeWidth={1}
                className="cursor-pointer transition-all duration-150"
                onClick={() => onNoteClick?.(note)}
              />
              {/* Note label */}
              {i < 7 && (
                <text
                  x={i * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH / 2}
                  y={WHITE_KEY_HEIGHT + 16}
                  textAnchor="middle"
                  fill={
                    isRoot
                      ? "rgba(167, 139, 250, 0.9)"
                      : isHighlighted
                        ? "rgba(34, 211, 238, 0.8)"
                        : "rgba(255, 255, 255, 0.3)"
                  }
                  fontSize={11}
                  fontFamily="monospace"
                >
                  {note}
                </text>
              )}
            </g>
          );
        })}

        {/* Black keys */}
        {Array.from({ length: octaves }).flatMap((_, octave) =>
          BLACK_KEY_OFFSETS.map(({ note, after }) => {
            const x =
              (octave * WHITE_KEYS_PER_OCTAVE + after) * WHITE_KEY_WIDTH +
              WHITE_KEY_WIDTH -
              BLACK_KEY_WIDTH / 2;

            const isHighlighted = highlightedNotes.includes(note);
            const isRoot = rootNote === note;

            return (
              <rect
                key={`black-${octave}-${note}`}
                x={x}
                y={0}
                width={BLACK_KEY_WIDTH}
                height={BLACK_KEY_HEIGHT}
                rx={3}
                fill={
                  isRoot
                    ? "rgba(167, 139, 250, 0.6)"
                    : isHighlighted
                      ? "rgba(34, 211, 238, 0.5)"
                      : "rgba(8, 8, 12, 0.9)"
                }
                stroke={
                  isRoot
                    ? "rgba(167, 139, 250, 0.8)"
                    : isHighlighted
                      ? "rgba(34, 211, 238, 0.6)"
                      : "rgba(255, 255, 255, 0.08)"
                }
                strokeWidth={1}
                className="cursor-pointer transition-all duration-150"
                onClick={() => onNoteClick?.(note)}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}
