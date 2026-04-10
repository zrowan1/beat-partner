import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProjectStore } from "@/stores/projectStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAIStore } from "@/stores/aiStore";
import { FirstRunModelSetup } from "@/components/features/FirstRunModelSetup";

function AppInitializer() {
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const loadSettings = useSettingsStore((state) => state.loadSettings);

  useEffect(() => {
    loadProjects();
    loadSettings();
  }, [loadProjects, loadSettings]);

  return null;
}

function App() {
  const [showFirstRunSetup, setShowFirstRunSetup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { models, loadModels } = useAIStore();
  const { getSetting, setSetting } = useSettingsStore();

  // Check if this is the first run
  useEffect(() => {
    const checkFirstRun = async () => {
      try {
        const hasCompletedSetup = getSetting("ai_setup_completed");
        
        if (!hasCompletedSetup) {
          // Check if there are any models already installed
          try {
            await loadModels();
          } catch {
            // If loadModels fails (e.g., Ollama not running), show setup
            setShowFirstRunSetup(true);
            setIsInitialized(true);
            return;
          }
          
          // Only show setup if no models are installed
          // Note: we check models.length in a separate effect to avoid dependency issues
        }
      } catch (error) {
        console.error("Error checking first run:", error);
      }
      
      setIsInitialized(true);
    };

    if (!isInitialized) {
      checkFirstRun();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]); // Only run once on mount

  const handleSetupComplete = async () => {
    await setSetting("ai_setup_completed", "true");
    setShowFirstRunSetup(false);
  };

  const handleSetupSkip = async () => {
    await setSetting("ai_setup_completed", "skipped");
    setShowFirstRunSetup(false);
  };

  // Check if we should show setup after models are loaded
  useEffect(() => {
    if (!isInitialized) return;
    
    const checkModels = async () => {
      const hasCompletedSetup = getSetting("ai_setup_completed");
      
      if (!hasCompletedSetup && models.length === 0) {
        // No models installed, show setup
        setShowFirstRunSetup(true);
      } else if (!hasCompletedSetup && models.length > 0) {
        // Models exist, mark as completed
        await setSetting("ai_setup_completed", "true");
      }
    };
    
    checkModels();
  }, [models.length, isInitialized, getSetting, setSetting]);

  return (
    <>
      <AppInitializer />
      
      {showFirstRunSetup && (
        <FirstRunModelSetup 
          onComplete={handleSetupComplete}
          onSkip={handleSetupSkip}
        />
      )}
      
      <AppLayout />
    </>
  );
}

export default App;
