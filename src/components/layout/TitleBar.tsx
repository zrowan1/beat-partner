import { useAppStore } from "@/stores/appStore";

export function TitleBar() {
  const { toggleSidebar, toggleAiChat } = useAppStore();

  return (
    <header className="glass-background flex items-center justify-between px-4 py-3" data-tauri-drag-region>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="glass-interactive px-2 py-1 text-label text-white/60 hover:text-white"
          title="Toggle sidebar"
        >
          ☰
        </button>
        <h1 className="text-heading font-semibold tracking-tight">
          BeatPartner
        </h1>
      </div>
      <button
        onClick={toggleAiChat}
        className="glass-interactive px-3 py-1 text-label text-white/60 hover:text-accent-cyan"
        title="Toggle AI Chat"
      >
        AI Chat
      </button>
    </header>
  );
}
