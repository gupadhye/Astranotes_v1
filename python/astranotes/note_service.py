"""
NoteService — implements create_note (FR-1) and view_notes (FR-2).
Uses NoteRepository for JSON persistence (NFR-1). Validation in create_note (SR-1).
"""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

from astranotes.note import Note
from astranotes.note_repository import NoteRepository


class NoteService:
    """Coordinates validation, building Note objects, and saving through the repository."""

    def __init__(self, repository: NoteRepository) -> None:
        self._repo = repository

    def create_note(self, title: str, content: str) -> Note:
        """Create and save a note: validates title/content (SR-1), sets timestamps, stores via repository."""
        t = title.strip() if title else ""
        c = content.strip() if content else ""
        if not t or not c:
            raise ValueError("Title and content must not be empty or whitespace only.")

        now = datetime.now(timezone.utc).isoformat()
        note = Note(
            id=str(uuid.uuid4()),
            title=t,
            content=c,
            created_at=now,
            updated_at=now,
        )

        notes = self._repo.load_notes()
        notes.append(note)
        self._repo.save_notes(notes)
        return note

    def view_notes(self) -> list[Note]:
        """List all notes from storage (FR-2). Returns an empty list when there are none."""
        return self._repo.load_notes()
