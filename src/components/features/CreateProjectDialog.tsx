import { useState } from "react";
import { X, Plus, FolderPlus, Loader2 } from "lucide-react";
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

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <GlassPanel level="card" gloss className="max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
              <FolderPlus size={20} className="text-accent-cyan" />
            </div>
            <div className="flex-1">
              <h3 className="text-heading font-medium text-white/90">New Project</h3>
              <p className="text-label text-white/40">
                Create a new music production project
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.04] rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Input */}
          <div className="mb-5">
            <label
              htmlFor="project-name"
              className="block text-label text-white/50 mb-2"
            >
              Project Name
            </label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Summer Vibes, Dark Techno, Chill Beats"
              className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-body text-white placeholder:text-white/20 outline-none focus:border-accent-cyan/30 focus:bg-white/[0.05] transition-colors"
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mb-4 text-label text-red-400 bg-red-500/5 px-3 py-2 rounded-lg">
              <span className="w-1 h-1 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-body text-white/50 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 rounded-lg text-body font-medium hover:bg-accent-cyan/15 transition-colors disabled:opacity-50"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Project
                </>
              )}
            </button>
          </div>
        </form>
      </GlassPanel>
    </div>
  );
}
