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
│ - Tools    │   Tools/Presets)       │  Copilot  │
│ - Presets  │                        │           │
│ - Samples │                        │           │
│ - Settings│                        │           │
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
  activeView: 'guides' | 'tools' | 'presets' | 'samples' | 'settings';
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
| **OpenAI** | Cloud | Fallback — GPT-4o, GPT-4o-mini |
| **Anthropic** | Cloud | Fallback — Claude Sonnet, Claude Haiku |
| **OpenAI-compatible** | Cloud | Custom endpoints (bijv. OpenRouter, Groq) |

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
// 2. If unavailable && apiKey exists → use configured cloud provider
// 3. If both fail → show offline message with retry option
// 4. Auto-switch back to local when available again

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
  | 'creative';         // Brainstorming, ideeën genereren

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
- [ ] AI Chat interface met streaming
- [ ] Ollama integratie (lokaal)
- [ ] Cloud provider fallback (OpenAI / Anthropic)
- [ ] Chat history opslag in SQLite
- [ ] **Hardware detectie & model aanbevelingen**
- [ ] **Model download & installatie vanuit de app**
- [ ] **Use-case gebaseerde model suggesties**

### Fase 2: Music Tools *(must-have)*
- [ ] BPM/Key Detector (audio analyse via Rust + aubio/essentia)
- [ ] Theory Helper (chord grids, scales viewer)
- [ ] Audio Analyzer (spectrum FFT visualization)
- [ ] Reference track importer

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

---

## 9. Technische Architectuur

```
src-tauri/
├── src/
│   ├── main.rs           # Entry point
│   ├── lib.rs            # Module exports
│   ├── error.rs          # Error types & handling
│   ├── commands/         # Tauri commands
│   │   ├── ai.rs         # AI/LLM handling
│   │   ├── audio.rs      # BPM/Key detection
│   │   ├── db.rs         # SQLite operations
│   │   ├── files.rs      # File management
│   │   └── projects.rs   # Project CRUD
│   ├── services/         # Business logic
│   │   ├── ai_service.rs
│   │   └── audio_service.rs
│   └── models/           # Rust data models
│       ├── project.rs
│       ├── sample.rs
│       └── preset.rs

src/
├── components/           # React components
│   ├── ui/              # Generic UI (Button, Card, Input)
│   ├── layout/          # Layout components
│   ├── liquid-glass/    # Liquid glass specific components
│   └── features/        # Feature-specific components
├── hooks/               # Custom React hooks
├── pages/               # Page views
├── services/            # API clients
├── stores/              # Zustand stores
├── styles/              # Global styles, Tailwind config
├── types/               # TypeScript types
├── utils/               # Helper functions
└── constants/           # App constants
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
