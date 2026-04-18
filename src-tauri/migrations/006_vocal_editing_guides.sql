-- Vocal Editing Guides progress (stored as JSON in existing vocal_production_notes)
ALTER TABLE vocal_production_notes ADD COLUMN comping_progress_json TEXT DEFAULT '{}';
ALTER TABLE vocal_production_notes ADD COLUMN tuning_timing_progress_json TEXT DEFAULT '{}';

-- Vocal analysis cache: reuse audio_analysis table with new type 'vocal'
-- No schema change needed — we use analysis_type = 'vocal' in audio_analysis
