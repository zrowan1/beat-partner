import { Sliders, AudioWaveform, Settings, Music } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { ProjectManager } from "@/components/features/ProjectManager";
import { ToolsView } from "@/components/features/tools/ToolsView";

export function MainContent() {
  const { activeView } = useAppStore();

  const renderContent = () => {
    switch (activeView) {
      case "guides":
        return <ProjectManager />;
      case "tools":
        return <ToolsView />;
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
    <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
      <div className="glass-interactive p-8">
        <Icon size={40} className="text-white/20" />
      </div>
      <div className="text-center">
        <p className="text-body text-white/50 mb-1">{title} coming soon</p>
        <p className="text-label text-white/30">{description}</p>
      </div>
    </div>
  );
}
