import { BookOpen, Wrench, Sliders, AudioWaveform, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ActiveView } from "@/types";

interface NavItem {
  id: ActiveView;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "guides", label: "Guides", icon: BookOpen },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "presets", label: "Presets", icon: Sliders },
  { id: "samples", label: "Samples", icon: AudioWaveform },
  { id: "settings", label: "Settings", icon: Settings },
];
