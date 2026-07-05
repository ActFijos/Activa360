from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Generic, TypeVar

T = TypeVar("T")


@dataclass
class Queue(Generic[T]):
    """Cola simple de tareas listos, inspirada en SQS."""

    items: deque[T] = field(default_factory=deque)

    def enqueue(self, item: T) -> None:
        self.items.append(item)

    def dequeue(self) -> T | None:
        return self.items.popleft() if self.items else None

    def size(self) -> int:
        return len(self.items)
