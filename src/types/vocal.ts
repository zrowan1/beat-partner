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

export interface VocalProductionNotes {
  id: number | null;
  projectId: number;
  micChoice: string;
  vocalChain: VocalChain;
  recordingNotes: string;
  editingNotes: string;
  tuningNotes: string;
  checklist: ChecklistItem[];
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
