import { useAppStore } from "@/stores/appStore";
import { NAV_ITEMS } from "@/constants/navigation";
import type { ActiveView } from "@/types";
import type { LucideIcon } from "lucide-react";

export function Sidebar() {
  const { activeView, setActiveView, sidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-56 flex flex-col gap-2 shrink-0">
      <div className="glass-card glass-gloss p-2">
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
      </div>
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-body text-left transition-all duration-300 group ${
        active
          ? "glass-interactive active"
          : "hover:bg-white/[0.04] text-white/60 hover:text-white"
      }`}
    >
      <div className={`p-2 rounded-lg transition-all ${
        active 
          ? "bg-accent-cyan/20" 
          : "bg-white/[0.04] group-hover:bg-white/[0.08]"
      }`}>
        <Icon 
          size={18} 
          strokeWidth={active ? 2 : 1.5} 
          className={active ? "text-accent-cyan" : "text-white/50"}
        />
      </div>
      <span className={active ? "font-medium text-accent-cyan" : ""}>{label}</span>
    </button>
  );
}
