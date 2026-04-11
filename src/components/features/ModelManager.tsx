import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import { HardwareInfoCard } from "./HardwareInfoCard";
import { ModelRecommendationsPanel } from "./ModelRecommendationsPanel";
import { InstalledModelsList } from "./InstalledModelsList";
import { Button } from "@/components/ui/Button";

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
