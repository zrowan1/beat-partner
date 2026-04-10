export type ProductionPhase =
  | "idea"
  | "arrangement"
  | "sound-design"
  | "mixing"
  | "mastering"
  | "done";

export interface Project {
  id: number | null;
  name: string;
  bpm: number | null;
  key: string | null;
  genre: string | null;
  phase: ProductionPhase;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}
