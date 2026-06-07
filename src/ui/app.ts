import { NoteRepository } from "@core/noteRepository";
import { FileStorageManager } from "@core/fileStorageManager";
import { NoteService } from "@core/noteService";
import { NoteController } from "@core/noteController";
import { VaultService } from "@core/vaultService";
import { createBrowserNotesStorage } from "@adapters/browserNotesStorage";
import { createElectronIpcStorage } from "@adapters/electronIpcStorage";
import { createBrowserVaultStorage } from "@adapters/browserVaultStorage";
import { createElectronVaultStorage } from "@adapters/electronVaultStorage";
import { mountShell } from "@ui/shell";

function createNotesIo() {
  if (typeof window !== "undefined" && window.electronAPI) {
    return createElectronIpcStorage();
  }
  return createBrowserNotesStorage();
}

function createVaultIo() {
  if (typeof window !== "undefined" && window.electronAPI) {
    return createElectronVaultStorage();
  }
  return createBrowserVaultStorage();
}

async function initVault(vault: VaultService): Promise<void> {
  await vault.init();

  if (typeof window === "undefined" || !window.electronAPI || vault.hasVault()) {
    return;
  }

  const legacy = await createBrowserVaultStorage().load();
  if (!legacy) {
    return;
  }

  await createElectronVaultStorage().save(legacy);
  await vault.init();
}

export async function mountApp(root: HTMLElement): Promise<void> {
  const isDesktop = typeof window !== "undefined" && Boolean(window.electronAPI);
  const repo = new NoteRepository();
  const vault = new VaultService(createVaultIo());
  const io = createNotesIo();
  const storage = new FileStorageManager(io.read, io.write);
  const service = new NoteService(repo, storage, vault);
  const controller = new NoteController(service);

  try {
    await initVault(vault);
    await service.loadStartup();
  } catch {
    // loadStartup already falls back to empty; guard prevents mount failure.
  }

  const notes = await controller.viewNotes();

  mountShell(
    root,
    { noteCount: notes.length, isDesktop },
    {
      createNote: (title, content, isSecure) => controller.createNote(title, content, isSecure),
      updateNote: (id, title, content, isSecure) => controller.updateNote(id, title, content, isSecure),
      deleteNote: (id) => controller.deleteNote(id),
      findNotes: (query) => controller.findNotes(query),
      listNotes: () => controller.viewNotes(),
      hasVault: () => controller.hasVault(),
      isVaultUnlocked: () => controller.isVaultUnlocked(),
      lockVault: () => controller.lockVault(),
      unlockVault: (password) => controller.unlockVault(password),
    },
  );
}
