export type LyricTag = "melody" | "ad-lib" | "harmony" | "flow" | "emphasis" | "note";

export interface Lyrics {
  id: number | null;
  projectId: number;
  content: string;
  updatedAt: string | null;
}

export interface LyricAnnotation {
  id: number | null;
  lyricsId: number;
  startIndex: number;
  endIndex: number;
  tag: LyricTag;
  color: string | null;
  note: string | null;
  createdAt: string | null;
}

export const LYRIC_TAG_COLORS: Record<
  LyricTag,
  { bg: string; border: string; label: string }
> = {
  melody: { bg: "bg-accent-cyan/30", border: "border-accent-cyan", label: "Melody" },
  "ad-lib": {
    bg: "bg-accent-magenta/30",
    border: "border-accent-magenta",
    label: "Ad-lib",
  },
  harmony: {
    bg: "bg-accent-purple/30",
    border: "border-accent-purple",
    label: "Harmony",
  },
  flow: { bg: "bg-amber-400/30", border: "border-amber-400", label: "Flow" },
  emphasis: { bg: "bg-rose-400/30", border: "border-rose-400", label: "Emphasis" },
  note: { bg: "bg-white/20", border: "border-white/40", label: "Note" },
};
