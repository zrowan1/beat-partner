import { invoke } from "@tauri-apps/api/core";
import { Channel } from "@tauri-apps/api/core";
import type {
  AnalysisProgress,
  AudioAnalysisResult,
  ReferenceTrack,
  SpectrumData,
} from "@/types";

export async function analyzeAudioFile(
  filePath: string,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<AudioAnalysisResult> {
  const channel = new Channel<AnalysisProgress>();

  if (onProgress) {
    channel.onmessage = onProgress;
  }

  return invoke("analyze_audio_file", {
    filePath,
    onProgress: channel,
  });
}

export async function getAudioSpectrum(
  filePath: string,
  fftSize?: number
): Promise<SpectrumData> {
  return invoke("get_audio_spectrum", { filePath, fftSize });
}

export async function addReferenceTrack(
  projectId: number,
  filePath: string
): Promise<ReferenceTrack> {
  return invoke("add_reference_track", { projectId, filePath });
}

export async function listReferenceTracks(
  projectId: number
): Promise<ReferenceTrack[]> {
  return invoke("list_reference_tracks", { projectId });
}

export async function deleteReferenceTrack(id: number): Promise<void> {
  return invoke("delete_reference_track", { id });
}

export function formatDuration(secs: number): string {
  const mins = Math.floor(secs / 60);
  const remainingSecs = Math.floor(secs % 60);
  return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
}
