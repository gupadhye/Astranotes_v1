# Testing Artifacts

## Test framework

- **Runner:** Vitest (`vitest.config.ts`)
- **Command:** `npm test`

## Test files

| File | Coverage |
|------|----------|
| `test/validationService.test.ts` | Title/content empty and whitespace rejection; `validateNotePatch` |
| `test/noteService.test.ts` | Create, update, delete, search, safe-save on write failure, secure notes, duplicate ID |
| `test/secureNoteCrypto.test.ts` | PBKDF2 key derive, AES-GCM encrypt/decrypt, vault verifier |

## Key scenarios covered

### Validation
- Empty and whitespace-only title/content rejected on create and update.

### CRUD + persistence
- Create persists to mock storage.
- Update and delete succeed when note exists.
- Update/delete return error when note missing.
- Save failure does not mutate in-memory repository (NFR-5).

### Search
- Exact and partial title match.
- Multiple notes with same title returned.

### Secure notes
- Secure create blocked when vault locked.
- Content encrypted at rest when vault unlocked.
- Content masked when vault locked after create.

### Cryptography
- Round-trip encrypt/decrypt.
- Wrong password fails verifier check.

## Manual test plan (desktop)

1. **Create** — Enter title + content → Save → note appears in sidebar → "Note saved."
2. **Empty validation** — Blank title → error message.
3. **List** — Delete all notes → "No notes available."
4. **Search** — Partial title → matching notes in sidebar → "Found N note(s)."
5. **Update** — Select note → edit → Update → "Note updated."
6. **Delete** — Select note → Delete → "Note deleted."
7. **Persistence** — Quit app → restart → notes still present (`notes.json`).
8. **Vault** — Set up vault → create secure note → lock vault → content masked → unlock → content visible.

## Not covered (out of scope)

- End-to-end automated UI tests (Playwright/Cypress).
- Load testing beyond 100 notes.
- Cross-platform installer QA.
