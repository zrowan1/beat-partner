use tauri::State;

use crate::db::Database;
use crate::error::Result;
use crate::models::Project;
use crate::services::ProjectService;

#[tauri::command]
pub fn list_projects(db: State<'_, Database>) -> Result<Vec<Project>> {
    ProjectService::list(&db)
}

#[tauri::command]
pub fn create_project(db: State<'_, Database>, name: String) -> Result<Project> {
    ProjectService::create(&db, &name)
}

#[tauri::command]
pub fn delete_project(db: State<'_, Database>, id: i64) -> Result<()> {
    ProjectService::delete(&db, id)
}
