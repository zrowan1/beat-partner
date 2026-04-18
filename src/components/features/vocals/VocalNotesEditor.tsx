import { useCallback } from "react";
import { Mic, Sliders, FileEdit, Scissors, Music } from "lucide-react";
import { useVocalProductionStore } from "@/stores/vocalProductionStore";
import type { VocalProductionNotes } from "@/types";

export function VocalNotesEditor() {
  const { notes, scheduleAutoSave } = useVocalProductionStore();

  const handleChange = useCallback(
    (field: keyof Omit<VocalProductionNotes, "id" | "projectId" | "updatedAt" | "vocalChain" | "checklist">, value: string) => {
      if (!notes) return;
      scheduleAutoSave({ [field]: value });
    },
    [notes, scheduleAutoSave]
  );

  const handleChainChange = useCallback(
    (field: keyof VocalProductionNotes["vocalChain"], value: string) => {
      if (!notes) return;
      const updatedChain = { ...notes.vocalChain, [field]: value };
      scheduleAutoSave({ vocalChain: updatedChain });
    },
    [notes, scheduleAutoSave]
  );

  if (!notes) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-4">
      {/* Mic Choice */}
      <div className="glass-card glass-gloss p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mic size={14} className="text-accent-magenta" />
          <h3 className="text-[13px] font-medium text-white/80">
            Microphone Choice
          </h3>
        </div>
        <textarea
          value={notes.micChoice}
          onChange={(e) => handleChange("micChoice", e.target.value)}
          placeholder="Which mic are you using and why? (e.g., SM7B for warmth, U87 for clarity...)"
          className="w-full h-20 bg-white/5 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-accent-magenta/50 transition-colors"
          spellCheck={false}
        />
      </div>

      {/* Vocal Chain */}
      <div className="glass-card glass-gloss p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sliders size={14} className="text-accent-cyan" />
          <h3 className="text-[13px] font-medium text-white/80">Vocal Chain</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ChainField
            icon={<Music size={12} />}
            label="EQ"
            value={notes.vocalChain.eq}
            onChange={(v) => handleChainChange("eq", v)}
            placeholder="High-pass 80Hz, +2dB 3kHz..."
          />
          <ChainField
            icon={<Music size={12} />}
            label="Compressor"
            value={notes.vocalChain.compressor}
            onChange={(v) => handleChainChange("compressor", v)}
            placeholder="Ratio 4:1, attack 10ms..."
          />
          <ChainField
            icon={<Music size={12} />}
            label="Reverb"
            value={notes.vocalChain.reverb}
            onChange={(v) => handleChainChange("reverb", v)}
            placeholder="Plate, decay 2.5s, pre-delay 25ms..."
          />
          <ChainField
            icon={<Music size={12} />}
            label="Delay"
            value={notes.vocalChain.delay}
            onChange={(v) => handleChainChange("delay", v)}
            placeholder="1/4 note, 30% wet, feedback 25%..."
          />
          <ChainField
            icon={<Sliders size={12} />}
            label="Other"
            value={notes.vocalChain.other}
            onChange={(v) => handleChainChange("other", v)}
            placeholder="De-esser, saturation, doubler..."
            className="col-span-2"
          />
        </div>
      </div>

      {/* Recording Notes */}
      <div className="glass-card glass-gloss p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileEdit size={14} className="text-accent-purple" />
          <h3 className="text-[13px] font-medium text-white/80">
            Recording Notes
          </h3>
        </div>
        <textarea
          value={notes.recordingNotes}
          onChange={(e) => handleChange("recordingNotes", e.target.value)}
          placeholder="Notes about the recording session: takes that worked, issues, vocalist feedback..."
          className="w-full h-28 bg-white/5 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-accent-purple/50 transition-colors"
          spellCheck={false}
        />
      </div>

      {/* Editing Notes */}
      <div className="glass-card glass-gloss p-4">
        <div className="flex items-center gap-2 mb-3">
          <Scissors size={14} className="text-amber-400" />
          <h3 className="text-[13px] font-medium text-white/80">
            Editing Notes
          </h3>
        </div>
        <textarea
          value={notes.editingNotes}
          onChange={(e) => handleChange("editingNotes", e.target.value)}
          placeholder="Comping decisions, crossfade notes, timing adjustments..."
          className="w-full h-28 bg-white/5 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-amber-400/50 transition-colors"
          spellCheck={false}
        />
      </div>

      {/* Tuning Notes */}
      <div className="glass-card glass-gloss p-4">
        <div className="flex items-center gap-2 mb-3">
          <Music size={14} className="text-rose-400" />
          <h3 className="text-[13px] font-medium text-white/80">
            Tuning Notes
          </h3>
        </div>
        <textarea
          value={notes.tuningNotes}
          onChange={(e) => handleChange("tuningNotes", e.target.value)}
          placeholder="Pitch correction settings, formant shifts, manual tuning notes..."
          className="w-full h-28 bg-white/5 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-rose-400/50 transition-colors"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function ChainField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1.5">
        {icon}
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-16 bg-white/5 border border-white/10 rounded-lg p-2.5 text-[12px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-accent-cyan/50 transition-colors"
        spellCheck={false}
      />
    </div>
  );
}
