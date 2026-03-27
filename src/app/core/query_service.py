"""Query service: thin wrapper around llm.process_question.

The main logic is now in llm.py which uses Claude tool use.
This file exists for backward compatibility with imports.
"""

from __future__ import annotations

from app.core.llm import QueryResult, process_question, create_client

__all__ = ["QueryResult", "process_question", "create_client"]
