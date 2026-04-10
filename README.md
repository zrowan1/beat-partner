# BeatPartner

A desktop companion for music producers that guides beginners through the music production process with AI assistance. Runs alongside any DAW.

![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Tauri](https://img.shields.io/badge/Tauri-2.x-ffc107)

## Features

- **AI Copilot** - Chat with local (Ollama) or cloud AI models (OpenAI, Anthropic) for music production guidance
- **Production Guides** - Step-by-step workflow guidance through the production process
- **BPM & Key Detection** - Automatic audio analysis for tempo and musical key
- **Theory Helper** - Chord grids, scales viewer, and harmonic relationships
- **Sample Browser** - Organize and search your sample library with metadata
- **Preset Manager** - Manage synthesizer presets across multiple synths
- **Project Tracking** - Track progress through production phases

## Design

BeatPartner features a **Liquid Glass** design inspired by iOS 26's aesthetic:

- Frosted glass effects with layered backdrop blur
- Dark theme optimized for studio environments
- Subtle animations and micro-interactions
- Clean, distraction-free interface

## Tech Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Framework | [Tauri 2.x](https://tauri.app/)   |
| Frontend  | React 19 + TypeScript             |
| Styling   | Tailwind CSS                      |
| State     | Zustand                           |
| Backend   | Rust                              |
| Database  | SQLite (rusqlite)                 |
| AI        | Ollama (local), OpenAI, Anthropic |

## Prerequisites

### For Development

- **Node.js** 18+
- **Rust** 1.70+
- **Ollama** (for local AI, optional)

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.2
```

### For Building

- Xcode Command Line Tools (macOS)
- Windows SDK (Windows)
- GCC/Clang (Linux)

## Installation

### From Source

```bash
# Clone the repository
git clone https://github.com/your-org/beat-partner.git
cd beat-partner

# Install dependencies
npm install

# Run development server
npm run tauri dev
```

### From Release

Download the latest release for your platform from the [Releases](https://github.com/your-org/beat-partner/releases) page.

## Development

### Commands

```bash
# Start development server
npm run tauri dev

# Build for production
npm run tauri build

# Frontend only
npm run dev          # Dev server
npm run build        # Production build

# Code quality
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run format       # Prettier

# Rust
cargo build          # Build Rust backend
cargo test           # Run Rust tests
cargo clippy         # Lint Rust code
```

### Project Structure

```
beat-partner/
├── src/                      # React frontend
│   ├── components/           # UI components
│   │   ├── ui/              # Primitives (Button, Card, Input)
│   │   ├── layout/          # Layout (Sidebar, MainContent)
│   │   ├── liquid-glass/    # Liquid Glass components
│   │   └── features/        # Feature components
│   ├── hooks/               # Custom React hooks
│   ├── pages/               # Page views
│   ├── services/            # Tauri IPC clients
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript types
│   └── constants/            # App constants
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── main.rs          # Entry point
│   │   ├── lib.rs           # Module exports
│   │   ├── error.rs         # Error types
│   │   ├── commands/        # Tauri IPC commands
│   │   ├── services/        # Business logic
│   │   └── models/         # Data models
│   └── migrations/         # SQLite migrations
└── AGENTS.md                # AI agent instructions
```

## Architecture

### State Management

Three Zustand stores manage application state:

- **`appStore`** - UI state (active view, sidebar, chat panel)
- **`projectStore`** - Project data (projects, current project, phase)
- **`audioStore`** - Audio analysis results

### Tauri Commands

Thin IPC layer delegating to services:

| Command      | Purpose                   |
| ------------ | ------------------------- |
| `ai_*`       | AI chat, model management |
| `audio_*`    | BPM/key detection         |
| `db_*`       | Database operations       |
| `projects_*` | Project CRUD              |
| `files_*`    | File system access        |

### Database

SQLite with migrations stored in `src-tauri/migrations/`. Key tables:

- `projects` - Music projects
- `progress` - Phase completion tracking
- `samples` - Sample library metadata
- `presets` - Synthesizer presets
- `ai_messages` - Chat history
- `settings` - Key-value app preferences

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run linting: `npm run lint && npm run typecheck`
5. Commit using conventional commits: `git commit -m "feat: add new feature"`
6. Push and open a pull request

### Code Conventions

- **Language**: English for code, comments, and commit messages
- **Types**: Separate `types/` directory for shared types
- **Exports**: Named exports (no default exports)
- **Rust**: Use `thiserror` for errors, `Result<T, BeatPartnerError>` return types

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Built with [Tauri](https://tauri.app/), [React](https://react.dev/), and [Zustand](https://zustand-demo.pmnd.rs/).
