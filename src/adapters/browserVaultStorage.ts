import type { VaultConfig } from "@core/vaultConfig";

const CONFIG_KEY = "astranotes:vault-config";
const LEGACY_SALT_KEY = "astranotes:vault-salt";
const LEGACY_VERIFIER_KEY = "astranotes:vault-verifier";

/** Browser persistence for vault metadata (salt + verifier only). */
export function createBrowserVaultStorage(): {
  load: () => Promise<VaultConfig | null>;
  save: (config: VaultConfig) => Promise<void>;
} {
  return {
    async load() {
      const raw = globalThis.localStorage?.getItem(CONFIG_KEY);
      if (raw) {
        try {
          return JSON.parse(raw) as VaultConfig;
        } catch {
          return null;
        }
      }

      const legacySalt = globalThis.localStorage?.getItem(LEGACY_SALT_KEY);
      const legacyVerifier = globalThis.localStorage?.getItem(LEGACY_VERIFIER_KEY);
      if (legacySalt && legacyVerifier) {
        const config = { salt: legacySalt, verifier: legacyVerifier };
        globalThis.localStorage?.setItem(CONFIG_KEY, JSON.stringify(config));
        globalThis.localStorage?.removeItem(LEGACY_SALT_KEY);
        globalThis.localStorage?.removeItem(LEGACY_VERIFIER_KEY);
        return config;
      }

      return null;
    },
    async save(config) {
      try {
        globalThis.localStorage?.setItem(CONFIG_KEY, JSON.stringify(config));
      } catch {
        throw new Error("Could not save vault configuration.");
      }
    },
  };
}
