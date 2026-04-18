import { useState } from "react";
import {
  Upload,
  Trash2,
  Music,
  Clock,
  Activity,
  User,
  FileText,
  BarChart3,
  Waves,
  Volume2,
  Zap,
  Loader2,
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useVocalProductionStore } from "@/stores/vocalProductionStore";
import type { VocalAnalysisResult } from "@/types";

const AUDIO_FILTERS = [
  {
    name: "Audio Files",
    extensions: ["mp3", "wav", "flac", "ogg", "aac", "m4a"],
  },
];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function AnalysisCard({ analysis }: { analysis: VocalAnalysisResult }) {
  return (
    <div className="mt-3 glass-card p-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 size={12} className="text-accent-cyan" />
        <span className="text-[11px] font-medium text-white/60">Vocal Analysis</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AnalysisField
          icon={<Waves size={10} />}
          label="Formant Range"
          value={analysis.estimatedFormantRange}
        />
        <AnalysisField
          icon={<Volume2 size={10} />}
          label="Spectral Character"
          value={`${analysis.spectralBrightness.charAt(0).toUpperCase() + analysis.spectralBrightness.slice(1)}`}
        />
        <AnalysisField
          icon={<Zap size={10} />}
          label="Dynamics"
          value={`${analysis.dynamicsCharacter.charAt(0).toUpperCase() + analysis.dynamicsCharacter.slice(1)}, ${analysis.dynamicsRangeDb.toFixed(1)}dB range`}
        />
        <AnalysisField
          icon={<Activity size={10} />}
          label="Presence (2–5kHz)"
          value={`${analysis.presencePeakDb.toFixed(1)} dB`}
        />
      </div>

      {/* Hint based on analysis */}
      <div className="mt-2 pt-2 border-t border-white/5">
        <p className="text-[11px] text-white/40 leading-relaxed">{getAnalysisHint(analysis)}</p>
      </div>
    </div>
  );
}

function AnalysisField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="shrink-0 mt-0.5 text-white/30">{icon}</div>
      <div className="min-w-0">
        <span className="text-[10px] text-white/30 block">{label}</span>
        <span className="text-[11px] text-white/70 font-mono">{value}</span>
      </div>
    </div>
  );
}

function getAnalysisHint(analysis: VocalAnalysisResult): string {
  const hints: string[] = [];

  if (analysis.spectralBrightness === "harsh") {
    hints.push("Consider a gentle de-esser or cutting around 6–8kHz.");
  } else if (analysis.spectralBrightness === "dark") {
    hints.push("Try a subtle high-shelf boost around 10–12kHz for air.");
  }

  if (analysis.dynamicsCharacter === "inconsistent") {
    hints.push("Heavy compression or volume automation may help even out levels.");
  } else if (analysis.dynamicsCharacter === "compressed") {
    hints.push("The vocal is already fairly compressed — go easy on additional gain reduction.");
  }

  if (analysis.lowEndRumbleDb > -40) {
    hints.push("Significant low-end energy detected — check for rumble with a high-pass filter.");
  }

  if (hints.length === 0) {
    hints.push("The vocal has a balanced spectral profile — focus on context in the mix.");
  }

  return hints.join(" ");
}

export function ReferenceVocalLibrary() {
  const {
    referenceVocals,
    vocalAnalyses,
    addReferenceVocal,
    deleteReferenceVocal,
    updateReferenceVocal,
    analyzeVocal,
  } = useVocalProductionStore();
  const [isImporting, setIsImporting] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);

  const handleImport = async () => {
    const file = await open({
      multiple: false,
      filters: AUDIO_FILTERS,
    });

    if (file) {
      setIsImporting(true);
      await addReferenceVocal(file);
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteReferenceVocal(id);
  };

  const handleNotesChange = (vocal: (typeof referenceVocals)[0], notes: string) => {
    updateReferenceVocal({ ...vocal, notes });
  };

  const handleArtistChange = (vocal: (typeof referenceVocals)[0], artistName: string) => {
    updateReferenceVocal({ ...vocal, artistName });
  };

  const handleAnalyze = async (vocal: (typeof referenceVocals)[0]) => {
    if (!vocal.filePath) return;
    setAnalyzingId(vocal.id!);
    await analyzeVocal(vocal.filePath);
    setAnalyzingId(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h3 className="text-[13px] font-medium text-white/80">Reference Vocals</h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            Import vocal tracks for analysis and comparison
          </p>
        </div>
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="btn-glass-primary flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isImporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Import</span>
            </>
          )}
        </button>
      </div>

      {/* Vocal list */}
      <div className="flex-1 overflow-y-auto pr-2">
        {referenceVocals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="glass-interactive p-6">
              <Music size={32} className="text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-body text-white/50">No reference vocals yet</p>
              <p className="text-label text-white/30 mt-1">
                Import vocal tracks to analyze BPM, key, and duration
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {referenceVocals.map((vocal) => {
              const analysis = vocalAnalyses[vocal.filePath];
              const isAnalyzing = analyzingId === vocal.id;

              return (
                <div key={vocal.id} className="glass-interactive p-3 rounded-xl group">
                  <div className="flex items-start gap-3">
                    <div className="glass-interactive p-2 rounded-lg shrink-0 mt-0.5">
                      <Music size={16} className="text-white/40" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top row: filename + metadata */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[13px] text-white/80 truncate">{vocal.fileName}</p>
                          <div className="flex flex-wrap gap-3 mt-1">
                            {vocal.bpm && (
                              <span className="text-label text-white/40 flex items-center gap-1">
                                <Activity size={10} />
                                <span className="font-mono">{vocal.bpm.toFixed(1)} BPM</span>
                              </span>
                            )}
                            {vocal.key && (
                              <span className="text-label text-white/40 flex items-center gap-1">
                                <Music size={10} />
                                <span className="font-mono">{vocal.key}</span>
                              </span>
                            )}
                            <span className="text-label text-white/40 flex items-center gap-1">
                              <Clock size={10} />
                              <span className="font-mono">
                                {formatDuration(vocal.durationSecs)}
                              </span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(vocal.id!)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Artist name */}
                      <div className="flex items-center gap-2">
                        <User size={12} className="text-white/30" />
                        <input
                          type="text"
                          value={vocal.artistName}
                          onChange={(e) => handleArtistChange(vocal, e.target.value)}
                          placeholder="Artist name..."
                          className="flex-1 bg-transparent text-[12px] text-white/60 placeholder:text-white/20 focus:outline-none border-b border-transparent focus:border-white/10 transition-colors"
                        />
                      </div>

                      {/* Notes */}
                      <div className="flex items-start gap-2">
                        <FileText size={12} className="text-white/30 mt-1" />
                        {editingNotesId === vocal.id ? (
                          <textarea
                            value={vocal.notes}
                            onChange={(e) => handleNotesChange(vocal, e.target.value)}
                            onBlur={() => setEditingNotesId(null)}
                            autoFocus
                            placeholder="Notes about this reference vocal..."
                            className="flex-1 h-16 bg-white/5 border border-white/10 rounded-lg p-2 text-[12px] text-white/60 placeholder:text-white/20 resize-none focus:outline-none focus:border-accent-magenta/50 transition-colors"
                            spellCheck={false}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingNotesId(vocal.id!)}
                            className="flex-1 text-left"
                          >
                            {vocal.notes ? (
                              <p className="text-[12px] text-white/50 line-clamp-2">
                                {vocal.notes}
                              </p>
                            ) : (
                              <span className="text-[12px] text-white/20 italic">Add notes...</span>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Analyze button */}
                      {!analysis && (
                        <button
                          onClick={() => handleAnalyze(vocal)}
                          disabled={isAnalyzing}
                          className="flex items-center gap-1.5 text-[11px] text-accent-cyan/70 hover:text-accent-cyan transition-colors"
                        >
                          {isAnalyzing ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <BarChart3 size={12} />
                          )}
                          {isAnalyzing ? "Analyzing..." : "Analyze vocal characteristics"}
                        </button>
                      )}

                      {/* Analysis results */}
                      {analysis && <AnalysisCard analysis={analysis} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
