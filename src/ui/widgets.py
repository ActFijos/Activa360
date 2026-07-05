from __future__ import annotations

import tkinter as tk
from tkinter import ttk


class SectionFrame(ttk.LabelFrame):
    def __init__(self, parent: tk.Misc, title: str, **kwargs: object) -> None:
        super().__init__(parent, text=title, **kwargs)
        self.columnconfigure(0, weight=1)


class LabeledEntry(ttk.Frame):
    def __init__(self, parent: tk.Misc, label: str, variable: tk.Variable | None = None, **kwargs: object) -> None:
        super().__init__(parent, **kwargs)
        self.label = ttk.Label(self, text=label)
        self.label.grid(row=0, column=0, sticky="w")
        self.entry = ttk.Entry(self, textvariable=variable)
        self.entry.grid(row=1, column=0, sticky="ew")
        self.columnconfigure(0, weight=1)

    def get(self) -> str:
        return self.entry.get()


class LabeledText(ttk.Frame):
    def __init__(self, parent: tk.Misc, label: str, **kwargs: object) -> None:
        super().__init__(parent, **kwargs)
        self.label = ttk.Label(self, text=label)
        self.label.grid(row=0, column=0, sticky="w")
        self.text = tk.Text(self, height=4, width=40)
        self.text.grid(row=1, column=0, sticky="nsew")
        self.columnconfigure(0, weight=1)
        self.rowconfigure(1, weight=1)

    def get(self) -> str:
        return self.text.get("1.0", tk.END).strip()

    def set(self, value: str) -> None:
        self.text.delete("1.0", tk.END)
        self.text.insert("1.0", value)
