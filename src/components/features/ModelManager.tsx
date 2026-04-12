import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, RefreshCw, Terminal, Wifi, WifiOff, X } from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import { HardwareInfoCard } from "./HardwareInfoCard";
import { ModelRecommendationsPanel } from "./ModelRecommendationsPanel";
import { InstalledModelsList } from "./InstalledModelsList";
import { Button } from "@/components/ui/Button";

function LlamaCppPanel() {
  const {
    llamaCppBaseUrl,
    llamaCppStatus,
    llamaCppModels,
    isLoadingLlamaCppModels,
    selectedModel,
    setLlamaCppBaseUrl,
    checkLlamaCppStatus,
    loadLlamaCppModels,
    selectModel,
  } = useAIStore();

  const [showInstructions, setShowInstructions] = useState(false);
  const [urlInput, setUrlInput] = useState(llamaCppBaseUrl);

  const handleCheckConnection = () => {
    setLlamaCppBaseUrl(urlInput);
    void checkLlamaCppStatus();
    void loadLlamaCppModels();
  };

  const StatusDot = () => {
    if (llamaCppStatus === "available") {
      return <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />;
    }
    if (llamaCppStatus === "unavailable") {
      return <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />;
    }
    return <span className="w-2 h-2 rounded-full bg-white/20 shrink-0" />;
  };

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center shrink-0">
          <Wifi size={16} className="text-accent-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-white/90">Local (llama.cpp)</p>
          <p className="text-label text-white/40">Connect to a running llama-server</p>
        </div>
        <StatusDot />
        {llamaCppStatus === "available" && (
          <span className="text-label text-green-400">Running</span>
        )}
        {llamaCppStatus === "unavailable" && (
          <span className="text-label text-red-400 flex items-center gap-1">
            <WifiOff size={12} />
            Not found
          </span>
        )}
      </div>

      {/* URL input + check button */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCheckConnection()}
          placeholder="http://localhost:8080"
          className="flex-1 glass-interactive px-3 py-2 text-body text-white/80 bg-transparent outline-none placeholder:text-white/30 rounded-lg"
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCheckConnection}
          disabled={isLoadingLlamaCppModels}
          className="shrink-0 flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={isLoadingLlamaCppModels ? "animate-spin" : ""} />
          Check
        </Button>
      </div>

      {/* Loaded models */}
      {llamaCppStatus === "available" && llamaCppModels.length > 0 && (
        <div className="space-y-1">
          <p className="text-label text-white/40 uppercase tracking-wide px-1">Loaded model</p>
          {llamaCppModels.map((model) => (
            <button
              key={model.id}
              onClick={() => selectModel(model.id, "llama_cpp")}
              className={`w-full glass-interactive px-3 py-2 rounded-lg text-left flex items-center justify-between transition-all duration-200 ${
                selectedModel === model.id ? "active" : ""
              }`}
            >
              <span className="text-body text-white/80 truncate">{model.name || model.id}</span>
              {selectedModel === model.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Setup instructions */}
      <button
        onClick={() => setShowInstructions((v) => !v)}
        className="flex items-center gap-1.5 text-label text-white/40 hover:text-white/60 transition-colors duration-200"
      >
        {showInstructions ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Setup instructions
      </button>

      {showInstructions && (
        <div className="glass-card p-3 space-y-2">
          <div className="flex items-center gap-2 text-white/60">
            <Terminal size={14} />
            <span className="text-label font-medium">Start llama-server</span>
          </div>
          <pre className="text-label text-accent-cyan/80 bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
            {`llama-server -m /path/to/model.gguf --port 8080`}
          </pre>
          <p className="text-label text-white/40">
            Download GGUF models from{" "}
            <span className="text-accent-cyan">Hugging Face</span>. llama-server is part of the{" "}
            <span className="text-accent-cyan">llama.cpp</span> project.
          </p>
        </div>
      )}
    </div>
  );
}

export function ModelManager() {
  const {
    hardware,
    isLoadingHardware,
    models,
    isLoadingModels,
    recommendations,
    isLoadingRecommendations,
    loadModels,
    loadHardwareInfo,
    loadRecommendations,
    toggleModelManager,
  } = useAIStore();

  useEffect(() => {
    loadHardwareInfo();
    loadModels();
  }, [loadHardwareInfo, loadModels]);

  useEffect(() => {
    if (hardware) {
      loadRecommendations();
    }
  }, [hardware, loadRecommendations]);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75">
      {/* Solid background card — no backdrop-filter to avoid WKWebView compositor bug */}
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: "#0f0f14" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <h2 className="text-heading font-semibold text-white/90">Model Manager</h2>
          <Button variant="ghost" size="sm" onClick={toggleModelManager}>
            <X size={18} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          <HardwareInfoCard hardware={hardware} isLoading={isLoadingHardware} />
          <ModelRecommendationsPanel
            recommendations={recommendations}
            isLoading={isLoadingRecommendations}
          />
          <InstalledModelsList
            models={models}
            isLoading={isLoadingModels}
            onRefresh={loadModels}
          />
          <LlamaCppPanel />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-2 shrink-0">
          <Button variant="secondary" onClick={toggleModelManager}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
