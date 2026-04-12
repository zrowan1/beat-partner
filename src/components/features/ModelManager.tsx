import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Cloud,
  Eye,
  EyeOff,
  RefreshCw,
  Terminal,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import type { OpenRouterModel } from "@/types";
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

function OpenRouterPanel() {
  const {
    openRouterApiKey,
    openRouterModels,
    isLoadingOpenRouterModels,
    selectedOpenRouterModel,
    provider,
    setOpenRouterApiKey,
    setSelectedOpenRouterModel,
    fetchOpenRouterModels,
    setProvider,
  } = useAIStore();

  const [apiKeyInput, setApiKeyInput] = useState(openRouterApiKey ?? "");
  const [showKey, setShowKey] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [providerFilter, setProviderFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const availableProviders = useMemo(() => {
    const names = new Set(openRouterModels.map((m) => m.topProvider));
    return ["all", ...Array.from(names).sort()];
  }, [openRouterModels]);

  const filteredModels = useMemo(() => {
    return openRouterModels.filter((m) => {
      if (freeOnly && !m.isFree) return false;
      if (providerFilter !== "all" && m.topProvider !== providerFilter) return false;
      if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [openRouterModels, freeOnly, providerFilter, searchQuery]);

  const handleSaveKey = () => {
    setOpenRouterApiKey(apiKeyInput.trim() || null);
  };

  const handleSelectModel = (model: OpenRouterModel) => {
    setSelectedOpenRouterModel(model.id);
    if (provider !== "openrouter") {
      setProvider("openrouter");
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Free";
    if (price < 1) return `$${price.toFixed(3)}/1M`;
    return `$${price.toFixed(2)}/1M`;
  };

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accent-purple/10 flex items-center justify-center shrink-0">
          <Cloud size={16} className="text-accent-purple" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body font-medium text-white/90">Cloud (OpenRouter)</p>
          <p className="text-label text-white/40">200+ models via one API key</p>
        </div>
        {openRouterModels.length > 0 && (
          <span className="text-label text-white/40">{openRouterModels.length} models</span>
        )}
      </div>

      {/* API key input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? "text" : "password"}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
            placeholder="sk-or-..."
            className="w-full glass-interactive px-3 py-2 pr-9 text-body text-white/80 bg-transparent outline-none placeholder:text-white/30 rounded-lg"
          />
          <button
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors duration-200"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSaveKey}
          className="shrink-0"
        >
          Save
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { void fetchOpenRouterModels(); }}
          disabled={isLoadingOpenRouterModels || !openRouterApiKey}
          className="shrink-0 flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={isLoadingOpenRouterModels ? "animate-spin" : ""} />
          Fetch
        </Button>
      </div>

      {/* Filters — only shown when models are loaded */}
      {openRouterModels.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Free toggle */}
          <button
            onClick={() => setFreeOnly((v) => !v)}
            className={`glass-interactive px-2.5 py-1 rounded-lg text-label transition-all duration-200 ${
              freeOnly ? "active text-accent-cyan" : "text-white/50"
            }`}
          >
            Free only
          </button>

          {/* Provider filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="glass-interactive px-2.5 py-1 rounded-lg text-label text-white/70 bg-transparent outline-none"
          >
            {availableProviders.map((p) => (
              <option key={p} value={p} style={{ background: "#0f0f14" }}>
                {p === "all" ? "All providers" : p}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 min-w-[120px] glass-interactive px-2.5 py-1 rounded-lg text-label text-white/80 bg-transparent outline-none placeholder:text-white/30"
          />
        </div>
      )}

      {/* Model list */}
      {filteredModels.length > 0 && (
        <div className="space-y-1 max-h-60 overflow-y-auto">
          <p className="text-label text-white/40 uppercase tracking-wide px-1">
            {filteredModels.length} model{filteredModels.length !== 1 ? "s" : ""}
          </p>
          {filteredModels.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelectModel(model)}
              className={`w-full glass-interactive px-3 py-2 rounded-lg text-left flex items-center gap-3 transition-all duration-200 ${
                selectedOpenRouterModel === model.id && provider === "openrouter" ? "active" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-body text-white/80 truncate">{model.name}</span>
                  {model.isFree && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan shrink-0">
                      Free
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-label text-white/30">{model.topProvider}</span>
                  {model.contextLength > 0 && (
                    <span className="text-label text-white/25">
                      {(model.contextLength / 1000).toFixed(0)}k ctx
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                {model.isFree ? (
                  <span className="text-label text-accent-cyan/70">Free</span>
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-white/30">in: {formatPrice(model.pricingPrompt)}</p>
                    <p className="text-[10px] text-white/30">out: {formatPrice(model.pricingCompletion)}</p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {openRouterModels.length > 0 && filteredModels.length === 0 && (
        <p className="text-label text-white/30 text-center py-4">No models match your filters</p>
      )}

      {!openRouterApiKey && (
        <p className="text-label text-white/30">
          Get your free API key at{" "}
          <span className="text-accent-purple">openrouter.ai</span>
        </p>
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
          <OpenRouterPanel />
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
