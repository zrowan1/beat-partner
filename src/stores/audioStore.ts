import { create } from "zustand";
import type {
  AnalysisProgress,
  AudioAnalysisResult,
  ReferenceTrack,
  SpectrumData,
} from "@/types";
import * as audioApi from "@/services/audioApi";

interface AudioState {
  // Analysis
  analysisResult: AudioAnalysisResult | null;
  isAnalyzing: boolean;
  analysisProgress: AnalysisProgress | null;

  // Spectrum
  spectrumData: SpectrumData | null;
  isLoadingSpectrum: boolean;

  // Reference tracks
  referenceTracks: ReferenceTrack[];
  loadingReferenceTracks: boolean;

  // Actions
  analyzeFile: (filePath: string) => Promise<AudioAnalysisResult | null>;
  loadSpectrum: (filePath: string, fftSize?: number) => Promise<void>;
  loadReferenceTracks: (projectId: number) => Promise<void>;
  addReferenceTrack: (projectId: number, filePath: string) => Promise<ReferenceTrack | null>;
  removeReferenceTrack: (id: number) => Promise<void>;
  clearAnalysis: () => void;
  clearSpectrum: () => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  analysisResult: null,
  isAnalyzing: false,
  analysisProgress: null,
  spectrumData: null,
  isLoadingSpectrum: false,
  referenceTracks: [],
  loadingReferenceTracks: false,

  analyzeFile: async (filePath: string) => {
    set({ isAnalyzing: true, analysisProgress: null, analysisResult: null });
    try {
      const result = await audioApi.analyzeAudioFile(filePath, (progress) => {
        set({ analysisProgress: progress });
      });
      set({ analysisResult: result, isAnalyzing: false });
      return result;
    } catch (error) {
      set({
        isAnalyzing: false,
        analysisProgress: {
          type: "error",
          message: String(error),
        },
      });
      return null;
    }
  },

  loadSpectrum: async (filePath: string, fftSize?: number) => {
    set({ isLoadingSpectrum: true, spectrumData: null });
    try {
      const data = await audioApi.getAudioSpectrum(filePath, fftSize);
      set({ spectrumData: data, isLoadingSpectrum: false });
    } catch {
      set({ isLoadingSpectrum: false });
    }
  },

  loadReferenceTracks: async (projectId: number) => {
    set({ loadingReferenceTracks: true });
    try {
      const tracks = await audioApi.listReferenceTracks(projectId);
      set({ referenceTracks: tracks, loadingReferenceTracks: false });
    } catch {
      set({ loadingReferenceTracks: false });
    }
  },

  addReferenceTrack: async (projectId: number, filePath: string) => {
    try {
      const track = await audioApi.addReferenceTrack(projectId, filePath);
      set((state) => ({
        referenceTracks: [track, ...state.referenceTracks],
      }));
      return track;
    } catch {
      return null;
    }
  },

  removeReferenceTrack: async (id: number) => {
    try {
      await audioApi.deleteReferenceTrack(id);
      set((state) => ({
        referenceTracks: state.referenceTracks.filter((t) => t.id !== id),
      }));
    } catch {
      // silently fail
    }
  },

  clearAnalysis: () => {
    set({ analysisResult: null, analysisProgress: null });
  },

  clearSpectrum: () => {
    set({ spectrumData: null });
  },
}));
