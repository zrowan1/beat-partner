import { useState } from "react";
import { Sparkles, Send, Mic2, Guitar, Lightbulb } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useAIStore } from "@/stores/aiStore";

const GENRES = [
  "Pop",
  "Hip-Hop / Rap",
  "R&B",
  "Rock",
  "Indie / Alternative",
  "Electronic",
  "Country",
  "Jazz",
  "Metal",
  "Soul",
  "Folk",
  "Other",
];

const VOCALIST_TYPES = [
  "Male — Tenor",
  "Male — Baritone",
  "Male — Bass",
  "Female — Soprano",
  "Female — Mezzo-Soprano",
  "Female — Alto",
  "Androgynous / Non-binary",
];

export function VocalChainAdvisor() {
  const [genre, setGenre] = useState("");
  const [vocalistType, setVocalistType] = useState("");
  const [vibe, setVibe] = useState("");
  const [isSending, setIsSending] = useState(false);

  const toggleAiChat = useAppStore((state) => state.toggleAiChat);
  const sendMessage = useAIStore((state) => state.sendMessage);

  const handleGetAdvice = async () => {
    if (!genre || !vocalistType) return;

    const prompt = `I'm recording ${vocalistType.toLowerCase()} vocals for a ${genre.toLowerCase()} track${
      vibe ? `. The vibe I'm going for is: ${vibe}` : ""
    }.

Please suggest:
1. A microphone choice (specific model) with reasoning
2. A complete vocal chain with specific settings:
   - EQ (frequencies, Q, gain)
   - Compression (ratio, attack, release, threshold range)
   - Reverb (type, decay, pre-delay)
   - Delay (type, timing, feedback)
   - Any additional processing (de-esser, saturation, etc.)
3. Recording tips specific to this genre and vocalist type

Keep it practical and actionable for a home studio setup.`;

    setIsSending(true);
    toggleAiChat();
    await sendMessage(prompt);
    setIsSending(false);
  };

  const canSubmit = genre && vocalistType && !isSending;

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-4">
      {/* Intro card */}
      <div className="glass-card glass-gloss p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={14} className="text-accent-cyan" />
          <h3 className="text-[13px] font-medium text-white/80">
            AI Vocal Chain Advisor
          </h3>
        </div>
        <p className="text-[12px] text-white/50 leading-relaxed">
          Describe your track and vocalist, and the AI will suggest a complete
          microphone choice and vocal processing chain tailored to your setup.
          The response opens in the AI chat panel.
        </p>
      </div>

      {/* Inputs */}
      <div className="glass-card p-4 space-y-4">
        {/* Genre */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1.5">
            <Guitar size={12} />
            Genre
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white/80 focus:outline-none focus:border-accent-cyan/50 transition-colors appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="" disabled className="bg-[#0f0f14]">
              Select a genre...
            </option>
            {GENRES.map((g) => (
              <option key={g} value={g} className="bg-[#0f0f14]">
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Vocalist Type */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1.5">
            <Mic2 size={12} />
            Vocalist Type
          </label>
          <select
            value={vocalistType}
            onChange={(e) => setVocalistType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[13px] text-white/80 focus:outline-none focus:border-accent-cyan/50 transition-colors appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="" disabled className="bg-[#0f0f14]">
              Select vocalist type...
            </option>
            {VOCALIST_TYPES.map((v) => (
              <option key={v} value={v} className="bg-[#0f0f14]">
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Vibe */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] text-white/40 mb-1.5">
            <Sparkles size={12} />
            Vibe / Description (optional)
          </label>
          <textarea
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder="e.g., airy and ethereal, gritty and raw, smooth and polished..."
            className="w-full h-20 bg-white/5 border border-white/10 rounded-lg p-3 text-[13px] text-white/80 placeholder:text-white/20 resize-none focus:outline-none focus:border-accent-cyan/50 transition-colors"
            spellCheck={false}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleGetAdvice}
          disabled={!canSubmit}
          className="w-full btn-glass-primary flex items-center justify-center gap-2 py-2.5 rounded-lg disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:scale-100"
        >
          {isSending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Asking AI...</span>
            </>
          ) : (
            <>
              <Send size={14} />
              <span>Get AI Advice</span>
            </>
          )}
        </button>
      </div>

      {/* Quick tips */}
      <div className="glass-card p-4">
        <h4 className="text-[12px] font-medium text-white/60 mb-2">
          Quick Tips
        </h4>
        <ul className="space-y-1.5">
          {[
            "Record at ~-12dB peak to leave headroom for processing",
            "Use a pop filter 2–4 inches from the mic capsule",
            "High-pass around 80–100Hz to remove rumble",
            "Boost 2–5kHz for intelligibility, cut 200–400Hz for mud",
            "Parallel compression can add weight without squash",
          ].map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12px] text-white/40"
            >
              <span className="text-accent-cyan/60 mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
