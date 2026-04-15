import { useState } from "react";
import { Activity, Music, BarChart3, Library } from "lucide-react";
import { BpmKeyDetector } from "./BpmKeyDetector";
import { TheoryHelper } from "./theory/TheoryHelper";
import { AudioAnalyzer } from "./AudioAnalyzer";
import { ReferenceTrackManager } from "./ReferenceTrackManager";

type ToolTab = "bpm-key" | "theory" | "spectrum" | "references";

const TOOL_TABS: { id: ToolTab; label: string; icon: typeof Activity }[] = [
  { id: "bpm-key", label: "BPM / Key", icon: Activity },
  { id: "theory", label: "Theory", icon: Music },
  { id: "spectrum", label: "Spectrum", icon: BarChart3 },
  { id: "references", label: "References", icon: Library },
];

export function ToolsView() {
  const [activeTab, setActiveTab] = useState<ToolTab>("bpm-key");

  const renderContent = () => {
    switch (activeTab) {
      case "bpm-key":
        return <BpmKeyDetector />;
      case "theory":
        return <TheoryHelper />;
      case "spectrum":
        return <AudioAnalyzer />;
      case "references":
        return <ReferenceTrackManager />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-1 p-3 pb-0">
        {TOOL_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`glass-interactive flex items-center gap-2 px-4 py-2 rounded-lg text-body transition-all duration-200 ${
                isActive
                  ? "active text-white/90"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">{renderContent()}</div>
    </div>
  );
}
