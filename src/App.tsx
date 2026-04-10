import { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectStore } from "@/stores/projectStore";
import { useSettingsStore } from "@/stores/settingsStore";

function AppInitializer() {
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadProjects();
    loadSettings();
  }, [loadProjects, loadSettings]);

  return null;
}

export function App() {
  return (
    <>
      <AppInitializer />
      <AppLayout />
    </>
  );
}
