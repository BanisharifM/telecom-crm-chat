# TelecomCo CRM - Detailed Architecture & Technical Documentation

**Live App:** https://telecomco.chat
**GitHub:** https://github.com/BanisharifM/telecom-crm-chat

---

## 1. System Overview

A natural-language chat interface for querying telecom CRM data. Marketers type questions in plain English ("What is the churn rate by state?") and receive answers as text, interactive charts, and downloadable tables.

```
User (Browser)
    |
    v
Caddy (HTTPS, reverse proxy, auto-SSL via Let's Encrypt)
    |
    +-- /* --> Next.js Frontend (port 3000)
    |           - Landing page, auth, chat UI, dashboard, explorer
    |           - Google OAuth via NextAuth.js v5
    |           - Chat history stored in PostgreSQL via Prisma
    |
    +-- /api/query/* --> FastAPI Backend (port 8000)
                          - Claude Sonnet 4.6 via OpenRouter (tool use)
                          - SQL validation (sqlglot) + fuzzy fixing
                          - Query execution against PostgreSQL
                          - Retry with error feedback (up to 3x)
```

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **LLM** | Claude Sonnet 4.6 via OpenRouter | Best text-to-SQL accuracy (94%), tool use support |
| **Backend** | FastAPI (Python) | Async, fast, OpenAI SDK compatible |
| **Frontend** | Next.js 14 (App Router) | Server components, streaming, shadcn/ui |
| **UI Components** | shadcn/ui + Tailwind CSS + Radix UI | Accessible, customizable, dark/light mode |
| **Charts** | Plotly.js (basic-dist-min) | Interactive, 70% smaller bundle, bar/pie/line/scatter/choropleth |
| **Auth** | NextAuth.js v5 + Google OAuth | JWT sessions, Prisma adapter |
| **Database (CRM)** | PostgreSQL (Neon serverless) | 3,333 customers, 5 materialized views |
| **Database (App)** | PostgreSQL (same Neon instance) | Users, conversations, messages via Prisma |
| **ORM** | Prisma | Type-safe, migrations, NextAuth adapter |
| **SQL Validation** | sqlglot | AST-level parsing, dialect-aware (PostgreSQL) |
| **Reverse Proxy** | Caddy | Auto HTTPS, simple config, gzip |
| **Deployment** | Docker Compose on AWS EC2 (t3.large) | 3 containers: backend + frontend + caddy |
| **Domain** | telecomco.chat (Route 53) | SSL via Caddy/Let's Encrypt |

---

## 3. LLM Pipeline (How Questions Become Answers)

### 3.1 Tool Use Architecture

We use **Claude's tool use (function calling)** instead of forcing JSON output. This is the key architectural decision:

```
User: "What is the churn rate?"
    |
    v
Claude receives: system prompt + conversation history + user message + tool definition
    |
    v
Claude DECIDES: call query_database tool? or respond conversationally?
    |
    +-- [Tool Call] --> Claude generates SQL + chart config + explanation
    |                   |
    |                   v
    |              Validate SQL (sqlglot) --> Fuzzy fix columns --> Execute on PostgreSQL
    |                   |
    |                   +-- [Success] --> Return data + chart + explanation
    |                   +-- [Error] --> Feed error back to Claude as tool_result
    |                                   Claude retries with corrected SQL (up to 3x)
    |
    +-- [No Tool Call] --> Claude responds with text only
                          (greetings, thanks, explanations, follow-ups)
```

**Why tool use instead of JSON prompting:**
- Claude naturally decides when to query vs when to just talk
- No "SELECT 1" hacks for non-data messages
- "great", "thanks", "why?" handled correctly without word lists
- Error retry uses the official tool_result protocol
- Structured output guaranteed by tool schema (no JSON parsing errors)

### 3.2 System Prompt

The prompt includes:
- **Schema**: Full CREATE TABLE with column descriptions, types, and value ranges
- **Summary tables**: 5 pre-computed materialized views for fast aggregations
- **Sample data**: 5 representative rows so Claude sees actual values
- **Data rules**: 11 rules (Churn is BOOLEAN, double-quote columns, ROUND::numeric, etc.)
- **Conversation guidelines**: How to handle follow-ups, modifications, acknowledgments
- **Formatting**: Markdown, no em dashes, number formatting

### 3.3 SQL Validation Pipeline

Every LLM-generated SQL goes through 4 layers before execution:

1. **Fuzzy column fix**: Auto-corrects `Total_day_minutes` to `"Total day minutes"`, `Churn = 'Yes'` to `Churn = true`
2. **Blocked keyword check**: Rejects DROP, DELETE, INSERT, UPDATE, ALTER, CREATE (regex word-boundary matching)
3. **AST validation** (sqlglot): Parses SQL, verifies SELECT/UNION only, validates table names against whitelist, validates CTE aliases
4. **LIMIT enforcement**: Adds `LIMIT 500` if missing

### 3.4 Handling Hallucination & Edge Cases

| Problem | Solution |
|---------|----------|
| "great" / "thanks" triggers SQL | Tool use: Claude doesn't call tool for non-data messages |
| LLM generates `WHERE "State" = 'California'` | Prompt includes column_value_examples: "State codes are 2-letter (CA, TX)" |
| LLM uses `Churn = 'Yes'` instead of `true` | Fuzzy fix auto-corrects; prompt has <common_mistakes> section |
| LLM uses `ROUND(float, 2)` (PostgreSQL error) | Prompt rule: "ROUND(expr::numeric, 2)"; retry feeds exact error back |
| Complex UNION ALL rejected | Validator accepts `exp.Union` in addition to `exp.Select` |
| SQL references non-existent table | sqlglot validates against `VALID_TABLES` whitelist |
| No date columns but user asks "last 3 months" | Prompt instructs: explain this limitation, offer alternatives |
| Query fails after 3 retries | LLM explains what went wrong and suggests how to rephrase |

### 3.5 Conversation Context

- Last 10 messages sent as conversation history
- Claude sees previous questions + answers for follow-ups
- "Show that as a pie chart" works because Claude sees the previous SQL in context
- "Filter by CA" works by modifying the previous query

---

## 4. Database Architecture

### 4.1 CRM Data (PostgreSQL - Neon)

**Source**: Excel file (churn-bigml-full.xlsx) from Kaggle, imported via pandas `to_sql`

**Main table**: `customers` (3,333 rows, 21 columns)
- Demographics: State (51 US states), Area code (408/415/510)
- Account: customer_id (0-3332, unique), Account length (days)
- Plans: International plan (Yes/No), Voice mail plan (Yes/No)
- Usage: Day/Evening/Night/International minutes, calls, charges
- Service: Customer service calls (0-9)
- Target: Churn (BOOLEAN true/false)

**Materialized views** (pre-computed for fast dashboard queries):
- `overall_kpis`: Total customers, churned, churn rate, states, avg tenure
- `state_summary`: Per-state churn rate, customer count, avg charges
- `plan_summary`: Per-plan-combination metrics
- `area_code_summary`: Per-area-code metrics
- `service_calls_churn`: Churn rate by service call count

**Indexes**: State, Churn, International plan

### 4.2 Application Data (same Neon instance, Prisma-managed)

**Tables** (created via Prisma migrations):
- `User`: Google OAuth profile (name, email, image)
- `Account`: OAuth provider accounts
- `Session`: JWT session tokens
- `Conversation`: Chat sessions (title, pinned, timestamps)
- `Message`: Individual messages with SQL, chart config, data (as JSON)
- `app_settings`: Key-value store (executive summary cache)

### 4.3 Data Cleaning

Original dataset had 667 duplicate customer_ids (from merging two Kaggle splits). Fixed by assigning new unique IDs (original + 2666) to second occurrences. Result: 3,333 unique IDs, 0 duplicates.

---

## 5. Frontend Architecture

### 5.1 Pages

| Route | Auth | Purpose |
|-------|------|---------|
| `/` | No | Landing page (marketing, features, CTA) |
| `/login` | No | Google OAuth sign-in |
| `/chat` | Yes | New chat (lazy creation - no DB record until first message) |
| `/chat/[id]` | Yes | Existing conversation with message history |
| `/dashboard` | Yes | KPI cards, choropleth map, insights, charts, AI summary |
| `/customer` | Yes | Customer 360 view (search by ID, health score, usage, risk) |
| `/explorer` | Yes | Paginated data table with filters and CSV download |

### 5.2 Key Components

- **AppSidebar**: Navigation, conversation list with search/rename/pin/delete, user profile, settings, theme toggle
- **ChatMarkdown**: react-markdown + remark-gfm + rehype-highlight for rendering LLM responses
- **PlotlyChart**: Dynamic Plotly with dark/light mode, grouped bars, axis labels
- **ChoroplethMap**: US state map colored by churn rate (plotly.js-geo-dist)
- **AnimatedCounter**: framer-motion number animation for KPI cards
- **InfoPanel**: WhatsApp-style details panel (Charts/Files/Queries tabs)
- **ChatInput**: Auto-resize textarea (react-textarea-autosize)
- **MessageActions**: Copy + thumbs up/down below assistant messages
- **SuggestedFollowups**: Contextual suggestion chips after responses
- **SettingsDialog**: Account, appearance, AI chat, data export, danger zone

### 5.3 Dark/Light Mode

- CSS variables in globals.css (HSL-based)
- next-themes for system preference detection
- Dark: layered surfaces (slate-950 sidebar, slate-900 bg, slate-800 cards)
- Light: white cards, slate-200 backgrounds, dark navy sidebar
- Charts auto-adapt (theme-aware colors, grid lines, text)

### 5.4 Responsive Design

- Mobile (<768px): Slide-out sidebar, stacked layout, hamburger menu
- Tablet (768-1024px): Sidebar + content
- Desktop (>1024px): Sidebar + content + optional info panel

---

## 6. Authentication Flow

1. User clicks "Get Started" on landing page
2. Redirected to `/login` page
3. Clicks "Continue with Google" -> Google OAuth consent screen
4. Google redirects back with auth code
5. NextAuth exchanges code for tokens, creates/finds User in PostgreSQL
6. JWT session token set as cookie
7. Middleware protects `/chat`, `/dashboard`, `/explorer`, `/customer`
8. User redirected to `/chat` after login

---

## 7. Deployment Architecture

```
Internet
    |
    v
AWS Route 53 (DNS: telecomco.chat -> 3.132.197.187)
    |
    v
AWS EC2 (t3.large, 8GB RAM, Amazon Linux 2023)
    |
    v
Docker Compose
    +-- Caddy (ports 80/443, auto HTTPS, reverse proxy)
    +-- Next.js Frontend (port 3000, standalone build)
    +-- FastAPI Backend (port 8000, uvicorn)
    |
    v (external)
Neon PostgreSQL (serverless, us-east-2)
    +-- CRM data (customers table + materialized views)
    +-- App data (users, conversations, messages)
    |
    v (external)
OpenRouter API -> Claude Sonnet 4.6
```

**EC2 optimizations**:
- 4GB swap file (prevents OOM during Docker builds)
- Docker log rotation (10MB max per container, 3 files)
- vm.swappiness=10 (prefer RAM over swap)
- Build cache cleanup after each deploy

---

## 8. Key Design Decisions

| Decision | Why |
|----------|-----|
| **Claude tool use** instead of JSON prompting | Natural intent classification, no "SELECT 1" hacks |
| **PostgreSQL** instead of keeping DuckDB | Multi-user, persistent, same DB for app + CRM data |
| **Neon serverless** | Free tier, scale to zero, connection pooling built-in |
| **shadcn/ui + Tailwind** instead of MUI | Smaller bundle, better dark mode, copy-paste components |
| **Plotly** instead of Recharts | More chart types (choropleth, scatter), interactive |
| **Caddy** instead of Nginx | Auto HTTPS, simpler config, built-in Let's Encrypt |
| **JWT sessions** instead of database sessions | Stateless, no DB query per request |
| **Lazy chat creation** | No orphan empty conversations (ChatGPT/Claude pattern) |
| **Materialized views** | Pre-computed aggregations for instant dashboard loading |
| **sqlglot AST validation** | More robust than string matching for SQL injection prevention |

---

## 9. Performance

- **Plotly bundle**: 1MB (plotly.js-basic-dist-min) instead of 3.5MB full
- **Font**: next/font self-hosts Inter (zero external requests)
- **Charts**: Dynamic import with ssr:false + loading skeleton
- **Dashboard**: Parallel data fetching (Promise.all for KPIs, charts, map)
- **Auto-scroll**: Only on submit/response, not on input changes
- **Conversation list**: SWR with 10s refresh interval (not polling)

---

## 10. Features Summary

### Core (P0)
- Natural language to SQL queries via Claude tool use
- Interactive Plotly charts (bar, line, pie, scatter, grouped, choropleth)
- Data tables with CSV download and PNG chart export
- Multi-conversation chat with persistence
- Google OAuth authentication
- Dark/light theme with system preference
- Rich markdown rendering with syntax-highlighted code blocks

### Enhanced (P1)
- Animated KPI dashboard with choropleth US map
- AI Executive Summary (one-click, persisted, regeneratable)
- Customer 360 page with health scoring and risk factors
- Follow-up question suggestions after each response
- Collapsible SQL viewer (transparent query)
- Thumbs up/down feedback on responses
- Info panel with Charts (PNG) / Files (CSV) / Queries (SQL) tabs
- Conversation management (rename, pin, delete, search)
- Settings dialog (theme, export chats, delete all chats)
- Auto-resizing textarea with Shift+Enter for newlines
- Date separators between messages
- Scroll-to-bottom button
- 404 page with brand illustration
- Error boundaries per route
- Loading skeletons per page
