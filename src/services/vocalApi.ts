import type {
  ChecklistItem,
  ReferenceVocal,
  VocalProductionNotes,
} from "@/types";
import { invoke } from "./tauri";

export async function getVocalProductionNotes(
  projectId: number
): Promise<VocalProductionNotes> {
  return invoke<VocalProductionNotes>("get_vocal_production_notes", {
    projectId,
  });
}

export async function updateVocalProductionNotes(
  notes: VocalProductionNotes
): Promise<VocalProductionNotes> {
  return invoke<VocalProductionNotes>("update_vocal_production_notes", {
    notes,
  });
}

export async function updateRecordingChecklist(
  projectId: number,
  checklist: ChecklistItem[]
): Promise<VocalProductionNotes> {
  return invoke<VocalProductionNotes>("update_recording_checklist", {
    projectId,
    checklist,
  });
}

export async function listReferenceVocals(
  projectId: number
): Promise<ReferenceVocal[]> {
  return invoke<ReferenceVocal[]>("list_reference_vocals", { projectId });
}

export async function addReferenceVocal(
  projectId: number,
  filePath: string,
  artistName?: string,
  notes?: string
): Promise<ReferenceVocal> {
  return invoke<ReferenceVocal>("add_reference_vocal", {
    projectId,
    filePath,
    artistName,
    notes,
  });
}

export async function deleteReferenceVocal(id: number): Promise<void> {
  return invoke<void>("delete_reference_vocal", { id });
}

export async function updateReferenceVocal(
  vocal: ReferenceVocal
): Promise<ReferenceVocal> {
  return invoke<ReferenceVocal>("update_reference_vocal", { vocal });
}
