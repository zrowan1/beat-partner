import { Check, Trash2, RefreshCw } from "lucide-react";
import type { OllamaModel } from "@/types";
import { Button } from "@/components/ui/Button";
import { useAIStore } from "@/stores/aiStore";
import { formatModelSize, getUseCaseLabel } from "@/services/aiApi";

interface InstalledModelsListProps {
  models: OllamaModel[];
  isLoading?: boolean;
  onRefresh: () => void;
}

export function InstalledModelsList({
  models,
  isLoading,
  onRefresh,
}: InstalledModelsListProps) {
  const { selectedModel, setSelectedModel, deleteModel } = useAIStore();

  if (isLoading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-12 bg-white/10 rounded" />
          <div className="h-12 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 flex-1 min-h-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label font-medium text-white/70">
          Installed Models ({models.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          <RefreshCw size={14} />
        </Button>
      </div>

      {models.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-body text-white/40 mb-2">No models installed</p>
          <p className="text-label text-white/30">
            Download a model from the recommendations above
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`
                glass-interactive p-3 rounded-lg cursor-pointer transition-all
                ${selectedModel === model.id ? "ring-1 ring-accent-cyan bg-accent-cyan/10" : "hover:bg-white/5"}
              `}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-body font-medium text-white/90 truncate">
                      {model.name}
                    </span>
                    {selectedModel === model.id && (
                      <Check size={14} className="text-accent-cyan shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-label">
                    <span className="text-white/50">
                      {formatModelSize(model.sizeGb)}
                    </span>
                    <span className="text-white/30">{model.parameterCount}</span>
                    <span className="text-white/30 truncate">
                      {model.useCases.slice(0, 2).map(getUseCaseLabel).join(", ")}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e?.stopPropagation();
                    if (confirm(`Delete ${model.name}?`)) {
                      deleteModel(model.id);
                    }
                  }}
                  className="shrink-0 text-white/30 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
