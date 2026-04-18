import { type GuitarVoicing } from "./guitarVoicings";

interface GuitarChordDiagramProps {
  voicing: GuitarVoicing;
}

const STRING_COUNT = 6;
const FRET_COUNT = 5;
const DIAGRAM_WIDTH = 150;
const DIAGRAM_HEIGHT = 172;
const LEFT_MARGIN = 28;
const RIGHT_MARGIN = 12;
const TOP_MARGIN = 32;
const BOTTOM_MARGIN = 12;

const STRING_SPACING =
  (DIAGRAM_WIDTH - LEFT_MARGIN - RIGHT_MARGIN) / (STRING_COUNT - 1);
const FRET_SPACING =
  (DIAGRAM_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN) / FRET_COUNT;

export function GuitarChordDiagram({ voicing }: GuitarChordDiagramProps) {
  const { frets, startingFret, recommended } = voicing;

  const nutY = TOP_MARGIN;
  const stringsX = Array.from(
    { length: STRING_COUNT },
    (_, i) => LEFT_MARGIN + i * STRING_SPACING
  );
  const fretsY = Array.from(
    { length: FRET_COUNT + 1 },
    (_, i) => nutY + i * FRET_SPACING
  );

  // String indicators (X or O) above the nut
  const stringIndicators = frets.map((fret) => {
    if (fret === -1) return "X";
    if (fret === 0) return "O";
    return null;
  });

  // Finger positions
  const fingerPositions = frets
    .map((fret, stringIndex) => {
      if (fret <= 0) return null;
      const relativeFret = fret - startingFret + 1;
      if (relativeFret < 1 || relativeFret > FRET_COUNT) return null;

      const cx = stringsX[stringIndex];
      const cy = nutY + (relativeFret - 0.5) * FRET_SPACING;
      const isRoot = stringIndex === voicing.rootString;
      return { cx, cy, isRoot, fret };
    })
    .filter(Boolean) as { cx: number; cy: number; isRoot: boolean; fret: number }[];

  const showNut = startingFret === 1;

  return (
    <div className="flex flex-col items-center">
      {/* Title + recommended badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-label text-white/50 text-center leading-tight">
          {voicing.name}
        </span>
        {recommended && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 whitespace-nowrap">
            Recommended
          </span>
        )}
      </div>

      <svg
        width={DIAGRAM_WIDTH}
        height={DIAGRAM_HEIGHT}
        viewBox={`0 0 ${DIAGRAM_WIDTH} ${DIAGRAM_HEIGHT}`}
        className="block"
      >
        {/* Starting fret number (left side) */}
        {!showNut && (
          <text
            x={4}
            y={nutY + FRET_SPACING * 0.5 + 4}
            fill="rgba(255,255,255,0.7)"
            fontSize={11}
            fontFamily="monospace"
          >
            {startingFret}
          </text>
        )}

        {/* String indicators (X / O) above nut */}
        {stringIndicators.map((indicator, i) =>
          indicator ? (
            <text
              key={`ind-${i}`}
              x={stringsX[i]}
              y={nutY - 6}
              textAnchor="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize={11}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {indicator}
            </text>
          ) : null
        )}

        {/* Frets (horizontal lines) */}
        {fretsY.map((y, i) => (
          <line
            key={`fret-${i}`}
            x1={stringsX[0]}
            y1={y}
            x2={stringsX[STRING_COUNT - 1]}
            y2={y}
            stroke={
              showNut && i === 0
                ? "rgba(255,255,255,0.5)"
                : "rgba(255,255,255,0.2)"
            }
            strokeWidth={showNut && i === 0 ? 3 : 1}
          />
        ))}

        {/* Strings (vertical lines) */}
        {stringsX.map((x, i) => (
          <line
            key={`string-${i}`}
            x1={x}
            y1={nutY}
            x2={x}
            y2={fretsY[FRET_COUNT]}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={i <= 1 ? 1.5 : 1}
          />
        ))}

        {/* Finger dots */}
        {fingerPositions.map((pos, i) => (
          <g key={`finger-${i}`}>
            <circle
              cx={pos.cx}
              cy={pos.cy}
              r={7}
              fill={
                pos.isRoot
                  ? "rgba(167, 139, 250, 0.85)"
                  : "rgba(34, 211, 238, 0.8)"
              }
              stroke={
                pos.isRoot
                  ? "rgba(167, 139, 250, 1)"
                  : "rgba(34, 211, 238, 0.9)"
              }
              strokeWidth={1}
            />
            <text
              x={pos.cx}
              y={pos.cy + 3.5}
              textAnchor="middle"
              fill="rgba(0,0,0,0.85)"
              fontSize={9}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {pos.fret}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
