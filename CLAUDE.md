# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **natural-language chat UI for querying telecom CRM data**. The system:
1. Accepts natural-language questions from users
2. Uses an LLM (Claude Sonnet 4.6 via OpenRouter) to convert questions into DuckDB SQL
3. Validates and executes queries against the CRM dataset
4. Returns answers as text + interactive Plotly charts + downloadable tables

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Database | DuckDB (in-process OLAP) |
| LLM | Claude Sonnet 4.6 via OpenRouter |
| Frontend | Streamlit (chat + dashboard + data explorer) |
| Charts | Plotly (custom dark CRM theme) |
| SQL Validation | sqlglot (schema check + CTE support) |
| Package Manager | uv |
| Python | 3.11+ |

## Commands

```bash
# Setup
uv venv --python 3.13 && source .venv/bin/activate
uv pip install -r requirements.txt

# Run the app
PYTHONPATH=src streamlit run streamlit_app.py

# Run all tests (unit + integration, no API key needed)
PYTHONPATH=src pytest tests/ -v -k "not test_e2e"

# Run E2E tests (requires OPENROUTER_API_KEY)
PYTHONPATH=src pytest tests/integration/test_e2e_queries.py -v

# Run a single test
PYTHONPATH=src pytest tests/unit/test_sql_validator.py::TestValidateSQL::test_rejects_drop -v

# Lint
ruff check src/ tests/
ruff format src/ tests/
```

## Architecture

```
User Question → LLM (Claude) → SQL + Chart Config (JSON)
                                    ↓
                              Fuzzy Fix Columns (underscore→spaces, Yes/No→bool)
                                    ↓
                              Validate SQL (sqlglot: schema check, CTE aliases, SELECT-only)
                                    ↓
                              Execute (DuckDB, in-process)
                                    ↓
                              Render (text + Plotly chart + st.dataframe)

On failure: retry up to 3x with error feedback to LLM
```

## Data Quirks

- `Churn` is **BOOLEAN** (true/false), NOT 'Yes'/'No' as metadata says
- Column names have **spaces** → must be double-quoted in SQL
- `customer_id` exists but is NOT in metadata (0-2665, some duplicates)
- No date/time column → temporal questions cannot be answered literally

## Rules

### Rule 1: Session Logging (MANDATORY)
After **every** user message, append a new entry to the **top** of `SESSION_LOG.md` (below the header).

### Rule 2: Session Start Protocol
At the start of each new session:
1. Read `CLAUDE.md` (loaded automatically)
2. Read `SESSION_LOG.md` to understand where we left off
3. Continue from the last entry's pending tasks unless the user says otherwise
