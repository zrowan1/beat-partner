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
- **Alle structs die naar de frontend worden gestuurd MOETEN `#[serde(rename_all = "camelCase")]` hebben** — TypeScript interfaces gebruiken camelCase, Rust structs snake_case. Zonder deze attribuut worden velden zoals `use_cases` niet herkend als `useCases` in TypeScript, wat een runtime crash veroorzaakt.
- Enums die naar de frontend worden gestuurd als string waarden gebruiken `#[serde(rename_all = "kebab-case")]` zodat ze overeenkomen met de TypeScript union types (bijv. `SoundDesign` → `"sound-design"`)

### CSS / Styling
- Tailwind utility classes als primaire styling methode
- **ALTIJD gebruik maken van Liquid Glass CSS classes** — zie Design System sectie
- Geen inline styles tenzij dynamische waarden (bijv. berekende posities)
- Donker thema is standaard en enige thema

## Design System — Liquid Glass

### Vereiste CSS Classes
Gebruik deze classes voor consistente styling:

**Containers & Panels:**
- `.glass-background` — Hoofd panels, status bars (hoogste blur laag)
- `.glass-card` — Cards, dialogs, sidebars (medium blur + gloss)
- `.glass-gloss` — Extra glans overlay (combineer met glass-card)

**Interactieve Elementen:**
- `.glass-interactive` — Buttons, list items, clickable cards
- `.glass-interactive.active` — Actieve geselecteerde state
- `.btn-glass` — Basis button styling
- `.btn-glass-primary` — Primaire actie button (cyan accent)

### Kleuren Schema
```css
/* Surface (achtergronden) */
--surface-primary: #020204    /* Diepste zwart */
--surface-secondary: #08080c  /* Secundair */
--surface-tertiary: #0f0f14   /* Lichter */

/* Accenten */
--accent-cyan: #22d3ee
--accent-purple: #a78bfa
--accent-magenta: #f472b6

/* Glas effecten */
--glass-bg: rgba(255,255,255,0.08)
--glass-bg-hover: rgba(255,255,255,0.14)
--glass-border: rgba(255,255,255,0.12)
--glass-border-hover: rgba(255,255,255,0.18)
```

### Layout Patterns
```tsx
// App layout met achtergrond diepte
<div className="bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-tertiary">
  {/* Blur blobs voor diepte */}
  <div className="fixed inset-0 pointer-events-none">
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-[120px]" />
    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-cyan/10 rounded-full blur-[100px]" />
  </div>
  
  {/* Content */}
  <div className="relative z-10">
    <TitleBar />
    <div className="flex gap-4 p-4">
      <Sidebar />
      <MainContent />
    </div>
  </div>
</div>

// Card met gloss
<div className="glass-card glass-gloss p-4">
  Content hier
</div>

// Interactief element
<button className="glass-interactive px-4 py-2">
  Label
</button>

// Actief element
<button className="glass-interactive active px-4 py-2">
  Selected
</button>
```

### Iconen
- Gebruik **Lucide React** voor alle iconen
- Standaard size: 18px voor buttons, 20-24px voor headers
- Standaard strokeWidth: 1.5 (2 voor actieve states)
- Iconen in containers: 40-48px container met glass-achtige achtergrond

### Typografie
- **Labels**: 11px, text-white/40-60% (meta info)
- **Body**: 13px, text-white/80-90% (hoofd tekst)
- **Headings**: 15px, font-medium (sectie titels)
- **Titles**: 20px, font-semibold (pagina titels)
- **Monospace**: Altijd voor data (BPM, key, timestamps)

### Spacing
- Gap tussen panels: `gap-4` (16px)
- Padding in panels: `p-4` (16px) of `p-6` (24px) voor dialogs
- Kleinere gaps in lists: `gap-3` (12px)
- Border radius: `rounded-xl` (12px) of `rounded-2xl` (16px) voor cards

### Transitions
- Standaard hover: `transition-all duration-200`
- Spring easing voor interacties: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- Smooth easing: `cubic-bezier(0.4, 0, 0.2, 1)`

### Modals & Dialogs

> **WKWebView compositor bug**: `backdrop-filter` op een element dat zich binnen een `position: fixed` full-screen overlay bevindt, zorgt in Tauri (WKWebView op macOS) voor een volledig zwart scherm. Dit is een bekende WebKit-bug.

**Regels voor elke modal of dialog:**
1. Gebruik **`createPortal(…, document.body)`** — render altijd buiten de component tree zodat geen enkel CSS stacking context of containing block interfereert
2. De **outer overlay** (`fixed inset-0`) gebruikt `bg-black/75` — geen `backdrop-filter`/`backdrop-blur-*`
3. De **inner card** gebruikt een solid achtergrond (`style={{ background: "#0f0f14" }}` of een surface kleur) — **geen `glass-card`** op de modal container zelf
4. Binnenste elementen (lijsten, info-kaarten) mogen `glass-card` en `glass-interactive` wél gebruiken

```tsx
// ✅ Correct modal patroon
return createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75">
    <div
      className="w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl"
      style={{ background: "#0f0f14" }}
    >
      {/* inner content mag glass-* gebruiken */}
    </div>
  </div>,
  document.body
);

// ❌ Fout — veroorzaakt zwart scherm in Tauri
return (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
    <div className="glass-card">...</div>
  </div>
);
```

### Wat te vermijden
❌ Platte achtergronden (`bg-white/[0.02]` zonder glass effect) — *buiten modals*  
❌ Simpele borders zonder backdrop-filter — *buiten modals*  
❌ Inline styles voor statische styling  
❌ Emoji als iconen (gebruik Lucide)  
❌ Te veel verschillende alpha waarden  
❌ `backdrop-blur-*` of `backdrop-filter` op full-screen overlays/modals  
❌ `glass-card` als container van een modal (gebruik solid achtergrond)  
❌ Modals renderen zonder `createPortal` — CSS stacking contexts in de app tree breken `z-index` en `position: fixed`

### Wat te doen
✅ Altijd `glass-*` classes gebruiken voor containers — *buiten modals*  
✅ Achtergrond blur blobs toevoegen voor diepte  
✅ Consistente spacing met gap-4 en p-4  
✅ Gloss overlay gebruiken voor premium feel  
✅ Hover states met lift effect (`translateY(-2px)`)  
✅ Lucide iconen met consistente sizing  
✅ `createPortal(…, document.body)` voor elke modal of dialog  
✅ Solid achtergrondkleur (`surface-tertiary` = `#0f0f14`) voor modal containers

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

## AI Model Management Conventies

### Hardware Detectie (Rust)
- Gebruik `sysinfo` crate voor cross-platform hardware detectie
- Apple Silicon detectie via `std::env::consts::ARCH` + `uname`
- Cache hardware info bij app startup, geen real-time monitoring
- Return serializable struct voor frontend

### Ollama Integratie
- **Ollama HTTP API** — gebruik directe HTTP calls naar `localhost:11434`, niet CLI
- **Streaming downloads** — gebruik Tauri's `Channel` voor progress updates
- **Model cache** — cache model lijst in SQLite, refresh elke 5 minuten
- **Default model** — fallback naar `llama3.2:latest` als beschikbaar

### Use-Case Suggesties
- Suggesties zijn **hints**, niet enforcements — gebruiker heeft altijd keuze
- Sla gebruikersvoorkeuren op in `model_preferences` tabel
- Update recommendations op basis van daadwerkelijk gebruik

### Error Handling
- Ollama niet running → duidelijke "Start Ollama" instructie
- Onvoldoende RAM → waarschuwing + alternatieve modellen tonen
- Download errors → retry logica met exponential backoff

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
