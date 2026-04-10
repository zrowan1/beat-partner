use tauri::State;

use crate::db::Database;
use crate::error::Result;
use crate::services::SettingsService;

#[tauri::command]
pub fn get_setting(db: State<'_, Database>, key: String) -> Result<Option<String>> {
    SettingsService::get(&db, &key)
}

#[tauri::command]
pub fn set_setting(db: State<'_, Database>, key: String, value: String) -> Result<()> {
    SettingsService::set(&db, &key, &value)
}

#[tauri::command]
pub fn get_all_settings(db: State<'_, Database>) -> Result<Vec<(String, String)>> {
    SettingsService::get_all(&db)
}
