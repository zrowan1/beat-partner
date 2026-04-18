import { useEffect, useState } from "react";
import { Mic, FileText, ListChecks, Sparkles, Music, BookOpen, Wand2 } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useVocalProductionStore } from "@/stores/vocalProductionStore";
import { VocalNotesEditor } from "./VocalNotesEditor";
import { RecordingChecklist } from "./RecordingChecklist";
import { VocalChainAdvisor } from "./VocalChainAdvisor";
import { ReferenceVocalLibrary } from "./ReferenceVocalLibrary";
import { GuidesView } from "./GuidesView";
import { VocalEffectPresets } from "./VocalEffectPresets";

type VocalTab = "notes" | "checklist" | "advisor" | "guides" | "presets" | "references";

const TABS: { id: VocalTab; label: string; icon: typeof Mic }[] = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "checklist", label: "Checklist", icon: ListChecks },
  { id: "advisor", label: "Advisor", icon: Sparkles },
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "presets", label: "Presets", icon: Wand2 },
  { id: "references", label: "References", icon: Music },
];

export function VocalsView() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const { isDirty, isLoading, loadNotes, loadReferenceVocals, clearState } =
    useVocalProductionStore();
  const [activeTab, setActiveTab] = useState<VocalTab>("notes");

  // Load data when project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadNotes(currentProject.id);
      loadReferenceVocals(currentProject.id);
    } else {
      clearState();
    }

    return () => {
      clearState();
    };
  }, [currentProject?.id, loadNotes, loadReferenceVocals, clearState]);

  // Save on Ctrl/Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // Auto-save is debounced; this forces immediate save if dirty
        const store = useVocalProductionStore.getState();
        if (store.notes) {
          store.saveNotes(store.notes);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!currentProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
        <div className="glass-interactive p-8">
          <Mic size={40} className="text-white/20" />
        </div>
        <div className="text-center">
          <p className="text-body text-white/50 mb-1">No project selected</p>
          <p className="text-label text-white/30">
            Create or open a project to start vocal production
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
          <div className="p-2 rounded-lg bg-accent-magenta/10">
            <Mic size={18} className="text-accent-magenta" />
          </div>
          <div>
            <h2 className="text-[15px] font-medium text-white/90">{currentProject.name}</h2>
            <p className="text-label text-white/40">Vocal Production Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && <span className="text-[11px] text-white/30 italic">Unsaved changes</span>}
          {isLoading && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/10 shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200 ${
                isActive
                  ? "glass-interactive active"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden p-4">
        {activeTab === "notes" && <VocalNotesEditor />}
        {activeTab === "checklist" && <RecordingChecklist />}
        {activeTab === "advisor" && <VocalChainAdvisor />}
        {activeTab === "guides" && <GuidesView />}
        {activeTab === "presets" && <VocalEffectPresets />}
        {activeTab === "references" && <ReferenceVocalLibrary />}
      </div>
    </div>
  );
}
