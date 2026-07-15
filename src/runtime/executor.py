from __future__ import annotations

from concurrent.futures import Future as StdFuture, ThreadPoolExecutor
from typing import Any, Callable, Protocol


class Future(Protocol):
    def result(self, timeout: float | None = None) -> Any: ...
    def cancel(self) -> bool: ...
    def done(self) -> bool: ...


class Executor(Protocol):
    def submit(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Future: ...
    def shutdown(self, wait: bool = True) -> None: ...


class ThreadedFuture:
    def __init__(self, std_future: StdFuture[Any]):
        self._future = std_future

    def result(self, timeout: float | None = None) -> Any:
        return self._future.result(timeout=timeout)

    def cancel(self) -> bool:
        return self._future.cancel()

    def done(self) -> bool:
        return self._future.done()


class ThreadedExecutor:
    def __init__(self, max_workers: int | None = None):
        self._executor = ThreadPoolExecutor(max_workers=max_workers)

    def submit(self, fn: Callable[..., Any], *args: Any, **kwargs: Any) -> Future:
        std_future = self._executor.submit(fn, *args, **kwargs)
        return ThreadedFuture(std_future)

    def shutdown(self, wait: bool = True) -> None:
        self._executor.shutdown(wait=wait)
