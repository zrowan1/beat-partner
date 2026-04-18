import { useState } from "react";
import { Sliders, Music, Wand2, Search, Check, X } from "lucide-react";
import { useVocalProductionStore } from "@/stores/vocalProductionStore";
import { VOCAL_EFFECT_PRESETS, GENRE_COLORS } from "@/constants/vocalPresets";
import type { VocalEffectPreset } from "@/types";

const ALL_GENRES = Array.from(new Set(VOCAL_EFFECT_PRESETS.map((p) => p.genre)));

export function VocalEffectPresets() {
  const { notes, scheduleAutoSave } = useVocalProductionStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const filteredPresets = VOCAL_EFFECT_PRESETS.filter((preset) => {
    const matchesSearch =
      searchQuery === "" ||
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === null || preset.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const handleApply = (preset: VocalEffectPreset) => {
    if (!notes) return;
    scheduleAutoSave({ vocalChain: preset.chain });
    setAppliedId(preset.id);
    setTimeout(() => setAppliedId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="glass-card glass-gloss p-4 mb-4 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Wand2 size={14} className="text-accent-cyan" />
          <h3 className="text-[13px] font-medium text-white/80">Vocal Effect Presets</h3>
        </div>
        <p className="text-[12px] text-white/50 leading-relaxed">
          Browse genre-specific vocal chain presets. Click "Apply to My Chain" to copy settings into
          your vocal production notes.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search presets..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-[12px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-accent-cyan/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Genre pills */}
      <div className="flex items-center gap-2 mb-4 shrink-0 flex-wrap">
        <button
          onClick={() => setSelectedGenre(null)}
          className={`px-3 py-1 rounded-full text-[11px] transition-all duration-200 ${
            selectedGenre === null ? "glass-interactive active" : "glass-interactive text-white/50"
          }`}
        >
          All
        </button>
        {ALL_GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
            className={`px-3 py-1 rounded-full text-[11px] transition-all duration-200 ${
              selectedGenre === genre
                ? "glass-interactive active"
                : "glass-interactive text-white/50"
            }`}
            style={
              selectedGenre === genre ? { borderColor: `${GENRE_COLORS[genre]}40` } : undefined
            }
          >
            {genre}
          </button>
        ))}
      </div>

      {/* Presets grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-1 gap-3">
          {filteredPresets.map((preset) => {
            const genreColor = GENRE_COLORS[preset.genre] || "#22d3ee";
            const isApplied = appliedId === preset.id;

            return (
              <div key={preset.id} className="glass-card p-4 relative overflow-hidden">
                {/* Genre accent border */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5"
                  style={{ background: genreColor }}
                />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: `${genreColor}15`,
                          color: genreColor,
                        }}
                      >
                        {preset.genre}
                      </span>
                    </div>
                    <h4 className="text-[13px] font-medium text-white/90">{preset.name}</h4>
                    <p className="text-[11px] text-white/40 mt-0.5">{preset.description}</p>
                  </div>
                  <button
                    onClick={() => handleApply(preset)}
                    disabled={isApplied}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                      isApplied ? "bg-green-500/15 text-green-400" : "btn-glass-primary"
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check size={12} />
                        Applied
                      </>
                    ) : (
                      <>
                        <Sliders size={12} />
                        Apply to My Chain
                      </>
                    )}
                  </button>
                </div>

                {/* Chain settings */}
                <div className="space-y-2">
                  <ChainField
                    icon={<Music size={10} />}
                    label="EQ"
                    value={preset.chain.eq}
                    color={genreColor}
                  />
                  <ChainField
                    icon={<Sliders size={10} />}
                    label="Compressor"
                    value={preset.chain.compressor}
                    color={genreColor}
                  />
                  <ChainField
                    icon={<Music size={10} />}
                    label="Reverb"
                    value={preset.chain.reverb}
                    color={genreColor}
                  />
                  <ChainField
                    icon={<Music size={10} />}
                    label="Delay"
                    value={preset.chain.delay}
                    color={genreColor}
                  />
                  {preset.chain.other && (
                    <ChainField
                      icon={<Wand2 size={10} />}
                      label="Other"
                      value={preset.chain.other}
                      color={genreColor}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredPresets.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center gap-3">
            <Sliders size={24} className="text-white/20" />
            <p className="text-[12px] text-white/40">No presets match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ChainField({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div
        className="shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center"
        style={{ background: `${color}15`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
        <p className="text-[11px] text-white/60 leading-relaxed">{value}</p>
      </div>
    </div>
  );
}
