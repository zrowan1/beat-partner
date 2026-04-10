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

**Kernprincipes iOS 26 Liquid Glass:**

1. **Refractie & Lichtbreking**
   - Multi-layer backdrop-filter met varying intensities
   - Simuleer lichtbreking door glas (chromatic offset via CSS)
   - Gebruik WebGL shaders voor advanced refractie indien mogelijk

2. **Diepte & Dimensie**
   ```css
   /* Layer 1: Background */
   backdrop-filter: blur(40px) saturate(180%);
   
   /* Layer 2: Cards */
   backdrop-filter: blur(20px) saturate(150%);
   
   /* Layer 3: Interactive elements */
   backdrop-filter: blur(10px) saturate(120%);
   ```

3. **Chromatic Aberration (RGB Split)**
   - Subtiele RGB offset aan randen bij hover/focus
   - CSS text-shadow of pseudo-elementen voor effect

4. **Organische Vormen & Animaties**
   - `border-radius` animaties voor liquid morphing
   - Spring-physics easing (overshoot voor organic feel)
   - Scale transforms met cubic-bezier(0.34, 1.56, 0.64, 1)

5. **Reflectie & Glans**
   - Linear gradients overlay voor glans effect
   - Radial gradients voor spotlight highlights
   - Subtle noise texture voor realism

6. **3D Perspective (Desktop variant)**
   - CSS `transform: perspective(1000px) rotateX/Y()`
   - Mouse-tracking voor tilt effect (optioneel)

**Kleuren:**
- **Basis**: Donkere achtergrond (#0a0a0f, #12121a)
- **Accenten**: Cyan (#00d4ff), Purple (#b347d9), Magenta (#ff0080)
- **Glas**: rgba(255,255,255,0.05-0.15)
- **Borders**: rgba(255,255,255,0.1-0.2)

**Typography:**
- **Primary**: Inter, SF Pro Display
- **Monospace**: SF Mono, JetBrains Mono (voor data: BPM, keys)
- **Sizes**: 12px labels, 14px body, 16px headings, 24px titles

---

## 4. State Management

### Zustand Store Structure
```typescript
// stores/appStore.ts
interface AppState {
  // UI State
  activeView: 'guides' | 'tools' | 'presets' | 'samples' | 'settings';
  sidebarOpen: boolean;
  aiChatOpen: boolean;
  
  // Project State
  currentProject: Project | null;
  currentPhase: ProductionPhase;
  
  // Audio State
  audioContext: AudioContextState;
  analysisResults: AudioAnalysis | null;
  
  // AI State
  aiProvider: AIProvider;
  aiMessages: AIMessage[];
  aiLoading: boolean;
}

// stores/projectStore.ts
interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  recentProjects: Project[];
  loading: boolean;
  error: string | null;
}
```

---

## 5. Database Schema (SQLite)

```sql
-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Users & Preferences
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT 'Producer',
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  user_id INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  bpm INTEGER DEFAULT 128,
  key TEXT,
  genre TEXT,
  phase TEXT DEFAULT 'idea',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_updated ON projects(updated_at);

-- Progress Tracking
CREATE TABLE progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  project_id INTEGER NOT NULL,
  phase TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE(user_id, project_id, phase)
);

CREATE INDEX idx_progress_project ON progress(project_id);

-- Samples Library
CREATE TABLE samples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  category TEXT,
  tags TEXT, -- JSON array
  bpm INTEGER,
  key TEXT,
  duration REAL,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_samples_category ON samples(category);
CREATE INDEX idx_samples_user ON samples(user_id);

-- Presets
CREATE TABLE presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  synth_name TEXT NOT NULL,
  category TEXT,
  tags TEXT, -- JSON array
  settings_json TEXT NOT NULL, -- Full preset data
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_presets_synth ON presets(synth_name);
CREATE INDEX idx_presets_category ON presets(category);

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
  file_path TEXT NOT NULL UNIQUE,
  file_hash TEXT NOT NULL, -- For cache invalidation
  analysis_type TEXT NOT NULL, -- 'bpm', 'key', 'spectrum'
  results_json TEXT NOT NULL,
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

```typescript
// types/ai.ts
type AIProvider = 'ollama' | 'cloud' | 'auto';

interface AIConfig {
  provider: AIProvider;
  preferredLocalModel: string;      // e.g., "llama3.2"
  preferredCloudModel: string;      // e.g., "gpt-4"
  cloudApiKey?: string;
  cloudBaseUrl?: string;            // For custom OpenAI-compatible endpoints
  ollamaBaseUrl: string;            // Default: http://localhost:11434
  timeoutMs: number;                // Default: 30000
  maxRetries: number;               // Default: 3
}

// Fallback Strategy:
// 1. Try local Ollama (primary)
// 2. If unavailable && apiKey exists → use Cloud
// 3. If both fail → show offline message with retry option
// 4. Auto-switch back to local when available again
```

---

## 8. Feature Roadmap (Gefaseerd)

### Fase 1: Foundation
- [ ] Tauri project scaffolding + React + Tailwind
- [ ] Zustand store setup
- [ ] Basis Liquid Glass layout met sidebar
- [ ] AI Chat interface met Ollama integratie
- [ ] Fallback strategie (cloud API)
- [ ] SQLite schema + migrations
- [ ] Error handling framework

### Fase 2: Music Tools
- [ ] BPM/Key Detector (audio analyse via Rust + aubio/essentia)
- [ ] Theory Helper (chord grids, scales viewer)
- [ ] Audio Analyzer (spectrum FFT visualization)
- [ ] Reference track importer

### Fase 3: Content & Management
- [ ] Sample Browser (+ drag-drop import)
- [ ] Preset Manager (multi-synth support)
- [ ] Project templates
- [ ] Auto-tagging (AI-powered)

### Fase 4: Polish & Advanced
- [ ] Progress tracking dashboard
- [ ] AI feedback op project progress
- [ ] Genre-specific guides
- [ ] Export (PDF/HTML project report)
- [ ] Plugin detection (scan installed VSTs)

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
- **Sample Library**: Virtual scrolling for large lists
- **AI Chat**: Debounce requests, stream responses
- **Images**: Lazy loading voor artwork
- **Database**: Connection pooling (via r2d2-sqlite)
