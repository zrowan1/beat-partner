import { Menu, Bot } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export function TitleBar() {
  const { toggleSidebar, toggleAiChat, aiChatOpen } = useAppStore();

  return (
    <header className="glass-background flex items-center justify-between px-4 py-2.5 shrink-0" data-tauri-drag-region>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="glass-interactive p-2 text-white/50 hover:text-white"
          title="Toggle sidebar"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">BP</span>
          </div>
          <h1 className="text-heading font-semibold tracking-tight text-white/90">
            BeatPartner
          </h1>
        </div>
      </div>
      <button
        onClick={toggleAiChat}
        className={`glass-interactive flex items-center gap-2 px-3 py-1.5 text-body transition-colors ${
          aiChatOpen 
            ? "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20" 
            : "text-white/50 hover:text-white"
        }`}
        title="Toggle AI Chat"
      >
        <Bot size={16} strokeWidth={1.5} />
        <span className="hidden sm:inline">AI Copilot</span>
      </button>
    </header>
  );
}
