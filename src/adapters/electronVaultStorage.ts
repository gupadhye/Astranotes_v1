import type { VaultConfig } from "@core/vaultConfig";

function getApi() {
  if (typeof window === "undefined" || !window.electronAPI) {
    throw new Error("electronAPI is not available");
  }
  return window.electronAPI;
}

/** Electron IPC persistence for vault metadata. */
export function createElectronVaultStorage(): {
  load: () => Promise<VaultConfig | null>;
  save: (config: VaultConfig) => Promise<void>;
} {
  return {
    async load() {
      return getApi().loadVault();
    },
    async save(config) {
      await getApi().saveVault(config);
    },
  };
}
