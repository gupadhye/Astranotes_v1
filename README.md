# AstraNotes

**Desktop app** (Electron + Vite + TypeScript). Notes are persisted as **`notes.json`** via the Electron main process (not the browser). Vitest is used for unit tests.

### Run the desktop app

```bash
npm install
npm run dev
# same as: npm run desktop
```

## Prerequisites

- Node.js 20+ (recommended)

## Setup

```bash
npm install
```

## Scripts

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Builds Electron main/preload, starts Vite, opens the **desktop** window (loads `http://localhost:5173` in dev). |
| `npm run desktop` | Same as `npm run dev`. |
| `npm run dev:web` | Browser-only Vite dev server (uses localStorage; no `notes.json` on disk). |
| `npm run build` | Builds Electron bundles + Vite app into `dist-electron/` and `dist/`. |
| `npm start` | Runs Electron against a previous `npm run build` (loads `dist/index.html`). |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |

## Where data is stored

In the desktop app, `notes.json` lives under the OS app user data folder (e.g. macOS: `~/Library/Application Support/astranotes/notes.json`), not the project directory.

## Layout

```
electron/         # Main process + preload (IPC to read/write notes.json)
src/
  core/           # Domain + services
  adapters/       # Electron IPC, browser localStorage, Node file IO
  ui/             # Renderer (`mountApp`)
  styles/
test/
docs/
```

## Troubleshooting (Electron)

If you see `require('electron')` behaving like a **string path** or `app` is undefined, your environment may have **`ELECTRON_RUN_AS_NODE=1`** set (some tools do this). The npm scripts run Electron with `env -u ELECTRON_RUN_AS_NODE` on macOS/Linux so the real Electron APIs load. On Windows, clear that variable for the session before `npm run dev` if you hit the same issue.

## Language

This repo uses **TypeScript**.
