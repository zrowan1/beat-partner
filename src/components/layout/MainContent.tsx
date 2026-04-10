import { useAppStore } from "@/stores/appStore";

export function MainContent() {
  const { activeView } = useAppStore();

  return (
    <main className="glass-card glass-gloss flex-1 p-6 overflow-auto">
      <h2 className="text-title font-semibold capitalize mb-4">{activeView}</h2>
      <p className="text-body text-white/50">
        Select a section from the sidebar to get started.
      </p>
    </main>
  );
}
