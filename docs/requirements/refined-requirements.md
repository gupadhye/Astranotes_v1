# Refined Requirements

Source artifact: [`../artifacts/requirements/Refined requirements.docx`](../artifacts/requirements/Refined%20requirements.docx)

## Functional requirements (refined)

| ID | Requirement |
|----|-------------|
| FR-1 | Create a note with title and content; title must not be empty or whitespace-only; no duplicate note identifiers. |
| FR-2 | View all saved notes in a list showing each note's title; display **"No notes available"** when empty. |
| FR-3 | Retrieve notes by title (partial match) or identifier; show all title matches; show error if none found. |
| FR-4 | Update an existing note's title or content by selecting it; updated fields must not be empty or whitespace-only. |
| FR-5 | Delete a note by selecting it; show error if the note does not exist. |
| FR-6 | Store all notes in a local file and load on startup; start with empty list if file is missing. |

## Non-functional requirements (refined)

| ID | Requirement |
|----|-------------|
| NFR-1 | Create, update, delete, retrieve, and list feel instant for up to **100 notes**. |
| NFR-2 | Clear success message after every successful action; clear error message on failure. |
| NFR-3 | Validate note input before saving (title and content non-empty for create/update). |
| NFR-4 | Handle storage errors (missing file, corrupt JSON, write failure) without crashing. |
| NFR-5 | Replace in-memory note data only after successful persistence (save-before-mutate). |

## Extended feature (implementation)

| ID | Requirement |
|----|-------------|
| FR-7 | Optional **secure notes**: encrypt content at rest with a user vault password (AES-GCM); mask content when vault is locked. |

## Reflection

AI helped identify missing edge cases and error behavior in the initial set. Refined requirements specify empty states, duplicate ID handling, search behavior, validation rules, and safe-save semantics used in the final prototype.
