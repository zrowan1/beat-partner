import { Bot, Sparkles } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export function AiChatPanel() {
  const { aiChatOpen } = useAppStore();

  if (!aiChatOpen) return null;

  return (
    <aside className="glass-card glass-gloss w-80 flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-6 h-6 rounded-md bg-accent-purple/20 flex items-center justify-center">
          <Sparkles size={14} className="text-accent-purple" />
        </div>
        <span className="text-body font-medium text-white/80">AI Copilot</span>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center">
          <Bot size={24} className="text-white/20" />
        </div>
        <div>
          <p className="text-body text-white/50 mb-1">Chat interface coming soon</p>
          <p className="text-label text-white/30">Ask questions about your project</p>
        </div>
      </div>
    </aside>
  );
}
