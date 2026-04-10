import { useAppStore } from "@/stores/appStore";

export function AiChatPanel() {
  const { aiChatOpen } = useAppStore();

  if (!aiChatOpen) return null;

  return (
    <aside className="glass-card glass-gloss w-72 flex flex-col p-4">
      <div className="text-label font-mono uppercase tracking-widest text-white/40 mb-3">
        AI Copilot
      </div>
      <div className="flex-1 flex items-center justify-center text-body text-white/30">
        Chat interface coming soon
      </div>
    </aside>
  );
}
