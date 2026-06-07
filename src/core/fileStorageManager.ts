import type { Note } from "./note.js";

export interface NotesSnapshot {
  notes: Note[];
  version: number;
}

/** Persists and loads note snapshots (implementation provided by adapters). */
export class FileStorageManager {
  constructor(private readonly read: () => Promise<NotesSnapshot>, private readonly write: (data: NotesSnapshot) => Promise<void>) {}

  async load(): Promise<NotesSnapshot> {
    return this.read();
  }

  async save(data: NotesSnapshot): Promise<void> {
    await this.write(data);
  }
}
