import type { VaultConfig } from "@core/vaultConfig";

/**
 * Reads/writes `vault.json` on disk (Node.js / Electron main process).
 * Stores only salt + verifier — never the vault password.
 */
export function createNodeVaultStorage(filePath: string): {
  load: () => Promise<VaultConfig | null>;
  save: (config: VaultConfig) => Promise<void>;
} {
  return {
    async load() {
      const fs = await import("node:fs/promises");
      try {
        const raw = await fs.readFile(filePath, "utf8");
        try {
          return JSON.parse(raw) as VaultConfig;
        } catch {
          return null;
        }
      } catch (err: unknown) {
        const code = typeof err === "object" && err && "code" in err ? String((err as NodeJS.ErrnoException).code) : "";
        if (code === "ENOENT") {
          return null;
        }
        throw new Error("Could not read vault configuration.");
      }
    },
    async save(config) {
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const tmp = `${filePath}.${process.pid}.tmp`;
      const payload = `${JSON.stringify(config, null, 2)}\n`;
      try {
        await fs.writeFile(tmp, payload, "utf8");
        await fs.rename(tmp, path.resolve(filePath));
      } catch {
        throw new Error("Could not write vault configuration.");
      }
    },
  };
}
