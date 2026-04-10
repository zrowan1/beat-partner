use tauri::{ipc::Channel, State};
use tokio::sync::mpsc;

use crate::db::Database;
use crate::error::Result;
use crate::models::{
    ChatMessage, DownloadProgress, HardwareCapabilities, ModelRecommendation, ModelUseCase,
    OllamaModel, OllamaStatus,
};
use crate::services::{AIService, HardwareService};


#[derive(Debug, Clone, serde::Serialize)]
pub struct AIMessage {
    pub id: i64,
    pub project_id: Option<i64>,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub model: Option<String>,
    pub created_at: String,
}

impl From<&rusqlite::Row<'_>> for AIMessage {
    fn from(row: &rusqlite::Row) -> Self {
        Self {
            id: row.get("id").unwrap_or(0),
            project_id: row.get("project_id").ok(),
            session_id: row.get("session_id").unwrap_or_default(),
            role: row.get("role").unwrap_or_default(),
            content: row.get("content").unwrap_or_default(),
            model: row.get("model").ok(),
            created_at: row.get("created_at").unwrap_or_default(),
        }
    }
}

#[tauri::command]
pub async fn check_ollama_status(base_url: Option<String>) -> Result<OllamaStatus> {
    let service = match base_url {
        Some(url) => AIService::with_base_url(url),
        None => AIService::new(Default::default()),
    };
    
    service.check_ollama_status().await
}

#[tauri::command]
pub async fn list_ollama_models(base_url: Option<String>) -> Result<Vec<OllamaModel>> {
    let service = match base_url {
        Some(url) => AIService::with_base_url(url),
        None => AIService::new(Default::default()),
    };
    
    service.list_available_models().await
}

#[tauri::command]
pub async fn download_model(
    model_id: String,
    base_url: Option<String>,
    on_progress: Channel<DownloadProgress>,
) -> Result<()> {
    let service = match base_url {
        Some(url) => AIService::with_base_url(url),
        None => AIService::new(Default::default()),
    };

    let (progress_tx, mut progress_rx) = mpsc::channel::<DownloadProgress>(100);

    let on_progress_clone = on_progress.clone();
    let progress_task = tokio::spawn(async move {
        while let Some(progress) = progress_rx.recv().await {
            let _ = on_progress_clone.send(progress);
        }
    });

    let result = service.download_model(model_id, progress_tx).await;

    let _ = progress_task.await;

    result
}

#[tauri::command]
pub async fn delete_ollama_model(model_id: String, base_url: Option<String>) -> Result<()> {
    let service = match base_url {
        Some(url) => AIService::with_base_url(url),
        None => AIService::new(Default::default()),
    };
    
    service.delete_model(model_id).await
}

#[tauri::command]
pub fn check_hardware_capabilities() -> Result<HardwareCapabilities> {
    HardwareService::detect_capabilities()
}

#[tauri::command]
pub fn get_model_recommendations(
    use_case: Option<String>,
) -> Result<Vec<ModelRecommendation>> {
    let capabilities = HardwareService::detect_capabilities()?;
    
    let use_case_enum = use_case.and_then(|uc| match uc.as_str() {
        "general" => Some(ModelUseCase::General),
        "theory" => Some(ModelUseCase::Theory),
        "production" => Some(ModelUseCase::Production),
        "sound_design" => Some(ModelUseCase::SoundDesign),
        "mixing" => Some(ModelUseCase::Mixing),
        "mastering" => Some(ModelUseCase::Mastering),
        "analysis" => Some(ModelUseCase::Analysis),
        "creative" => Some(ModelUseCase::Creative),
        _ => None,
    });
    
    Ok(HardwareService::get_recommendations(&capabilities, use_case_enum))
}

#[tauri::command]
pub async fn send_chat_message(
    db: State<'_, Database>,
    project_id: Option<i64>,
    session_id: String,
    content: String,
    model: String,
    _provider: String,
    base_url: Option<String>,
    on_chunk: Channel<String>,
) -> Result<AIMessage> {
    let service = match base_url {
        Some(url) => AIService::with_base_url(url),
        None => AIService::new(Default::default()),
    };

    // Save user message to database
    let _user_message_id = {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO ai_messages (project_id, session_id, role, content, model) VALUES (?1, ?2, 'user', ?3, ?4)",
            (project_id, &session_id, &content, &model),
        )?;
        conn.last_insert_rowid()
    };

    // Load chat history for context
    let history = load_chat_history_internal(&db, &session_id, Some(10))?;
    
    let chat_messages: Vec<ChatMessage> = history
        .into_iter()
        .map(|msg| ChatMessage {
            role: msg.role,
            content: msg.content,
        })
        .collect();

    let (stream_tx, mut stream_rx) = mpsc::channel::<String>(100);

    let on_chunk_clone = on_chunk.clone();
    let stream_task = tokio::spawn(async move {
        while let Some(chunk) = stream_rx.recv().await {
            let _ = on_chunk_clone.send(chunk);
        }
    });

    let response = service.chat(chat_messages, Some(model.clone()), stream_tx).await;

    let _ = stream_task.await;

    match response {
        Ok(chat_response) => {
            let assistant_content = chat_response.message.content;
            
            let conn = db.conn.lock().unwrap();
            conn.execute(
                "INSERT INTO ai_messages (project_id, session_id, role, content, model) VALUES (?1, ?2, 'assistant', ?3, ?4)",
                (project_id, &session_id, &assistant_content, &model),
            )?;
            
            let assistant_id = conn.last_insert_rowid();
            
            Ok(AIMessage {
                id: assistant_id,
                project_id,
                session_id,
                role: "assistant".to_string(),
                content: assistant_content,
                model: Some(model),
                created_at: chrono::Local::now().to_rfc3339(),
            })
        }
        Err(e) => {
            Err(crate::error::BeatPartnerError::AIService(format!(
                "Chat failed: {}",
                e
            )))
        }
    }
}

#[tauri::command]
pub fn load_chat_history(
    db: State<'_, Database>,
    session_id: String,
    limit: Option<i64>,
) -> Result<Vec<AIMessage>> {
    load_chat_history_internal(&db, &session_id, limit)
}

fn load_chat_history_internal(
    db: &State<'_, Database>,
    session_id: &str,
    limit: Option<i64>,
) -> Result<Vec<AIMessage>> {
    let conn = db.conn.lock().unwrap();
    
    let limit_clause = limit.map(|l| format!("LIMIT {}", l)).unwrap_or_default();
    
    let mut stmt = conn.prepare(&format!(
        "SELECT id, project_id, session_id, role, content, model, created_at 
         FROM ai_messages 
         WHERE session_id = ?1 
         ORDER BY created_at ASC {}",
        limit_clause
    ))?;
    
    let messages = stmt
        .query_map([session_id], |row| {
            Ok(AIMessage {
                id: row.get(0)?,
                project_id: row.get(1)?,
                session_id: row.get(2)?,
                role: row.get(3)?,
                content: row.get(4)?,
                model: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, _>>()?;
    
    Ok(messages)
}

#[tauri::command]
pub fn clear_chat_history(
    db: State<'_, Database>,
    session_id: String,
) -> Result<()> {
    let conn = db.conn.lock().unwrap();
    conn.execute(
        "DELETE FROM ai_messages WHERE session_id = ?1",
        [&session_id],
    )?;
    Ok(())
}
