# Claude Superpowers

Curated, technology-aware skill installer for [Claude Code](https://claude.ai/code).

Instead of installing every skill blindly, **pick only what fits your stack** — web, mobile, backend, security, or just the essentials. **77 skills** from 5 source repositories, organized into 12 categories. Also supports **130 agent plugins** from 2 marketplaces.

## Quick Start

```bash
curl -fsSL https://raw.githubusercontent.com/dragolea/claude-superpowers/main/install.sh | sh
```

That's it. The interactive wizard walks you through project type, tech stack, and skill selection. No cloning or npm install required — just Node.js 18+.

## Presets

Skip the interactive wizard with `--preset`:

```bash
curl -fsSL https://raw.githubusercontent.com/dragolea/claude-superpowers/main/install.sh | sh -s -- --preset core
```

Available presets:

| Preset | Skills | Description |
|--------|--------|-------------|
| `core` | 4 | Debugging, TDD, verification |
| `workflow` | 10 | Core + planning & execution |
| `web` | 28 | Web stack + frameworks + design |
| `mobile` | 19 | Mobile frameworks + core |
| `mobile-expo` | 19 | React Native/Expo focused |
| `backend` | 25 | Server frameworks + databases |
| `fullstack` | 46 | Web + backend + languages |
| `devops` | 22 | Infrastructure + CI/CD |
| `security` | 17 | OWASP, static analysis, auditing |
| `documents` | 5 | PDF, Word, Excel, PowerPoint |
| `full` | 77 | Everything |

## Interactive Mode

Run without arguments for a guided experience:

1. **Project type** — Web, Mobile, Backend, CLI, or General
2. **Tech stack** — Framework-specific (React, Expo, Node.js, etc.)
3. **Skill categories** — Pick from 12 categories with smart pre-selection
4. **Per-skill picker** — Tag-based pre-selection, toggle individual skills
5. **Confirm** — Review selected skills, choose scope, then install

Skills are downloaded to `.claude/skills/` in your current directory.

## Other Commands

Pass any flag via `sh -s -- <flags>`:

```bash
curl -fsSL .../install.sh | sh -s -- --list            # Show all 77 skills with descriptions
curl -fsSL .../install.sh | sh -s -- --search          # Searchable multi-select picker
curl -fsSL .../install.sh | sh -s -- --search react    # Pre-filtered search
curl -fsSL .../install.sh | sh -s -- --update          # Re-download already installed skills
curl -fsSL .../install.sh | sh -s -- --scan            # Detect project tech stack
curl -fsSL .../install.sh | sh -s -- --help            # Full usage info
```

## Scope

Control where skills are installed:

```bash
curl -fsSL .../install.sh | sh -s -- --scope project   # .claude/ — shared with collaborators (default)
curl -fsSL .../install.sh | sh -s -- --scope user      # ~/.claude/ — available in all your projects
curl -fsSL .../install.sh | sh -s -- --scope local     # .claude/ + .gitignore — this repo only
```

## Agent Installation

Agents are installed as plugins from two marketplaces via the Claude CLI. **83 plugins** (~240 agents) from [VoltAgent](https://github.com/VoltAgent/awesome-claude-code-subagents) and [Claude Code Workflows](https://github.com/wshobson/agents).

```bash
curl -fsSL .../install.sh | sh -s -- --agents                        # Interactive wizard
curl -fsSL .../install.sh | sh -s -- --agents --preset core-dev      # Install a preset
curl -fsSL .../install.sh | sh -s -- --agents --preset fullstack     # Core + languages + quality + DX
curl -fsSL .../install.sh | sh -s -- --agents --search               # Search & pick individual plugins
curl -fsSL .../install.sh | sh -s -- --agents --search kubernetes    # Pre-filtered search
curl -fsSL .../install.sh | sh -s -- --agents --list                 # List all plugins by category
curl -fsSL .../install.sh | sh -s -- --agents --update               # Update installed plugins
```

> **Note:** Agent installation requires the Claude CLI (`npm install -g @anthropic-ai/claude-code`).

### Agent Presets

```bash
curl -fsSL .../install.sh | sh -s -- --agents --preset core-dev     # Frontend, backend, fullstack, API, mobile
curl -fsSL .../install.sh | sh -s -- --agents --preset web          # Core + language specialists
curl -fsSL .../install.sh | sh -s -- --agents --preset backend      # Core + languages + infrastructure
curl -fsSL .../install.sh | sh -s -- --agents --preset fullstack    # Core + languages + quality + DX
curl -fsSL .../install.sh | sh -s -- --agents --preset devops       # Infrastructure + quality + orchestration
curl -fsSL .../install.sh | sh -s -- --agents --preset security     # Quality/security + infrastructure
curl -fsSL .../install.sh | sh -s -- --agents --preset full         # Everything
```

### Agent Categories

| Category | Agents | Highlights |
|----------|--------|------------|
| **Core Development** | 10 | fullstack-developer, backend-developer, frontend-developer, mobile-developer |
| **Language Specialists** | 26 | TypeScript, Python, Rust, Go, Java, C#, Swift, PHP, Elixir, PowerShell |
| **Infrastructure** | 16 | DevOps, Docker, Kubernetes, Terraform, SRE, cloud, networking |
| **Quality & Security** | 14 | code-reviewer, security-auditor, penetration-tester, chaos-engineer |
| **Data & AI** | 12 | ML engineer, data scientist, LLM architect, NLP, MLOps |
| **Developer Experience** | 13 | build-engineer, CLI, documentation, git workflows, refactoring |
| **Specialized Domains** | 12 | blockchain, embedded, fintech, gaming, IoT, payments |
| **Business & Product** | 11 | product-manager, scrum-master, technical-writer, UX researcher |
| **Meta & Orchestration** | 10 | multi-agent-coordinator, workflow-orchestrator, task-distributor |
| **Research & Analysis** | 6 | competitive-analyst, market-researcher, trend-analyst |

## Skill Categories

| Category | Count | Highlights |
|----------|-------|------------|
| **Core** | 4 | systematic-debugging, TDD, verification, property-based-testing |
| **Workflow** | 6 | brainstorming, writing-plans, executing-plans, parallel agents |
| **Git & Code Review** | 5 | worktrees, code review, branch management, differential review |
| **Web Development** | 7 | webapp-testing, React, Next.js, Vue, Angular, Playwright |
| **Mobile Development** | 4 | React Native/Expo, Flutter, Swift, Kotlin |
| **Backend & API** | 11 | NestJS, Django, FastAPI, Rails, Laravel, Spring Boot, GraphQL, MCP |
| **Languages** | 7 | TypeScript, Python, Go, Rust, Java, C++, C# |
| **DevOps & Infra** | 6 | CI/CD, Kubernetes, Terraform, cloud, SRE, monitoring |
| **Security** | 13 | OWASP, Semgrep, variant analysis, insecure defaults, APK scanning |
| **Design & Creative** | 6 | frontend-design, algorithmic art, theming, canvas |
| **Documents** | 5 | PDF, Word, Excel, PowerPoint, internal comms |
| **Meta** | 3 | skill creation guides, superpowers system intro |

## Skill Sources

Skills are fetched from their original repositories at install time:

| Source | Count | Focus |
|--------|-------|-------|
| [obra/superpowers](https://github.com/obra/superpowers) | 14 skills | Development workflow — debugging, TDD, planning, code review |
| [anthropic/skills](https://github.com/anthropics/skills) | 16 skills | Official Anthropic — documents, design, testing, MCP |
| [jeffallan/claude-skills](https://github.com/jeffallan/claude-skills) | 30 skills | Fullstack — frameworks, languages, DevOps |
| [trailofbits/skills](https://github.com/trailofbits/skills) | 16 skills | Security — static analysis, vulnerability detection, auditing |
| [agamm/claude-code-owasp](https://github.com/agamm/claude-code-owasp) | 1 skill | OWASP Top 10:2025, ASVS 5.0 |

## Local Development

If you want to contribute or run from source:

```bash
git clone https://github.com/dragolea/claude-superpowers.git
cd claude-superpowers
npm install
npm run build
node dist/bin.js          # Run the installer
```

## Adding Skills

See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for how to:
- Add a skill from an existing repository
- Add a new source repository
- Create custom skills

## Requirements

- Node.js 18+ (already required by [Claude Code](https://docs.anthropic.com/en/docs/claude-code/overview))

## License

MIT
