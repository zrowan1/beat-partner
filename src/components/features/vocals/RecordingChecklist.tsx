import { useState } from "react";
import {
  ListChecks,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useVocalProductionStore } from "@/stores/vocalProductionStore";
import { CHECKLIST_CATEGORIES } from "@/types";

export function RecordingChecklist() {
  const { notes, toggleChecklistItem, addCustomChecklistItem, removeCustomChecklistItem, resetChecklist } =
    useVocalProductionStore();
  const [newItemText, setNewItemText] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleAddCustom = () => {
    if (!newItemText.trim()) return;
    addCustomChecklistItem(newItemText.trim());
    setNewItemText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  if (!notes) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const totalItems = notes.checklist.length;
  const completedItems = notes.checklist.filter((i) => i.completed).length;
  const progressPercent =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Progress header */}
      <div className="glass-card glass-gloss p-4 mb-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ListChecks size={14} className="text-accent-cyan" />
            <span className="text-[13px] font-medium text-white/80">
              Recording Progress
            </span>
          </div>
          <span className="text-[13px] font-mono text-white/60">
            {completedItems}/{totalItems}
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-cyan to-accent-purple rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-white/30 mt-1.5">
          {progressPercent === 100
            ? "All set! Ready to record."
            : progressPercent >= 75
            ? "Almost there — just a few more checks."
            : progressPercent >= 50
            ? "Good progress. Keep going!"
            : progressPercent >= 25
            ? "Getting started. Check the essentials first."
            : "Start with mic setup and gain staging."}
        </p>
      </div>

      {/* Checklist items */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {CHECKLIST_CATEGORIES.map((category) => {
          const items = notes.checklist.filter(
            (item) => item.category === category.id
          );
          if (items.length === 0 && category.id !== "custom") return null;

          const isCollapsed = collapsedCategories.has(category.id);
          const categoryCompleted = items.filter((i) => i.completed).length;
          const categoryTotal = items.length;

          return (
            <div key={category.id} className="glass-card p-3">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight
                      size={14}
                      className="text-white/30 group-hover:text-white/60 transition-colors"
                    />
                  ) : (
                    <ChevronDown
                      size={14}
                      className="text-white/30 group-hover:text-white/60 transition-colors"
                    />
                  )}
                  <span className="text-[13px] font-medium text-white/70">
                    {category.label}
                  </span>
                  <span className="text-[11px] text-white/30 font-mono">
                    {categoryCompleted}/{categoryTotal}
                  </span>
                </div>
                <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-cyan/60 rounded-full transition-all"
                    style={{
                      width:
                        categoryTotal > 0
                          ? `${(categoryCompleted / categoryTotal) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              </button>

              {!isCollapsed && (
                <div className="mt-2 space-y-1 pl-5">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2.5 group"
                    >
                      <button
                        onClick={() => toggleChecklistItem(item.id)}
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                          item.completed
                            ? "bg-accent-cyan/20 border-accent-cyan"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      >
                        {item.completed && (
                          <Check size={10} className="text-accent-cyan" />
                        )}
                      </button>
                      <span
                        className={`text-[13px] leading-relaxed flex-1 transition-all ${
                          item.completed
                            ? "text-white/30 line-through"
                            : "text-white/70"
                        }`}
                      >
                        {item.text}
                      </span>
                      {item.category === "custom" && (
                        <button
                          onClick={() => removeCustomChecklistItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add custom item + reset */}
      <div className="mt-3 pt-3 border-t border-white/10 shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add custom checklist item..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/50 transition-colors"
          />
          <button
            onClick={handleAddCustom}
            disabled={!newItemText.trim()}
            className="glass-interactive p-2 rounded-lg text-white/60 hover:text-white/90 disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:scale-100"
          >
            <Plus size={16} />
          </button>
        </div>
        <button
          onClick={() => resetChecklist()}
          className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
        >
          <RotateCcw size={10} />
          Reset all checklist items
        </button>
      </div>
    </div>
  );
}
