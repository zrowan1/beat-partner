import { useRef, useCallback, useEffect, useState } from "react";
import type { LyricAnnotation, LyricTag } from "@/types";
import { HighlightedText } from "./HighlightedText";
import { AnnotationToolbar } from "./AnnotationToolbar";

interface LyricsEditorProps {
  content: string;
  annotations: LyricAnnotation[];
  selectedTag: LyricTag | null;
  onContentChange: (content: string) => void;
  onScheduleAutoSave: (content: string) => void;
  onAddAnnotation: (
    startIndex: number,
    endIndex: number,
    tag: LyricTag
  ) => void;
  onRemoveAnnotation: (annotationId: number) => void;
  onSelectTag: (tag: LyricTag | null) => void;
}

export function LyricsEditor({
  content,
  annotations,
  selectedTag,
  onContentChange,
  onScheduleAutoSave,
  onAddAnnotation,
  onRemoveAnnotation,
  onSelectTag,
}: LyricsEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionRange, setSelectionRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  // Sync scroll between textarea and mirror
  const syncScroll = useCallback(() => {
    if (textareaRef.current && mirrorRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
      mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  // Handle textarea input
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      onContentChange(newContent);
      onScheduleAutoSave(newContent);
    },
    [onContentChange, onScheduleAutoSave]
  );

  // Handle text selection
  const handleSelect = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (end > start) {
      setHasSelection(true);
      setSelectionRange({ start, end });
    } else {
      setHasSelection(false);
      setSelectionRange(null);
    }
  }, []);

  // Handle click to clear selection when clicking outside selected text
  const handleClick = useCallback(() => {
    // Small delay to let the selection update first
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (end > start) {
        setHasSelection(true);
        setSelectionRange({ start, end });
      } else {
        setHasSelection(false);
        setSelectionRange(null);
      }
    }, 0);
  }, []);

  // Ensure textarea stays focused for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        const textarea = textareaRef.current;
        if (textarea && document.activeElement === textarea) {
          e.preventDefault();
          textarea.select();
          handleSelect();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSelect]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <AnnotationToolbar
        selectedTag={selectedTag}
        onSelectTag={onSelectTag}
        onClearTag={() => onSelectTag(null)}
        hasSelection={hasSelection}
        selectionRange={selectionRange}
        annotations={annotations}
        onAddAnnotation={onAddAnnotation}
        onRemoveAnnotation={onRemoveAnnotation}
      />

      <div className="relative flex-1 overflow-hidden">
        {/* Mirror overlay — shows highlighted text */}
        <div
          ref={mirrorRef}
          className="absolute inset-0 pointer-events-none overflow-auto px-4 py-3 whitespace-pre-wrap text-[14px] leading-6 text-white/90 font-mono"
          aria-hidden="true"
          style={{
            padding: "12px 16px",
            fontFamily:
              '"SF Mono", "JetBrains Mono", "Fira Code", monospace',
          }}
        >
          <HighlightedText content={content} annotations={annotations} />
        </div>

        {/* Input textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onSelect={handleSelect}
          onClick={handleClick}
          onScroll={syncScroll}
          onMouseUp={handleSelect}
          onKeyUp={handleSelect}
          spellCheck={false}
          placeholder="Start writing your lyrics here..."
          className="absolute inset-0 w-full h-full bg-transparent text-white/90 resize-none outline-none border-none px-4 py-3 text-[14px] leading-6 caret-accent-cyan"
          style={{
            fontFamily:
              '"SF Mono", "JetBrains Mono", "Fira Code", monospace',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}
