import type { NotesSnapshot } from "@core/fileStorageManager";

const EMPTY_SNAPSHOT: NotesSnapshot = { notes: [], version: 1 };

/**
 * Reads/writes `notes.json` on disk (Node.js / Electron main process).
 * Do not import this module from browser bundles — use dynamic import from a Node entry only.
 */
export function createNodeJsonFileStorage(filePath: string): {
  read: () => Promise<NotesSnapshot>;
  write: (data: NotesSnapshot) => Promise<void>;
} {
  return {
    async read() {
      const fs = await import("node:fs/promises");
      try {
        const raw = await fs.readFile(filePath, "utf8");
        try {
          return JSON.parse(raw) as NotesSnapshot;
        } catch {
          return { ...EMPTY_SNAPSHOT };
        }
      } catch (err: unknown) {
        const code = typeof err === "object" && err && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
        if (code === "ENOENT") {
          return { ...EMPTY_SNAPSHOT };
        }
        throw new Error("Could not read notes file.");
      }
    },
    async write(data: NotesSnapshot) {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const tmp = `${filePath}.${process.pid}.tmp`;
      const payload = `${JSON.stringify(data, null, 2)}\n`;
      try {
        await fs.writeFile(tmp, payload, "utf8");
        await fs.rename(tmp, path.resolve(filePath));
      } catch {
        throw new Error("Could not write notes file.");
      }
    },
  };
}
