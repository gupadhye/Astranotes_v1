# AstraNotes documentation

- **UML / requirements**: Link your diagrams and traceability matrix here.
- **Architecture**: Core domain lives in `src/core`. UI in `src/ui`. Environment-specific IO in `src/adapters`.
- **Desktop vs web**: Run **`npm run dev`** for the Electron desktop app (IPC + `notes.json` under the OS user data directory). Use **`npm run dev:web`** for browser-only development (localStorage).
