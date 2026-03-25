# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a take-home project to build a **natural-language chat UI for querying telecom CRM data**. The system should:
1. Accept natural-language questions from marketers
2. Use an LLM to convert questions into SQL queries
3. Execute queries against the dataset
4. Return answers as text + tables/plots

## Data

- **Dataset**: `data-agent-task/churn-bigml-full.xlsx` — CRM extract with one row per customer
- **Metadata**: `data-agent-task/churn-metadata.md` — column descriptions
- **Task spec**: `data-agent-task/task.md` — full requirements

Key columns: State, Account length, Area code, International plan, Voice mail plan, various call metrics (day/eve/night/intl minutes/calls/charges), Customer service calls, Churn (Yes/No target variable).

## Technical Constraints (from task spec)

- Any frontend stack is acceptable
- Any charting/visualization library is acceptable
- The dataset is an Excel file (.xlsx) that will need to be loaded into a queryable format (e.g., SQLite, DuckDB, or pandas)

## Key Files

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — project rules and context for Claude Code |
| `SESSION_LOG.md` | Chronological log of all interactions (most recent first) |
| `data-agent-task/task.md` | Full project requirements |
| `data-agent-task/churn-metadata.md` | Dataset column descriptions |
| `data-agent-task/churn-bigml-full.xlsx` | Raw CRM dataset |
| `.gitignore` | Git ignore rules |
| `.claudeignore` | Files excluded from Claude Code context |
| `.claude/settings.local.json` | Claude Code tool permissions |

## Rules

### Rule 1: Session Logging (MANDATORY)
After **every** user message, append a new entry to the **top** of `SESSION_LOG.md` (below the header). Each entry must include:
- Date and entry number (increment from last)
- Summary of the user's message
- Numbered list of actions taken
- Current project state
- Pending tasks
- Files created/updated

Format:
```
### YYYY-MM-DD | Entry N: Short Title
**User Message:** <summary>
**Actions:**
1. ...
**Current State:** ...
**Pending Tasks:** ...
**Files Created:** ...
**Files Updated:** ...
```

### Rule 2: Session Start Protocol
At the start of each new session:
1. Read `CLAUDE.md` (loaded automatically)
2. Read `SESSION_LOG.md` to understand where we left off
3. Continue from the last entry's pending tasks unless the user says otherwise
