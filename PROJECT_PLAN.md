# BeatPartner - Project Plan

## 1. Project Overzicht

| Specificatie | Waarde |
|--------------|--------|
| **Naam** | BeatPartner |
| **Type** | Desktop Application |
| **Stack** | Tauri 2.x + React + TypeScript |
| **Database** | SQLite (rusqlite) |
| **State** | Zustand |
| **Styling** | Tailwind CSS |
| **License** | MIT |
| **Platforms** | Mac (primary), Windows, Linux |

## 2. Doel & Visie

Desktop companion die beginners begeleidt door het muziek productie-proces met AI-assistentie. Draait naast elke DAW.

**Target**: Beginners tot ervaren producers  
**Design**: Liquid Glass (iOS 26-style), minimalistisch, clean

---

## 3. UI/UX Design - Liquid Glass (iOS 26)

### Window Layout
```
┌─────────────────────────────────────────────────────┐
│  [Logo]  BeatPartner              [—] [□] [×]    │
├────────────┬────────────────────────┬───────────┤
│            │                        │           │
│  SIDEBAR   │      MAIN CONTENT      │   AI      │
│            │                        │  CHAT     │
│ - Guides   │  (Guide/Player/        │           │
│ - Tools    │   Tools/Presets/       │  Copilot  │
│ - Lyrics   │   Lyrics/Vocals)       │           │
│ - Vocals   │                        │           │
│ - Presets  │                        │           │
│ - Samples  │                        │           │
│ - Settings │                        │           │
│            │                        │           │
├────────────┴────────────────────────┴───────────┤
│  Status: BPM 128 | C minor | Phase: Arrangement    │
└─────────────────────────────────────────────────────┘
```

### Design Systeem - Liquid Glass

> **Gefaseerde aanpak**: Begin met de basis (Niveau 1-2) in Fase 1a. Advanced effecten
> (Niveau 3) worden pas in Fase 4 toegevoegd. Dit voorkomt performance-problemen vroeg
> in de ontwikkeling en houdt de focus op functionaliteit.
>
> **Performance waarschuwing**: Meerdere lagen `backdrop-filter` zijn GPU-intensief,
> vooral op Windows/Linux. Test altijd op alle platforms bij het toevoegen van visuele lagen.
>
> **WKWebView / Tauri waarschuwing**: `backdrop-filter` op een `position: fixed` full-screen
> overlay veroorzaakt een volledig zwart scherm in Tauri op macOS (WKWebView compositor bug).
> **Modals en dialogs mogen NOOIT `backdrop-filter` of `glass-card` gebruiken op hun outer container.**
> Gebruik `createPortal(…, document.body)` + een solid achtergrondkleur (`#0f0f14`).
> Zie `AGENTS.md` → "Modals & Dialogs" voor het correcte patroon.

**Kernprincipes iOS 26 Liquid Glass:**

#### Niveau 1: Basis *(Fase 1a)* — HUIDIGE IMPLEMENTATIE
1. **Diepte & Dimensie**
   ```css
   /* Layer 1: Background panels */
   backdrop-filter: blur(40px) saturate(200%);
   background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
   border: 1px solid rgba(255,255,255,0.08);
   
   /* Layer 2: Cards */
   backdrop-filter: blur(32px) saturate(180%);
   background: linear-gradient(165deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.02) 100%);
   border: 1px solid rgba(255,255,255,0.12);
   box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
   
   /* Layer 3: Interactive elements */
   backdrop-filter: blur(20px) saturate(160%);
   background: linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%);
   border: 1px solid rgba(255,255,255,0.1);
   box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
   ```

2. **Reflectie & Glans**
   - Linear gradients overlay voor glans effect (top 50%, 15% opacity)
   - Shimmer highlight effect (45deg gradient sweep)
   - Radial blur blobs voor achtergrond diepte
   - Subtle noise texture voor realism (toekomstig)

#### Niveau 2: Animaties *(Fase 2)*
3. **Organische Vormen & Animaties**
   - `border-radius` animaties voor liquid morphing
   - Spring-physics easing (overshoot voor organic feel)
   - Scale transforms met cubic-bezier(0.34, 1.56, 0.64, 1)

#### Niveau 3: Advanced Effecten *(Fase 4)*
4. **Refractie & Lichtbreking**
   - Multi-layer backdrop-filter met varying intensities
   - Simuleer lichtbreking door glas (chromatic offset via CSS)
   - Gebruik WebGL shaders voor advanced refractie indien mogelijk

5. **Chromatic Aberration (RGB Split)**
   - Subtiele RGB offset aan randen bij hover/focus
   - CSS text-shadow of pseudo-elementen voor effect

6. **3D Perspective (Desktop variant)**
   - CSS `transform: perspective(1000px) rotateX/Y()`
   - Mouse-tracking voor tilt effect (optioneel)

**Kleuren (geüpdatet na design overhaul):**
- **Basis**: Diep zwart (#020204, #08080c, #0f0f14)
- **Accenten**: Cyan (#22d3ee), Purple (#a78bfa), Magenta (#f472b6)
- **Glas**: rgba(255,255,255,0.08-0.2)
- **Borders**: rgba(255,255,255,0.12-0.3)

**Typography:**
- **Primary**: Inter, SF Pro Display
- **Monospace**: SF Mono, JetBrains Mono (voor data: BPM, keys)
- **Sizes**: 11px labels, 13px body, 15px headings, 20px titles

---

## 4. State Management

### Zustand Store Structure
```typescript
// stores/appStore.ts — UI & globale app state
interface AppState {
  // UI State
  activeView: 'guides' | 'tools' | 'lyrics' | 'vocals' | 'presets' | 'samples' | 'settings';
  sidebarOpen: boolean;
  aiChatOpen: boolean;
  
  // AI State
  aiProvider: AIProvider;
  aiMessages: AIMessage[];
  aiLoading: boolean;
}

// stores/projectStore.ts — Project data (single source of truth)
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;  // Enige plek voor current project
  currentPhase: ProductionPhase;
  recentProjects: Project[];
  loading: boolean;
  error: string | null;
}

// stores/audioStore.ts — Audio analyse resultaten
interface AudioState {
  analysisResults: AudioAnalysis | null;
  isAnalyzing: boolean;
}
// NB: AudioContext zelf is een browser-object en hoort niet in een
// serializable store. Gebruik een useRef of singleton pattern.

// stores/lyricsStore.ts — Lyrics & annotaties per project
interface LyricsState {
  lyrics: Lyrics | null;
  annotations: LyricAnnotation[];
  isDirty: boolean;
  selectedTag: LyricTag | null;
}

// stores/vocalProductionStore.ts — Vocal productie notities
interface VocalProductionState {
  notes: VocalProductionNotes | null;
  isLoading: boolean;
}
```

---

## 5. Database Schema (SQLite)

```sql
-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- App Preferences (key-value store, geen users tabel nodig voor desktop app)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  bpm INTEGER DEFAULT 128,
  key TEXT,
  genre TEXT,
  phase TEXT DEFAULT 'idea',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_updated ON projects(updated_at);

-- Progress Tracking
CREATE TABLE progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  phase TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, phase)
);

CREATE INDEX idx_progress_project ON progress(project_id);

-- Tags (genormaliseerd voor betere querying)
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Samples Library
CREATE TABLE samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  category TEXT,
  bpm INTEGER,
  key TEXT,
  duration REAL,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_samples_category ON samples(category);

CREATE TABLE sample_tags (
  sample_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (sample_id, tag_id),
  FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Presets
CREATE TABLE presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  synth_name TEXT NOT NULL,
  category TEXT,
  settings_json TEXT NOT NULL, -- Full preset data
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_presets_synth ON presets(synth_name);
CREATE INDEX idx_presets_category ON presets(category);

CREATE TABLE preset_tags (
  preset_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (preset_id, tag_id),
  FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- AI Conversations
CREATE TABLE ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER,
  session_id TEXT NOT NULL, -- Group messages per chat session
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT, -- Which AI model was used
  tokens_used INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_ai_messages_project ON ai_messages(project_id);
CREATE INDEX idx_ai_messages_session ON ai_messages(session_id);

-- Audio Analysis Cache
CREATE TABLE audio_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL,
  file_hash TEXT NOT NULL, -- For cache invalidation
  analysis_type TEXT NOT NULL, -- 'bpm', 'key', 'spectrum'
  results_json TEXT NOT NULL,
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(file_path, analysis_type)
);

CREATE INDEX idx_audio_analysis_path ON audio_analysis(file_path);
CREATE INDEX idx_audio_hash ON audio_analysis(file_hash);

-- Lyrics (per project, één actieve versie)
CREATE TABLE lyrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Lyric Annotations (highlights: melody, ad-lib, flow, harmony, etc.)
CREATE TABLE lyric_annotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lyrics_id INTEGER NOT NULL,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  tag TEXT NOT NULL CHECK(tag IN ('melody','ad-lib','harmony','flow','emphasis','note')),
  color TEXT,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lyrics_id) REFERENCES lyrics(id) ON DELETE CASCADE
);

CREATE INDEX idx_lyric_annotations_lyrics ON lyric_annotations(lyrics_id);

-- Vocal Production Notes (per project)
CREATE TABLE vocal_production_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  mic_choice TEXT,
  vocal_chain_json TEXT,
  recording_notes TEXT,
  editing_notes TEXT,
  tuning_notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

---

## 6. Error Handling

### Rust Error Types (src-tauri/src/error.rs)
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum BeatPartnerError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    
    #[error("AI service error: {0}")]
    AIService(String),
    
    #[error("Audio analysis error: {0}")]
    AudioAnalysis(String),
    
    #[error("File not found: {0}")]
    FileNotFound(String),
    
    #[error("Invalid configuration: {0}")]
    Config(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, BeatPartnerError>;
```

### Frontend Error Handling
- **API Layer**: Centralized error handling in services
- **UI**: Toast notifications voor user-facing errors
- **Logging**: Structured logging naar file (via Tauri plugin)

---

## 7. AI Integratie & Fallback Strategy

### Ondersteunde Providers
| Provider | Type | Gebruik |
|----------|------|---------|
| **Ollama** | Lokaal | Primair — gratis, privacy-vriendelijk |
| **llama.cpp** | Lokaal | Alternatief voor Ollama — hogere performance, directe GPU-toegang, GGUF modellen |
| **OpenAI** | Cloud | Fallback — GPT-4o, GPT-4o-mini |
| **Anthropic** | Cloud | Fallback — Claude Sonnet, Claude Haiku |
| **OpenRouter** | Cloud | Aggregator — 200+ modellen via één API key (gratis + betaalde opties) |
| **OpenAI-compatible** | Cloud | Custom endpoints (bijv. Groq, Together AI) |

### Config & Types
```typescript
// types/ai.ts
type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'custom' | 'auto';

interface AIConfig {
  provider: AIProvider;
  preferredLocalModel: string;      // e.g., "llama3.2"
  preferredCloudModel: string;      // e.g., "claude-sonnet-4-20250514"
  cloudApiKey?: string;             // Opgeslagen via tauri-plugin-store (encrypted)
  cloudBaseUrl?: string;            // Voor custom OpenAI-compatible endpoints
  ollamaBaseUrl: string;            // Default: http://localhost:11434
  timeoutMs: number;                // Default: 30000
  maxRetries: number;               // Default: 3
  streamResponses: boolean;         // Default: true
}

// Fallback Strategy:
// 1. Try local Ollama (primary)
// 2. If unavailable → try llama.cpp server (if configured)
// 3. If both unavailable && apiKey exists → use configured cloud provider (OpenAI / Anthropic / OpenRouter)
// 4. If all fail → show offline message with retry option
// 5. Auto-switch back to local when available again

// Streaming:
// - Chat responses worden altijd gestreamed (SSE voor cloud, Ollama native)
// - UI toont tokens incrementeel via een streaming state in de AI store
// - Timeout geldt voor eerste token, niet voor volledige response
```

---

## 7.1 AI Model Management (Ollama)

> **Design Philosophy**: Omdat BeatPartner primair lokaal draait met Ollama, is het essentieel dat de app gebruikers helpt bij het selecteren, downloaden en beheren van AI modellen. De app moet "out of the box" werken zonder dat de gebruiker handmatig modellen hoeft te installeren via command line.

### Hardware Detectie & Model Aanbevelingen

De app detecteert automatisch de systeemhardware en beveelt geschikte modellen aan:

```rust
// src-tauri/src/services/ollama_service.rs
pub struct HardwareCapabilities {
    pub total_memory_gb: f64,        // RAM
    pub gpu_memory_gb: Option<f64>,  // VRAM (indien GPU beschikbaar)
    pub cpu_cores: usize,
    pub cpu_vendor: String,          // "Apple", "Intel", "AMD"
    pub os: String,                  // "macos", "windows", "linux"
    pub is_apple_silicon: bool,
}

pub enum ModelSizeTier {
    Tiny,    // < 4GB  - Geschikt voor 8GB RAM
    Small,   // 4-8GB  - Geschikt voor 16GB RAM
    Medium,  // 8-16GB - Geschikt voor 32GB RAM
    Large,   // > 16GB - Geschikt voor 64GB+ RAM
}

impl HardwareCapabilities {
    pub fn recommended_model_tier(&self) -> ModelSizeTier {
        // Apple Silicon heeft efficiënter memory management
        let effective_memory = if self.is_apple_silicon {
            self.total_memory_gb * 1.2
        } else {
            self.total_memory_gb
        };
        
        match effective_memory as u32 {
            0..=12 => ModelSizeTier::Tiny,
            13..=20 => ModelSizeTier::Small,
            21..=40 => ModelSizeTier::Medium,
            _ => ModelSizeTier::Large,
        }
    }
}
```

**Aanbevolen modellen per tier:**

| Tier | RAM | Aanbevolen Modellen | Doel |
|------|-----|---------------------|------|
| Tiny | 8GB | `qwen2.5:3b`, `phi4:3.8b`, `gemma3:4b` | Snelle antwoorden, basis taken |
| Small | 16GB | `llama3.2`, `mistral:7b`, `qwen2.5:7b` | Goede balans snelheid/kwaliteit |
| Medium | 32GB | `llama3.1:8b`, `deepseek-r1:14b`, `qwen2.5:14b` | Complexe muziektheorie, arrangement tips |
| Large | 64GB+ | `llama3.3:70b`, `mixtral:8x7b`, `qwq:32b` | Advanced productie hulp, detailanalyse |

### Use-Case Gebaseerde Model Suggesties

De app analyseert het gesprek en suggereert het beste model voor de taak:

```typescript
// types/ai.ts
export type ModelUseCase = 
  | 'general'           // Algemene vragen, quick tips
  | 'theory'            // Muziektheorie, harmonieleer, akkoorden
  | 'production'        // Productie-technieken, workflow
  | 'sound-design'      // Synthesizer programmering, sound design
  | 'mixing'            // Mixing advies, EQ, compressie
  | 'mastering'         // Mastering technieken
  | 'analysis'          // Gedetailleerde track analyse
  | 'creative'          // Brainstorming, ideeën genereren
  | 'lyrics'            // Rhyme, rewrite, storytelling, flow
  | 'vocals';           // Recording tips, vocal chain, comping/tuning advies

export interface ModelRecommendation {
  modelId: string;           // e.g., "llama3.2:latest"
  name: string;              // e.g., "Llama 3.2"
  sizeGb: number;
  useCases: ModelUseCase[];
  reasoning: string;         // Waarom dit model past bij de use case
  estimatedSpeed: 'fast' | 'medium' | 'slow';
  quality: 'basic' | 'good' | 'excellent';
}

// Voorbeeld suggesties:
// - "Hoe maak ik een chord progression?" → Small model (theory = snel genoeg)
// - "Analyseer mijn mix" → Medium/Large model (analysis = meer context nodig)
// - "Geef 5 ideeën voor een drop" → Tiny model (creative = snelheid > kwaliteit)
```

**Model Suggestie Logica:**

```typescript
// services/ollamaService.ts
export function suggestModelsForUseCase(
  useCase: ModelUseCase,
  hardware: HardwareCapabilities,
  installedModels: OllamaModel[]
): ModelRecommendation[] {
  // 1. Filter modellen die passen in hardware
  // 2. Sorteer op geschiktheid voor use case
  // 3. Prioriteit: geïnstalleerde modellen eerst, dan downloads
  // 4. Return top 3 aanbevelingen met uitleg
}
```

### In-App Model Download & Installatie

Gebruikers kunnen modellen direct vanuit de app downloaden zonder command line:

```rust
// src-tauri/src/commands/ollama.rs
#[tauri::command]
pub async fn download_model(
    model_id: String,
    on_progress: Channel<DownloadProgress>,
) -> Result<OllamaModel> {
    // Stream download progress naar frontend
    // Ollama pull command via HTTP API
    // Return model info wanneer klaar
}

#[tauri::command]
pub async fn get_ollama_models() -> Result<Vec<OllamaModel>> {
    // Lijst van geïnstalleerde modellen
}

#[tauri::command]
pub async fn delete_ollama_model(model_id: String) -> Result<()> {
    // Verwijder model om ruimte vrij te maken
}

#[tauri::command]
pub fn check_hardware_capabilities() -> HardwareCapabilities {
    // Detecteer RAM, GPU, CPU
}
```

**Download Progress Interface:**

```typescript
// types/ollama.ts
export interface DownloadProgress {
  modelId: string;
  status: 'downloading' | 'verifying' | 'completed' | 'error';
  bytesDownloaded: number;
  bytesTotal: number;
  percentage: number;
  speedMbps: number;
  estimatedSecondsRemaining: number;
  error?: string;
}

export interface OllamaModel {
  id: string;                    // "llama3.2:latest"
  name: string;                  // "Llama 3.2"
  description: string;
  sizeGb: number;
  parameterCount: string;        // "3B", "7B", "70B"
  useCases: ModelUseCase[];
  installed: boolean;
  downloadedAt?: string;
  version: string;
  quantization: string;          // "Q4_K_M", "Q8_0", etc.
}
```

### Model Manager UI Componenten

**ModelRecommendationsPanel**:
- Toont hardware detectie resultaten
- Lijst van aanbevolen modellen per use case
- "Download" knop voor niet-geïnstalleerde modellen
- Progress indicator tijdens download
- "Geïnstalleerd" badge voor beschikbare modellen

**ModelSelector**:
- Dropdown in chat interface
- Groepeer modellen: "Geïnstalleerd" vs "Aanbevolen"
- Toon model info: grootte, snelheid, geschiktheid
- Snelle switch tussen modellen

**HardwareInfoCard**:
- RAM: "32GB detected — Medium models recommended"
- GPU: "Apple Silicon M3 — Optimized for local inference"
- Status: "Ready for AI chat" / "Consider downloading a model"

### First-Run Experience

Bij eerste start van de app:

1. **Hardware Scan**: Detecteer systeem specificaties
2. **Ollama Check**: Controleer of Ollama is geïnstalleerd
3. **Model Aanbeveling**: Toon 2-3 beste modellen voor dit systeem
4. **Quick Download**: "Download Llama 3.2 (4GB) — Recommended for your system"
5. **Alternative**: "Skip — I'll configure AI later"

### Database Schema Uitbreiding

```sql
-- Ollama modellen cache (voor snelle lookup zonder Ollama API call)
CREATE TABLE ollama_models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  size_bytes INTEGER NOT NULL,
  parameter_count TEXT,
  use_cases TEXT,              -- JSON array of ModelUseCase
  quantization TEXT,
  downloaded_at DATETIME,
  last_used_at DATETIME,
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Model download geschiedenis
CREATE TABLE model_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT NOT NULL,
  status TEXT NOT NULL,        -- 'pending', 'downloading', 'completed', 'failed', 'cancelled'
  bytes_total INTEGER,
  bytes_downloaded INTEGER,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (model_id) REFERENCES ollama_models(id)
);

-- Default model preferences per use case
CREATE TABLE model_preferences (
  use_case TEXT PRIMARY KEY,
  preferred_model_id TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Ollama niet geïnstalleerd | Toon installatie-instructies per OS |
| Onvoldoende schijfruimte | Waarschuwing voor download, cleanup suggesties |
| Download onderbroken | Hervatten mogelijk (Ollama ondersteunt partial pulls) |
| Model corrupt | Verifiëren hash, opnieuw downloaden suggestie |
| Hardware te zwak | Fallback naar cloud provider, of Tiny models aanbevelen |
| Netwerk timeout | Retry met exponentiële backoff, cancel optie |

---

## 7.2 llama.cpp Integratie

> **Design Philosophy**: llama.cpp biedt hogere inference-performance dan Ollama door minder overhead en directere GPU-toegang (Metal op macOS, CUDA op NVIDIA). Geschikt voor gevorderde gebruikers die al GGUF-bestanden beheren. BeatPartner behandelt llama.cpp als een optionele lokale provider naast Ollama — geen vervanging.

### Hoe het werkt

De gebruiker draait zelf `llama-server -m model.gguf --port 8080`. BeatPartner detecteert de server en gebruikt deze als provider. Er is **geen in-app download** voor llama.cpp modellen — de gebruiker downloadt GGUF-bestanden zelf (bijv. via Hugging Face).

**llama.cpp server endpoints (OpenAI-compatibel):**
- `GET /health` — server status check
- `GET /v1/models` — lijst van geladen modellen (typisch 1 tegelijk)
- `POST /v1/chat/completions` — streaming chat (SSE, zelfde formaat als OpenAI)

### Backend (Rust)

Nieuwe service `src-tauri/src/services/llamacpp_service.rs`:

```rust
pub struct LlamaCppService {
    base_url: String,   // Default: http://localhost:8080
    client: reqwest::Client,
}

impl LlamaCppService {
    pub async fn check_status(&self) -> Result<LlamaCppStatus>;
    pub async fn list_models(&self) -> Result<Vec<LlamaCppModel>>;
    pub async fn chat(
        &self,
        messages: Vec<ChatMessage>,
        model: &str,
        on_chunk: impl Fn(String),
    ) -> Result<ChatResponse>;
}

pub struct LlamaCppStatus {
    pub running: bool,
    pub version: Option<String>,
    pub base_url: String,
}
```

Nieuwe Tauri command in `src-tauri/src/commands/ai.rs`:

```rust
#[tauri::command]
pub async fn check_llamacpp_status(base_url: Option<String>) -> Result<LlamaCppStatus>;

#[tauri::command]
pub async fn list_llamacpp_models(base_url: Option<String>) -> Result<Vec<LlamaCppModel>>;
```

`AIProvider` type uitbreiden: `"llamacpp"` toevoegen.

### Frontend

```typescript
// types/ai.ts
type AIProvider = 'ollama' | 'llamacpp' | 'openai' | 'anthropic' | 'openrouter' | 'custom' | 'auto';

interface AIConfig {
  // ... bestaande velden
  llamaCppBaseUrl: string;   // Default: http://localhost:8080
}

interface LlamaCppStatus {
  running: boolean;
  version?: string;
  baseUrl: string;
}
```

**Settings UI:**
- Base URL invoerveld (default `http://localhost:8080`)
- Status indicator: groen "Running" / rood "Not detected"
- Link naar llama.cpp releases + instructies voor GGUF downloaden

**ModelSelector:**
- llama.cpp modellen als aparte groep "Local (llama.cpp)"
- Typisch 1 actief model — toon welk model geladen is

### Verschillen vs Ollama

| Aspect | Ollama | llama.cpp |
|--------|--------|-----------|
| Model beheer | In-app download + delete | Handmatig (GGUF bestanden) |
| Gelijktijdige modellen | Meerdere | Typisch 1 |
| Performance | Goed | Beter (minder overhead) |
| Gebruikersniveau | Beginner-vriendelijk | Gevorderd |
| Installatie | Installer beschikbaar | Zelf compileren of binary |

---

## 7.3 OpenRouter Integratie

> **Design Philosophy**: OpenRouter geeft gebruikers toegang tot 200+ modellen — inclusief Claude, GPT-4, Llama, Mistral en meer — via één API key. Veel modellen zijn gratis of zeer goedkoop. OpenRouter is volledig OpenAI-compatibel en fungeert als een volwaardige cloud provider naast OpenAI en Anthropic.

### Hoe het werkt

- Base URL: `https://openrouter.ai/api/v1`
- Authenticatie: Bearer token (API key van openrouter.ai)
- Model listing: `GET /v1/models` — retourneert naam, pricing, context window, capabilities
- Chat: `POST /v1/chat/completions` — zelfde SSE streaming formaat als OpenAI
- Aanbevolen identificatie headers: `HTTP-Referer: https://beatpartner.app`, `X-Title: BeatPartner`

### Backend (Rust)

Uitbreiding van `src-tauri/src/services/cloud_service.rs`:

```rust
// OpenRouter gebruikt het OpenAI-formaat maar met extra headers
pub async fn chat_openrouter(
    &self,
    messages: Vec<ChatMessage>,
    model: &str,
    api_key: &str,
    on_chunk: impl Fn(String),
) -> Result<ChatResponse> {
    // POST https://openrouter.ai/api/v1/chat/completions
    // Headers: Authorization: Bearer <key>
    //          HTTP-Referer: https://beatpartner.app
    //          X-Title: BeatPartner
}

pub async fn fetch_openrouter_models(api_key: &str) -> Result<Vec<OpenRouterModel>>;
```

Nieuwe Tauri command:

```rust
#[tauri::command]
pub async fn fetch_openrouter_models(api_key: String) -> Result<Vec<OpenRouterModel>>;
```

### Frontend Types

```typescript
// types/ai.ts
export interface OpenRouterModel {
  id: string;             // "anthropic/claude-sonnet-4-5"
  name: string;           // "Claude Sonnet 4.5"
  description?: string;
  contextLength: number;  // Max context tokens
  pricing: {
    prompt: number;       // $ per 1M tokens (0 = gratis)
    completion: number;
  };
  isFree: boolean;        // true als prompt + completion = $0
  topProvider: string;    // "Anthropic", "Meta", "Mistral", etc.
}
```

**Settings UI:**
- API key invoerveld (encrypted opslaan via tauri-plugin-store)
- "Fetch Models" knop → laad beschikbare modellen
- Model browser met filters:
  - Gratis / Betaald toggle
  - Filter op provider (Anthropic, OpenAI, Meta, etc.)
  - Zoeken op naam
- Toon pricing per model (gratis modellen gemarkeerd)

**ModelSelector:**
- OpenRouter modellen als aparte groep "Cloud (OpenRouter)"
- Gratis modellen gemarkeerd met "Free" badge
- Toon context window grootte als indicator voor geschiktheid

### Voordelen vs "custom" provider

| Aspect | Custom Provider | OpenRouter |
|--------|----------------|------------|
| Setup | Handmatig base URL | Één API key |
| Model overzicht | Onbekend | Volledige browser |
| Pricing info | Niet beschikbaar | Per model zichtbaar |
| Gratis modellen | Onbekend | Duidelijk gemarkeerd |
| Provider diversiteit | Beperkt | 200+ modellen |

---

## 8. Feature Roadmap (Gefaseerd)

### Fase 1a: Scaffolding & Basis Layout *(must-have)*
- [x] Tauri 2.x project scaffolding + React + TypeScript + Tailwind
- [x] SQLite database setup + migratie-systeem
- [x] Error handling framework (Rust + frontend)
- [x] Basis layout: sidebar + main content area (simpele Liquid Glass, zonder advanced effecten)

### Fase 1b: Stores & Data *(must-have)* ✅
- [x] Zustand stores (app, project, audio)
- [x] Project CRUD (aanmaken, openen, verwijderen)
- [x] Settings persistence (key-value store)

### Fase 1c: AI Chat & Model Management *(must-have)*
- [x] AI Chat interface met streaming
- [x] Ollama integratie (lokaal, primair)
- [x] Cloud provider fallback (OpenAI / Anthropic)
- [x] Chat history opslag in SQLite
- [x] **Hardware detectie & model aanbevelingen**
- [x] **Model download & installatie vanuit de app**
- [x] **Use-case gebaseerde model suggesties**
- [x] **llama.cpp server integratie** (status check, model listing, streaming chat)
- [x] **llama.cpp provider UI** (base URL configuratie, server status indicator, GGUF instructies)
- [x] **OpenRouter provider** (API key beheer, model browser, streaming chat)
- [x] **OpenRouter model browser UI** (free/paid filter, provider filter, prijsindicator)
- [x] **Fallback volgorde** updaten: Ollama → llama.cpp → OpenRouter/Cloud

### Fase 2: Music Tools *(must-have)* ✅
- [x] BPM/Key Detector (audio analyse via Rust + symphonia + realfft)
- [x] Theory Helper (chord grids, scales viewer, circle of fifths, guitar diagrams, progression suggestions)
- [x] Audio Analyzer (spectrum FFT visualization)
- [x] Reference track importer

#### Fase 2a: Lyrics Editor *(must-have)*
- [x] Per-project lyrics tekstveld met auto-save
- [x] Annotatie systeem: selecteer tekst → kies tag (`melody`, `ad-lib`, `harmony`, `flow`, `emphasis`, `note`)
- [x] Highlight rendering in editor (kleurgecodeerde onderstreep/achtergrond)
- [x] AI assistentie voor lyrics (rhyme suggestions, rewrite, flow tips)

#### Fase 2b: Vocal Production Assistant *(must-have)* ✅
- [x] **Recording Checklist**: stap-voor-stap checklist voor vocal recording (mic setup, gain staging, room, takes)
- [x] **Mic & Chain Advisor**: AI-gebaseerde suggesties voor microfoonkeuze en vocal chain (EQ, compression, reverb, delay) op basis van genre/vocalist
- [x] **Vocal Production Notes**: per project notities voor recording, editing, tuning
- [x] **Reference Vocal Library**: importeer reference vocal tracks (alleen analyse/metadata, niet voor opname)

#### Fase 2c: Vocal Editing Guides *(nice-to-have)*
- [x] **Comping Guide**: beste practices voor vocal comping uit meerdere takes
- [x] **Tuning & Timing Guide**: when/to what extent te tunen/timen voor natuurlijk resultaat
- [x] **Effect Presets**: vocal chain presets per genre (pop, hip-hop, R&B, rock)
- [ ] **Vocal Analysis**: analyse van geïmporteerde reference vocals (formant, dynamics hints)

### Fase 3: Content & Management *(nice-to-have)*
- [ ] Sample Browser (+ drag-drop import)
- [ ] Preset Manager (multi-synth support)
- [ ] Project templates
- [ ] Auto-tagging (AI-powered)

### Fase 4: Polish & Advanced *(nice-to-have)*
- [ ] Progress tracking dashboard
- [ ] AI feedback op project progress
- [ ] Genre-specific guides
- [ ] Export (PDF/HTML project report)
- [ ] Plugin detection (scan installed VSTs)
- [ ] Advanced Liquid Glass effecten (WebGL shaders, chromatic aberration, 3D perspective)

#### Fase 4a: Advanced Vocal Tools *(nice-to-have, later)*
- [ ] AI feedback op lyrics (emotioneel verhaal, songstructuur)
- [ ] Integration met DAW: export lyrics + annotaties als tekst/Markdown/PDF om naast DAW te gebruiken
- [ ] Vocal warm-up en performance tips generator

---

## 9. Technische Architectuur

```
src-tauri/
├── src/
│   ├── main.rs            # Entry point
│   ├── lib.rs             # Module exports
│   ├── error.rs           # Error types & handling
│   ├── commands/          # Tauri commands
│   │   ├── ai.rs          # AI/LLM handling
│   │   ├── audio.rs       # BPM/Key detection
│   │   ├── db.rs          # SQLite operations
│   │   ├── files.rs       # File management
│   │   ├── lyrics.rs      # Lyrics + annotations CRUD
│   │   ├── vocals.rs      # Vocal production notes CRUD
│   │   └── projects.rs    # Project CRUD
│   ├── services/          # Business logic
│   │   ├── ai_service.rs
│   │   ├── audio_service.rs
│   │   ├── lyrics_service.rs
│   │   └── vocal_production_service.rs
│   └── models/            # Rust data models
│       ├── project.rs
│       ├── sample.rs
│       ├── preset.rs
│       ├── lyrics.rs
│       ├── lyric_annotation.rs
│       └── vocal_production_notes.rs

src/
├── components/            # React components
│   ├── ui/               # Generic UI (Button, Card, Input)
│   ├── layout/           # Layout components
│   ├── liquid-glass/     # Liquid glass specific components
│   └── features/         # Feature-specific components
│       ├── lyrics/
│       │   ├── LyricsEditor.tsx
│       │   ├── AnnotationToolbar.tsx
│       │   └── HighlightedLyrics.tsx
│       └── vocals/
│           ├── VocalProductionPanel.tsx
│           ├── RecordingChecklist.tsx
│           ├── VocalChainAdvisor.tsx
│           └── VocalNotesEditor.tsx
├── hooks/                # Custom React hooks
├── pages/                # Page views
├── services/             # API clients
├── stores/               # Zustand stores
│   ├── lyricsStore.ts
│   └── vocalProductionStore.ts
├── styles/               # Global styles, Tailwind config
├── types/                # TypeScript types
│   ├── lyrics.ts
│   └── vocal.ts
├── utils/                # Helper functions
└── constants/            # App constants
```

---

## 10. Development Workflow

### Commands
```bash
# Setup
npm install

# Development
npm run tauri dev

# Building
npm run tauri build

# Quality Assurance
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run format        # Prettier
npm run test          # Unit tests
npm run test:e2e      # Playwright E2E

# Database
npm run db:migrate    # Run migrations
npm run db:reset      # Reset development DB
```

### Git Workflow
- `main`: Production-ready
- `develop`: Integration branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

### Code Quality
- **ESLint**: Strict TypeScript config
- **Prettier**: Consistent formatting
- **Husky**: Pre-commit hooks (lint + typecheck)
- **Conventional Commits**: Structured commit messages

---

## 11. Dependencies (Key)

### Frontend
- `zustand` - State management
- `tailwindcss` - Styling
- `framer-motion` - Animations
- `@tauri-apps/api` - Tauri bindings
- `react-hot-toast` - Notifications

### Backend (Rust)
- `rusqlite` - SQLite
- `serde` - Serialization
- `thiserror` - Error handling
- `reqwest` - HTTP client
- `tokio` - Async runtime
- `log` + `fern` - Logging

---

## 12. Performance Considerations

- **Audio Analysis**: Cache results in `audio_analysis` table (hash-based)
- **Sample Library**: Virtual scrolling voor grote lijsten
- **AI Chat**: Stream responses, debounce user input
- **Images**: Lazy loading voor artwork
- **Database**: Enkele connectie met WAL mode (voldoende voor desktop app)

---

## 13. Security

- **API Keys**: Opgeslagen via `tauri-plugin-store` met OS-level encryptie (Keychain op macOS, Credential Manager op Windows, libsecret op Linux)
- **File Access**: Gebruik Tauri's scope-based file access — alleen toegang tot expliciet toegestane directories
- **IPC Validation**: Alle Tauri commands valideren input; geen ongecontroleerde paden naar het filesystem
- **Dependencies**: Regelmatige `cargo audit` en `npm audit` checks
- **No Telemetry**: Geen data verzameling zonder expliciete toestemming

---

## 14. Testing Strategie

| Laag | Tool | Scope |
|------|------|-------|
| **Rust unit tests** | `cargo test` | Services, models, business logic |
| **Rust integration** | `cargo test` | Tauri commands met test-database |
| **React components** | Vitest + Testing Library | Component rendering, user interactions |
| **Store tests** | Vitest | Zustand store actions en state transitions |
| **E2E** | Playwright | Volledige user flows (app startup, project creation, AI chat) |

**Minimale test coverage targets:**
- Rust services: 80%
- React stores: 80%
- React components: 60%
- E2E: Alle kritieke user flows

---

## 15. Database Migraties

- **Tool**: `rusqlite_migration` crate (ingebouwd, geen externe tooling nodig)
- **Strategie**: Sequentiele, genummerde SQL migratie-bestanden
- **Locatie**: `src-tauri/migrations/`
- **Uitvoering**: Automatisch bij app startup (voor database gebruik)
- **Rollback**: Niet ondersteund — nieuwe migratie schrijven om te corrigeren
- **Versioning**: Migratie-versie opgeslagen in SQLite `user_version` pragma

```
src-tauri/migrations/
├── 001_initial_schema.sql
├── 002_add_tags_tables.sql
└── ...
```

---

## 16. Auto-Update & Distributie

- **Update mechanisme**: `tauri-plugin-updater` met JSON manifest
- **Update check**: Bij app startup + periodiek (elke 24 uur)
- **Kanalen**: Stable (default), Beta (opt-in via settings)
- **Distributie**:
  - macOS: `.dmg` (unsigned voor nu, code signing later)
  - Windows: `.msi` installer
  - Linux: `.AppImage` + `.deb`
- **Release flow**: GitHub Releases met `tauri-action` CI
