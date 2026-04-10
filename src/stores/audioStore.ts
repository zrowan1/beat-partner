import { create } from "zustand";

interface AudioAnalysis {
  bpm: number | null;
  key: string | null;
  spectrum: number[] | null;
}

interface AudioState {
  analysisResults: AudioAnalysis | null;
  isAnalyzing: boolean;

  setAnalysisResults: (results: AudioAnalysis | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  analysisResults: null,
  isAnalyzing: false,

  setAnalysisResults: (results) => set({ analysisResults: results }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
}));
