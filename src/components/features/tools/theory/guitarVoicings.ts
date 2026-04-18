import { type NoteName } from "./theoryData";

/** Guitar string state: -1 = mute, 0 = open, >0 = fret number */
export type GuitarString = number;

export interface GuitarVoicing {
  name: string;
  frets: GuitarString[]; // [low E, A, D, G, B, high e]
  startingFret: number; // 1-based first visible fret
  rootString: number; // 0-indexed string where root is (0 = low E)
  recommended: boolean;
}

// ─────────────────────────────────────────────────────────────
//  OPEN CHORD LIBRARY — fixed-position chords in standard tuning
// ─────────────────────────────────────────────────────────────

interface OpenChordDef {
  root: NoteName;
  name: string;
  frets: GuitarString[];
  rootString: number;
}

const OPEN_CHORDS: Record<string, OpenChordDef[]> = {
  Major: [
    { root: "C", name: "Open C", frets: [-1, 3, 2, 0, 1, 0], rootString: 1 },
    { root: "A", name: "Open A", frets: [-1, 0, 2, 2, 2, 0], rootString: 1 },
    { root: "G", name: "Open G", frets: [3, 2, 0, 0, 0, 3], rootString: 0 },
    { root: "E", name: "Open E", frets: [0, 2, 2, 1, 0, 0], rootString: 0 },
    { root: "D", name: "Open D", frets: [-1, -1, 0, 2, 3, 2], rootString: 2 },
    { root: "F", name: "Open F", frets: [1, 3, 3, 2, 1, 1], rootString: 0 },
  ],
  Minor: [
    { root: "A", name: "Open Am", frets: [-1, 0, 2, 2, 1, 0], rootString: 1 },
    { root: "E", name: "Open Em", frets: [0, 2, 2, 0, 0, 0], rootString: 0 },
    { root: "D", name: "Open Dm", frets: [-1, -1, 0, 2, 3, 1], rootString: 2 },
  ],
  "Dominant 7th": [
    { root: "C", name: "Open C7", frets: [-1, 3, 2, 3, 1, 0], rootString: 1 },
    { root: "A", name: "Open A7", frets: [-1, 0, 2, 0, 2, 0], rootString: 1 },
    { root: "G", name: "Open G7", frets: [3, 2, 0, 0, 0, 1], rootString: 0 },
    { root: "E", name: "Open E7", frets: [0, 2, 0, 1, 0, 0], rootString: 0 },
    { root: "D", name: "Open D7", frets: [-1, -1, 0, 2, 1, 2], rootString: 2 },
    { root: "B", name: "Open B7", frets: [-1, 2, 1, 2, 0, 2], rootString: 1 },
  ],
  "Major 7th": [
    { root: "C", name: "Open Cmaj7", frets: [-1, 3, 2, 0, 0, 0], rootString: 1 },
    { root: "A", name: "Open Amaj7", frets: [-1, 0, 2, 1, 2, 0], rootString: 1 },
    { root: "G", name: "Open Gmaj7", frets: [3, 2, 0, 0, 0, 2], rootString: 0 },
    { root: "E", name: "Open Emaj7", frets: [0, 2, 1, 1, 0, 0], rootString: 0 },
    { root: "F", name: "Open Fmaj7", frets: [1, 3, 3, 2, 1, 0], rootString: 0 },
    { root: "D", name: "Open Dmaj7", frets: [-1, -1, 0, 2, 2, 2], rootString: 2 },
  ],
  "Minor 7th": [
    { root: "A", name: "Open Am7", frets: [-1, 0, 2, 0, 1, 0], rootString: 1 },
    { root: "E", name: "Open Em7", frets: [0, 2, 0, 0, 0, 0], rootString: 0 },
    { root: "D", name: "Open Dm7", frets: [-1, -1, 0, 2, 1, 1], rootString: 2 },
    { root: "B", name: "Open Bm7", frets: [-1, 2, 0, 2, 0, 2], rootString: 1 },
  ],
  "Suspended 2nd": [
    { root: "D", name: "Open Dsus2", frets: [-1, -1, 0, 2, 3, 0], rootString: 2 },
    { root: "A", name: "Open Asus2", frets: [-1, 0, 2, 2, 0, 0], rootString: 1 },
    { root: "E", name: "Open Esus2", frets: [0, 2, 4, 4, 0, 0], rootString: 0 },
  ],
  "Suspended 4th": [
    { root: "D", name: "Open Dsus4", frets: [-1, -1, 0, 2, 3, 3], rootString: 2 },
    { root: "A", name: "Open Asus4", frets: [-1, 0, 2, 2, 3, 0], rootString: 1 },
    { root: "E", name: "Open Esus4", frets: [0, 2, 2, 2, 0, 0], rootString: 0 },
  ],
  Diminished: [],
  Augmented: [],
};

// ─────────────────────────────────────────────────────────────
//  MOVABLE SHAPE LIBRARY — barre / CAGED / partial shapes
// ─────────────────────────────────────────────────────────────

interface MovableShapeDef {
  name: string;
  shape: GuitarString[];
  rootString: number;
  baseRoot: NoteName; // note at fret 0 on the root string
  rootFretOffset?: number; // root fret within shape (default 0)
}

const MOVABLE_SHAPES: Record<string, MovableShapeDef[]> = {
  Major: [
    { name: "E-shape", shape: [0, 2, 2, 1, 0, 0], rootString: 0, baseRoot: "E" },
    { name: "A-shape", shape: [-1, 0, 2, 2, 2, 0], rootString: 1, baseRoot: "A" },
    { name: "D-shape", shape: [-1, -1, 0, 2, 3, 2], rootString: 2, baseRoot: "D" },
    {
      name: "C-shape",
      shape: [-1, 3, 2, 0, 1, 0],
      rootString: 1,
      baseRoot: "A",
      rootFretOffset: 3,
    },
    {
      name: "Partial (top 4 strings)",
      shape: [-1, -1, 2, 1, 0, 0],
      rootString: 2,
      baseRoot: "D",
      rootFretOffset: 2,
    },
  ],
  Minor: [
    { name: "Em-shape", shape: [0, 2, 2, 0, 0, 0], rootString: 0, baseRoot: "E" },
    { name: "Am-shape", shape: [-1, 0, 2, 2, 1, 0], rootString: 1, baseRoot: "A" },
    { name: "Dm-shape", shape: [-1, -1, 0, 2, 3, 1], rootString: 2, baseRoot: "D" },
    {
      name: "Partial (top 4 strings)",
      shape: [-1, -1, 2, 0, 0, 0],
      rootString: 2,
      baseRoot: "D",
      rootFretOffset: 2,
    },
  ],
  "Dominant 7th": [
    { name: "E7-shape", shape: [0, 2, 0, 1, 0, 0], rootString: 0, baseRoot: "E" },
    { name: "A7-shape", shape: [-1, 0, 2, 0, 2, 0], rootString: 1, baseRoot: "A" },
  ],
  "Major 7th": [
    { name: "Emaj7-shape", shape: [0, 2, 1, 1, 0, 0], rootString: 0, baseRoot: "E" },
    { name: "Amaj7-shape", shape: [-1, 0, 2, 1, 2, 0], rootString: 1, baseRoot: "A" },
  ],
  "Minor 7th": [
    { name: "Em7-shape", shape: [0, 2, 0, 0, 0, 0], rootString: 0, baseRoot: "E" },
    { name: "Am7-shape", shape: [-1, 0, 2, 0, 1, 0], rootString: 1, baseRoot: "A" },
  ],
  Diminished: [
    {
      name: "A-dim shape",
      shape: [-1, 0, 1, 2, 1, -1],
      rootString: 1,
      baseRoot: "A",
    },
  ],
  Augmented: [
    {
      name: "A-aug shape",
      shape: [-1, 0, 3, 2, 1, 0],
      rootString: 1,
      baseRoot: "A",
    },
  ],
  "Suspended 2nd": [
    { name: "Esus2-shape", shape: [0, 2, 4, 4, 0, 0], rootString: 0, baseRoot: "E" },
    { name: "Asus2-shape", shape: [-1, 0, 2, 2, 0, 0], rootString: 1, baseRoot: "A" },
  ],
  "Suspended 4th": [
    { name: "Esus4-shape", shape: [0, 2, 2, 2, 0, 0], rootString: 0, baseRoot: "E" },
    { name: "Asus4-shape", shape: [-1, 0, 2, 2, 3, 0], rootString: 1, baseRoot: "A" },
  ],
};

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const NOTE_SEMITONE: Record<NoteName, number> = {
  C: 0,
  "C#": 1,
  D: 2,
  "D#": 3,
  E: 4,
  F: 5,
  "F#": 6,
  G: 7,
  "G#": 8,
  A: 9,
  "A#": 10,
  B: 11,
};

const CHORD_TYPE_SHORT: Record<string, string> = {
  Major: "",
  Minor: "m",
  "Dominant 7th": "7",
  "Major 7th": "maj7",
  "Minor 7th": "m7",
  Diminished: "dim",
  Augmented: "aug",
  "Suspended 2nd": "sus2",
  "Suspended 4th": "sus4",
};

/** Positive semitone distance from → to (0..11) */
function semitoneDistance(from: NoteName, to: NoteName): number {
  const d = NOTE_SEMITONE[to] - NOTE_SEMITONE[from];
  return ((d % 12) + 12) % 12;
}

/** Transpose a shape by N frets. -1 (mute) stays -1. */
function transpose(shape: GuitarString[], shift: number): GuitarString[] {
  return shape.map((f) => (f === -1 ? -1 : f + shift));
}

/** Calculate starting fret for the diagram (1-based). */
function computeStartingFret(frets: GuitarString[]): number {
  const played = frets.filter((f) => f > 0);
  if (played.length === 0) return 1;
  const min = Math.min(...played);
  return min > 4 ? min : 1;
}

/** Count played (non-muted) strings. */
function playedCount(frets: GuitarString[]): number {
  return frets.filter((f) => f >= 0).length;
}

/** Max fret used (excluding mutes). */
function maxFret(frets: GuitarString[]): number {
  const played = frets.filter((f) => f > 0);
  return played.length > 0 ? Math.max(...played) : 0;
}

/** Min fret used (excluding mutes and open strings). */
function minFret(frets: GuitarString[]): number {
  const played = frets.filter((f) => f > 0);
  return played.length > 0 ? Math.min(...played) : 0;
}

/** Any impossible frets (< -1 means below nut on a non-muted string)? */
function hasInvalidFrets(frets: GuitarString[]): boolean {
  return frets.some((f) => f < -1);
}

/** String key for deduplication. */
function fretKey(frets: GuitarString[]): string {
  return frets.join(",");
}

// ─────────────────────────────────────────────────────────────
//  GENERATION
// ─────────────────────────────────────────────────────────────

/**
 * Return every conventional guitar voicing for a chord.
 * Includes open chords (when they match the target root) and all applicable
 * transposed movable shapes. Results are deduplicated, filtered for
 * playability, sorted low-to-high, and the best option is marked recommended.
 */
export function getGuitarVoicings(
  root: NoteName,
  chordTypeName: string
): GuitarVoicing[] {
  const voicings: GuitarVoicing[] = [];
  const seen = new Set<string>();
  const suffix = CHORD_TYPE_SHORT[chordTypeName] ?? "";

  const addVoicing = (v: GuitarVoicing) => {
    const key = fretKey(v.frets);
    if (seen.has(key)) return;

    // Skip impossible or impractical shapes
    if (hasInvalidFrets(v.frets)) return;
    if (maxFret(v.frets) > 14) return;
    if (playedCount(v.frets) < 3) return;

    seen.add(key);
    voicings.push(v);
  };

  // ── 1. Open chords (only when root matches) ──
  const openDefs = OPEN_CHORDS[chordTypeName] ?? [];
  for (const def of openDefs) {
    if (def.root !== root) continue;
    addVoicing({
      name: def.name,
      frets: def.frets,
      startingFret: computeStartingFret(def.frets),
      rootString: def.rootString,
      recommended: false,
    });
  }

  // ── 2. Movable shapes (transposed to target root) ──
  const movableDefs = MOVABLE_SHAPES[chordTypeName] ?? [];
  for (const def of movableDefs) {
    const offset = def.rootFretOffset ?? 0;
    const shift = semitoneDistance(def.baseRoot, root) - offset;
    const frets = transpose(def.shape, shift);

    const chordName = suffix ? `${root}${suffix}` : `${root}`;
    addVoicing({
      name: `${chordName} — ${def.name}`,
      frets,
      startingFret: computeStartingFret(frets),
      rootString: def.rootString,
      recommended: false,
    });

    // For diminished: add inversion 3 frets up (diminished symmetry)
    if (chordTypeName === "Diminished") {
      const invFrets = transpose(def.shape, shift + 3);
      if (!hasInvalidFrets(invFrets) && maxFret(invFrets) <= 14) {
        addVoicing({
          name: `${chordName} — ${def.name} +3 frets (inversion)`,
          frets: invFrets,
          startingFret: computeStartingFret(invFrets),
          rootString: def.rootString,
          recommended: false,
        });
      }
    }

    // For augmented: add inversion 4 frets up (augmented symmetry)
    if (chordTypeName === "Augmented") {
      const invFrets = transpose(def.shape, shift + 4);
      if (!hasInvalidFrets(invFrets) && maxFret(invFrets) <= 14) {
        addVoicing({
          name: `${chordName} — ${def.name} +4 frets (inversion)`,
          frets: invFrets,
          startingFret: computeStartingFret(invFrets),
          rootString: def.rootString,
          recommended: false,
        });
      }
    }
  }

  // ── 3. Sort by lowest fret (ascending) ──
  voicings.sort((a, b) => minFret(a.frets) - minFret(b.frets));

  // ── 4. Mark recommended ──
  // Preference: open chord first, otherwise lowest barre shape
  if (voicings.length > 0) {
    const openIdx = voicings.findIndex((v) => v.name.startsWith("Open "));
    const recIdx = openIdx >= 0 ? openIdx : 0;
    voicings[recIdx].recommended = true;
  }

  return voicings;
}
