import { Trash2 } from "lucide-react";
import type { LyricAnnotation } from "@/types";
import { LYRIC_TAG_COLORS } from "@/types/lyrics";

interface AnnotationListProps {
  content: string;
  annotations: LyricAnnotation[];
  onRemoveAnnotation: (annotationId: number) => void;
  onNavigateToAnnotation: (startIndex: number) => void;
}

export function AnnotationList({
  content,
  annotations,
  onRemoveAnnotation,
  onNavigateToAnnotation,
}: AnnotationListProps) {
  if (annotations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-label text-white/30">No annotations yet</p>
        <p className="text-[11px] text-white/20 mt-1">
          Select text and choose a tag
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 overflow-y-auto">
      <p className="text-label text-white/40 mb-1 px-1">
        Annotations ({annotations.length})
      </p>
      {annotations.map((annotation) => {
        const colors = LYRIC_TAG_COLORS[annotation.tag];
        const preview = content.slice(
          annotation.startIndex,
          Math.min(annotation.endIndex, annotation.startIndex + 40)
        );
        const isTruncated =
          annotation.endIndex - annotation.startIndex > 40;

        return (
          <div
            key={annotation.id}
            onClick={() => onNavigateToAnnotation(annotation.startIndex)}
            className="glass-interactive p-2.5 rounded-lg cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${colors.bg.replace("/30", "")}`}
                  />
                  <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
                    {colors.label}
                  </span>
                </div>
                <p className="text-[12px] text-white/70 truncate">
                  &ldquo;{preview}
                  {isTruncated ? "..." : ""}&rdquo;
                </p>
                {annotation.note && (
                  <p className="text-[11px] text-white/40 mt-1 italic">
                    {annotation.note}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (annotation.id) {
                    onRemoveAnnotation(annotation.id);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-400/10 text-white/30 hover:text-rose-400 transition-all shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
