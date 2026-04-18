export type ChecklistCategory =
  | "mic-setup"
  | "gain-staging"
  | "room"
  | "takes"
  | "performance"
  | "custom";

export interface VocalChain {
  eq: string;
  compressor: string;
  reverb: string;
  delay: string;
  other: string;
}

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  text: string;
  completed: boolean;
}

export interface CompingProgress {
  completedSections: string[];
  userNotes: string;
}

export interface TuningTimingProgress {
  completedSections: string[];
  userNotes: string;
}

export interface VocalProductionNotes {
  id: number | null;
  projectId: number;
  micChoice: string;
  vocalChain: VocalChain;
  recordingNotes: string;
  editingNotes: string;
  tuningNotes: string;
  checklist: ChecklistItem[];
  compingProgress: CompingProgress;
  tuningTimingProgress: TuningTimingProgress;
  updatedAt: string | null;
}

export interface ReferenceVocal {
  id: number | null;
  projectId: number;
  filePath: string;
  fileName: string;
  artistName: string;
  bpm: number | null;
  key: string | null;
  durationSecs: number;
  notes: string;
  addedAt: string | null;
}

export interface VocalAnalysisResult {
  filePath: string;
  durationSecs: number;
  estimatedFormantRange: string;
  spectralBrightness: string;
  dynamicsRangeDb: number;
  dynamicsCharacter: string;
  presencePeakDb: number;
  lowEndRumbleDb: number;
  analyzedAt: string;
}

export interface VocalEffectPreset {
  id: string;
  name: string;
  genre: string;
  description: string;
  chain: VocalChain;
}

export const CHECKLIST_CATEGORIES: {
  id: ChecklistCategory;
  label: string;
}[] = [
  { id: "mic-setup", label: "Mic Setup" },
  { id: "gain-staging", label: "Gain Staging" },
  { id: "room", label: "Room" },
  { id: "takes", label: "Takes" },
  { id: "performance", label: "Performance" },
  { id: "custom", label: "Custom" },
];
