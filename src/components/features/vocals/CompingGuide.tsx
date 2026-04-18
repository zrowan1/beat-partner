import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  BookOpen,
  Scissors,
  Ear,
  AlertTriangle,
  ListChecks,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { useVocalProductionStore } from "@/stores/vocalProductionStore";
import { useAppStore } from "@/stores/appStore";
import { useAIStore } from "@/stores/aiStore";

interface Section {
  id: string;
  title: string;
  icon: typeof BookOpen;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    id: "prep",
    title: "Before You Start",
    icon: BookOpen,
    content: [
      "Label every take clearly: verse, chorus, bridge + take number.",
      "Create a dedicated 'comp' track or playlist to build on.",
      "Listen to all takes once without editing — take notes on standout moments.",
      "Ensure your session grid and tempo map are accurate.",
      "Set up quick solo/mute key commands for fast A/B comparison.",
    ],
  },
  {
    id: "process",
    title: "The Comping Process",
    icon: Scissors,
    content: [
      "Work phrase-by-phrase, not word-by-word — context matters.",
      "Use crossfades (5–20ms) at every edit point to avoid clicks.",
      "Pay attention to breaths: keep natural breaths or replace with room tone.",
      "Match the tone and energy between edit points — a perfect pitch with wrong tone is worse.",
      "When in doubt, choose the more emotional take over the more 'perfect' one.",
    ],
  },
  {
    id: "listen",
    title: "What to Listen For",
    icon: Ear,
    content: [
      "Pitch accuracy — but allow natural drift around the center note.",
      "Timing — is it locked to the groove or intentionally laid back/ahead?",
      "Tone consistency — does the voice sound the same across takes?",
      "Emotion and delivery — does it serve the song's story?",
      "Breath noise, mouth clicks, and sibilance that might need cleanup.",
    ],
  },
  {
    id: "mistakes",
    title: "Common Mistakes",
    icon: AlertTriangle,
    content: [
      "Over-comping: stitching too many takes makes the vocal sound robotic.",
      "Ignoring the bigger picture — a 'perfect' line can feel wrong in context.",
      "Cutting off natural tails or cutting too close to the note start.",
      "Using the same take for every section — variety keeps the listener engaged.",
      "Not checking comps in mono — phase issues from stereo effects can hide problems.",
    ],
  },
];

const QUICK_CHECKLIST = [
  { id: "comp-1", text: "All takes labeled and organized" },
  { id: "comp-2", text: "Listened to every take before editing" },
  { id: "comp-3", text: "Comp built phrase-by-phrase" },
  { id: "comp-4", text: "Crossfades applied at every edit" },
  { id: "comp-5", text: "Breaths sound natural" },
  { id: "comp-6", text: "Tone and energy matched across edits" },
  { id: "comp-7", text: "Checked comp in mono" },
  { id: "comp-8", text: "Emotional delivery prioritized over perfection" },
];

export function CompingGuide() {
  const { notes, updateCompingProgress } = useVocalProductionStore();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["prep"]));

  const toggleAiChat = useAppStore((state) => state.toggleAiChat);
  const sendMessage = useAIStore((state) => state.sendMessage);

  const progress = notes?.compingProgress ?? {
    completedSections: [],
    userNotes: "",
  };

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleChecklistItem = (itemId: string) => {
    const completed = new Set(progress.completedSections);
    if (completed.has(itemId)) {
      completed.delete(itemId);
    } else {
      completed.add(itemId);
    }
    updateCompingProgress({ completedSections: Array.from(completed) });
  };

  const handleAskAI = () => {
    const prompt = `I'm comping vocals for a track and want advice on:
- Which takes to choose when I have similar options
- How to handle breaths and edit points naturally
- When to prioritize emotion over technical perfection

Give me practical, actionable advice for vocal comping in a DAW.`;

    toggleAiChat();
    sendMessage(prompt);
  };

  const completedCount = progress.completedSections.length;
  const totalCount = QUICK_CHECKLIST.length;

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-4">
      {/* Progress header */}
      <div className="glass-card glass-gloss p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Scissors size={14} className="text-accent-cyan" />
            <h3 className="text-[13px] font-medium text-white/80">Comping Guide</h3>
          </div>
          <span className="text-[11px] text-white/40">
            {completedCount}/{totalCount} checked
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-cyan rounded-full transition-all duration-300"
            style={{
              width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Sections */}
      {SECTIONS.map((section) => {
        const isOpen = openSections.has(section.id);
        return (
          <div key={section.id} className="glass-card overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-3 glass-interactive rounded-xl"
            >
              <div className="flex items-center gap-2.5">
                <section.icon size={14} className="text-white/50" />
                <span className="text-[13px] font-medium text-white/80">{section.title}</span>
              </div>
              {isOpen ? (
                <ChevronUp size={14} className="text-white/40" />
              ) : (
                <ChevronDown size={14} className="text-white/40" />
              )}
            </button>

            {isOpen && (
              <div className="p-3 pt-1 space-y-2">
                {section.content.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-[12px] text-white/60 leading-relaxed"
                  >
                    <span className="text-accent-cyan/60 mt-0.5 shrink-0">•</span>
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Quick checklist */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <ListChecks size={14} className="text-accent-purple" />
          <h3 className="text-[13px] font-medium text-white/80">Quick Reference Checklist</h3>
        </div>
        <div className="space-y-1.5">
          {QUICK_CHECKLIST.map((item) => {
            const isCompleted = progress.completedSections.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleChecklistItem(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-left transition-all duration-200 ${
                  isCompleted ? "glass-interactive active" : "glass-interactive"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isCompleted ? "bg-accent-cyan/20 border-accent-cyan/50" : "border-white/20"
                  }`}
                >
                  {isCompleted && <Check size={10} className="text-accent-cyan" />}
                </div>
                <span className={isCompleted ? "text-white/50 line-through" : "text-white/70"}>
                  {item.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User notes */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={14} className="text-amber-400" />
          <h3 className="text-[13px] font-medium text-white/80">My Comping Notes</h3>
        </div>
        <textarea
          value={progress.userNotes}
          onChange={(e) => updateCompingProgress({ userNotes: e.target.value })}
          placeholder="Write your own comping notes, decisions, or reminders for this project..."
          className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-[12px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-amber-400/50 transition-colors"
          spellCheck={false}
        />
      </div>

      {/* AI button */}
      <button
        onClick={handleAskAI}
        className="w-full btn-glass-primary flex items-center justify-center gap-2 py-2.5 rounded-lg"
      >
        <Sparkles size={14} />
        <span>Ask AI for Comping Advice</span>
      </button>
    </div>
  );
}
