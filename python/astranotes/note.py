"""Note model — one note record (title, content, created_at, updated_at)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Note:
    """Represents a single note in the app (Note class in your design)."""

    id: str
    title: str
    content: str
    created_at: str  # ISO 8601 string
    updated_at: str  # ISO 8601 string
