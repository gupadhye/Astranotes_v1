import type { NotesSnapshot } from "@core/fileStorageManager";

function getApi(): NonNullable<Window["electronAPI"]> {
  const api = globalThis.window?.electronAPI;
  if (!api) {
    throw new Error("Electron IPC API is not available. Run the desktop app with npm run dev.");
  }
  return api;
}

/** Persists notes via Electron main process (real notes.json on disk). */
export function createElectronIpcStorage(): {
  read: () => Promise<NotesSnapshot>;
  write: (data: NotesSnapshot) => Promise<void>;
} {
  return {
    async read() {
      return getApi().loadNotes();
    },
    async write(data: NotesSnapshot) {
      await getApi().saveNotes(data);
    },
  };
}
