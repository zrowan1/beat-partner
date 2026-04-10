import { Wrench, Sliders, AudioWaveform, Settings, Music } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { ProjectManager } from "@/components/features/ProjectManager";

export function MainContent() {
  const { activeView } = useAppStore();

  const renderContent = () => {
    switch (activeView) {
      case "guides":
        return <ProjectManager />;
      case "tools":
        return <PlaceholderView icon={Wrench} title="Tools" description="Audio analysis and production tools" />;
      case "presets":
        return <PlaceholderView icon={Sliders} title="Presets" description="Synth preset manager" />;
      case "samples":
        return <PlaceholderView icon={AudioWaveform} title="Samples" description="Sample library and browser" />;
      case "settings":
        return <PlaceholderView icon={Settings} title="Settings" description="Application preferences" />;
      default:
        return <ProjectManager />;
    }
  };

  return (
    <main className="glass-card glass-gloss flex-1 overflow-hidden flex flex-col">
      {renderContent()}
    </main>
  );
}

function PlaceholderView({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: typeof Music;
  title: string;
  description: string;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-white/30">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center">
        <Icon size={28} className="text-white/20" />
      </div>
      <div className="text-center">
        <p className="text-body text-white/50 mb-1">{title} coming soon</p>
        <p className="text-label text-white/30">{description}</p>
      </div>
    </div>
  );
}
