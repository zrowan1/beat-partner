import { useState } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { GlassPanel } from "@/components/liquid-glass/GlassPanel";
import { CreateProjectDialog } from "./CreateProjectDialog";
import type { Project } from "@/types";

export function ProjectManager() {
  const { projects, currentProject, loading, selectProject, deleteProject } =
    useProjectStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleDelete = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    if (project.id === null) return;
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (projectToDelete?.id !== null && projectToDelete?.id !== undefined) {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-title font-semibold">Projects</h2>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="glass-interactive px-4 py-2 text-body font-medium text-accent-cyan hover:text-white"
          disabled={loading}
        >
          + New Project
        </button>
      </div>

      {/* Project List */}
      <GlassPanel level="background" className="flex-1 overflow-auto p-4">
        {projects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/40">
            <p className="text-body mb-2">No projects yet</p>
            <p className="text-label">
              Click "New Project" to create your first project
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => selectProject(project)}
                className={`glass-interactive p-4 cursor-pointer transition-all ${
                  currentProject?.id === project.id
                    ? "bg-white/10 border-accent-cyan/50"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-heading font-medium truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-label text-white/50 font-mono">
                      <span>
                        BPM <span className="text-white/70">{project.bpm ?? "—"}</span>
                      </span>
                      <span className="text-white/20">|</span>
                      <span>
                        Key <span className="text-white/70">{project.key ?? "—"}</span>
                      </span>
                      <span className="text-white/20">|</span>
                      <span className="capitalize">{project.phase}</span>
                    </div>
                    {project.genre && (
                      <p className="text-label text-white/40 mt-1">
                        {project.genre}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDelete(project, e)}
                    className="glass-interactive px-2 py-1 text-label text-white/40 hover:text-red-400 ml-2"
                    title="Delete project"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Create Project Dialog */}
      {showCreateDialog && (
        <CreateProjectDialog onClose={() => setShowCreateDialog(false)} />
      )}

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <GlassPanel level="card" className="max-w-md w-full p-6">
            <h3 className="text-heading font-semibold mb-2">Delete Project?</h3>
            <p className="text-body text-white/60 mb-6">
              Are you sure you want to delete "{projectToDelete.name}"? This
              action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setProjectToDelete(null)}
                className="glass-interactive px-4 py-2 text-body"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="glass-interactive px-4 py-2 text-body bg-red-500/20 text-red-300 border-red-500/30"
              >
                Delete
              </button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}
