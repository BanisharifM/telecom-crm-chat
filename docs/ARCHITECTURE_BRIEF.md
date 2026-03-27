# TelecomCo CRM - Architecture Brief

**Live:** https://telecomco.chat | **Repo:** github.com/BanisharifM/telecom-crm-chat

---

## What It Does

Chat interface where marketers ask questions about 3,333 telecom customers in plain English and get answers with interactive charts.

**Example:** "What is the churn rate by state?" -> Bar chart + data table + markdown explanation

---

## Architecture

```
Browser -> Caddy (HTTPS) -> Next.js (UI) + FastAPI (API) -> Claude (LLM) -> PostgreSQL (Data)
```

| Component | Tech | Role |
|-----------|------|------|
| Frontend | Next.js 14 + shadcn/ui + Tailwind | Chat UI, dashboard, auth |
| Backend | FastAPI (Python) | LLM orchestration, SQL execution |
| LLM | Claude Sonnet 4.6 via OpenRouter | Text-to-SQL + conversation |
| Database | PostgreSQL (Neon serverless) | CRM data + app data |
| Auth | NextAuth.js v5 + Google OAuth | Login, session management |
| Proxy | Caddy | HTTPS, routing, security headers |
| Deploy | Docker Compose on EC2 | 3 containers |

---

## How the LLM Works

**Key decision: Claude tool use (function calling)**, not forced JSON output.

Claude receives the question and decides:
- **Need data?** -> Calls `query_database` tool with SQL + chart config
- **Conversational?** -> Responds directly (greetings, follow-ups, explanations)

This eliminates intent classification hacks. "great", "thanks", "why?" just work.

**Pipeline:**
1. User asks question
2. Claude generates SQL via tool call (or responds conversationally)
3. SQL validated by sqlglot (AST parsing, not regex)
4. Common mistakes auto-fixed (column quoting, Churn boolean)
5. Executed on PostgreSQL
6. On error: error fed back to Claude, retries up to 3x
7. Result returned with chart config and markdown explanation

---

## Handling LLM Challenges

| Challenge | Solution |
|-----------|----------|
| Hallucination (wrong SQL) | sqlglot AST validation + 3x retry with error feedback |
| "great"/"thanks" triggers query | Tool use: Claude doesn't call tool for non-data messages |
| Column names with spaces | Fuzzy auto-fix: `Total_day_minutes` -> `"Total day minutes"` |
| Churn = 'Yes' (wrong) | Auto-fix to `Churn = true` + prompt examples |
| ROUND function (PostgreSQL) | Prompt rule: `ROUND(expr::numeric, 2)` |
| No date columns | Prompt instructs: explain limitation, offer alternatives |
| SQL injection | Blocked keywords + AST validation + table whitelist |
| Complex UNION queries | Validator accepts UNION type alongside SELECT |

---

## Database

**CRM data:** 3,333 customers, 21 columns (demographics, plans, usage, charges, churn)

**5 materialized views** for fast dashboard queries (overall KPIs, state summary, plan summary, area code summary, service call analysis)

**App data** (same Neon instance): Users, conversations, messages stored via Prisma ORM

---

## Features

**Chat:** Natural language queries, inline Plotly charts, markdown responses, conversation history, follow-up suggestions, CSV/PNG download, collapsible SQL viewer

**Dashboard:** Animated KPI cards, US choropleth map, AI executive summary (persisted), key insights, 4 chart panels

**Customer 360:** Search by ID, health score (0-100 with traffic light), usage breakdown, risk factors

**Data Explorer:** Filterable paginated table, CSV export

**UX:** Dark/light mode, responsive (mobile/tablet/desktop), Google OAuth, settings dialog, conversation management (rename/pin/delete/search)

---

## Deployment

- **Domain:** telecomco.chat (AWS Route 53)
- **Server:** AWS EC2 t3.large (8GB RAM)
- **Containers:** Docker Compose (Caddy + Next.js + FastAPI)
- **Database:** Neon PostgreSQL (serverless, us-east-2)
- **SSL:** Auto via Caddy + Let's Encrypt
- **LLM:** OpenRouter API (Claude Sonnet 4.6)

---

## Interview Q&A Preparation

**Q: Why Claude instead of GPT-4?**
A: Claude Sonnet scores 94% on text-to-SQL benchmarks (highest among all models). Tool use support is excellent. Via OpenRouter, we're not locked to one provider.

**Q: Why not LangChain?**
A: Our pipeline is simple: question -> LLM -> SQL -> execute. LangChain adds 15-25% latency and 83% more memory for no benefit. Direct API calls with tool use handle everything we need.

**Q: How do you prevent SQL injection?**
A: 4 layers: (1) blocked keyword regex, (2) sqlglot AST parsing validates SELECT/UNION only, (3) table name whitelist, (4) LIMIT enforcement. The LLM never has write access.

**Q: How do you handle LLM errors?**
A: Tool use retry pattern: SQL error is fed back to Claude as a `tool_result` with `is_error`. Claude sees the exact error and corrects itself. Up to 3 retries. If all fail, Claude explains what went wrong and suggests alternatives.

**Q: Why PostgreSQL instead of DuckDB?**
A: Production needs: multi-user concurrent access, persistent data, same database for CRM data and app data (auth, conversations). DuckDB kept as local dev option.

**Q: How does auth work?**
A: NextAuth.js v5 with Google OAuth. JWT sessions (stateless). Prisma adapter stores users in PostgreSQL. Middleware protects app routes.

**Q: How is it deployed?**
A: Docker Compose on EC2. Caddy handles HTTPS auto-renewal. Neon PostgreSQL is serverless (separate from EC2). Domain via Route 53.

**Q: What would you add next?**
A: ML-based churn prediction (replace rule-based health score with trained model), streaming responses (token-by-token), rate limiting on API, and Redis caching for repeated queries.
