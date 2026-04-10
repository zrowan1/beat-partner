import { Bot, Sparkles } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export function AiChatPanel() {
  const { aiChatOpen } = useAppStore();

  if (!aiChatOpen) return null;

  return (
    <aside className="glass-card glass-gloss w-80 flex flex-col shrink-0">
      <div className="glass-interactive m-3 mb-0 flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-magenta/20 flex items-center justify-center">
          <Sparkles size={18} className="text-accent-purple" />
        </div>
        <div>
          <span className="text-body font-medium text-white/90 block">AI Copilot</span>
          <span className="text-label text-white/40">Ready to help</span>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="glass-interactive p-6">
          <Bot size={32} className="text-white/20" />
        </div>
        <div>
          <p className="text-body text-white/50 mb-1">Chat interface coming soon</p>
          <p className="text-label text-white/30">Ask questions about your project</p>
        </div>
      </div>
    </aside>
  );
}
