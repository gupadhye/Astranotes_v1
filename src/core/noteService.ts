import type { Note } from "./note.js";
import { SECURE_CONTENT_MASK } from "./note.js";
import type { NoteRepository } from "./noteRepository.js";
import type { FileStorageManager, NotesSnapshot } from "./fileStorageManager.js";
import { ValidationService } from "./validationService.js";
import { encryptText, decryptText } from "./secureNoteCrypto.js";
import type { VaultService } from "./vaultService.js";

const SNAPSHOT_VERSION = 1;

export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string };
export type NoteActionResult = { ok: true; note: Note } | { ok: false; message: string };
export type NotesActionResult = { ok: true; notes: Note[] } | { ok: false; message: string };
export type VoidActionResult = { ok: true } | { ok: false; message: string };

/** Domain orchestration for notes (create, list, persistence). */
export class NoteService {
  private readonly validation = new ValidationService();

  constructor(
    private readonly repo: NoteRepository,
    private readonly storage: FileStorageManager,
    private readonly vault: VaultService,
  ) {}

  async loadStartup(): Promise<void> {
    try {
      const snap = await this.storage.load();
      this.repo.replaceFromSnapshot(snap);
    } catch {
      this.repo.replaceFromSnapshot({ notes: [], version: SNAPSHOT_VERSION });
    }
  }

  hasVault(): boolean {
    return this.vault.hasVault();
  }

  isVaultUnlocked(): boolean {
    return this.vault.isUnlocked();
  }

  lockVault(): void {
    this.vault.lock();
  }

  async unlockVault(password: string): Promise<VoidActionResult> {
    return this.vault.unlock(password);
  }

  async listNotes(): Promise<Note[]> {
    const notes = this.repo.getAll();
    return Promise.all(notes.map((note) => this.toDisplayNote(note)));
  }

  async createNote(title: string, content: string, isSecure = false): Promise<NoteActionResult> {
    const titleCheck = this.validation.validateTitle(title);
    if (!titleCheck.ok) {
      return { ok: false, message: titleCheck.message };
    }
    const contentCheck = this.validation.validateContent(content);
    if (!contentCheck.ok) {
      return { ok: false, message: contentCheck.message };
    }

    if (isSecure) {
      const secureCheck = this.requireUnlockedVault();
      if (!secureCheck.ok) {
        return secureCheck;
      }
    }

    const now = new Date().toISOString();
    const trimmedContent = content.trim();
    const storedContent = isSecure ? await this.encryptForStorage(trimmedContent) : trimmedContent;

    const note: Note = {
      id: crypto.randomUUID(),
      title: title.trim(),
      content: storedContent,
      isSecure,
      createdAt: now,
      updatedAt: now,
    };

    const nextSnapshot = this.buildSnapshotWithNoteAdded(note);
    const saved = await this.persistSnapshot(nextSnapshot);
    if (!saved.ok) {
      return { ok: false, message: saved.message };
    }

    this.repo.applySnapshot(nextSnapshot);
    return { ok: true, note: await this.toDisplayNote(note) };
  }

  async updateNote(id: string, title: string, content: string, isSecure = false): Promise<NoteActionResult> {
    const patchCheck = this.validation.validateNotePatch({ title, content });
    if (!patchCheck.ok) {
      return { ok: false, message: patchCheck.message };
    }

    const existing = this.repo.findById(id);
    if (!existing) {
      return { ok: false, message: "No note found with that identifier." };
    }

    if (isSecure) {
      const secureCheck = this.requireUnlockedVault();
      if (!secureCheck.ok) {
        return secureCheck;
      }
    }

    const trimmedContent = content.trim();
    const storedContent = isSecure ? await this.encryptForStorage(trimmedContent) : trimmedContent;

    const updated: Note = {
      ...existing,
      title: title.trim(),
      content: storedContent,
      isSecure,
      updatedAt: new Date().toISOString(),
    };

    const nextSnapshot = this.buildSnapshotWithNoteUpdated(updated);
    const saved = await this.persistSnapshot(nextSnapshot);
    if (!saved.ok) {
      return { ok: false, message: saved.message };
    }

    this.repo.applySnapshot(nextSnapshot);
    return { ok: true, note: await this.toDisplayNote(updated) };
  }

  async deleteNote(id: string): Promise<VoidActionResult> {
    const existing = this.repo.findById(id);
    if (!existing) {
      return { ok: false, message: "No note found with that identifier." };
    }

    const nextSnapshot = this.buildSnapshotWithNoteRemoved(id);
    const saved = await this.persistSnapshot(nextSnapshot);
    if (!saved.ok) {
      return { ok: false, message: saved.message };
    }

    this.repo.applySnapshot(nextSnapshot);
    return { ok: true };
  }

  async getNoteById(id: string): Promise<NoteActionResult> {
    const note = this.repo.findById(id);
    if (!note) {
      return { ok: false, message: "No note found with that identifier." };
    }
    return { ok: true, note: await this.toDisplayNote(note) };
  }

  async findNotes(query: string): Promise<NotesActionResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { ok: false, message: "Enter a title to search." };
    }

    const byTitle = this.repo.findByTitle(trimmed);
    if (byTitle.length === 0) {
      return { ok: false, message: "No note found." };
    }

    const notes = await Promise.all(
      byTitle
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
        .map((note) => this.toDisplayNote(note)),
    );

    return { ok: true, notes };
  }

  private requireUnlockedVault(): NoteActionResult | { ok: true } {
    if (!this.vault.isUnlocked()) {
      return { ok: false, message: "Unlock the vault to work with secure notes." };
    }
    return { ok: true };
  }

  private async encryptForStorage(plaintext: string): Promise<string> {
    const key = this.vault.getKey();
    if (!key) {
      throw new Error("Vault is locked.");
    }
    return encryptText(plaintext, key);
  }

  private async toDisplayNote(note: Note): Promise<Note> {
    if (!note.isSecure) {
      return { ...note };
    }

    if (!this.vault.isUnlocked()) {
      return { ...note, content: SECURE_CONTENT_MASK };
    }

    try {
      const key = this.vault.getKey();
      if (!key) {
        return { ...note, content: SECURE_CONTENT_MASK };
      }
      const decrypted = await decryptText(note.content, key);
      return { ...note, content: decrypted };
    } catch {
      return { ...note, content: SECURE_CONTENT_MASK };
    }
  }

  private buildSnapshotWithNoteAdded(note: Note): NotesSnapshot {
    return { notes: [...this.repo.toSnapshot(SNAPSHOT_VERSION).notes, note], version: SNAPSHOT_VERSION };
  }

  private buildSnapshotWithNoteUpdated(updated: Note): NotesSnapshot {
    const notes = this.repo.toSnapshot(SNAPSHOT_VERSION).notes.map((n) => (n.id === updated.id ? updated : n));
    return { notes, version: SNAPSHOT_VERSION };
  }

  private buildSnapshotWithNoteRemoved(id: string): NotesSnapshot {
    const notes = this.repo.toSnapshot(SNAPSHOT_VERSION).notes.filter((n) => n.id !== id);
    return { notes, version: SNAPSHOT_VERSION };
  }

  private async persistSnapshot(snapshot: NotesSnapshot): Promise<VoidActionResult> {
    try {
      await this.storage.save(snapshot);
      return { ok: true };
    } catch {
      return { ok: false, message: "Could not save notes. Check disk space and permissions." };
    }
  }
}
