import {
  CIRCLE_OF_FIFTHS_MAJOR,
  CIRCLE_OF_FIFTHS_MINOR,
  type NoteName,
} from "./theoryData";

interface CircleOfFifthsProps {
  rootNote: NoteName;
  onRootChange: (note: NoteName) => void;
}

const SIZE = 320;
const CENTER = SIZE / 2;
const OUTER_RADIUS = 130;
const INNER_RADIUS = 88;
const LABEL_OUTER_RADIUS = OUTER_RADIUS + 2;
const LABEL_INNER_RADIUS = INNER_RADIUS - 14;

export function CircleOfFifths({ rootNote, onRootChange }: CircleOfFifthsProps) {
  const relativeMinorIndex = CIRCLE_OF_FIFTHS_MAJOR.indexOf(rootNote);
  const relativeMinor =
    relativeMinorIndex >= 0 ? CIRCLE_OF_FIFTHS_MINOR[relativeMinorIndex] : null;

  return (
    <div className="flex justify-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Background circles */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={OUTER_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={INNER_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />

        {/* Outer ring: Major keys */}
        {CIRCLE_OF_FIFTHS_MAJOR.map((note, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = CENTER + LABEL_OUTER_RADIUS * Math.cos(angle);
          const y = CENTER + LABEL_OUTER_RADIUS * Math.sin(angle);
          const isActive = note === rootNote;

          return (
            <g key={`major-${note}`} onClick={() => onRootChange(note)} className="cursor-pointer">
              <circle
                cx={x}
                cy={y}
                r={18}
                fill={
                  isActive
                    ? "rgba(34, 211, 238, 0.3)"
                    : "rgba(255, 255, 255, 0.06)"
                }
                stroke={
                  isActive
                    ? "rgba(34, 211, 238, 0.5)"
                    : "rgba(255, 255, 255, 0.1)"
                }
                strokeWidth={1}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? "rgba(34, 211, 238, 0.95)" : "rgba(255, 255, 255, 0.7)"}
                fontSize={12}
                fontWeight={isActive ? 600 : 400}
                fontFamily="monospace"
              >
                {note}
              </text>
            </g>
          );
        })}

        {/* Inner ring: Minor keys */}
        {CIRCLE_OF_FIFTHS_MINOR.map((note, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = CENTER + LABEL_INNER_RADIUS * Math.cos(angle);
          const y = CENTER + LABEL_INNER_RADIUS * Math.sin(angle);
          const isActive = note === relativeMinor;

          return (
            <g key={`minor-${note}`} className="cursor-pointer" onClick={() => {
              // Find the relative major and set that as root
              const majorIndex = CIRCLE_OF_FIFTHS_MINOR.indexOf(note);
              if (majorIndex >= 0) {
                onRootChange(CIRCLE_OF_FIFTHS_MAJOR[majorIndex]);
              }
            }}>
              <circle
                cx={x}
                cy={y}
                r={14}
                fill={
                  isActive
                    ? "rgba(167, 139, 250, 0.3)"
                    : "rgba(255, 255, 255, 0.04)"
                }
                stroke={
                  isActive
                    ? "rgba(167, 139, 250, 0.5)"
                    : "rgba(255, 255, 255, 0.08)"
                }
                strokeWidth={1}
              />
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={
                  isActive
                    ? "rgba(167, 139, 250, 0.95)"
                    : "rgba(255, 255, 255, 0.45)"
                }
                fontSize={10}
                fontFamily="monospace"
              >
                {note}m
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={CENTER}
          y={CENTER - 8}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.3)"
          fontSize={10}
        >
          Circle of
        </text>
        <text
          x={CENTER}
          y={CENTER + 8}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.3)"
          fontSize={10}
        >
          Fifths
        </text>
      </svg>
    </div>
  );
}
