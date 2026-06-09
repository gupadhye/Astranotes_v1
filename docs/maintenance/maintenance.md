# Maintenance Notes

## Routine maintenance

| Task | Frequency | Command / action |
|------|-----------|------------------|
| Dependency updates | Monthly or per security advisory | `npm outdated`, review, `npm update` |
| Run tests before release | Every change | `npm test && npm run typecheck` |
| Verify desktop build | Before submission/release | `npm run build && npm start` |

## Backup and recovery

**User data** lives outside the repo:

- Back up `notes.json` and `vault.json` from the app user data directory.
- If `notes.json` is corrupt, the app starts with an empty list (data loss unless backup exists).
- Secure notes require the vault password to decrypt; back up `vault.json` with `notes.json`.

## Known limitations

1. **Refresh** reloads in-memory notes only; does not re-read disk if file changed externally.
2. **Duplicate titles** are allowed; search returns all matches.
3. **Duplicate IDs** on load are deduped (first wins) to avoid crash from hand-edited JSON.
4. **Python module** (`python/`) is a reference implementation; the desktop app uses TypeScript.

## Extensibility

| Change | Suggested location |
|--------|-------------------|
| New validation rule | `src/core/validationService.ts` + tests |
| New note field | `src/core/note.ts`, snapshot version migration in `NoteService` |
| New storage backend | New adapter in `src/adapters/`, wire in `src/ui/app.ts` |
| UI feature | `src/ui/shell.ts`, `src/styles/shell.css` |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Electron `app` undefined | Unset `ELECTRON_RUN_AS_NODE`; use `npm run dev` |
| Port 5173 in use | Kill stale Vite: `lsof -ti :5173 \| xargs kill -9` |
| Vault shows "Set up" after restart | Ensure `vault.json` exists in user data dir (Electron desktop path) |
| Secure note shows dots | Unlock vault from header button |

## Technical debt (acceptable for coursework)

- No E2E UI automation.
- No formal snapshot schema migration beyond `version: 1`.
- No installer packaging in repo.
