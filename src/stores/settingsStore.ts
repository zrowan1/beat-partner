import { create } from "zustand";
import * as settingsApi from "@/services/settingsApi";

interface SettingsState {
  settings: Record<string, string>;
  loading: boolean;
  error: string | null;

  // Actions
  setSettings: (settings: Record<string, string>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  loadSettings: () => Promise<void>;
  getSetting: (key: string) => string | null;
  setSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  loading: false,
  error: null,

  setSettings: (settings) => set({ settings }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  loadSettings: async () => {
    set({ loading: true, error: null });
    try {
      const entries = await settingsApi.getAllSettings();
      const settings: Record<string, string> = {};
      for (const [key, value] of entries) {
        settings[key] = value;
      }
      set({ settings, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load settings",
        loading: false,
      });
    }
  },

  getSetting: (key: string) => {
    return get().settings[key] ?? null;
  },

  setSetting: async (key: string, value: string) => {
    set({ loading: true, error: null });
    try {
      await settingsApi.setSetting(key, value);
      set((state) => ({
        settings: { ...state.settings, [key]: value },
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to save setting",
        loading: false,
      });
    }
  },
}));
