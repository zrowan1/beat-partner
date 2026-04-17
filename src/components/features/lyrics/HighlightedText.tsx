import type { LyricAnnotation } from "@/types";
import { LYRIC_TAG_COLORS } from "@/types/lyrics";

interface HighlightedTextProps {
  content: string;
  annotations: LyricAnnotation[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

export function HighlightedText({ content, annotations }: HighlightedTextProps) {
  if (!content) {
    return <span>&nbsp;</span>;
  }

  // Sort annotations by start index
  const sorted = [...annotations].sort((a, b) => a.startIndex - b.startIndex);

  // Build segments
  const segments: {
    text: string;
    annotation: LyricAnnotation | null;
  }[] = [];

  let currentIndex = 0;

  for (const annotation of sorted) {
    // Skip annotations that are out of bounds
    if (annotation.startIndex >= content.length) continue;
    if (annotation.endIndex <= annotation.startIndex) continue;

    const endIndex = Math.min(annotation.endIndex, content.length);

    // Add text before this annotation
    if (annotation.startIndex > currentIndex) {
      segments.push({
        text: content.slice(currentIndex, annotation.startIndex),
        annotation: null,
      });
    }

    // Add annotated text
    segments.push({
      text: content.slice(annotation.startIndex, endIndex),
      annotation,
    });

    currentIndex = endIndex;
  }

  // Add remaining text
  if (currentIndex < content.length) {
    segments.push({
      text: content.slice(currentIndex),
      annotation: null,
    });
  }

  // If no annotations or all were out of bounds, render the whole text
  if (segments.length === 0) {
    return (
      <span
        dangerouslySetInnerHTML={{ __html: escapeHtml(content) + "\n" }}
      />
    );
  }

  return (
    <>
      {segments.map((segment, i) => {
        const escapedText = escapeHtml(segment.text);

        if (segment.annotation) {
          const colors = LYRIC_TAG_COLORS[segment.annotation.tag];
          return (
            <span
              key={i}
              className={`${colors.bg} border-b-2 ${colors.border} rounded-sm`}
              dangerouslySetInnerHTML={{ __html: escapedText }}
            />
          );
        }

        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: escapedText }}
          />
        );
      })}
      <br />
    </>
  );
}
