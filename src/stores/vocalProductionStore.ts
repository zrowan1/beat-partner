import { create } from "zustand";
import type {
  ChecklistItem,
  CompingProgress,
  ReferenceVocal,
  TuningTimingProgress,
  VocalAnalysisResult,
  VocalProductionNotes,
} from "@/types";
import * as vocalApi from "@/services/vocalApi";

interface VocalProductionState {
  notes: VocalProductionNotes | null;
  referenceVocals: ReferenceVocal[];
  vocalAnalyses: Record<string, VocalAnalysisResult>;
  isLoading: boolean;
  isDirty: boolean;
  saveTimeout: ReturnType<typeof setTimeout> | null;

  // Actions
  setNotes: (notes: VocalProductionNotes | null) => void;
  setReferenceVocals: (vocals: ReferenceVocal[]) => void;
  setIsDirty: (dirty: boolean) => void;
  setIsLoading: (loading: boolean) => void;

  // Async actions
  loadNotes: (projectId: number) => Promise<void>;
  saveNotes: (partialNotes: Partial<VocalProductionNotes>) => Promise<void>;
  scheduleAutoSave: (partialNotes: Partial<VocalProductionNotes>) => void;
  toggleChecklistItem: (itemId: string) => Promise<void>;
  addCustomChecklistItem: (text: string) => Promise<void>;
  removeCustomChecklistItem: (itemId: string) => Promise<void>;
  resetChecklist: () => Promise<void>;
  loadReferenceVocals: (projectId: number) => Promise<void>;
  addReferenceVocal: (filePath: string) => Promise<void>;
  deleteReferenceVocal: (id: number) => Promise<void>;
  updateReferenceVocal: (vocal: ReferenceVocal) => Promise<void>;
  updateCompingProgress: (progress: Partial<CompingProgress>) => Promise<void>;
  updateTuningTimingProgress: (progress: Partial<TuningTimingProgress>) => Promise<void>;
  analyzeVocal: (filePath: string) => Promise<VocalAnalysisResult | null>;
  clearState: () => void;
}

const AUTO_SAVE_DELAY = 1000;

const DEFAULT_NOTES = (projectId: number): VocalProductionNotes => ({
  id: null,
  projectId,
  micChoice: "",
  vocalChain: { eq: "", compressor: "", reverb: "", delay: "", other: "" },
  recordingNotes: "",
  editingNotes: "",
  tuningNotes: "",
  checklist: [],
  compingProgress: { completedSections: [], userNotes: "" },
  tuningTimingProgress: { completedSections: [], userNotes: "" },
  updatedAt: null,
});

export const useVocalProductionStore = create<VocalProductionState>((set, get) => ({
  notes: null,
  referenceVocals: [],
  vocalAnalyses: {},
  isLoading: false,
  isDirty: false,
  saveTimeout: null,

  setNotes: (notes) => set({ notes }),
  setReferenceVocals: (referenceVocals) => set({ referenceVocals }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setIsLoading: (isLoading) => set({ isLoading }),

  loadNotes: async (projectId: number) => {
    set({ isLoading: true });
    try {
      const notes = await vocalApi.getVocalProductionNotes(projectId);
      set({ notes, isDirty: false, isLoading: false });
    } catch (err) {
      console.error("Failed to load vocal production notes:", err);
      set({
        notes: DEFAULT_NOTES(projectId),
        isDirty: false,
        isLoading: false,
      });
    }
  },

  saveNotes: async (partialNotes: Partial<VocalProductionNotes>) => {
    const { notes } = get();
    if (!notes?.id) return;

    const updated: VocalProductionNotes = { ...notes, ...partialNotes };

    try {
      const saved = await vocalApi.updateVocalProductionNotes(updated);
      set({ notes: saved, isDirty: false });
    } catch (err) {
      console.error("Failed to save vocal production notes:", err);
    }
  },

  scheduleAutoSave: (partialNotes: Partial<VocalProductionNotes>) => {
    const { saveTimeout, notes } = get();

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Update local state immediately for responsiveness
    if (notes) {
      set({ notes: { ...notes, ...partialNotes }, isDirty: true });
    }

    // Schedule backend save
    if (notes?.id) {
      const timeout = setTimeout(() => {
        get().saveNotes(partialNotes);
      }, AUTO_SAVE_DELAY);
      set({ saveTimeout: timeout });
    }
  },

  toggleChecklistItem: async (itemId: string) => {
    const { notes } = get();
    if (!notes) return;

    const updatedChecklist = notes.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item,
    );

    set({
      notes: { ...notes, checklist: updatedChecklist },
      isDirty: true,
    });

    try {
      const saved = await vocalApi.updateRecordingChecklist(notes.projectId, updatedChecklist);
      set({ notes: saved, isDirty: false });
    } catch (err) {
      console.error("Failed to update checklist:", err);
    }
  },

  addCustomChecklistItem: async (text: string) => {
    const { notes } = get();
    if (!notes) return;

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      category: "custom",
      text,
      completed: false,
    };

    const updatedChecklist = [...notes.checklist, newItem];

    set({
      notes: { ...notes, checklist: updatedChecklist },
      isDirty: true,
    });

    try {
      const saved = await vocalApi.updateRecordingChecklist(notes.projectId, updatedChecklist);
      set({ notes: saved, isDirty: false });
    } catch (err) {
      console.error("Failed to add checklist item:", err);
    }
  },

  removeCustomChecklistItem: async (itemId: string) => {
    const { notes } = get();
    if (!notes) return;

    const updatedChecklist = notes.checklist.filter((item) => item.id !== itemId);

    set({
      notes: { ...notes, checklist: updatedChecklist },
      isDirty: true,
    });

    try {
      const saved = await vocalApi.updateRecordingChecklist(notes.projectId, updatedChecklist);
      set({ notes: saved, isDirty: false });
    } catch (err) {
      console.error("Failed to remove checklist item:", err);
    }
  },

  resetChecklist: async () => {
    const { notes } = get();
    if (!notes) return;

    const updatedChecklist = notes.checklist.map((item) => ({
      ...item,
      completed: false,
    }));

    set({
      notes: { ...notes, checklist: updatedChecklist },
      isDirty: true,
    });

    try {
      const saved = await vocalApi.updateRecordingChecklist(notes.projectId, updatedChecklist);
      set({ notes: saved, isDirty: false });
    } catch (err) {
      console.error("Failed to reset checklist:", err);
    }
  },

  loadReferenceVocals: async (projectId: number) => {
    try {
      const vocals = await vocalApi.listReferenceVocals(projectId);
      set({ referenceVocals: vocals });
    } catch (err) {
      console.error("Failed to load reference vocals:", err);
      set({ referenceVocals: [] });
    }
  },

  addReferenceVocal: async (filePath: string) => {
    const { notes, referenceVocals } = get();
    if (!notes?.projectId) return;

    try {
      const vocal = await vocalApi.addReferenceVocal(notes.projectId, filePath);
      set({ referenceVocals: [vocal, ...referenceVocals] });
    } catch (err) {
      console.error("Failed to add reference vocal:", err);
    }
  },

  deleteReferenceVocal: async (id: number) => {
    const { referenceVocals } = get();

    try {
      await vocalApi.deleteReferenceVocal(id);
      set({
        referenceVocals: referenceVocals.filter((v) => v.id !== id),
      });
    } catch (err) {
      console.error("Failed to delete reference vocal:", err);
    }
  },

  updateReferenceVocal: async (vocal: ReferenceVocal) => {
    const { referenceVocals } = get();

    try {
      const updated = await vocalApi.updateReferenceVocal(vocal);
      set({
        referenceVocals: referenceVocals.map((v) => (v.id === updated.id ? updated : v)),
      });
    } catch (err) {
      console.error("Failed to update reference vocal:", err);
    }
  },

  updateCompingProgress: async (progress: Partial<CompingProgress>) => {
    const { notes } = get();
    if (!notes) return;

    const updated: CompingProgress = {
      ...notes.compingProgress,
      ...progress,
    };

    set({
      notes: { ...notes, compingProgress: updated },
      isDirty: true,
    });

    try {
      const saved = await vocalApi.updateCompingProgress(notes.projectId, updated);
      set({ notes: saved, isDirty: false });
    } catch (err) {
      console.error("Failed to update comping progress:", err);
    }
  },

  updateTuningTimingProgress: async (progress: Partial<TuningTimingProgress>) => {
    const { notes } = get();
    if (!notes) return;

    const updated: TuningTimingProgress = {
      ...notes.tuningTimingProgress,
      ...progress,
    };

    set({
      notes: { ...notes, tuningTimingProgress: updated },
      isDirty: true,
    });

    try {
      const saved = await vocalApi.updateTuningTimingProgress(notes.projectId, updated);
      set({ notes: saved, isDirty: false });
    } catch (err) {
      console.error("Failed to update tuning/timing progress:", err);
    }
  },

  analyzeVocal: async (filePath: string) => {
    const { vocalAnalyses } = get();

    // Return cached result if available
    if (vocalAnalyses[filePath]) {
      return vocalAnalyses[filePath];
    }

    try {
      const result = await vocalApi.analyzeVocalFile(filePath);
      set({
        vocalAnalyses: { ...vocalAnalyses, [filePath]: result },
      });
      return result;
    } catch (err) {
      console.error("Failed to analyze vocal:", err);
      return null;
    }
  },

  clearState: () => {
    const { saveTimeout } = get();
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    set({
      notes: null,
      referenceVocals: [],
      vocalAnalyses: {},
      isDirty: false,
      isLoading: false,
      saveTimeout: null,
    });
  },
}));
