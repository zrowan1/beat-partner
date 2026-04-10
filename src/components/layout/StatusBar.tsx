import { Activity, Music2, Layers } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";

export function StatusBar() {
  const { currentProject, currentPhase } = useProjectStore();

  return (
    <footer className="glass-background mx-4 mb-4 flex items-center gap-6 px-5 py-3 shrink-0">
      <div className="flex items-center gap-5 text-label">
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
        <span className="text-label text-white/40 truncate max-w-xs font-medium">
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
    <div className="glass-interactive px-3 py-1.5 flex items-center gap-2 text-white/50">
      <Icon size={14} strokeWidth={2} className="text-white/30" />
      <span className="text-white/40">{label}</span>
      <span className={`text-white/90 font-mono ${capitalize ? "capitalize" : ""}`}>
        {value}
      </span>
    </div>
  );
}
