import { create } from "zustand";
import type { ActiveView, AIProvider, AIMessage } from "@/types";

interface AppState {
  activeView: ActiveView;
  sidebarOpen: boolean;
  aiChatOpen: boolean;
  aiProvider: AIProvider;
  aiMessages: AIMessage[];
  aiLoading: boolean;

  setActiveView: (view: ActiveView) => void;
  toggleSidebar: () => void;
  toggleAiChat: () => void;
  setAiProvider: (provider: AIProvider) => void;
  setAiLoading: (loading: boolean) => void;
  addAiMessage: (message: AIMessage) => void;
  clearAiMessages: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "guides",
  sidebarOpen: true,
  aiChatOpen: false,
  aiProvider: "auto",
  aiMessages: [],
  aiLoading: false,

  setActiveView: (view) => set({ activeView: view }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleAiChat: () => set((state) => ({ aiChatOpen: !state.aiChatOpen })),
  setAiProvider: (provider) => set({ aiProvider: provider }),
  setAiLoading: (loading) => set({ aiLoading: loading }),
  addAiMessage: (message) =>
    set((state) => ({ aiMessages: [...state.aiMessages, message] })),
  clearAiMessages: () => set({ aiMessages: [] }),
}));
