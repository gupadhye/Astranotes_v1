import type { Note } from "./note.js";
import type { NotesSnapshot } from "./fileStorageManager.js";

export class NoteRepository {
  private notes: Note[] = [];

  getAll(): Note[] {
    return [...this.notes].sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  }

  findById(id: string): Note | undefined {
    return this.notes.find((n) => n.id === id);
  }

  findByTitle(title: string): Note[] {
    const needle = title.trim().toLowerCase();
    if (!needle) {
      return [];
    }
    const exact = this.notes.filter((n) => n.title.trim().toLowerCase() === needle);
    if (exact.length > 0) {
      return exact;
    }
    return this.notes.filter((n) => n.title.trim().toLowerCase().includes(needle));
  }

  hasId(id: string): boolean {
    return this.notes.some((n) => n.id === id);
  }

  replaceFromSnapshot(snapshot: NotesSnapshot): void {
    this.notes = dedupeById(snapshot.notes);
  }

  /** Replace in-memory state after a successful disk write. */
  applySnapshot(snapshot: NotesSnapshot): void {
    this.notes = [...snapshot.notes];
  }

  toSnapshot(version: number): NotesSnapshot {
    return { notes: [...this.notes], version };
  }

  addNote(note: Note): void {
    if (this.hasId(note.id)) {
      throw new Error(`A note with identifier "${note.id}" already exists.`);
    }
    this.notes.push(note);
  }
}

function dedupeById(notes: Note[]): Note[] {
  const seen = new Set<string>();
  const result: Note[] = [];
  for (const note of notes) {
    if (seen.has(note.id)) {
      continue;
    }
    seen.add(note.id);
    result.push(note);
  }
  return result;
}
