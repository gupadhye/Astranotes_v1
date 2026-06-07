import { describe, expect, it } from "vitest";
import { ValidationService } from "../src/core/validationService.js";

describe("ValidationService", () => {
  it("rejects empty titles", () => {
    const v = new ValidationService();
    expect(v.validateTitle("").ok).toBe(false);
    expect(v.validateTitle("   ").ok).toBe(false);
  });

  it("accepts non-empty trimmed titles", () => {
    const v = new ValidationService();
    expect(v.validateTitle("Hello").ok).toBe(true);
  });

  it("rejects empty content", () => {
    const v = new ValidationService();
    expect(v.validateContent("").ok).toBe(false);
    expect(v.validateContent("  \t").ok).toBe(false);
  });

  it("accepts non-empty content", () => {
    const v = new ValidationService();
    expect(v.validateContent("Body").ok).toBe(true);
  });

  it("validateNotePatch rejects empty title", () => {
    const v = new ValidationService();
    expect(v.validateNotePatch({ title: "  ", content: "Body" }).ok).toBe(false);
  });

  it("validateNotePatch rejects empty content", () => {
    const v = new ValidationService();
    expect(v.validateNotePatch({ title: "Title", content: "" }).ok).toBe(false);
  });

  it("validateNotePatch accepts valid fields", () => {
    const v = new ValidationService();
    expect(v.validateNotePatch({ title: "Title", content: "Body" }).ok).toBe(true);
  });
});
