# Requirements-to-UML Traceability Matrix

Source artifact: [`../artifacts/traceability/Requirements-to-UML Traceability Matrix .docx`](../artifacts/traceability/Requirements-to-UML%20Traceability%20Matrix.docx)

This matrix updates the course traceability document against the **final implementation** (quarter-end prototype).

## Functional requirements

| ID | Requirement | Class / code evidence | Use case / activity | Deployment | Status |
|----|-------------|----------------------|---------------------|------------|--------|
| FR-1 | Create note (valid title/content, no duplicate IDs) | `NoteService.createNote`, `ValidationService`, `NoteRepository.hasId`, dedupe on load | Create → validate → save → success/error message | `notes.json` via `nodeJsonFileStorage` | **Fully traced** |
| FR-2 | View all notes; empty message | `NoteService.listNotes`, `shell.ts` `updateWorkspace`, "No notes available" | View notes list in sidebar | Load from `notes.json` at startup | **Fully traced** |
| FR-3 | Retrieve by title or ID; multiple matches; not found error | `NoteRepository.findByTitle`, `NoteService.findNotes`, sidebar search UI | Search → filter list → feedback | In-memory search over loaded notes | **Fully traced** |
| FR-4 | Update by selection; non-empty fields | `NoteService.updateNote`, list click → form, `validateNotePatch` | Select note → edit → Update → save | Atomic write to `notes.json` | **Fully traced** |
| FR-5 | Delete by selection; error if missing | `NoteService.deleteNote`, Delete button | Select → Delete → confirm via message | Remove from snapshot, persist | **Fully traced** |
| FR-6 | Local file load/save; empty if missing | `FileStorageManager`, `nodeJsonFileStorage` ENOENT/parse fallback, `loadStartup` | App start → load notes | `~/Library/Application Support/astranotes/notes.json` (macOS) | **Fully traced** |
| FR-7 | Secure notes (extended) | `VaultService`, `secureNoteCrypto`, `isSecure`, `vault.json` | Unlock vault → create/edit secure note | Encrypted content in `notes.json`; vault metadata in `vault.json` | **Fully traced** |

## Non-functional requirements

| ID | Requirement | Evidence | Status |
|----|-------------|----------|--------|
| NFR-1 | Instant for ≤100 notes | In-memory `NoteRepository`; sorted list render | **Met** |
| NFR-2 | Success/error messages | `setFormMessage`, `setSidebarMessage`, `announce` | **Met** |
| NFR-3 | Validate before save | `ValidationService` on create/update | **Met** |
| NFR-4 | Storage errors no crash | Adapter try/catch, `loadStartup` fallback, UI try/catch | **Met** |
| NFR-5 | Save before replace | `persistSnapshot` then `applySnapshot` | **Met** |

## Traceability metrics (final)

| Metric | Count |
|--------|-------|
| Requirements reviewed | 13 (FR-1–FR-7, NFR-1–NFR-5, plus initial set) |
| Fully traced in implementation | 12 |
| Partially traced | 0 |
| Not traced | 0 |

## Gap analysis (course → final)

Gaps noted in the original matrix (search by title, delete error paths, note selection) are **closed** in the final prototype:

- Search by title with partial match and sidebar feedback.
- Delete/update not-found errors returned from `NoteService` and shown in UI.
- Note selection via sidebar list items with highlighted row.

Remaining limitations (documented in [security.md](../security/security.md) and [maintenance.md](../maintenance/maintenance.md)):

- Browser dev mode uses non-atomic `localStorage` writes.
- Refresh reloads in-memory state only (not a full disk reload).

## Short note

AI helped organize the matrix wording; final traceability status and gap closure were verified against the running Electron app and unit tests.
