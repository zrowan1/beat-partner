import { useAppStore } from "@/stores/appStore";
import { NAV_ITEMS } from "@/constants/navigation";
import type { ActiveView } from "@/types";

export function Sidebar() {
  const { activeView, setActiveView, sidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="glass-card glass-gloss w-48 flex flex-col gap-1 p-3">
      <div className="text-label font-mono uppercase tracking-widest text-white/40 mb-2 px-2">
        Navigation
      </div>
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.id}
          id={item.id}
          label={item.label}
          active={activeView === item.id}
          onClick={() => setActiveView(item.id)}
        />
      ))}
    </aside>
  );
}

function NavButton({
  label,
  active,
  onClick,
}: {
  id: ActiveView;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`glass-interactive px-3 py-2 text-body text-left transition-colors ${
        active
          ? "bg-white/10 border-accent-cyan/30 text-accent-cyan"
          : "text-white/70 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}
