import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Music,
  Settings,
  Clock,
  Wrench,
  Heart,
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
  icon: typeof Music;
  content: string[];
}

const SECTIONS: Section[] = [
  {
    id: "when",
    title: "When to Tune",
    icon: Music,
    content: [
      "Corrective tuning: fix obvious pitch mistakes that distract the listener.",
      "Creative tuning: use as an effect (T-Pain, hyperpop, etc.) — this is intentional.",
      "Genre expectations: pop and EDM demand tighter pitch; jazz and folk allow more drift.",
      "Not every note needs fixing — slight variations make a vocal sound human.",
      "If the performance is great but has one sour note, tune just that note.",
    ],
  },
  {
    id: "how-much",
    title: "How Much to Tune",
    icon: Settings,
    content: [
      "Set correction speed slower for a more natural sound (50–70% in most tools).",
      "Preserve formants — shifting pitch without formant correction sounds unnatural.",
      "Allow vibrato to pass through untouched; it adds life to the performance.",
      "Avoid 'correcting' every note to the exact center of the pitch — this sounds robotic.",
      "Use manual editing for important lines; auto-tune is fine for background vocals.",
    ],
  },
  {
    id: "timing",
    title: "Timing Adjustments",
    icon: Clock,
    content: [
      "Quantize lightly — 50–70% strength keeps the human feel while tightening the groove.",
      "Preserve intentional pushes and pulls (e.g., laid-back verses, driving choruses).",
      "Align backing vocals to the lead, not the grid — they should support, not compete.",
      "Watch for transients: moving vocal starts too far can soften consonants.",
      "Use slip-editing (time-stretching within the clip) for subtle shifts, not hard cuts.",
    ],
  },
  {
    id: "tools",
    title: "Tools & Workflow",
    icon: Wrench,
    content: [
      "Melodyne: best for detailed, note-by-note editing with excellent formant control.",
      "Auto-Tune / Waves Tune: great for real-time or automatic correction.",
      "Flex Pitch (Logic) / VariAudio (Cubase): built-in, convenient for quick fixes.",
      "Always work on a duplicate playlist / take — keep the original untouched.",
      "Bounce tuned vocals to a new track before mixing to reduce CPU load and preserve edits.",
    ],
  },
  {
    id: "natural",
    title: "Maintaining Naturalness",
    icon: Heart,
    content: [
      "Retain subtle pitch drift at note starts and ends — perfectly straight notes sound synthetic.",
      "Preserve breaths, lip smacks, and other 'imperfections' — they add intimacy.",
      "Don't over-tune ad-libs and background vocals — raw energy often beats precision.",
      "Compare tuned vs. untuned frequently; your ears adapt quickly.",
      "If it sounds worse after tuning, undo and try a lighter touch — or leave it alone.",
    ],
  },
];

const QUICK_CHECKLIST = [
  { id: "tune-1", text: "Decided on corrective vs. creative approach" },
  { id: "tune-2", text: "Set correction speed to natural (50–70%)" },
  { id: "tune-3", text: "Formant preservation enabled" },
  { id: "tune-4", text: "Vibrato left untouched" },
  { id: "tune-5", text: "Timing quantized lightly (50–70%)" },
  { id: "tune-6", text: "Original take preserved on duplicate" },
  { id: "tune-7", text: "Checked tuned vs. untuned in context" },
  { id: "tune-8", text: "Bounced tuned vocals before mixing" },
];

export function TuningTimingGuide() {
  const { notes, updateTuningTimingProgress } = useVocalProductionStore();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["when"]));

  const toggleAiChat = useAppStore((state) => state.toggleAiChat);
  const sendMessage = useAIStore((state) => state.sendMessage);

  const progress = notes?.tuningTimingProgress ?? {
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
    updateTuningTimingProgress({
      completedSections: Array.from(completed),
    });
  };

  const handleAskAI = () => {
    const prompt = `I'm tuning and timing vocals in my DAW. I need advice on:
- How to keep vocals sounding natural while correcting pitch
- When to use manual tuning vs. automatic correction
- Timing adjustments that preserve feel and groove
- Common mistakes that make tuned vocals sound robotic

Give me practical, actionable advice.`;

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
            <Music size={14} className="text-rose-400" />
            <h3 className="text-[13px] font-medium text-white/80">Tuning & Timing Guide</h3>
          </div>
          <span className="text-[11px] text-white/40">
            {completedCount}/{totalCount} checked
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-400 rounded-full transition-all duration-300"
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
                    <span className="text-rose-400/60 mt-0.5 shrink-0">•</span>
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
                    isCompleted ? "bg-rose-400/20 border-rose-400/50" : "border-white/20"
                  }`}
                >
                  {isCompleted && <Check size={10} className="text-rose-400" />}
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
          <h3 className="text-[13px] font-medium text-white/80">My Tuning & Timing Notes</h3>
        </div>
        <textarea
          value={progress.userNotes}
          onChange={(e) => updateTuningTimingProgress({ userNotes: e.target.value })}
          placeholder="Write your own tuning and timing notes, tool settings, or reminders..."
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
        <span>Ask AI for Tuning Advice</span>
      </button>
    </div>
  );
}
