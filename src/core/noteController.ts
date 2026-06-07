import type { Note } from "./note.js";
import type { NoteService, NoteActionResult, NotesActionResult, VoidActionResult } from "./noteService.js";

/** Thin adapter between UI and NoteService. */
export class NoteController {
  constructor(private readonly notes: NoteService) {}

  async viewNotes(): Promise<Note[]> {
    return this.notes.listNotes();
  }

  async createNote(title: string, content: string, isSecure = false): Promise<NoteActionResult> {
    return this.notes.createNote(title, content, isSecure);
  }

  async updateNote(id: string, title: string, content: string, isSecure = false): Promise<NoteActionResult> {
    return this.notes.updateNote(id, title, content, isSecure);
  }

  async deleteNote(id: string): Promise<VoidActionResult> {
    return this.notes.deleteNote(id);
  }

  async getNoteById(id: string): Promise<NoteActionResult> {
    return this.notes.getNoteById(id);
  }

  async findNotes(query: string): Promise<NotesActionResult> {
    return this.notes.findNotes(query);
  }

  hasVault(): boolean {
    return this.notes.hasVault();
  }

  isVaultUnlocked(): boolean {
    return this.notes.isVaultUnlocked();
  }

  lockVault(): void {
    this.notes.lockVault();
  }

  async unlockVault(password: string): Promise<VoidActionResult> {
    return this.notes.unlockVault(password);
  }
}
