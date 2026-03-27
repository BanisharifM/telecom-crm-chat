# TelecomCo CRM - Code Map & LLM Implementation Guide

---

## Folder Structure

```
OuterProduct/
├── data-agent-task/
│   ├── task.md                    # Interview case study requirements
│   └── churn-bigml-full.xlsx      # Source CRM data (3,333 customers)
│
├── src/app/core/                  # 🧠 BACKEND CORE (Python)
│   ├── llm.py                     #   LLM: tool use, process_question(), retry logic
│   ├── prompt.py                  #   System prompt: schema, rules, examples
│   ├── sql_validator.py           #   SQL safety: sqlglot AST, blocked keywords, fuzzy fix
│   ├── database.py                #   DB: PostgreSQL + DuckDB executors, schema definitions
│   └── config.py                  #   Settings: env vars, API keys, model config
│
├── backend/                       # 🔌 FASTAPI API
│   ├── main.py                    #   App entry: CORS, lifespan, route registration
│   ├── api/
│   │   ├── deps.py                #   Dependency injection (DB, LLM client, settings)
│   │   └── routes/
│   │       ├── chat.py            #   POST /api/chat (NL -> SQL -> results)
│   │       ├── dashboard.py       #   GET /api/dashboard/* (KPIs, charts, map, AI summary)
│   │       ├── explorer.py        #   GET /api/explorer/* (filters, data, customer 360)
│   │       └── health.py          #   GET /api/health
│   ├── schemas/                   #   Pydantic request/response models
│   └── Dockerfile                 #   Python 3.13 slim container
│
├── frontend/                      # 🖥️ NEXT.JS APP
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx         #     Root: fonts, SessionProvider, ThemeProvider
│   │   │   ├── page.tsx           #     Landing page (marketing, hero, features)
│   │   │   ├── not-found.tsx      #     404 page
│   │   │   ├── (auth)/login/      #     Google OAuth login page
│   │   │   ├── (app)/             #     Protected app pages:
│   │   │   │   ├── layout.tsx     #       Sidebar + main content shell
│   │   │   │   ├── chat/page.tsx  #       New chat (lazy creation)
│   │   │   │   ├── chat/[id]/     #       Existing conversation
│   │   │   │   ├── dashboard/     #       KPIs, map, charts, AI summary
│   │   │   │   ├── customer/      #       Customer 360 (health score, risk)
│   │   │   │   └── explorer/      #       Data table with filters
│   │   │   └── api/
│   │   │       ├── auth/[...nextauth]/  # NextAuth handlers
│   │   │       └── conversations/       # CRUD for chat history
│   │   ├── components/
│   │   │   ├── chat/              #     ChatMarkdown, PlotlyChart, InfoPanel,
│   │   │   │                      #     ChatInput, MessageActions, DateSeparator,
│   │   │   │                      #     ScrollToBottom, SuggestedFollowups
│   │   │   ├── dashboard/         #     AnimatedCounter, ChoroplethMap
│   │   │   ├── layout/            #     AppSidebar, ThemeToggle, SettingsDialog,
│   │   │   │                      #     SessionProvider, ThemeProvider
│   │   │   └── ui/                #     shadcn primitives (Button, Card, Input, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts             #     Backend API client (fetch wrapper)
│   │   │   ├── auth.ts            #     NextAuth config (Google, Prisma adapter)
│   │   │   ├── prisma.ts          #     Prisma client singleton
│   │   │   ├── types.ts           #     TypeScript interfaces
│   │   │   └── utils.ts           #     cn(), formatNumber(), relativeTime()
│   │   ├── styles/globals.css     #     Tailwind + dark/light CSS variables
│   │   ├── middleware.ts          #     Route protection (auth required)
│   │   └── types/                 #     Type declarations (next-auth, plotly)
│   ├── prisma/
│   │   ├── schema.prisma          #     DB schema: User, Conversation, Message
│   │   └── migrations/            #     SQL migrations
│   ├── public/                    #     Logos, favicon, 404 illustration
│   ├── Dockerfile                 #     Multi-stage: deps -> build -> runner
│   └── Dockerfile.migrate         #     Lightweight container for Prisma migrations
│
├── docs/
│   ├── ROADMAP.md                 #   1,700+ line comprehensive roadmap
│   ├── ARCHITECTURE_DETAILED.md   #   Full technical documentation
│   ├── ARCHITECTURE_BRIEF.md      #   Interview-ready one-pager
│   └── CODE_MAP.md                #   This file
│
├── docker-compose.yml             # 🐳 3 services: backend + frontend + caddy
├── Caddyfile                      # 🔒 Reverse proxy: HTTPS, routing, security
├── requirements.txt               # Python deps
├── CLAUDE.md                      # AI assistant rules
└── .env                           # Secrets (not in git)
```

---

## LLM Implementation - Where Each Part Lives

### 1. Tool Definition & Query Processing
**`src/app/core/llm.py`** - The main LLM file

| Part | What It Does |
|------|-------------|
| `QUERY_TOOL` dict | Defines the `query_database` tool schema (SQL, chart_type, chart_config, explanation) |
| `TOOLS = [QUERY_TOOL]` | Tool list passed to Claude API |
| `process_question()` | Main function: sends question to Claude with `tools` parameter, checks `finish_reason` to decide tool call vs conversation |
| Tool call handling | Extracts SQL from `tool_call.function.arguments`, validates, executes |
| Retry loop | On SQL error: builds `role: "tool"` message with error, sends back to Claude for self-correction |
| `create_client()` | Creates OpenAI-compatible client pointed at OpenRouter |
| `generate_sql()` / `generate_sql_with_retry()` | Legacy functions for Streamlit (old JSON approach) |

### 2. System Prompt
**`src/app/core/prompt.py`** - Everything Claude "knows"

| Section | What It Contains |
|---------|-----------------|
| `<schema>` | Full CREATE TABLE with column descriptions |
| `<summary_tables>` | 5 materialized view schemas |
| `<sample_data>` | 5 representative customer rows |
| `<data_rules>` | 11 rules (Churn is BOOLEAN, ROUND::numeric, etc.) |
| `<conversation_guidelines>` | How to handle follow-ups, acknowledgments |
| Formatting instructions | Markdown, no em dashes, no backticks for table names |

### 3. SQL Validation
**`src/app/core/sql_validator.py`** - Guards between LLM output and database

| Function | What It Does |
|----------|-------------|
| `validate_sql()` | Main entry: blocked keywords -> AST parse -> table whitelist -> LIMIT |
| `fuzzy_fix_columns()` | Auto-corrects `Total_day_minutes` -> `"Total day minutes"`, `Churn='Yes'` -> `Churn=true` |
| `_check_blocked_keywords()` | Regex rejects DROP, DELETE, INSERT, UPDATE, etc. |
| `_validate_structure()` | sqlglot parses SQL, verifies SELECT/UNION, checks tables against whitelist |
| `_ensure_limit()` | Adds LIMIT 500 if missing |

### 4. Database Execution
**`src/app/core/database.py`** - Where validated SQL actually runs

| Function | What It Does |
|----------|-------------|
| `execute_query_postgres()` | Runs SQL on PostgreSQL via SQLAlchemy, returns DataFrame |
| `execute_query()` | Runs SQL on DuckDB (local dev), returns DataFrame |
| `COLUMN_DEFINITIONS` | The schema string imported by prompt.py |
| `VALID_TABLES` | Whitelist used by sql_validator.py |

### 5. API Endpoint
**`backend/api/routes/chat.py`** - FastAPI route that connects frontend to LLM

| What | How |
|------|-----|
| `POST /api/chat` | Receives question + history, calls `process_question()`, converts DataFrame to JSON, returns ChatResponse |

### 6. Frontend Chat
- **`frontend/src/lib/api.ts`** - `sendChat()` function calls `/api/query/chat`
- **`frontend/src/app/(app)/chat/page.tsx`** - New chat page (lazy creation)
- **`frontend/src/app/(app)/chat/[id]/page.tsx`** - Existing conversation with history

### 7. AI Executive Summary
**`backend/api/routes/dashboard.py`** - `executive_summary()` endpoint

| What | How |
|------|-----|
| Runs 5 KPI queries in parallel | Gathers data context |
| Sends context to Claude | With executive summary prompt |
| Saves result to `app_settings` table | Persisted, regeneratable |

---

## The Complete Flow in Code

```
User types "What is the churn rate by state?"
    |
    v
frontend/src/app/(app)/chat/page.tsx: handleSend()
    |
    v
frontend/src/lib/api.ts: sendChat() -> POST /api/query/chat
    |
    v
backend/api/routes/chat.py: chat() -> process_question()
    |
    v
src/app/core/llm.py: process_question()
    |-- Builds messages: system prompt (prompt.py) + history + user question
    |-- Calls: client.chat.completions.create(tools=TOOLS, tool_choice="auto")
    |-- Claude returns: finish_reason="tool_calls"
    |-- Extracts: sql, chart_type, chart_config, explanation from tool arguments
    |
    v
src/app/core/sql_validator.py: fuzzy_fix_columns() -> validate_sql()
    |-- Fixes column names, boolean values
    |-- Parses with sqlglot, checks tables, ensures LIMIT
    |
    v
src/app/core/database.py: execute_query_postgres()
    |-- Runs SQL on Neon PostgreSQL
    |-- Returns pandas DataFrame
    |
    v
backend/api/routes/chat.py: converts DataFrame to JSON response
    |
    v
frontend: renders ChatMarkdown + PlotlyChart + data table
```
