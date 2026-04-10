import { create } from "zustand";
import type { Project, ProductionPhase } from "@/types";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentPhase: ProductionPhase;
  recentProjects: Project[];
  loading: boolean;
  error: string | null;

  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentPhase: (phase: ProductionPhase) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  currentPhase: "idea",
  recentProjects: [],
  loading: false,
  error: null,

  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
