import { createVerifier, deriveVaultKey, verifyKey } from "./secureNoteCrypto.js";
import type { VaultConfig, VaultStorage } from "./vaultConfig.js";

export type VaultActionResult = { ok: true } | { ok: false; message: string };

/** Session-only vault unlock state; password never persisted. */
export class VaultService {
  private key: CryptoKey | null = null;
  private config: VaultConfig | null = null;

  constructor(private readonly storage: VaultStorage) {}

  async init(): Promise<void> {
    this.config = await this.storage.load();
  }

  hasVault(): boolean {
    return Boolean(this.config?.salt && this.config?.verifier);
  }

  isUnlocked(): boolean {
    return this.key !== null;
  }

  lock(): void {
    this.key = null;
  }

  getKey(): CryptoKey | null {
    return this.key;
  }

  async setup(password: string): Promise<VaultActionResult> {
    const trimmed = password.trim();
    if (trimmed.length < 4) {
      return { ok: false, message: "Vault password must be at least 4 characters." };
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveVaultKey(trimmed, salt);
    const verifier = await createVerifier(key);
    const config: VaultConfig = {
      salt: btoa(String.fromCharCode(...salt)),
      verifier,
    };

    try {
      await this.storage.save(config);
    } catch {
      return { ok: false, message: "Could not save vault configuration." };
    }

    this.config = config;
    this.key = key;
    return { ok: true };
  }

  async unlock(password: string): Promise<VaultActionResult> {
    const trimmed = password.trim();
    if (!trimmed) {
      return { ok: false, message: "Enter your vault password." };
    }

    if (!this.hasVault()) {
      return this.setup(trimmed);
    }

    if (!this.config) {
      return { ok: false, message: "Vault is not configured." };
    }

    const saltBinary = atob(this.config.salt);
    const salt = new Uint8Array(saltBinary.length);
    for (let i = 0; i < saltBinary.length; i += 1) {
      salt[i] = saltBinary.charCodeAt(i);
    }

    const key = await deriveVaultKey(trimmed, salt);
    const valid = await verifyKey(key, this.config.verifier);
    if (!valid) {
      return { ok: false, message: "Incorrect vault password." };
    }

    this.key = key;
    return { ok: true };
  }
}
