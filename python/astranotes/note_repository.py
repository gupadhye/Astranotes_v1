"""
NoteRepository — saves/loads notes as JSON on disk (NFR-1).
Missing or unreadable files yield an empty list instead of crashing (RR-1).
"""

from __future__ import annotations

import json
from pathlib import Path

from astranotes.note import Note


class NoteRepository:
    """Reads and writes the notes list in one JSON file on disk."""

    def __init__(self, file_path: str | Path) -> None:
        self._path = Path(file_path)

    def load_notes(self) -> list[Note]:
        """Return all notes from disk, or an empty list if the file is missing, empty, or invalid JSON."""
        if not self._path.exists():
            return []

        try:
            text = self._path.read_text(encoding="utf-8").strip()
        except OSError:
            return []

        if not text:
            return []

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            return []

        items = data.get("notes") if isinstance(data, dict) else None
        if not isinstance(items, list):
            return []

        result: list[Note] = []
        for row in items:
            if not isinstance(row, dict):
                continue
            try:
                result.append(
                    Note(
                        id=str(row["id"]),
                        title=str(row["title"]),
                        content=str(row["content"]),
                        created_at=str(row["created_at"]),
                        updated_at=str(row["updated_at"]),
                    )
                )
            except (KeyError, TypeError, ValueError):
                continue
        return result

    def save_notes(self, notes: list[Note]) -> None:
        """Write all notes to JSON (overwrites the file)."""
        self._path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "notes": [
                {
                    "id": n.id,
                    "title": n.title,
                    "content": n.content,
                    "created_at": n.created_at,
                    "updated_at": n.updated_at,
                }
                for n in notes
            ]
        }
        text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
        self._path.write_text(text, encoding="utf-8")
