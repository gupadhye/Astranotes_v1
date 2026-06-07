export interface VaultConfig {
  salt: string;
  verifier: string;
}

export interface VaultStorage {
  load: () => Promise<VaultConfig | null>;
  save: (config: VaultConfig) => Promise<void>;
}
