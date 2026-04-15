import { useState } from "react";
import { Piano, Grid3X3, Circle, ListMusic } from "lucide-react";
import { type NoteName } from "./theoryData";
import { ScaleViewer } from "./ScaleViewer";
import { ChordGrid } from "./ChordGrid";
import { CircleOfFifths } from "./CircleOfFifths";
import { ProgressionSuggestions } from "./ProgressionSuggestions";

type TheoryTab = "scales" | "chords" | "circle" | "progressions";

const THEORY_TABS: { id: TheoryTab; label: string; icon: typeof Piano }[] = [
  { id: "scales", label: "Scales", icon: Piano },
  { id: "chords", label: "Chords", icon: Grid3X3 },
  { id: "circle", label: "Circle of 5ths", icon: Circle },
  { id: "progressions", label: "Progressions", icon: ListMusic },
];

export function TheoryHelper() {
  const [activeTab, setActiveTab] = useState<TheoryTab>("scales");
  const [rootNote, setRootNote] = useState<NoteName>("C");

  const renderContent = () => {
    switch (activeTab) {
      case "scales":
        return <ScaleViewer rootNote={rootNote} onRootChange={setRootNote} />;
      case "chords":
        return <ChordGrid rootNote={rootNote} />;
      case "circle":
        return <CircleOfFifths rootNote={rootNote} onRootChange={setRootNote} />;
      case "progressions":
        return <ProgressionSuggestions rootNote={rootNote} />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-heading font-medium text-white/90">Music Theory</div>
        <div className="text-label text-white/40">
          Root: <span className="font-mono text-accent-cyan">{rootNote}</span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1">
        {THEORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`glass-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label transition-all duration-200 ${
                isActive ? "active text-white/80" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
