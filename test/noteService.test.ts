import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoteRepository } from "../src/core/noteRepository.js";
import { FileStorageManager, type NotesSnapshot } from "../src/core/fileStorageManager.js";
import { NoteService } from "../src/core/noteService.js";
import { VaultService } from "../src/core/vaultService.js";
import { SECURE_CONTENT_MASK } from "../src/core/note.js";
import type { Note } from "../src/core/note.js";

const localStore: Record<string, string> = {};

function mockLocalStorage(): void {
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => localStore[key] ?? null,
    setItem: (key: string, value: string) => {
      localStore[key] = value;
    },
    removeItem: (key: string) => {
      delete localStore[key];
    },
  });
}

function createService(opts?: { writeFails?: boolean; initial?: Note[] }) {
  let stored: NotesSnapshot = { notes: opts?.initial ?? [], version: 1 };
  let vaultConfig: { salt: string; verifier: string } | null = null;
  const repo = new NoteRepository();
  const vault = new VaultService({
    load: async () => vaultConfig,
    save: async (config) => {
      vaultConfig = config;
    },
  });
  const storage = new FileStorageManager(
    async () => stored,
    async (data) => {
      if (opts?.writeFails) {
        throw new Error("write failed");
      }
      stored = data;
    },
  );
  const service = new NoteService(repo, storage, vault);
  return {
    service,
    repo,
    vault,
    getStored: () => stored,
    ready: async () => {
      await vault.init();
      await service.loadStartup();
    },
  };
}

beforeEach(() => {
  for (const key of Object.keys(localStore)) {
    delete localStore[key];
  }
  mockLocalStorage();
});

describe("NoteService", () => {
  it("creates a note and persists it", async () => {
    const { service, getStored, ready } = createService();
    await ready();

    const result = await service.createNote("Hello", "World");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.note.title).toBe("Hello");
      expect(result.note.content).toBe("World");
    }
    expect(getStored().notes).toHaveLength(1);
  });

  it("rejects empty title on create", async () => {
    const { service, ready } = createService();
    await ready();

    const result = await service.createNote("   ", "Body");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Title");
    }
  });

  it("rejects empty content on create", async () => {
    const { service, ready } = createService();
    await ready();

    const result = await service.createNote("Title", "  ");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Content");
    }
  });

  it("does not mutate repo when save fails on create", async () => {
    const { service, ready } = createService({ writeFails: true });
    await ready();

    const result = await service.createNote("Hello", "World");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Could not save");
    }
    expect(await service.listNotes()).toHaveLength(0);
  });

  it("updates an existing note", async () => {
    const note: Note = {
      id: "id-1",
      title: "Old",
      content: "Body",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    const { service, getStored, ready } = createService({ initial: [note] });
    await ready();

    const result = await service.updateNote("id-1", "New", "Updated body");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.note.title).toBe("New");
      expect(result.note.content).toBe("Updated body");
    }
    expect(getStored().notes[0]?.title).toBe("New");
  });

  it("returns error when updating a missing note", async () => {
    const { service, ready } = createService();
    await ready();

    const result = await service.updateNote("missing", "Title", "Body");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("No note found");
    }
  });

  it("rejects empty fields on update", async () => {
    const note: Note = {
      id: "id-1",
      title: "Old",
      content: "Body",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    const { service, ready } = createService({ initial: [note] });
    await ready();

    const result = await service.updateNote("id-1", "  ", "Body");
    expect(result.ok).toBe(false);
  });

  it("does not mutate repo when save fails on update", async () => {
    const note: Note = {
      id: "id-1",
      title: "Old",
      content: "Body",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    const { service, ready } = createService({ initial: [note], writeFails: true });
    await ready();

    const result = await service.updateNote("id-1", "New", "Updated");
    expect(result.ok).toBe(false);
    const notes = await service.listNotes();
    expect(notes[0]?.title).toBe("Old");
  });

  it("deletes an existing note", async () => {
    const note: Note = {
      id: "id-1",
      title: "Remove me",
      content: "Body",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    const { service, getStored, ready } = createService({ initial: [note] });
    await ready();

    const result = await service.deleteNote("id-1");
    expect(result.ok).toBe(true);
    expect(await service.listNotes()).toHaveLength(0);
    expect(getStored().notes).toHaveLength(0);
  });

  it("returns error when deleting a missing note", async () => {
    const { service, ready } = createService();
    await ready();

    const result = await service.deleteNote("missing");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("No note found");
    }
  });

  it("finds a note by exact title", async () => {
    const note: Note = {
      id: "abc-123",
      title: "Target",
      content: "Body",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    const { service, ready } = createService({ initial: [note] });
    await ready();

    const result = await service.findNotes("Target");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0]?.title).toBe("Target");
    }
  });

  it("finds notes by partial title match", async () => {
    const notes: Note[] = [
      {
        id: "id-1",
        title: "Meeting notes",
        content: "One",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "id-2",
        title: "Grocery list",
        content: "Two",
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
    ];
    const { service, ready } = createService({ initial: notes });
    await ready();

    const result = await service.findNotes("meet");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0]?.title).toBe("Meeting notes");
    }
  });

  it("finds all notes with the same title", async () => {
    const notes: Note[] = [
      {
        id: "id-1",
        title: "Shared",
        content: "One",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "id-2",
        title: "Shared",
        content: "Two",
        createdAt: "2024-01-02T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
      },
      {
        id: "id-3",
        title: "Other",
        content: "Three",
        createdAt: "2024-01-03T00:00:00.000Z",
        updatedAt: "2024-01-03T00:00:00.000Z",
      },
    ];
    const { service, ready } = createService({ initial: notes });
    await ready();

    const result = await service.findNotes("Shared");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.notes).toHaveLength(2);
    }
  });

  it("returns error when no note matches search", async () => {
    const { service, ready } = createService();
    await ready();

    const result = await service.findNotes("missing");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("No note found.");
    }
  });

  it("rejects secure note creation when vault is locked", async () => {
    const { service, ready } = createService();
    await ready();

    const result = await service.createNote("Secret", "Hidden", true);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Unlock the vault");
    }
  });

  it("encrypts secure notes at rest when vault is unlocked", async () => {
    const { service, vault, getStored, ready } = createService();
    await ready();
    await vault.unlock("test-password");

    const result = await service.createNote("Secret", "Hidden body", true);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.note.content).toBe("Hidden body");
      expect(result.note.isSecure).toBe(true);
    }

    const stored = getStored().notes[0];
    expect(stored?.isSecure).toBe(true);
    expect(stored?.content).not.toBe("Hidden body");
  });

  it("masks secure note content when vault is locked", async () => {
    const { service, vault, ready } = createService();
    await ready();
    await vault.unlock("test-password");
    await service.createNote("Secret", "Hidden body", true);
    vault.lock();

    const notes = await service.listNotes();
    expect(notes[0]?.content).toBe(SECURE_CONTENT_MASK);
  });
});

describe("NoteRepository", () => {
  it("rejects duplicate ids on addNote", () => {
    const repo = new NoteRepository();
    const note: Note = {
      id: "dup",
      title: "A",
      content: "B",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    repo.addNote(note);
    expect(() => repo.addNote(note)).toThrow(/already exists/);
  });

  it("dedupes ids when loading a snapshot", () => {
    const repo = new NoteRepository();
    const note: Note = {
      id: "dup",
      title: "First",
      content: "A",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    const duplicate: Note = {
      id: "dup",
      title: "Second",
      content: "B",
      createdAt: "2024-01-02T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
    };
    repo.replaceFromSnapshot({ notes: [note, duplicate], version: 1 });
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getAll()[0]?.title).toBe("First");
  });
});
