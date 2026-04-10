import { useProjectStore } from "@/stores/projectStore";

export function StatusBar() {
  const { currentProject, currentPhase } = useProjectStore();

  return (
    <footer className="glass-background flex items-center gap-4 px-4 py-2 text-label font-mono text-white/50">
      <span>
        BPM{" "}
        <span className="text-white/80">{currentProject?.bpm ?? "—"}</span>
      </span>
      <span className="text-white/20">|</span>
      <span>
        Key{" "}
        <span className="text-white/80">{currentProject?.key ?? "—"}</span>
      </span>
      <span className="text-white/20">|</span>
      <span>
        Phase{" "}
        <span className="text-white/80 capitalize">{currentPhase}</span>
      </span>
    </footer>
  );
}
