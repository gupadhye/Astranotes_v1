import type { Note } from "./note.js";

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

/** Validates note fields for create/update (extend as requirements evolve). */
export class ValidationService {
  validateTitle(title: string): ValidationResult {
    if (!title.trim()) {
      return { ok: false, message: "Title must not be empty or whitespace only." };
    }
    return { ok: true };
  }

  validateContent(content: string): ValidationResult {
    if (!content.trim()) {
      return { ok: false, message: "Content must not be empty or whitespace only." };
    }
    return { ok: true };
  }

  validateNotePatch(_note: Pick<Note, "title" | "content">): ValidationResult {
    const t = this.validateTitle(_note.title);
    if (!t.ok) {
      return t;
    }
    return this.validateContent(_note.content);
  }
}
