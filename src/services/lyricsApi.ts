import type { LyricAnnotation, LyricTag, Lyrics } from "@/types";
import { invoke } from "./tauri";

export async function getLyrics(projectId: number): Promise<Lyrics> {
  return invoke<Lyrics>("get_lyrics", { projectId });
}

export async function updateLyricsContent(
  lyricsId: number,
  content: string
): Promise<Lyrics> {
  return invoke<Lyrics>("update_lyrics_content", { lyricsId, content });
}

export async function listLyricAnnotations(
  lyricsId: number
): Promise<LyricAnnotation[]> {
  return invoke<LyricAnnotation[]>("list_lyric_annotations", { lyricsId });
}

export async function createLyricAnnotation(
  lyricsId: number,
  startIndex: number,
  endIndex: number,
  tag: LyricTag,
  note?: string
): Promise<LyricAnnotation> {
  return invoke<LyricAnnotation>("create_lyric_annotation", {
    lyricsId,
    startIndex,
    endIndex,
    tag,
    note,
  });
}

export async function deleteLyricAnnotation(
  annotationId: number
): Promise<void> {
  return invoke<void>("delete_lyric_annotation", { annotationId });
}

export async function updateLyricAnnotation(
  annotation: LyricAnnotation
): Promise<LyricAnnotation> {
  return invoke<LyricAnnotation>("update_lyric_annotation", { annotation });
}
