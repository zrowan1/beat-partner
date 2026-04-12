import { ChevronDown, Cpu } from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import { Button } from "@/components/ui/Button";

export function ModelSelector() {
  const {
    models,
    selectedModel,
    selectedOpenRouterModel,
    openRouterModels,
    provider,
    setSelectedModel,
    setSelectedOpenRouterModel,
    setProvider,
    toggleModelManager,
  } = useAIStore();

  const selectedLocalModel = models.find((m) => m.id === selectedModel);
  const selectedOrModel = openRouterModels.find((m) => m.id === selectedOpenRouterModel);

  const displayName =
    provider === "openrouter"
      ? (selectedOrModel?.name ?? "Select model")
      : (selectedLocalModel?.name ?? "Select model");

  const hasAnyModels = models.length > 0 || openRouterModels.length > 0;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (!hasAnyModels) {
            toggleModelManager();
          }
        }}
        className="flex items-center gap-2 text-white/50 hover:text-white/90"
      >
        <Cpu size={14} />
        <span className="text-label truncate max-w-32">{displayName}</span>
        {hasAnyModels && <ChevronDown size={14} />}
      </Button>

      {hasAnyModels && (
        <div className="absolute top-full left-0 mt-1 w-64 glass-card py-1 hidden group-hover:block">
          {/* Local Ollama models */}
          {models.length > 0 && (
            <>
              <p className="px-3 py-1 text-[10px] text-white/30 uppercase tracking-wider">
                Local (Ollama)
              </p>
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setProvider("ollama");
                  }}
                  className={`
                    w-full px-3 py-2 text-left text-body flex items-center justify-between
                    hover:bg-white/5 transition-colors
                    ${selectedModel === model.id && provider === "ollama" ? "text-accent-cyan" : "text-white/70"}
                  `}
                >
                  <span className="truncate">{model.name}</span>
                  {selectedModel === model.id && provider === "ollama" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shrink-0" />
                  )}
                </button>
              ))}
            </>
          )}

          {/* OpenRouter models */}
          {openRouterModels.length > 0 && (
            <>
              {models.length > 0 && <div className="border-t border-white/10 my-1" />}
              <p className="px-3 py-1 text-[10px] text-white/30 uppercase tracking-wider">
                Cloud (OpenRouter)
              </p>
              {openRouterModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedOpenRouterModel(model.id);
                    setProvider("openrouter");
                  }}
                  className={`
                    w-full px-3 py-2 text-left text-body flex items-center justify-between gap-2
                    hover:bg-white/5 transition-colors
                    ${selectedOpenRouterModel === model.id && provider === "openrouter" ? "text-accent-cyan" : "text-white/70"}
                  `}
                >
                  <span className="truncate flex-1">{model.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {model.isFree && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan">
                        Free
                      </span>
                    )}
                    {selectedOpenRouterModel === model.id && provider === "openrouter" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                    )}
                  </div>
                </button>
              ))}
            </>
          )}

          <div className="border-t border-white/10 mt-1 pt-1">
            <button
              onClick={toggleModelManager}
              className="w-full px-3 py-2 text-left text-label text-white/50 hover:text-white/90 hover:bg-white/5 transition-colors"
            >
              Manage models...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
