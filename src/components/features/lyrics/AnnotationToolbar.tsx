import { Highlighter, X } from "lucide-react";
import type { LyricAnnotation, LyricTag } from "@/types";
import { LYRIC_TAG_COLORS } from "@/types/lyrics";

interface AnnotationToolbarProps {
  selectedTag: LyricTag | null;
  onSelectTag: (tag: LyricTag) => void;
  onClearTag: () => void;
  hasSelection: boolean;
  selectionRange: { start: number; end: number } | null;
  annotations: LyricAnnotation[];
  onAddAnnotation: (startIndex: number, endIndex: number, tag: LyricTag) => void;
  onRemoveAnnotation: (annotationId: number) => void;
}

const TAGS: LyricTag[] = [
  "melody",
  "ad-lib",
  "harmony",
  "flow",
  "emphasis",
  "note",
];

export function AnnotationToolbar({
  selectedTag,
  onSelectTag,
  onClearTag,
  hasSelection,
  selectionRange,
  annotations,
  onAddAnnotation,
  onRemoveAnnotation,
}: AnnotationToolbarProps) {
  // Check if current selection overlaps with an existing annotation
  const overlappingAnnotation =
    hasSelection && selectionRange
      ? annotations.find(
          (a) =>
            a.id !== null &&
            selectionRange.start < a.endIndex &&
            selectionRange.end > a.startIndex
        )
      : null;

  const handleTagClick = (tag: LyricTag) => {
    if (!hasSelection || !selectionRange) return;

    if (overlappingAnnotation?.id) {
      // Remove overlapping annotation first
      onRemoveAnnotation(overlappingAnnotation.id);
    }

    onAddAnnotation(selectionRange.start, selectionRange.end, tag);
    onSelectTag(tag);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
      <Highlighter size={14} className="text-white/40 shrink-0" />
      <span className="text-label text-white/40 mr-2">Annotate:</span>

      <div className="flex items-center gap-1.5">
        {TAGS.map((tag) => {
          const colors = LYRIC_TAG_COLORS[tag];
          const isActive = selectedTag === tag;

          return (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              disabled={!hasSelection}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 ${colors.bg} ${colors.border} border ${
                isActive
                  ? "ring-1 ring-white/30"
                  : "opacity-70 hover:opacity-100"
              } ${
                !hasSelection
                  ? "opacity-30 cursor-not-allowed"
                  : "cursor-pointer hover:scale-105"
              }`}
              title={colors.label}
            >
              {colors.label}
            </button>
          );
        })}
      </div>

      {overlappingAnnotation && (
        <button
          onClick={() =>
            overlappingAnnotation.id &&
            onRemoveAnnotation(overlappingAnnotation.id)
          }
          className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/50 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
        >
          <X size={12} />
          Remove
        </button>
      )}

      {selectedTag && !hasSelection && (
        <button
          onClick={onClearTag}
          className="ml-auto text-[11px] text-white/30 hover:text-white/60 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
