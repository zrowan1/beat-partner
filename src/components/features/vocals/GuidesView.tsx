import { useState } from "react";
import { Scissors, Music } from "lucide-react";
import { CompingGuide } from "./CompingGuide";
import { TuningTimingGuide } from "./TuningTimingGuide";

type GuideTab = "comping" | "tuning";

const TABS: { id: GuideTab; label: string; icon: typeof Scissors }[] = [
  { id: "comping", label: "Comping", icon: Scissors },
  { id: "tuning", label: "Tuning & Timing", icon: Music },
];

export function GuidesView() {
  const [activeTab, setActiveTab] = useState<GuideTab>("comping");

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 mb-4 shrink-0">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-all duration-200 ${
                isActive
                  ? "glass-interactive active"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "comping" && <CompingGuide />}
        {activeTab === "tuning" && <TuningTimingGuide />}
      </div>
    </div>
  );
}
