import { Activity, Music2, Layers } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";

export function StatusBar() {
  const { currentProject, currentPhase } = useProjectStore();

  return (
    <footer className="glass-background flex items-center gap-6 px-4 py-2 shrink-0">
      <div className="flex items-center gap-4 text-label">
        <StatusItem 
          icon={Activity} 
          label="BPM" 
          value={currentProject?.bpm?.toString() ?? "—"} 
        />
        <StatusItem 
          icon={Music2} 
          label="Key" 
          value={currentProject?.key ?? "—"} 
        />
        <StatusItem 
          icon={Layers} 
          label="Phase" 
          value={currentPhase} 
          capitalize
        />
      </div>
      
      <div className="flex-1" />
      
      {currentProject && (
        <span className="text-label text-white/30 truncate max-w-xs">
          {currentProject.name}
        </span>
      )}
    </footer>
  );
}

function StatusItem({ 
  icon: Icon, 
  label, 
  value, 
  capitalize = false 
}: { 
  icon: typeof Activity;
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 text-white/40">
      <Icon size={12} strokeWidth={2} />
      <span>{label}</span>
      <span className={`text-white/80 font-mono ml-1 ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}
