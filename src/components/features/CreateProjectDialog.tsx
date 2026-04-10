import { useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { GlassPanel } from "@/components/liquid-glass/GlassPanel";

interface CreateProjectDialogProps {
  onClose: () => void;
}

export function CreateProjectDialog({ onClose }: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const { createProject, loading } = useProjectStore();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }

    const project = await createProject(name.trim());
    if (project) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <GlassPanel
        level="card"
        gloss
        className="max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <h3 className="text-heading font-semibold mb-1">New Project</h3>
          <p className="text-body text-white/50 mb-6">
            Create a new music production project
          </p>

          <div className="mb-4">
            <label
              htmlFor="project-name"
              className="block text-label text-white/60 mb-2"
            >
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="My Awesome Track"
              className="w-full glass-interactive px-3 py-2 text-body bg-transparent outline-none focus:border-accent-cyan/50"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-label text-red-400 mb-4">{error}</p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="glass-interactive px-4 py-2 text-body"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-interactive px-4 py-2 text-body bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30"
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
