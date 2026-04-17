import {
  BookOpen,
  Wrench,
  Sliders,
  AudioWaveform,
  Settings,
  FileText,
  Mic,
} from "lucide-react";
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
  { id: "lyrics", label: "Lyrics", icon: FileText },
  { id: "vocals", label: "Vocals", icon: Mic },
  { id: "presets", label: "Presets", icon: Sliders },
  { id: "samples", label: "Samples", icon: AudioWaveform },
  { id: "settings", label: "Settings", icon: Settings },
];
