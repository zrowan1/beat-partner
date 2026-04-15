export const NOTES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

export type NoteName = (typeof NOTES)[number];

// Maps enharmonic display names
export const NOTE_DISPLAY: Record<string, string> = {
  "C#": "C#/Db",
  "D#": "D#/Eb",
  "F#": "F#/Gb",
  "G#": "G#/Ab",
  "A#": "A#/Bb",
};

export function displayNote(note: string): string {
  return NOTE_DISPLAY[note] ?? note;
}

// Scale definitions as semitone intervals from root
export interface ScaleDefinition {
  name: string;
  intervals: number[];
  category: "major" | "minor" | "modal" | "pentatonic" | "other";
}

export const SCALES: ScaleDefinition[] = [
  { name: "Major (Ionian)", intervals: [0, 2, 4, 5, 7, 9, 11], category: "major" },
  { name: "Natural Minor (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10], category: "minor" },
  { name: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11], category: "minor" },
  { name: "Melodic Minor", intervals: [0, 2, 3, 5, 7, 9, 11], category: "minor" },
  { name: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10], category: "modal" },
  { name: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10], category: "modal" },
  { name: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11], category: "modal" },
  { name: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10], category: "modal" },
  { name: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10], category: "modal" },
  { name: "Major Pentatonic", intervals: [0, 2, 4, 7, 9], category: "pentatonic" },
  { name: "Minor Pentatonic", intervals: [0, 3, 5, 7, 10], category: "pentatonic" },
  { name: "Blues", intervals: [0, 3, 5, 6, 7, 10], category: "other" },
];

// Chord definitions as semitone intervals from root
export interface ChordDefinition {
  name: string;
  symbol: string;
  intervals: number[];
}

export const CHORDS: ChordDefinition[] = [
  { name: "Major", symbol: "", intervals: [0, 4, 7] },
  { name: "Minor", symbol: "m", intervals: [0, 3, 7] },
  { name: "Diminished", symbol: "dim", intervals: [0, 3, 6] },
  { name: "Augmented", symbol: "aug", intervals: [0, 4, 8] },
  { name: "Dominant 7th", symbol: "7", intervals: [0, 4, 7, 10] },
  { name: "Major 7th", symbol: "maj7", intervals: [0, 4, 7, 11] },
  { name: "Minor 7th", symbol: "m7", intervals: [0, 3, 7, 10] },
  { name: "Suspended 2nd", symbol: "sus2", intervals: [0, 2, 7] },
  { name: "Suspended 4th", symbol: "sus4", intervals: [0, 5, 7] },
];

// Get notes in a scale given a root note
export function getScaleNotes(root: NoteName, scale: ScaleDefinition): string[] {
  const rootIndex = NOTES.indexOf(root);
  return scale.intervals.map((interval) => NOTES[(rootIndex + interval) % 12]);
}

// Get notes in a chord given a root note
export function getChordNotes(root: NoteName, chord: ChordDefinition): string[] {
  const rootIndex = NOTES.indexOf(root);
  return chord.intervals.map((interval) => NOTES[(rootIndex + interval) % 12]);
}

// Interval names for display
const INTERVAL_NAMES = [
  "Root", "m2", "M2", "m3", "M3", "P4", "Tritone", "P5", "m6", "M6", "m7", "M7",
];

export function getIntervalName(semitones: number): string {
  return INTERVAL_NAMES[semitones % 12];
}

// Diatonic chords for a major scale
export interface DiatonicChord {
  degree: string; // Roman numeral
  chordType: ChordDefinition;
  rootInterval: number; // Semitones from scale root
}

const MAJOR_DIATONIC: DiatonicChord[] = [
  { degree: "I", chordType: CHORDS[0], rootInterval: 0 },   // Major
  { degree: "ii", chordType: CHORDS[1], rootInterval: 2 },   // minor
  { degree: "iii", chordType: CHORDS[1], rootInterval: 4 },  // minor
  { degree: "IV", chordType: CHORDS[0], rootInterval: 5 },   // Major
  { degree: "V", chordType: CHORDS[0], rootInterval: 7 },    // Major
  { degree: "vi", chordType: CHORDS[1], rootInterval: 9 },   // minor
  { degree: "vii\u00B0", chordType: CHORDS[2], rootInterval: 11 }, // dim
];

const MINOR_DIATONIC: DiatonicChord[] = [
  { degree: "i", chordType: CHORDS[1], rootInterval: 0 },    // minor
  { degree: "ii\u00B0", chordType: CHORDS[2], rootInterval: 2 },  // dim
  { degree: "III", chordType: CHORDS[0], rootInterval: 3 },  // Major
  { degree: "iv", chordType: CHORDS[1], rootInterval: 5 },   // minor
  { degree: "v", chordType: CHORDS[1], rootInterval: 7 },    // minor
  { degree: "VI", chordType: CHORDS[0], rootInterval: 8 },   // Major
  { degree: "VII", chordType: CHORDS[0], rootInterval: 10 }, // Major
];

export function getDiatonicChords(
  root: NoteName,
  mode: "major" | "minor"
): { degree: string; root: NoteName; symbol: string; notes: string[] }[] {
  const diatonic = mode === "major" ? MAJOR_DIATONIC : MINOR_DIATONIC;
  const rootIndex = NOTES.indexOf(root);

  return diatonic.map((d) => {
    const chordRoot = NOTES[(rootIndex + d.rootInterval) % 12] as NoteName;
    return {
      degree: d.degree,
      root: chordRoot,
      symbol: `${chordRoot}${d.chordType.symbol}`,
      notes: getChordNotes(chordRoot, d.chordType),
    };
  });
}

// Circle of Fifths data
export const CIRCLE_OF_FIFTHS_MAJOR: NoteName[] = [
  "C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F",
];

export const CIRCLE_OF_FIFTHS_MINOR: NoteName[] = [
  "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "F", "C", "G", "D",
];

// Genre-based chord progressions
export interface GenreProgression {
  genre: string;
  progressions: {
    name: string;
    numerals: string;
  }[];
}

export const GENRE_PROGRESSIONS: GenreProgression[] = [
  {
    genre: "Pop",
    progressions: [
      { name: "Pop Standard", numerals: "I - V - vi - IV" },
      { name: "Sensitive", numerals: "vi - IV - I - V" },
      { name: "Axis", numerals: "I - IV - vi - V" },
      { name: "50s Doo-Wop", numerals: "I - vi - IV - V" },
    ],
  },
  {
    genre: "Rock",
    progressions: [
      { name: "Classic Rock", numerals: "I - IV - V" },
      { name: "Blues Rock", numerals: "I - I - IV - IV - V - IV - I - V" },
      { name: "Power", numerals: "I - bVII - IV" },
      { name: "Grunge", numerals: "I - bIII - bVII - IV" },
    ],
  },
  {
    genre: "Jazz",
    progressions: [
      { name: "ii-V-I", numerals: "ii7 - V7 - Imaj7" },
      { name: "I-vi-ii-V (Rhythm Changes)", numerals: "Imaj7 - vi7 - ii7 - V7" },
      { name: "Minor ii-V-i", numerals: "ii\u00F8 - V7 - i" },
      { name: "Autumn Leaves", numerals: "ii7 - V7 - Imaj7 - IVmaj7 - vii\u00F8 - III7 - vi" },
    ],
  },
  {
    genre: "EDM",
    progressions: [
      { name: "Trance", numerals: "vi - IV - I - V" },
      { name: "House", numerals: "I - vi - IV - V" },
      { name: "Progressive", numerals: "i - VI - III - VII" },
      { name: "Future Bass", numerals: "I - iii - vi - IV" },
    ],
  },
  {
    genre: "Hip-hop",
    progressions: [
      { name: "Trap", numerals: "i - iv - VI - V" },
      { name: "Boom Bap", numerals: "i - VII - VI - V" },
      { name: "Lo-fi", numerals: "ii7 - V7 - Imaj7 - vi7" },
      { name: "Dark", numerals: "i - i - iv - V" },
    ],
  },
  {
    genre: "R&B",
    progressions: [
      { name: "Neo Soul", numerals: "Imaj7 - IVmaj7 - iii7 - vi7" },
      { name: "Classic Soul", numerals: "I - vi - ii - V" },
      { name: "Modern R&B", numerals: "vi7 - IV - I - V" },
    ],
  },
];

// Convert Roman numeral progression to actual chords in a key
export function progressionToChords(
  numerals: string,
  root: NoteName,
  mode: "major" | "minor" = "major"
): string[] {
  const diatonic = getDiatonicChords(root, mode);

  return numerals.split(" - ").map((numeral) => {
    const trimmed = numeral.trim();
    // Try to find a matching degree
    const match = diatonic.find(
      (d) => d.degree === trimmed || d.degree.replace("\u00B0", "dim") === trimmed
    );
    if (match) return match.symbol;
    // For numerals with extensions (7, maj7, etc.), show as-is with root
    return trimmed;
  });
}

// Check if a note is a black key on piano
export function isBlackKey(note: string): boolean {
  return note.includes("#");
}
