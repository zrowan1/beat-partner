import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { AiChatPanel } from "./AiChatPanel";
import { StatusBar } from "./StatusBar";

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen bg-surface-primary overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">
        <Sidebar />
        <MainContent />
        <AiChatPanel />
      </div>
      <StatusBar />
    </div>
  );
}
