import { ChevronDown, Cpu } from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import { Button } from "@/components/ui/Button";

export function ModelSelector() {
  const { models, selectedModel, setSelectedModel, toggleModelManager } = useAIStore();

  const selectedModelData = models.find((m) => m.id === selectedModel);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (models.length === 0) {
            toggleModelManager();
          }
        }}
        className="flex items-center gap-2 text-white/50 hover:text-white/90"
      >
        <Cpu size={14} />
        <span className="text-label truncate max-w-32">
          {selectedModelData?.name || "Select model"}
        </span>
        {models.length > 0 && <ChevronDown size={14} />}
      </Button>

      {models.length > 0 && selectedModel && (
        <div className="absolute top-full left-0 mt-1 w-56 glass-card py-1 hidden group-hover:block">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`
                w-full px-3 py-2 text-left text-body flex items-center justify-between
                hover:bg-white/5 transition-colors
                ${selectedModel === model.id ? "text-accent-cyan" : "text-white/70"}
              `}
            >
              <span>{model.name}</span>
              {selectedModel === model.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
              )}
            </button>
          ))}
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
