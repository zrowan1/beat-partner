import { useAppStore } from "@/stores/appStore";
import { ProjectManager } from "@/components/features/ProjectManager";

export function MainContent() {
  const { activeView } = useAppStore();

  const renderContent = () => {
    switch (activeView) {
      case "guides":
        return <ProjectManager />;
      case "tools":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <p className="text-body">Tools coming soon</p>
          </div>
        );
      case "presets":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <p className="text-body">Presets coming soon</p>
          </div>
        );
      case "samples":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <p className="text-body">Samples coming soon</p>
          </div>
        );
      case "settings":
        return (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <p className="text-body">Settings coming soon</p>
          </div>
        );
      default:
        return <ProjectManager />;
    }
  };

  return (
    <main className="glass-card glass-gloss flex-1 p-6 overflow-hidden flex flex-col">
      {renderContent()}
    </main>
  );
}
