import type { ActiveView } from "@/types";

interface NavItem {
  id: ActiveView;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "guides", label: "Guides" },
  { id: "tools", label: "Tools" },
  { id: "presets", label: "Presets" },
  { id: "samples", label: "Samples" },
  { id: "settings", label: "Settings" },
];
