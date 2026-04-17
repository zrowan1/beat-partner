import { useEffect, useCallback } from "react";
import { FileText, Sparkles, Music, PenLine, Loader2 } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useLyricsStore } from "@/stores/lyricsStore";
import { useAppStore } from "@/stores/appStore";
import { useAIStore } from "@/stores/aiStore";
import { LyricsEditor } from "./LyricsEditor";
import { AnnotationList } from "./AnnotationList";

export function LyricsView() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const {
    lyrics,
    annotations,
    isDirty,
    isLoading,
    selectedTag,
    loadLyrics,
    saveContent,
    scheduleAutoSave,
    addAnnotation,
    removeAnnotation,
    setSelectedTag,
    clearLyrics,
  } = useLyricsStore();

  const toggleAiChat = useAppStore((state) => state.toggleAiChat);
  const sendMessage = useAIStore((state) => state.sendMessage);

  // Load lyrics when project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadLyrics(currentProject.id);
    } else {
      clearLyrics();
    }

    return () => {
      // Cleanup timeout on unmount
      clearLyrics();
    };
  }, [currentProject?.id, loadLyrics, clearLyrics]);

  // Save on Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (lyrics) {
          saveContent(lyrics.content);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lyrics, saveContent]);

  const handleContentChange = useCallback(
    (content: string) => {
      if (lyrics) {
        useLyricsStore.setState({
          lyrics: { ...lyrics, content },
        });
      }
    },
    [lyrics]
  );

  const handleNavigateToAnnotation = useCallback((startIndex: number) => {
    // This will be passed to the editor via a ref or callback
    // For now, we can focus the editor
    const textarea = document.querySelector(
      'textarea[spellcheck="false"]'
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(startIndex, startIndex);
    }
  }, []);

  const handleAIAction = useCallback(
    (action: "rhyme" | "flow" | "rewrite") => {
      if (!lyrics) return;

      const textarea = document.querySelector(
        'textarea[spellcheck="false"]'
      ) as HTMLTextAreaElement;
      const selectedText =
        textarea?.value.slice(
          textarea.selectionStart,
          textarea.selectionEnd
        ) || "";

      let prompt = "";
      switch (action) {
        case "rhyme":
          prompt = selectedText
            ? `Suggest rhymes for: "${selectedText}"`
            : `Suggest rhymes for my lyrics:\n\n${lyrics.content}`;
          break;
        case "flow":
          prompt = `Analyze the flow and rhythm of these lyrics. Give tips on improving the cadence and delivery:\n\n${lyrics.content}`;
          break;
        case "rewrite":
          prompt = selectedText
            ? `Rewrite this line to make it more impactful while keeping the same meaning: "${selectedText}"`
            : `Give me suggestions to improve these lyrics:\n\n${lyrics.content}`;
          break;
      }

      toggleAiChat();
      sendMessage(prompt);
    },
    [lyrics, toggleAiChat, sendMessage]
  );

  if (!currentProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
        <div className="glass-interactive p-8">
          <FileText size={40} className="text-white/20" />
        </div>
        <div className="text-center">
          <p className="text-body text-white/50 mb-1">No project selected</p>
          <p className="text-label text-white/30">
            Create or open a project to start writing lyrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-cyan/10">
            <FileText size={18} className="text-accent-cyan" />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-white/90">
              {currentProject.name}
            </h2>
            <p className="text-label text-white/40">Lyrics Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-[11px] text-white/30 italic">
              Unsaved changes
            </span>
          )}
          {isLoading && (
            <Loader2 size={14} className="text-white/40 animate-spin" />
          )}
        </div>
      </div>

      {/* AI Quick Actions */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 shrink-0">
        <Sparkles size={14} className="text-accent-cyan/60 shrink-0" />
        <span className="text-label text-white/40 mr-2">AI:</span>
        <button
          onClick={() => handleAIAction("rhyme")}
          className="glass-interactive px-3 py-1.5 rounded-lg text-[11px] text-white/60 hover:text-white/90 transition-all flex items-center gap-1.5"
        >
          <Music size={12} />
          Suggest rhymes
        </button>
        <button
          onClick={() => handleAIAction("flow")}
          className="glass-interactive px-3 py-1.5 rounded-lg text-[11px] text-white/60 hover:text-white/90 transition-all flex items-center gap-1.5"
        >
          <PenLine size={12} />
          Analyze flow
        </button>
        <button
          onClick={() => handleAIAction("rewrite")}
          className="glass-interactive px-3 py-1.5 rounded-lg text-[11px] text-white/60 hover:text-white/90 transition-all flex items-center gap-1.5"
        >
          <Sparkles size={12} />
          Rewrite
        </button>
      </div>

      {/* Main content: Editor + Annotation sidebar */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        <div className="flex-1 glass-card glass-gloss overflow-hidden flex flex-col min-w-0">
          <LyricsEditor
            content={lyrics?.content || ""}
            annotations={annotations}
            selectedTag={selectedTag}
            onContentChange={handleContentChange}
            onScheduleAutoSave={scheduleAutoSave}
            onAddAnnotation={addAnnotation}
            onRemoveAnnotation={removeAnnotation}
            onSelectTag={setSelectedTag}
          />
        </div>

        <div className="w-64 shrink-0 glass-card glass-gloss overflow-hidden flex flex-col">
          <AnnotationList
            content={lyrics?.content || ""}
            annotations={annotations}
            onRemoveAnnotation={removeAnnotation}
            onNavigateToAnnotation={handleNavigateToAnnotation}
          />
        </div>
      </div>
    </div>
  );
}
