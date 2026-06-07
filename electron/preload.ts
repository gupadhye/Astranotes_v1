import { contextBridge, ipcRenderer } from "electron";
import type { NotesSnapshot } from "../src/core/fileStorageManager.js";
import type { VaultConfig } from "../src/core/vaultConfig.js";

type AppMenuPayload = { action: "view"; target: "workspace" };

contextBridge.exposeInMainWorld("electronAPI", {
  loadNotes: (): Promise<NotesSnapshot> => ipcRenderer.invoke("notes:load"),
  saveNotes: (snapshot: NotesSnapshot): Promise<void> => ipcRenderer.invoke("notes:save", snapshot),
  loadVault: (): Promise<VaultConfig | null> => ipcRenderer.invoke("vault:load"),
  saveVault: (config: VaultConfig): Promise<void> => ipcRenderer.invoke("vault:save", config),
  onAppMenu: (callback: (payload: AppMenuPayload) => void): (() => void) => {
    const listener = (_event: unknown, payload: AppMenuPayload): void => {
      callback(payload);
    };
    ipcRenderer.on("app-menu", listener);
    return () => {
      ipcRenderer.removeListener("app-menu", listener);
    };
  },
});
