import { create } from "zustand";
import type { LyricAnnotation, LyricTag, Lyrics } from "@/types";
import * as lyricsApi from "@/services/lyricsApi";

interface LyricsState {
  lyrics: Lyrics | null;
  annotations: LyricAnnotation[];
  isDirty: boolean;
  isLoading: boolean;
  selectedTag: LyricTag | null;
  saveTimeout: ReturnType<typeof setTimeout> | null;

  // Actions
  setLyrics: (lyrics: Lyrics | null) => void;
  setAnnotations: (annotations: LyricAnnotation[]) => void;
  setSelectedTag: (tag: LyricTag | null) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsLoading: (loading: boolean) => void;

  // Async actions
  loadLyrics: (projectId: number) => Promise<void>;
  saveContent: (content: string) => Promise<void>;
  scheduleAutoSave: (content: string) => void;
  addAnnotation: (
    startIndex: number,
    endIndex: number,
    tag: LyricTag,
    note?: string
  ) => Promise<void>;
  removeAnnotation: (annotationId: number) => Promise<void>;
  clearLyrics: () => void;
}

const AUTO_SAVE_DELAY = 1000;

export const useLyricsStore = create<LyricsState>((set, get) => ({
  lyrics: null,
  annotations: [],
  isDirty: false,
  isLoading: false,
  selectedTag: null,
  saveTimeout: null,

  setLyrics: (lyrics) => set({ lyrics }),
  setAnnotations: (annotations) => set({ annotations }),
  setSelectedTag: (tag) => set({ selectedTag: tag }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsLoading: (isLoading) => set({ isLoading }),

  loadLyrics: async (projectId: number) => {
    set({ isLoading: true });
    try {
      const lyrics = await lyricsApi.getLyrics(projectId);
      const annotations = lyrics.id
        ? await lyricsApi.listLyricAnnotations(lyrics.id)
        : [];
      set({ lyrics, annotations, isDirty: false, isLoading: false });
    } catch (err) {
      set({
        isLoading: false,
        lyrics: null,
        annotations: [],
      });
      console.error("Failed to load lyrics:", err);
    }
  },

  saveContent: async (content: string) => {
    const { lyrics } = get();
    if (!lyrics?.id) return;

    try {
      const updated = await lyricsApi.updateLyricsContent(lyrics.id, content);
      set({ lyrics: updated, isDirty: false });
    } catch (err) {
      console.error("Failed to save lyrics:", err);
    }
  },

  scheduleAutoSave: (content: string) => {
    const { saveTimeout, lyrics } = get();

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Mark as dirty
    set({ isDirty: true });

    // Schedule new save
    if (lyrics?.id) {
      const timeout = setTimeout(() => {
        get().saveContent(content);
      }, AUTO_SAVE_DELAY);
      set({ saveTimeout: timeout });
    }
  },

  addAnnotation: async (
    startIndex: number,
    endIndex: number,
    tag: LyricTag,
    note?: string
  ) => {
    const { lyrics, annotations } = get();
    if (!lyrics?.id) return;

    try {
      const annotation = await lyricsApi.createLyricAnnotation(
        lyrics.id,
        startIndex,
        endIndex,
        tag,
        note
      );
      set({
        annotations: [...annotations, annotation].sort(
          (a, b) => a.startIndex - b.startIndex
        ),
      });
    } catch (err) {
      console.error("Failed to add annotation:", err);
    }
  },

  removeAnnotation: async (annotationId: number) => {
    const { annotations } = get();

    try {
      await lyricsApi.deleteLyricAnnotation(annotationId);
      set({
        annotations: annotations.filter((a) => a.id !== annotationId),
      });
    } catch (err) {
      console.error("Failed to remove annotation:", err);
    }
  },

  clearLyrics: () => {
    const { saveTimeout } = get();
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    set({
      lyrics: null,
      annotations: [],
      isDirty: false,
      isLoading: false,
      selectedTag: null,
      saveTimeout: null,
    });
  },
}));
