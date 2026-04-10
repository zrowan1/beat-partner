import { Download, Sparkles, Zap } from "lucide-react";
import type { ModelRecommendation } from "@/types";
import { Button } from "@/components/ui/Button";
import { useAIStore } from "@/stores/aiStore";
import { formatModelSize, getUseCaseLabel } from "@/services/aiApi";

interface ModelRecommendationsPanelProps {
  recommendations: ModelRecommendation[];
  isLoading?: boolean;
}

export function ModelRecommendationsPanel({
  recommendations,
  isLoading,
}: ModelRecommendationsPanelProps) {
  const { downloadModel, activeDownloads } = useAIStore();

  if (isLoading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-16 bg-white/10 rounded" />
          <div className="h-16 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  const getSpeedIcon = (speed: string) => {
    switch (speed) {
      case "fast":
        return <Zap size={14} className="text-accent-cyan" />;
      case "medium":
        return <Zap size={14} className="text-accent-magenta" />;
      default:
        return <Zap size={14} className="text-white/40" />;
    }
  };

  const getQualityBadge = (quality: string) => {
    const colors = {
      basic: "bg-white/10 text-white/50",
      good: "bg-accent-magenta/20 text-accent-magenta",
      excellent: "bg-accent-purple/20 text-accent-purple",
    };
    return colors[quality as keyof typeof colors] || colors.basic;
  };

  return (
    <div className="glass-card p-4">
      <h3 className="text-label font-medium text-white/70 mb-3 flex items-center gap-2">
        <Sparkles size={14} />
        Recommended Models
      </h3>

      <div className="space-y-2">
        {recommendations.slice(0, 3).map((rec) => {
          const isDownloading = activeDownloads.has(rec.modelId);
          const downloadProgress = activeDownloads.get(rec.modelId);

          return (
            <div
              key={rec.modelId}
              className="glass-interactive p-3 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-body font-medium text-white/90 truncate">
                      {rec.name}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${getQualityBadge(
                        rec.quality
                      )}`}
                    >
                      {rec.quality}
                    </span>
                  </div>

                  <p className="text-label text-white/40 mb-2">{rec.reasoning}</p>

                  <div className="flex items-center gap-3 text-label">
                    <span className="text-white/50">
                      {formatModelSize(rec.sizeGb)}
                    </span>
                    <span className="flex items-center gap-1 text-white/50">
                      {getSpeedIcon(rec.estimatedSpeed)}
                      {rec.estimatedSpeed}
                    </span>
                    <span className="text-white/30">
                      {rec.useCases.slice(0, 2).map(getUseCaseLabel).join(", ")}
                    </span>
                  </div>

                  {isDownloading && downloadProgress && (
                    <div className="mt-2">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-cyan transition-all duration-300"
                          style={{ width: `${downloadProgress.percentage}%` }}
                        />
                      </div>
                      <p className="text-label text-white/40 mt-1">
                        {downloadProgress.status === "downloading"
                          ? `${downloadProgress.percentage.toFixed(1)}% • ${downloadProgress.speedMbps.toFixed(1)} MB/s`
                          : downloadProgress.status}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadModel(rec.modelId)}
                  disabled={isDownloading}
                  className="shrink-0"
                >
                  <Download size={16} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
