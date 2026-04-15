import { useEffect, useState } from "react";
import { Upload, Trash2, Music, Clock, Activity, FolderOpen } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAudioStore } from "@/stores/audioStore";
import { useProjectStore } from "@/stores/projectStore";
import { formatDuration } from "@/services/audioApi";

const AUDIO_FILTERS = [
  {
    name: "Audio Files",
    extensions: ["mp3", "wav", "flac", "ogg", "aac", "m4a"],
  },
];

export function ReferenceTrackManager() {
  const { currentProject } = useProjectStore();
  const {
    referenceTracks,
    loadingReferenceTracks,
    loadReferenceTracks,
    addReferenceTrack,
    removeReferenceTrack,
  } = useAudioStore();
  const [isImporting, setIsImporting] = useState(false);

  // Load reference tracks when project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadReferenceTracks(currentProject.id);
    }
  }, [currentProject?.id, loadReferenceTracks]);

  const handleImport = async () => {
    if (!currentProject?.id) return;

    const file = await open({
      multiple: false,
      filters: AUDIO_FILTERS,
    });

    if (file) {
      setIsImporting(true);
      await addReferenceTrack(currentProject.id, file);
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await removeReferenceTrack(id);
  };

  // No project selected
  if (!currentProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
        <div className="glass-interactive p-6 rounded-xl">
          <FolderOpen size={32} className="text-white/20" />
        </div>
        <div className="text-center">
          <p className="text-body text-white/50">No project selected</p>
          <p className="text-label text-white/30 mt-1">
            Select a project from Guides to manage reference tracks
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-heading font-medium text-white/90">Reference Tracks</div>
          <div className="text-label text-white/40 mt-0.5">{currentProject.name}</div>
        </div>
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="btn-glass-primary flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isImporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Importing...</span>
            </>
          ) : (
            <>
              <Upload size={16} />
              <span>Import</span>
            </>
          )}
        </button>
      </div>

      {/* Loading */}
      {loadingReferenceTracks && (
        <div className="flex items-center justify-center py-8">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Track list */}
      {!loadingReferenceTracks && referenceTracks.length > 0 && (
        <div className="flex flex-col gap-2">
          {referenceTracks.map((track) => (
            <div
              key={track.id}
              className="glass-interactive flex items-center gap-3 p-3 rounded-xl group"
            >
              <div className="glass-interactive p-2 rounded-lg">
                <Music size={16} className="text-white/40" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-body text-white/80 truncate">{track.fileName}</p>
                <div className="flex gap-4 mt-0.5">
                  {track.bpm && (
                    <span className="text-label text-white/40 flex items-center gap-1">
                      <Activity size={10} />
                      <span className="font-mono">{track.bpm.toFixed(1)} BPM</span>
                    </span>
                  )}
                  {track.key && (
                    <span className="text-label text-white/40 flex items-center gap-1">
                      <Music size={10} />
                      <span className="font-mono">{track.key}</span>
                    </span>
                  )}
                  <span className="text-label text-white/40 flex items-center gap-1">
                    <Clock size={10} />
                    <span className="font-mono">{formatDuration(track.durationSecs)}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(track.id)}
                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loadingReferenceTracks && referenceTracks.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="glass-interactive p-6 rounded-xl">
            <Music size={32} className="text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-body text-white/50">No reference tracks yet</p>
            <p className="text-label text-white/30 mt-1">
              Import audio files to analyze BPM, key, and use as references
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
