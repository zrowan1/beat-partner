import type { Project } from "@/types";
import { invoke } from "./tauri";

export async function listProjects(): Promise<Project[]> {
  return invoke<Project[]>("list_projects");
}

export async function getProject(id: number): Promise<Project | null> {
  return invoke<Project | null>("get_project", { id });
}

export async function createProject(name: string): Promise<Project> {
  return invoke<Project>("create_project", { name });
}

export async function updateProject(project: Project): Promise<Project> {
  return invoke<Project>("update_project", { project });
}

export async function deleteProject(id: number): Promise<void> {
  return invoke<void>("delete_project", { id });
}
