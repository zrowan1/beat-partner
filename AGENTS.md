# BeatPartner - AI Agent Instructies

## Project Context

BeatPartner is een Tauri 2.x desktop applicatie (React + TypeScript frontend, Rust backend) die muziekproducers begeleidt met AI-assistentie. Zie `PROJECT_PLAN.md` voor de volledige specificatie.

## Architectuur

- **Frontend**: React + TypeScript + Tailwind CSS + Zustand (state management)
- **Backend**: Rust (Tauri 2.x) + SQLite (rusqlite)
- **Styling**: Liquid Glass design systeem (donker thema, glasmorfisme)
- **AI**: Ollama (lokaal, primair) met cloud fallback (OpenAI/Anthropic)

## Code Conventies

### Taal
- **Code**: Engels (variabelen, functies, comments, commit messages)
- **Documentatie**: Nederlands (PROJECT_PLAN.md, gebruikersdocumentatie)
- **UI teksten**: Engels (interface labels, toasts, dialogs)

### TypeScript (Frontend)
- Strict mode aan (`strict: true` in tsconfig)
- Functionele React componenten met hooks (geen class components)
- Named exports (geen default exports)
- Types in aparte `types/` directory voor gedeelde types
- Zustand stores in `stores/` — elke store in eigen bestand
- Pad-aliassen: `@/` verwijst naar `src/`

### Rust (Backend)
- Gebruik `thiserror` voor error types, `anyhow` vermijden in library code
- Tauri commands in `src-tauri/src/commands/` — thin layer, delegeer naar services
- Business logic in `src-tauri/src/services/`
- Data models in `src-tauri/src/models/` met `serde::Serialize` + `serde::Deserialize`
- Gebruik `Result<T, BeatPartnerError>` als return type voor commands

### CSS / Styling
- Tailwind utility classes als primaire styling methode
- Custom CSS alleen voor Liquid Glass effecten die niet via Tailwind kunnen
- Geen inline styles tenzij dynamische waarden (bijv. berekende posities)
- Donker thema is standaard en enige thema

## Bestandsstructuur

```
src-tauri/
├── src/
│   ├── main.rs            # Entry point
│   ├── lib.rs             # Module exports
│   ├── error.rs           # BeatPartnerError enum
│   ├── commands/          # Tauri IPC commands (thin layer)
│   ├── services/          # Business logic
│   └── models/            # Rust data structs
├── migrations/            # SQLite migratie SQL bestanden

src/
├── components/
│   ├── ui/                # Herbruikbare UI primitives (Button, Card, Input)
│   ├── layout/            # Layout componenten (Sidebar, MainContent, StatusBar)
│   ├── liquid-glass/      # Liquid Glass specifieke componenten
│   └── features/          # Feature-specifieke componenten
├── hooks/                 # Custom React hooks
├── pages/                 # Page-level views
├── services/              # Tauri IPC client wrappers
├── stores/                # Zustand stores (appStore, projectStore, audioStore)
├── types/                 # Gedeelde TypeScript types
├── utils/                 # Pure helper functies
└── constants/             # App constanten
```

## Belangrijke Regels

1. **Geen users tabel** — dit is een single-user desktop app. Geen user_id foreign keys.
2. **AudioContext niet in Zustand** — browser AudioContext is niet serializable. Gebruik `useRef` of een singleton.
3. **currentProject leeft in projectStore** — niet dupliceren in andere stores.
4. **API keys via tauri-plugin-store** — nooit plain text opslaan.
5. **Migraties zijn forward-only** — geen rollbacks, schrijf een nieuwe migratie om te corrigeren.
6. **Stream AI responses** — altijd streaming gebruiken voor chat, nooit wachten op volledige response.
7. **Test op alle platforms** — backdrop-filter performance verschilt sterk per OS.

## Development Commands

```bash
npm install                # Dependencies installeren
npm run tauri dev          # Development server + Tauri window
npm run tauri build        # Production build
npm run lint               # ESLint
npm run typecheck          # TypeScript check
npm run format             # Prettier
npm run test               # Unit tests (Vitest)
npm run test:e2e           # E2E tests (Playwright)
cargo test                 # Rust unit + integration tests
```

## Git Conventies

- **Branch model**: `main` (production) / `develop` (integratie) / `feature/*` / `fix/*`
- **Commit messages**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **Pre-commit**: Husky draait lint + typecheck automatisch
