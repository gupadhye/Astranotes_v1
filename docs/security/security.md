# Security Notes

## Threat model (desktop notes app)

AstraNotes is a **local-first** desktop app. Primary concerns:

- Unauthorized reading of note content on disk.
- Vault password exposure.
- IPC boundary between renderer and main process.

## Secure notes feature

| Control | Implementation |
|---------|----------------|
| Encryption at rest | AES-256-GCM via Web Crypto API |
| Key derivation | PBKDF2 (120,000 iterations, SHA-256) from vault password + random salt |
| Password storage | **Never** persisted; session-only `CryptoKey` in memory |
| Vault verification | Encrypted verifier blob stored in `vault.json` (not the password) |
| Locked state | Secure note content shown as `••••••••` in UI and list previews |

## File locations (macOS example)

| File | Contents |
|------|----------|
| `~/Library/Application Support/astranotes/notes.json` | All notes (secure note content is ciphertext) |
| `~/Library/Application Support/astranotes/vault.json` | Salt + verifier only |

## Electron hardening

- `contextIsolation: true`
- `nodeIntegration: false`
- Preload exposes minimal IPC surface (`loadNotes`, `saveNotes`, `loadVault`, `saveVault`, menu events)

## Limitations

1. **Vault password recovery** — If the password is lost, secure note content cannot be decrypted.
2. **Browser dev mode** — `localStorage` vault metadata and non-atomic writes; use Electron for production-like security.
3. **No OS keychain integration** — Vault unlock is manual each session (by design for coursework scope).
4. **Titles are not encrypted** — Only note content is encrypted for secure notes; titles remain visible in the list.

## Recommendations for production hardening

- Integrate macOS Keychain / Windows Credential Manager for optional vault unlock persistence.
- Add optional OS-level full-disk encryption reminder in onboarding.
- Rate-limit vault unlock attempts.
- Audit log for secure note access (enterprise scenarios).
