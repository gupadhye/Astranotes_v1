# Deployment Notes

## Prerequisites

- **Node.js 20+**
- **npm 9+**
- macOS, Windows, or Linux for Electron desktop build

## Development deployment

```bash
git clone https://github.com/gupadhye/Astranotes_v1.git
cd Astranotes_v1
npm install
npm run dev        # Electron + Vite hot reload
```

## Production build

```bash
npm run build      # esbuild electron + tsc + vite build
npm start          # Electron loads dist/index.html
```

Output:

| Path | Contents |
|------|----------|
| `dist/` | Vite renderer bundle |
| `dist-electron/` | Bundled `main.cjs` and `preload.cjs` |

## Runtime data paths

| Platform | Notes file | Vault file |
|----------|------------|------------|
| macOS | `~/Library/Application Support/astranotes/notes.json` | `.../vault.json` |
| Windows | `%APPDATA%/astranotes/notes.json` | `.../vault.json` |
| Linux | `~/.config/astranotes/notes.json` | `.../vault.json` |

## Distribution options (future)

The current repo ships source + build scripts. For end-user distribution consider:

- **electron-builder** — `.dmg` (macOS), `.exe` (Windows), `.AppImage` (Linux)
- Code signing (Apple Developer ID, Windows Authenticode)
- Auto-update channel (electron-updater)

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_DEV_SERVER_URL` | Set by `npm run dev` for Electron to load Vite dev server |
| `ELECTRON_RUN_AS_NODE` | Must **not** be set (scripts unset it on macOS/Linux) |

## CI suggestion

```bash
npm ci
npm run typecheck
npm test
npm run build
```

## Web-only mode (development)

```bash
npm run dev:web
```

Uses browser `localStorage` — suitable for UI development, **not** for production desktop persistence parity.
