import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, Check, Download, HardDrive, Loader2, X } from "lucide-react";
import { useAIStore } from "@/stores/aiStore";
import { Button } from "@/components/ui/Button";
import type { OllamaStatus, HardwareCapabilities, ModelRecommendation } from "@/types";
import * as aiApi from "@/services/aiApi";

type SetupStep = "checking" | "hardware" | "recommendations" | "downloading" | "complete";

interface FirstRunModelSetupProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function FirstRunModelSetup({ onComplete, onSkip }: FirstRunModelSetupProps) {
  const [step, setStep] = useState<SetupStep>("checking");
  const [, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [hardware, setHardware] = useState<HardwareCapabilities | null>(null);
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { setSelectedModel: setStoreSelectedModel, loadModels } = useAIStore();

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    setStep("checking");
    setError(null);

    try {
      // Check Ollama status
      const status = await aiApi.checkOllamaStatus();
      setOllamaStatus(status);

      if (!status.available) {
        setError("Ollama is not running. Please install and start Ollama first.");
        return;
      }

      // Detect hardware
      setStep("hardware");
      try {
        const hw = await aiApi.checkHardwareCapabilities();
        setHardware(hw);
      } catch (hwError) {
        console.error("Hardware detection failed:", hwError);
        // Continue without hardware info
        setHardware({
          totalMemoryGb: 16,
          cpuCores: 8,
          cpuVendor: "Unknown",
          os: "macos",
          isAppleSilicon: false,
        });
      }

      // Get recommendations
      setStep("recommendations");
      try {
        const recs = await aiApi.getModelRecommendations();
        setRecommendations(recs);

        if (recs.length > 0) {
          setSelectedModel(recs[0].modelId);
        }
      } catch (recError) {
        console.error("Failed to get recommendations:", recError);
        // Set default recommendations
        setRecommendations([
          {
            modelId: "llama3.2",
            name: "Llama 3.2",
            sizeGb: 4,
            useCases: ["general", "production"],
            reasoning: "Good all-round model for most tasks",
            estimatedSpeed: "medium",
            quality: "good",
          },
        ]);
        setSelectedModel("llama3.2");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDownload = async () => {
    if (!selectedModel) return;

    setStep("downloading");
    setDownloadProgress(0);

    try {
      await aiApi.downloadModel(selectedModel, undefined, (progress) => {
        setDownloadProgress(progress.percentage);

        if (progress.status === "completed") {
          setStep("complete");
          setStoreSelectedModel(selectedModel);
          loadModels();
        } else if (progress.status === "error") {
          setError(progress.error || "Download failed");
          setStep("recommendations");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
      setStep("recommendations");
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const renderStep = () => {
    switch (step) {
      case "checking":
        return (
          <div className="text-center py-8">
            <Loader2 size={32} className="animate-spin text-accent-cyan mx-auto mb-4" />
            <p className="text-body text-white/70">Checking Ollama status...</p>
          </div>
        );

      case "hardware":
        return (
          <div className="text-center py-8">
            <HardDrive size={32} className="text-accent-purple mx-auto mb-4" />
            <p className="text-body text-white/70">Detecting hardware...</p>
            {hardware && (
              <p className="text-label text-white/50 mt-2">
                {hardware.totalMemoryGb.toFixed(0)}GB RAM • {hardware.cpuCores} cores
              </p>
            )}
          </div>
        );

      case "recommendations":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Bot size={32} className="text-accent-magenta mx-auto mb-3" />
              <h3 className="text-heading font-medium text-white/90 mb-2">
                Choose Your AI Model
              </h3>
              <p className="text-body text-white/50">
                Based on your system ({hardware?.totalMemoryGb.toFixed(0)}GB RAM), we recommend:
              </p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recommendations.map((rec) => (
                <button
                  key={rec.modelId}
                  onClick={() => setSelectedModel(rec.modelId)}
                  className={`
                    w-full glass-interactive p-3 text-left transition-all
                    ${selectedModel === rec.modelId ? "ring-1 ring-accent-cyan bg-accent-cyan/10" : "hover:bg-white/5"}
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-body font-medium text-white/90">
                      {rec.name}
                    </span>
                    {selectedModel === rec.modelId && (
                      <Check size={16} className="text-accent-cyan" />
                    )}
                  </div>
                  <p className="text-label text-white/40 mb-2">{rec.reasoning}</p>
                  <div className="flex items-center gap-3 text-label">
                    <span className="text-white/50">{rec.sizeGb}GB</span>
                    <span className="text-white/30">{rec.estimatedSpeed}</span>
                    <span className="text-white/30">{rec.quality} quality</span>
                  </div>
                </button>
              ))}
            </div>

            {error && (
              <div className="glass-interactive p-3 bg-red-500/10 border-red-500/30">
                <p className="text-body text-red-400">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" onClick={onSkip} className="flex-1">
                Skip for now
              </Button>
              <Button
                variant="primary"
                onClick={handleDownload}
                disabled={!selectedModel}
                className="flex-1"
              >
                <Download size={16} className="mr-2" />
                Download
              </Button>
            </div>
          </div>
        );

      case "downloading":
        return (
          <div className="text-center py-8">
            <Download size={32} className="text-accent-cyan mx-auto mb-4" />
            <p className="text-body text-white/70 mb-4">
              Downloading {selectedModel}...
            </p>
            <div className="glass-interactive p-1 rounded-full overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-accent-cyan to-accent-purple rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-label text-white/50 mt-2">
              {downloadProgress.toFixed(1)}%
            </p>
          </div>
        );

      case "complete":
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-accent-cyan/20 flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-accent-cyan" />
            </div>
            <h3 className="text-heading font-medium text-white/90 mb-2">
              Ready to Go!
            </h3>
            <p className="text-body text-white/50 mb-6">
              {selectedModel} is installed and ready to use.
            </p>
            <Button variant="primary" onClick={handleComplete} className="w-full">
              Start Using AI Copilot
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75">
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 shadow-2xl"
        style={{ background: "#0f0f14" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-heading font-semibold text-white/90">
            AI Setup
          </h2>
          {step !== "downloading" && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <X size={18} />
            </Button>
          )}
        </div>

        <div className="p-4">{renderStep()}</div>
      </div>
    </div>,
    document.body
  );
}
