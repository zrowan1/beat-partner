import { Menu, Bot } from "lucide-react";
import { useAppStore } from "@/stores/appStore";

export function TitleBar() {
  const { toggleSidebar, toggleAiChat, aiChatOpen } = useAppStore();

  return (
    <header className="glass-background mx-4 mt-4 mb-0 flex items-center justify-between px-5 py-3 shrink-0" data-tauri-drag-region>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="glass-interactive p-2.5 text-white/50 hover:text-white"
          title="Toggle sidebar"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center shadow-lg shadow-accent-cyan/20">
            <span className="text-sm font-bold text-white">BP</span>
          </div>
          <h1 className="text-heading font-semibold tracking-tight text-white/90">
            BeatPartner
          </h1>
        </div>
      </div>
      <button
        onClick={toggleAiChat}
        className={`glass-interactive flex items-center gap-2.5 px-4 py-2.5 text-body transition-all ${
          aiChatOpen 
            ? "active" 
            : "text-white/50 hover:text-white"
        }`}
        title="Toggle AI Chat"
      >
        <Bot size={18} strokeWidth={1.5} />
        <span className="hidden sm:inline">AI Copilot</span>
      </button>
    </header>
  );
}
