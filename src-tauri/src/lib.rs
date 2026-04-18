mod commands;
mod db;
mod error;
mod models;
mod services;

use db::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app_dir = dirs_next::data_dir()
        .expect("failed to resolve app data directory")
        .join("com.beatpartner.app");

    let database = Database::new(app_dir).expect("failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(database)
        .invoke_handler(tauri::generate_handler![
            commands::list_projects,
            commands::get_project,
            commands::create_project,
            commands::update_project,
            commands::delete_project,
            commands::get_setting,
            commands::set_setting,
            commands::get_all_settings,
            commands::check_ollama_status,
            commands::list_ollama_models,
            commands::check_llamacpp_status,
            commands::list_llamacpp_models,
            commands::download_model,
            commands::delete_ollama_model,
            commands::check_hardware_capabilities,
            commands::get_model_recommendations,
            commands::send_chat_message,
            commands::load_chat_history,
            commands::clear_chat_history,
            commands::fetch_openrouter_models,
            commands::analyze_audio_file,
            commands::get_audio_spectrum,
            commands::add_reference_track,
            commands::list_reference_tracks,
            commands::delete_reference_track,
            commands::get_lyrics,
            commands::update_lyrics_content,
            commands::list_lyric_annotations,
            commands::create_lyric_annotation,
            commands::delete_lyric_annotation,
            commands::update_lyric_annotation,
            commands::get_vocal_production_notes,
            commands::update_vocal_production_notes,
            commands::update_recording_checklist,
            commands::list_reference_vocals,
            commands::add_reference_vocal,
            commands::delete_reference_vocal,
            commands::update_reference_vocal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
