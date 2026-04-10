import { useState } from "react";
import { Folder, Plus, Trash2, Music, Clock, Loader2 } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
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
    <div className="h-full flex flex-col p-2">
      {/* Header */}
      <div className="glass-interactive mb-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 flex items-center justify-center">
              <Folder size={24} className="text-accent-cyan" />
            </div>
            <div>
              <h2 className="text-title font-semibold text-white/90">Projects</h2>
              <span className="text-label text-white/40">{projects.length} projects</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="btn-glass btn-glass-primary flex items-center gap-2 disabled:opacity-50"
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
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-auto">
        {projects.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-5">
            <div className="glass-card glass-gloss p-8">
              <Music size={40} className="text-white/20" />
            </div>
            <div className="text-center">
              <p className="text-body text-white/50 mb-1">No projects yet</p>
              <p className="text-label text-white/30">
                Create your first project to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => selectProject(project)}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                className={`glass-interactive p-4 cursor-pointer ${
                  currentProject?.id === project.id ? "active" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Project Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    currentProject?.id === project.id
                      ? "bg-accent-cyan/20"
                      : "bg-white/[0.06]"
                  }`}>
                    <Music 
                      size={22} 
                      className={currentProject?.id === project.id ? "text-accent-cyan" : "text-white/40"}
                    />
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-heading truncate mb-1 ${
                      currentProject?.id === project.id ? "text-white" : "text-white/90"
                    }`}>
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-4 text-label text-white/40">
                      <span className="font-mono">{project.bpm ?? "—"} BPM</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="font-mono">{project.key ?? "—"}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="capitalize">{project.phase}</span>
                    </div>
                  </div>

                  {/* Date & Actions */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-label text-white/30">
                      <Clock size={14} />
                      <span>{formatDate(project.updated_at)}</span>
                    </div>
                    
                    {/* Delete button - only visible on hover */}
                    <button
                      onClick={(e) => handleDelete(project, e)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        hoveredProject === project.id
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-2 pointer-events-none"
                      } text-white/30 hover:text-red-400 hover:bg-red-500/10`}
                      title="Delete project"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      {showCreateDialog && (
        <CreateProjectDialog onClose={() => setShowCreateDialog(false)} />
      )}

      {/* Delete Confirmation Dialog */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-card glass-gloss max-w-sm w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-heading font-medium text-white/90">Delete Project?</h3>
                <p className="text-label text-white/40">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-body text-white/50 mb-6">
              Are you sure you want to delete <span className="text-white/70 font-medium">"{projectToDelete.name}"</span>?
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setProjectToDelete(null)}
                className="btn-glass text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-glass bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15"
              >
                Delete
              </button>
            </div>
          </div>
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
