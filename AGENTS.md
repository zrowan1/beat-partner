# BeatPartner - Project Plan

## 1. Project Overzicht

| Specificatie | Waarde |
|--------------|--------|
| **Naam** | BeatPartner |
| **Type** | Desktop Application |
| **Stack** | Tauri 2.x + React + TypeScript |
| **Database** | SQLite (rusqlite) |
| **License** | MIT |
| **Platforms** | Mac (primary), Windows, Linux |

## 2. Doel & Visie

Desktop companion die beginners begeleidt door het muziek productie-proces met AI-assistentie. Draait naast elke DAW.

**Target**: Beginners tot ervaren producers  
**Design**: Liquid glass (glassmorphism), minimalistisch, clean

---

## 3. UI/UX Design

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

### Design Systeem
- **Glass-effect**: backdrop-filter: blur(20px), rgba backgrounds
- **Kleuren**: Donkere basis met cyan/purple accenten
- **Typography**: Inter/SF Pro, monospace voor data
- **Animaties**: Subtle transitions, liquid effects

---

## 4. Database Schema (SQLite)

```sql
-- Users & Preferences
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT DEFAULT 'Producer',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT);

-- Projects
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  name TEXT,
  bpm INTEGER DEFAULT 128,
  key TEXT,
  genre TEXT,
  phase TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP);

-- Progress Tracking
CREATE TABLE progress (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  project_id INTEGER,
  phase TEXT,
  completed BOOLEAN DEFAULT FALSE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);

-- Samples Library
CREATE TABLE samples (
  id INTEGER PRIMARY KEY,
  name TEXT,
  path TEXT,
  category TEXT,
  tags TEXT,
  bpm INTEGER,
  key TEXT);

-- Presets
CREATE TABLE presets (
  id INTEGER PRIMARY KEY,
  name TEXT,
  synth_name TEXT,
  category TEXT,
  settings_json TEXT);

-- AI Conversations
CREATE TABLE ai_messages (
  id INTEGER PRIMARY KEY,
  project_id INTEGER,
  role TEXT,
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
```

---

## 5. Feature Roadmap (Gefaseerd)

### Fase 1: Foundation
- [ ] Tauri project scaffolding + React
- [ ] Basis layout met sidebar
- [ ] AI Chat interface (lokaal Ollama)
- [ ] Cloud API configuratie (env var)
- [ ] Guide Mode: phase-based flow
- [ ] SQLite integratie

### Fase 2: Music Tools
- [ ] BPM/Key Detector (audio analyse via Rust)
- [ ] Theory Helper (chord grids, scales)
- [ ] Audio Analyzer (spectrum FFT)

### Fase 3: Content & Management
- [ ] Sample Browser (+ import)
- [ ] Preset Manager (+ import)
- [ ] Reference Track analyzer

### Fase 4: Extra
- [ ] Progress Tracker
- [ ] Feedback AI
- [ ] Genre Guides
- [ ] Project exporteren

---

## 6. Technische Architectuur

```
src-tauri/
├── src/
│   ├── main.rs         # Entry point
│   ├── commands/       # Tauri commands
│   │   ├── ai.rs       # AI/LLM handling
│   │   ├── audio.rs    # BPM/Key detection
│   │   ├── db.rs       # SQLite operations
│   │   └── files.rs    # File management
│   └── lib.rs
src/
├── components/         # React components
├── hooks/             # Custom hooks
├── pages/             # Page views
├── services/          # API calls
├── stores/            # State management
├── styles/           # CSS/design
└── types/             # TypeScript types
```

---

## 7. AI Integratie

```typescript
// Hybrid AI provider
type AIProvider = 'ollama' | 'cloud' | 'auto';

interface AIConfig {
  provider: AIProvider;
  model?: string;        // voor lokaal: "llama3", etc.
  apiKey?: string;      // voor cloud
  baseUrl?: string;     // voor custom endpoints
}
```

---

## 8. Development Workflow

1. **Setup**: `npm create tauri-app@latest`
2. **Dev**: `npm run tauri dev`
3. **Build**: `npm run tauri build`
4. **Test**: Playwright/E2E tests