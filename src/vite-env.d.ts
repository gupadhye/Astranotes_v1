/// <reference types="vite/client" />

import type { NotesSnapshot } from "./core/fileStorageManager";
import type { VaultConfig } from "./core/vaultConfig";
import type { AppMenuPayload } from "./ui/appMenu";

declare global {
  interface Window {
    /** Exposed by `electron/preload.ts` when running under Electron. */
    electronAPI?: {
      loadNotes: () => Promise<NotesSnapshot>;
      saveNotes: (snapshot: NotesSnapshot) => Promise<void>;
      loadVault: () => Promise<VaultConfig | null>;
      saveVault: (config: VaultConfig) => Promise<void>;
      onAppMenu?: (callback: (payload: AppMenuPayload) => void) => () => void;
    };
  }
}

export {};
