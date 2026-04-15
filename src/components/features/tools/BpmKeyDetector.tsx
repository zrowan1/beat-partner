import { useState } from "react";
import { Upload, Activity, Music, Zap, Clock, Radio } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAudioStore } from "@/stores/audioStore";
import { useProjectStore } from "@/stores/projectStore";
import { formatDuration } from "@/services/audioApi";

const AUDIO_FILTERS = [
  {
    name: "Audio Files",
    extensions: ["mp3", "wav", "flac", "ogg", "aac", "m4a"],
  },
];

export function BpmKeyDetector() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const { analysisResult, isAnalyzing, analysisProgress, analyzeFile, clearAnalysis } =
    useAudioStore();
  const { currentProject } = useProjectStore();

  const handleSelectFile = async () => {
    const file = await open({
      multiple: false,
      filters: AUDIO_FILTERS,
    });

    if (file) {
      setSelectedFile(file);
      clearAnalysis();
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    await analyzeFile(selectedFile);
  };

  const handleApplyToProject = async () => {
    if (!analysisResult || !currentProject) return;
    const { updateProject } = useProjectStore.getState();
    await updateProject({
      ...currentProject,
      bpm: analysisResult.bpm ? Math.round(analysisResult.bpm) : currentProject.bpm,
      key: analysisResult.key ?? currentProject.key,
    });
  };

  const fileName = selectedFile?.split("/").pop() ?? selectedFile?.split("\\").pop();

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="text-heading font-medium text-white/90">BPM & Key Detection</div>

      {/* File selector */}
      <div
        onClick={handleSelectFile}
        className="glass-interactive flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed border-white/10 cursor-pointer hover:border-white/20 transition-all duration-200"
      >
        <Upload size={32} className="text-white/30" />
        {fileName ? (
          <div className="text-center">
            <p className="text-body text-white/80">{fileName}</p>
            <p className="text-label text-white/40 mt-1">Click to change file</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-body text-white/50">Select an audio file to analyze</p>
            <p className="text-label text-white/30 mt-1">
              MP3, WAV, FLAC, OGG, AAC supported
            </p>
          </div>
        )}
      </div>

      {/* Analyze button */}
      {selectedFile && !analysisResult && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="btn-glass-primary flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>
                {analysisProgress?.type === "decoding"
                  ? "Decoding audio..."
                  : analysisProgress?.type === "analyzing"
                    ? `Analyzing: ${analysisProgress.step}`
                    : "Analyzing..."}
              </span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span>Analyze</span>
            </>
          )}
        </button>
      )}

      {/* Results */}
      {analysisResult && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            {/* BPM */}
            <div className="glass-card glass-gloss p-5 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Activity size={16} className="text-accent-cyan" />
                <span className="text-label text-white/50 uppercase tracking-wider">
                  BPM
                </span>
              </div>
              <div className="text-title font-mono font-semibold text-accent-cyan">
                {analysisResult.bpm?.toFixed(1) ?? "\u2014"}
              </div>
            </div>

            {/* Key */}
            <div className="glass-card glass-gloss p-5 rounded-xl text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Music size={16} className="text-accent-purple" />
                <span className="text-label text-white/50 uppercase tracking-wider">
                  Key
                </span>
              </div>
              <div className="text-title font-mono font-semibold text-accent-purple">
                {analysisResult.key ?? "\u2014"}
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="glass-card p-4 rounded-xl flex gap-6">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/40" />
              <span className="text-label text-white/50">Duration</span>
              <span className="text-body font-mono text-white/70">
                {formatDuration(analysisResult.durationSecs)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-white/40" />
              <span className="text-label text-white/50">Sample Rate</span>
              <span className="text-body font-mono text-white/70">
                {(analysisResult.sampleRate / 1000).toFixed(1)} kHz
              </span>
            </div>
          </div>

          {/* Apply to project */}
          {currentProject && (
            <button
              onClick={handleApplyToProject}
              className="btn-glass flex items-center justify-center gap-2 py-2.5 rounded-xl text-accent-cyan border border-accent-cyan/30 hover:border-accent-cyan/50 transition-all duration-200"
            >
              Apply to Project
            </button>
          )}

          {/* New analysis */}
          <button
            onClick={() => {
              clearAnalysis();
              setSelectedFile(null);
            }}
            className="btn-glass flex items-center justify-center gap-2 py-2 rounded-xl text-white/50 hover:text-white/70 transition-all duration-200"
          >
            Analyze another file
          </button>
        </div>
      )}

      {/* Error state */}
      {analysisProgress?.type === "error" && (
        <div className="glass-card p-4 rounded-xl border border-red-500/30">
          <p className="text-body text-red-400">{analysisProgress.message}</p>
        </div>
      )}
    </div>
  );
}
