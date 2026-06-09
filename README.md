# AstraNotes

A local-first desktop notes application built with **Electron**, **TypeScript**, and **Vite**. Create, search, update, and delete notes persisted to **`notes.json`**. Optional **secure notes** encrypt content at rest with a vault password.

**Author:** gupadhye · **Repository:** [github.com/gupadhye/Astranotes_v1](https://github.com/gupadhye/Astranotes_v1)

---

## Features

- Create, list, search (by title), update, and delete notes
- Input validation (non-empty title and content)
- Success and error feedback for every action
- Local JSON persistence with safe save (write before updating memory)
- Optional secure notes (AES-GCM encryption + vault)
- 29 automated unit tests (Vitest)

---

## Quick start

### Prerequisites

- **Node.js 20+**
- **npm 9+**

### Install and run (desktop)

```bash
git clone https://github.com/gupadhye/Astranotes_v1.git
cd Astranotes_v1
npm install
npm run dev
```

This builds the Electron main process, starts Vite at `http://localhost:5173`, and opens the desktop window.

### Other commands

| Command | Description |
|---------|-------------|
| `npm run dev` / `npm run desktop` | Development desktop app |
| `npm run dev:web` | Browser-only (localStorage; no disk file) |
| `npm run build` | Production build (`dist/` + `dist-electron/`) |
| `npm start` | Run built desktop app |
| `npm test` | Run unit tests |
| `npm run typecheck` | TypeScript check |

---

## Usage

### Notes

1. Click **+ New note**, enter title and content, click **Save note**.
2. Click a note in the sidebar to select and edit it; click **Update note**.
3. With a note selected, click **Delete**.
4. Use **Search by title** in the sidebar → **Find** (Enter also works) → **Clear** to reset.

### Secure notes

1. Click **Set up vault** (or **Unlock vault**) in the header and enter a password (min 4 characters).
2. Check **Secure note** when creating or editing; content is encrypted on disk.
3. Click **Lock vault** to hide secure content until you unlock again.

### Where data is stored (desktop)

| File | Location (macOS) |
|------|------------------|
| Notes | `~/Library/Application Support/astranotes/notes.json` |
| Vault metadata | `~/Library/Application Support/astranotes/vault.json` |

The vault file stores salt and verifier only — **not** your password.

---

## Project structure

```
Astranotes_v1/
├── electron/          Electron main process + preload (IPC)
├── src/
│   ├── core/          Domain: Note, service, repository, validation, vault
│   ├── adapters/      File, IPC, browser storage adapters
│   ├── ui/            Shell UI and app bootstrap
│   └── styles/        CSS
├── test/              Vitest unit tests
├── python/            Reference Python domain module
└── docs/              Requirements, UML, traceability, testing, security, deployment
```

---

## Documentation (quarter deliverables)

Full package index: **[docs/README.md](docs/README.md)**

| Category | Key documents |
|----------|---------------|
| Planning | [Working Agreement](docs/planning/working-agreement.md), [Definition of Done](docs/planning/definition-of-done.md) |
| Requirements | [Initial](docs/requirements/initial-requirements.md), [Refined](docs/requirements/refined-requirements.md) |
| Architecture | [Overview](docs/architecture/overview.md), [UML diagrams (Word)](docs/artifacts/uml/UML%20diagrams%20.docx) |
| Traceability | [Matrix](docs/traceability/traceability-matrix.md), [Validation](docs/validation/validation-summary.md) |
| Testing | [Testing guide](docs/testing/testing.md) |
| Security | [Security notes](docs/security/security.md) |
| Deployment | [Deployment](docs/deployment/deployment.md) |
| Maintenance | [Maintenance](docs/maintenance/maintenance.md) |

Original Word submissions are preserved under **`docs/artifacts/`**.

---

## Testing

```bash
npm test
```

Covers validation, CRUD, search, safe-save, secure notes, and cryptography (29 tests).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ELECTRON_RUN_AS_NODE` / `app` undefined | Run via `npm run dev` (scripts unset the variable on macOS/Linux) |
| Port 5173 in use | Stop other dev servers or run `lsof -ti :5173 \| xargs kill -9` |
| DevTools opening automatically | Removed in current `electron/main.ts` |
| Vault resets to "Set up" | Use desktop app (not web-only); vault persists to `vault.json` |

---

## License

Course project — see instructor guidelines for usage and submission.
