import { useState } from "react";
import { Folder, Plus, Trash2, Music, Clock, Loader2 } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { GlassPanel } from "@/components/liquid-glass/GlassPanel";
import { CreateProjectDialog } from "./CreateProjectDialog";
import type { Project } from "@/types";

export function ProjectManager() {
  const { projects, currentProject, loading, selectProject, deleteProject } =
    useProjectStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [hoveredProject, setHoveredProject] = useState<number | null>(null);

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
            <Folder size={18} className="text-accent-cyan" />
          </div>
          <h2 className="text-title font-semibold text-white/90">Projects</h2>
          <span className="text-label text-white/30 bg-white/[0.03] px-2 py-0.5 rounded">
            {projects.length}
          </span>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 rounded-lg text-body font-medium hover:bg-accent-cyan/15 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          New Project
        </button>
      </div>

      {/* Project List */}
      <GlassPanel level="background" className="flex-1 overflow-auto p-3">
        {projects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-white/30">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.02] flex items-center justify-center">
              <Music size={28} className="text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-body text-white/50 mb-1">No projects yet</p>
              <p className="text-label text-white/30">
                Create your first project to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => selectProject(project)}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  currentProject?.id === project.id
                    ? "bg-white/[0.06] border border-accent-cyan/20"
                    : "bg-white/[0.02] border border-transparent hover:bg-white/[0.04] hover:border-white/[0.06]"
                }`}
              >
                {/* Project Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  currentProject?.id === project.id
                    ? "bg-accent-cyan/10"
                    : "bg-white/[0.04] group-hover:bg-white/[0.06]"
                }`}>
                  <Music 
                    size={18} 
                    className={currentProject?.id === project.id ? "text-accent-cyan" : "text-white/40"}
                  />
                </div>

                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`text-heading truncate ${
                    currentProject?.id === project.id ? "text-white" : "text-white/80"
                  }`}>
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5 text-label text-white/40">
                    <span className="font-mono">{project.bpm ?? "—"} BPM</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="font-mono">{project.key ?? "—"}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span className="capitalize">{project.phase}</span>
                  </div>
                </div>

                {/* Date & Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-label text-white/30">
                    <Clock size={12} />
                    <span>{formatDate(project.updated_at)}</span>
                  </div>
                  
                  {/* Delete button - only visible on hover */}
                  <button
                    onClick={(e) => handleDelete(project, e)}
                    className={`p-1.5 rounded-md transition-all duration-200 ${
                      hoveredProject === project.id
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 translate-x-2 pointer-events-none"
                    } text-white/30 hover:text-red-400 hover:bg-red-500/10`}
                    title="Delete project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Active indicator */}
                {currentProject?.id === project.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-accent-cyan rounded-r-full" />
                )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <GlassPanel level="card" gloss className="max-w-sm w-full">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-heading font-medium text-white/90">Delete Project?</h3>
                  <p className="text-label text-white/40">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              
              <p className="text-body text-white/50 mb-5">
                Are you sure you want to delete <span className="text-white/70 font-medium">"{projectToDelete.name}"</span>?
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 text-body text-white/60 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-body font-medium hover:bg-red-500/15 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? "Just now" : `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
