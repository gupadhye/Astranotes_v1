export interface Note {
  id: string;
  title: string;
  content: string;
  /** When true, content is AES-GCM encrypted at rest. */
  isSecure?: boolean;
  /** ISO 8601 timestamps (set when the note is created or updated). */
  createdAt?: string;
  updatedAt?: string;
}

export const SECURE_CONTENT_MASK = "••••••••";
