import { describe, expect, it } from "vitest";
import {
  createVerifier,
  decryptText,
  deriveVaultKey,
  encryptText,
  verifyKey,
} from "../src/core/secureNoteCrypto.js";

describe("secureNoteCrypto", () => {
  it("encrypts and decrypts text", async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveVaultKey("my-password", salt);
    const encrypted = await encryptText("sensitive data", key);
    const decrypted = await decryptText(encrypted, key);
    expect(decrypted).toBe("sensitive data");
    expect(encrypted).not.toBe("sensitive data");
  });

  it("verifies a correct vault key", async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveVaultKey("vault-pass", salt);
    const verifier = await createVerifier(key);
    expect(await verifyKey(key, verifier)).toBe(true);
  });

  it("rejects an incorrect vault key", async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveVaultKey("vault-pass", salt);
    const wrongKey = await deriveVaultKey("wrong-pass", salt);
    const verifier = await createVerifier(key);
    expect(await verifyKey(wrongKey, verifier)).toBe(false);
  });
});
