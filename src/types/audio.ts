export interface AudioAnalysisResult {
  filePath: string;
  bpm: number | null;
  key: string | null;
  durationSecs: number;
  sampleRate: number;
  channels: number;
}

export interface SpectrumData {
  magnitudes: number[];
  frequencyResolution: number;
  sampleRate: number;
}

export interface AnalysisProgress {
  type: "decoding" | "analyzing" | "complete" | "error";
  percent?: number;
  step?: string;
  result?: AudioAnalysisResult;
  message?: string;
}

export interface ReferenceTrack {
  id: number;
  projectId: number;
  filePath: string;
  fileName: string;
  bpm: number | null;
  key: string | null;
  durationSecs: number;
  addedAt: string;
}
