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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
