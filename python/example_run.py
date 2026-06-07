#!/usr/bin/env python3
"""Run from the `python/` folder: `python example_run.py` — creates sample notes and prints them."""

from pathlib import Path

from astranotes.note_repository import NoteRepository
from astranotes.note_service import NoteService


def main() -> None:
    data_file = Path(__file__).resolve().parent / "data" / "notes.json"
    service = NoteService(NoteRepository(data_file))

    service.create_note("Shopping", "Milk, eggs, bread")
    notes = service.view_notes()
    print(f"Saved {len(notes)} note(s) to {data_file}")
    for n in notes:
        print(f"- {n.title}: {n.content} (created {n.created_at})")


if __name__ == "__main__":
    main()
