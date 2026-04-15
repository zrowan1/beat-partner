import { create } from "zustand";
import type { Project, ProductionPhase } from "@/types";
import * as projectApi from "@/services/projectApi";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentPhase: ProductionPhase;
  recentProjects: Project[];
  loading: boolean;
  error: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentPhase: (phase: ProductionPhase) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Async actions
  loadProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project | null>;
  updateProject: (project: Project) => Promise<Project | null>;
  deleteProject: (id: number) => Promise<void>;
  selectProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
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

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await projectApi.listProjects();
      set({ projects, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load projects",
        loading: false,
      });
    }
  },

  createProject: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const project = await projectApi.createProject(name);
      const { projects } = get();
      set({
        projects: [project, ...projects],
        loading: false,
      });
      return project;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to create project",
        loading: false,
      });
      return null;
    }
  },

  updateProject: async (project: Project) => {
    try {
      const updated = await projectApi.updateProject(project);
      const { projects, currentProject } = get();
      set({
        projects: projects.map((p) => (p.id === updated.id ? updated : p)),
        currentProject: currentProject?.id === updated.id ? updated : currentProject,
      });
      return updated;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to update project",
      });
      return null;
    }
  },

  deleteProject: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await projectApi.deleteProject(id);
      const { projects, currentProject } = get();
      set({
        projects: projects.filter((p) => p.id !== id),
        currentProject: currentProject?.id === id ? null : currentProject,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to delete project",
        loading: false,
      });
    }
  },

  selectProject: (project) => {
    set({ currentProject: project });
    if (project) {
      set((state) => ({
        recentProjects: [
          project,
          ...state.recentProjects.filter((p) => p.id !== project.id),
        ].slice(0, 5),
      }));
    }
  },
}));
