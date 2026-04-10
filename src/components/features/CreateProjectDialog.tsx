import { useState } from "react";
import { X, Plus, FolderPlus, Loader2 } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";

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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div className="glass-card glass-gloss max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 flex items-center justify-center">
              <FolderPlus size={24} className="text-accent-cyan" />
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
              className="glass-interactive p-2 text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Input */}
          <div className="glass-interactive p-1 mb-5">
            <label
              htmlFor="project-name"
              className="block text-label text-white/40 mb-2 px-3 pt-2"
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
              className="w-full px-3 pb-3 bg-transparent border-none text-body text-white placeholder:text-white/20 outline-none"
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="glass-interactive border-red-500/20 bg-red-500/5 mb-5 px-4 py-3">
              <p className="text-label text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass text-white/50 hover:text-white"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-glass btn-glass-primary flex items-center gap-2 disabled:opacity-50"
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
      </div>
    </div>
  );
}
