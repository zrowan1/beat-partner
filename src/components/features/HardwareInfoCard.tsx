import { Cpu, HardDrive, MemoryStick, Monitor } from "lucide-react";
import type { HardwareCapabilities } from "@/types";

interface HardwareInfoCardProps {
  hardware: HardwareCapabilities | null;
  isLoading?: boolean;
}

export function HardwareInfoCard({ hardware, isLoading }: HardwareInfoCardProps) {
  if (isLoading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-2/3" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!hardware) {
    return (
      <div className="glass-card p-4">
        <p className="text-body text-white/50">Hardware information unavailable</p>
      </div>
    );
  }

  const getRecommendedTier = () => {
    const memory = hardware.totalMemoryGb;
    if (memory >= 64) return { label: "Large models (70B+)", color: "text-accent-purple" };
    if (memory >= 32) return { label: "Medium models (8-14B)", color: "text-accent-cyan" };
    if (memory >= 16) return { label: "Small models (3-7B)", color: "text-accent-magenta" };
    return { label: "Tiny models (<4B)", color: "text-white/70" };
  };

  const tier = getRecommendedTier();

  return (
    <div className="glass-card p-4">
      <h3 className="text-label font-medium text-white/70 mb-3 flex items-center gap-2">
        <Cpu size={14} />
        System Hardware
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <MemoryStick size={16} className="text-accent-cyan" />
          <div>
            <p className="text-label text-white/40">RAM</p>
            <p className="text-body font-medium text-white/90">
              {hardware.totalMemoryGb.toFixed(1)} GB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <HardDrive size={16} className="text-accent-purple" />
          <div>
            <p className="text-label text-white/40">CPU</p>
            <p className="text-body font-medium text-white/90">
              {hardware.cpuCores} cores
            </p>
          </div>
        </div>

        {hardware.gpuMemoryGb && (
          <div className="flex items-center gap-2">
            <Monitor size={16} className="text-accent-magenta" />
            <div>
              <p className="text-label text-white/40">GPU VRAM</p>
              <p className="text-body font-medium text-white/90">
                {hardware.gpuMemoryGb.toFixed(1)} GB
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Cpu size={16} className="text-white/50" />
          <div>
            <p className="text-label text-white/40">Platform</p>
            <p className="text-body font-medium text-white/90">
              {hardware.isAppleSilicon ? "Apple Silicon" : hardware.cpuVendor}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-interactive px-3 py-2 rounded-lg">
        <p className="text-label text-white/40">Recommended</p>
        <p className={`text-body font-medium ${tier.color}`}>{tier.label}</p>
      </div>
    </div>
  );
}
