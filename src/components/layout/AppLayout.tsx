import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { AiChatPanel } from "./AiChatPanel";
import { StatusBar } from "./StatusBar";

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-tertiary">
      {/* Background blur layers for depth */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-cyan/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <TitleBar />
        <div className="flex flex-1 gap-4 p-4 overflow-hidden">
          <Sidebar />
          <MainContent />
          <AiChatPanel />
        </div>
        <StatusBar />
      </div>
    </div>
  );
}
