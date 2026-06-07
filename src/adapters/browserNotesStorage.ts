import type { NotesSnapshot } from "@core/fileStorageManager";

const STORAGE_KEY = "astranotes:snapshot:v1";
const EMPTY_SNAPSHOT: NotesSnapshot = { notes: [], version: 1 };

/** Browser persistence (localStorage). Swap for Node/Electron file IO when targeting desktop. */
export function createBrowserNotesStorage(): {
  read: () => Promise<NotesSnapshot>;
  write: (data: NotesSnapshot) => Promise<void>;
} {
  return {
    async read() {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (!raw) {
        return { ...EMPTY_SNAPSHOT };
      }
      try {
        return JSON.parse(raw) as NotesSnapshot;
      } catch {
        return { ...EMPTY_SNAPSHOT };
      }
    },
    async write(data: NotesSnapshot) {
      try {
        globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch {
        throw new Error("Could not save notes to browser storage.");
      }
    },
  };
}
