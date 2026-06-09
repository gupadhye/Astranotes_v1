# Connecting Design to Prototype / Implementation

Source artifact: [`../artifacts/design/Connecting design to prototype or implementation.docx`](../artifacts/design/Connecting%20design%20to%20prototype%20or%20implementation.docx)

## Chosen direction

**TypeScript + Electron** desktop application with Vite for the renderer.

## Project structure (as built)

| Area | Path | Role |
|------|------|------|
| Desktop shell | `electron/` | Window, menu, IPC, `notes.json` and `vault.json` IO |
| Domain | `src/core/` | Note model, repository, service, validation, vault |
| Adapters | `src/adapters/` | Electron IPC, Node file IO, browser fallbacks |
| UI | `src/ui/` | Sidebar list, editor, search, vault modal |
| Tests | `test/` | Vitest for validation, service, crypto |

## UI (current)

- **Header:** app name, vault lock/unlock status.
- **Sidebar:** New note, search by title, note list with selection.
- **Main area:** title + content editor, secure note toggle, Save / Update / Delete / Refresh.
- **Empty state:** subtle centered hint when no note is selected.

## Implementation mapping (requirements → code)

| Requirement | Implementation |
|-------------|----------------|
| FR-1 Create | `NoteService.createNote`, `ValidationService`, UI Save button |
| FR-2 List | `NoteService.listNotes`, sidebar `data-note-list`, empty message |
| FR-3 Search | `NoteService.findNotes`, sidebar search + Find/Clear |
| FR-4 Update | Select list item → `NoteService.updateNote` |
| FR-5 Delete | `NoteService.deleteNote`, Delete button |
| FR-6 Persist | `nodeJsonFileStorage`, IPC `notes:load` / `notes:save` |
| NFR-5 Safe save | Snapshot built before `applySnapshot` |
| FR-7 Secure | `VaultService`, `secureNoteCrypto`, `isSecure` on `Note` |

## AI reflection

AI assisted with project structure, Electron/Vite wiring, and debugging. All design choices were verified by running the app, reading `NoteService` and `electron/main.ts`, and aligning behavior with refined requirements.
