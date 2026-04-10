import { useAppStore } from "@/stores/appStore";
import { NAV_ITEMS } from "@/constants/navigation";
import type { ActiveView } from "@/types";
import type { LucideIcon } from "lucide-react";

export function Sidebar() {
  const { activeView, setActiveView, sidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-52 flex flex-col gap-1 shrink-0">
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.id}
          id={item.id}
          label={item.label}
          icon={item.icon}
          active={activeView === item.id}
          onClick={() => setActiveView(item.id)}
        />
      ))}
    </aside>
  );
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: ActiveView;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body text-left transition-all duration-200 group ${
        active
          ? "bg-white/[0.08] text-accent-cyan border-l-2 border-accent-cyan"
          : "text-white/60 hover:text-white hover:bg-white/[0.04] border-l-2 border-transparent"
      }`}
    >
      <Icon 
        size={18} 
        strokeWidth={active ? 2 : 1.5} 
        className={`transition-colors ${active ? "text-accent-cyan" : "text-white/40 group-hover:text-white/60"}`}
      />
      <span className={active ? "font-medium" : ""}>{label}</span>
    </button>
  );
}
