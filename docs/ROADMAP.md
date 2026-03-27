# TelecomCo CRM Chat - Next.js Rebuild Roadmap

**Author:** Mahdi BanisharifDehkordi
**Created:** 2026-03-26
**Status:** Planning Phase

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Migration: DuckDB to PostgreSQL](#2-database-migration)
3. [Authentication: Google OAuth](#3-authentication)
4. [Frontend: shadcn/ui + Tailwind](#4-frontend-framework)
5. [Chat System: Messenger-Style](#5-chat-system)
6. [Markdown Rendering](#6-markdown-rendering)
7. [Theme System: Dark/Light Mode](#7-theme-system)
8. [Responsive Design](#8-responsive-design)
9. [Cross-Browser Testing](#9-cross-browser-testing)
10. [Implementation Phases](#10-implementation-phases)
11. [Database Schema](#11-database-schema)
12. [API Endpoints](#12-api-endpoints)
13. [File Structure](#13-file-structure)
14. [Deployment](#14-deployment)
15. [LLM Session Management](#15-llm-session-management)
16. [LLM Framework Decision](#16-llm-framework-decision)

---

## 1. Architecture Overview

### Current vs Target

| Layer | Current | Target |
|-------|---------|--------|
| Database | DuckDB (in-memory, single-process) | PostgreSQL (Neon serverless) + Prisma ORM |
| CRM Data | Excel file loaded into DuckDB | PostgreSQL table (imported once, queryable) |
| Auth | None | NextAuth.js v5 + Google OAuth |
| Frontend | MUI + custom CSS (basic) | shadcn/ui + Tailwind CSS + Radix UI |
| Chat UI | Single-page, no history | Messenger-style: sidebar + chat + info panel |
| Theme | Dark only, hardcoded | Dark/Light toggle, CSS variables + Tailwind |
| Markdown | Plain text only | react-markdown + syntax highlighting + copy buttons |
| Responsive | Partial | Full 3-breakpoint system (mobile/tablet/desktop) |
| Testing | Python tests only | Playwright cross-browser + responsive tests |
| Charts | Plotly (react-plotly.js) | Keep Plotly, add chart image export for gallery |

### System Architecture

```
User Browser
    |
    v
Caddy (HTTPS + reverse proxy)
    |
    +-- /* --> Next.js Frontend (port 3000)
    |           |
    |           +-- Server Components (auth, data fetching)
    |           +-- Client Components (chat UI, charts)
    |           +-- API Routes (/api/auth/*, /api/conversations/*)
    |
    +-- /api/query/* --> FastAPI Backend (port 8000)
                          |
                          +-- LLM (Claude via OpenRouter)
                          +-- PostgreSQL (CRM data + chat history)
```

---

## 2. Database Migration

### Why PostgreSQL

- DuckDB: Single-process, in-memory, no concurrent connections, no user management
- PostgreSQL: Multi-user, persistent, handles auth sessions + chat history + CRM data
- Neon: Serverless PostgreSQL, scale to zero, free tier (512MB), branching for dev

### Migration Strategy

1. Import CRM data from Excel into PostgreSQL `customers` table (one-time)
2. Keep the same column names and types
3. Create pre-computed views for fast dashboard queries (replace DuckDB summary tables)
4. LLM-generated SQL runs against PostgreSQL instead of DuckDB
5. Add indexes on frequently queried columns

### Provider: Neon

- Free tier: 512MB storage, unlimited projects
- Serverless: scales to zero, pay per compute
- Prisma compatible
- Database branching for development
- Connection pooling built-in

### Connection in FastAPI

```python
# Use asyncpg for async PostgreSQL
import asyncpg

pool = await asyncpg.create_pool(DATABASE_URL)

async def execute_query(sql: str):
    async with pool.acquire() as conn:
        return await conn.fetch(sql)
```

### SQL Validator Updates

- sqlglot already supports PostgreSQL dialect
- Change `validate_sql()` to use `dialect="postgres"`
- PostgreSQL uses double quotes for identifiers (same as DuckDB, no change needed)
- Add `LIMIT` enforcement and `SELECT-only` check (already exists)

---

## 3. Authentication

### Provider: NextAuth.js v5 (Auth.js)

- Google OAuth for login
- JWT session strategy (stateless, fast)
- Prisma adapter for user persistence
- Middleware for route protection

### Google Cloud Console Setup

1. Create project at console.cloud.google.com
2. APIs and Services > OAuth consent screen > External
3. Add scopes: openid, email, profile
4. Credentials > Create OAuth Client ID > Web application
5. Redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://telecomco.chat/api/auth/callback/google`

### Environment Variables

```env
AUTH_SECRET=<generated secret>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
DATABASE_URL=postgresql://user:pass@host/db
```

### Protected Routes

- `/chat/*` -- requires login
- `/dashboard` -- public (overview only)
- `/explorer` -- public (read-only)
- `/api/chat` -- requires auth token
- `/login` -- Google OAuth sign-in page

### User Data from Google

On first login, NextAuth + Prisma adapter automatically stores:
- name
- email
- image (Google profile picture)
- provider account link

---

## 4. Frontend Framework

### Why shadcn/ui + Tailwind (not MUI)

| Feature | MUI | shadcn/ui + Tailwind |
|---------|-----|---------------------|
| GitHub stars | ~95K | ~75K (shadcn) + ~85K (Tailwind) |
| Bundle size | Large (~200KB+) | Small (only import what you use) |
| Customization | Theme object (limited) | Full CSS control via Tailwind classes |
| Dark/Light mode | ThemeProvider + palette | CSS variables + `dark:` prefix |
| Copy-paste | Import components | Copy components into your project |
| Community 2025 | Still popular | Dominant in Next.js ecosystem |
| Server Components | Limited SSR support | First-class RSC support |

### Key shadcn/ui Components to Use

| Component | Used For |
|-----------|----------|
| `Button` | All buttons, actions |
| `Card` | KPI cards, insight cards |
| `Dialog` | Modals (rename chat, settings) |
| `Dropdown Menu` | Context menus (chat options) |
| `Input` | Search, chat input |
| `Scroll Area` | Chat message list, sidebar |
| `Select` | Filter dropdowns |
| `Separator` | Dividers |
| `Sheet` | Mobile sidebar, info panel |
| `Tabs` | Dashboard tabs, media gallery |
| `Tooltip` | Icon buttons |
| `Avatar` | User profiles, bot avatar |
| `Badge` | Unread count |
| `Skeleton` | Loading states |

### Additional Libraries

| Package | Purpose |
|---------|---------|
| `lucide-react` | Icons (consistent, tree-shakeable) |
| `react-plotly.js` | Charts (keep existing) |
| `react-markdown` | Markdown rendering in chat |
| `remark-gfm` | GitHub-flavored markdown |
| `rehype-highlight` | Code syntax highlighting |
| `@tanstack/react-query` | Data fetching + caching |
| `@tanstack/react-virtual` | Virtualized message lists |
| `next-themes` | Dark/light mode toggle |
| `date-fns` | Relative timestamps |
| `sonner` | Toast notifications |

---

## 5. Chat System

### Messenger-Style Architecture

```
+----------------+------------------------+-----------------+
|                |                        |                 |
|  Conversation  |    Active Chat         |   Info Panel    |
|  Sidebar       |                        |   (optional)    |
|  (320px)       |    Messages + Input    |   (320px)       |
|                |                        |                 |
|  - Search      |    - Date separators   |   - Charts tab  |
|  - New Chat    |    - Message bubbles   |   - Files tab   |
|  - Conv list   |    - Typing indicator  |   - Queries tab |
|  - Pinned      |    - Chart renders     |                 |
|  - Recent      |    - Table renders     |                 |
|                |    - Markdown          |                 |
+----------------+------------------------+-----------------+
```

### Conversation Sidebar Features

- **Search bar**: Filter conversations by title/content
- **New Chat button**: Creates a new conversation
- **Conversation list**: Sorted by `updatedAt` DESC
  - Title (auto-generated from first question, user-renameable)
  - Last message preview (truncated ~60 chars)
  - Relative timestamp ("2m ago", "Yesterday", "Mar 25")
  - Unread badge (if user navigated away during streaming)
- **Pinned conversations**: At top, separated by label
- **Context menu** (right-click/long-press):
  - Pin/Unpin
  - Rename
  - Delete
  - Export as PDF

### Chat Panel Features

- **Message bubbles**:
  - User messages: right-aligned, primary color border
  - Assistant messages: left-aligned, muted background
  - Rich markdown rendering (see Section 6)
  - Inline charts (Plotly, interactive)
  - Inline tables (scrollable, styled)
  - File download buttons (CSV exports)
- **Date separators**: "Today", "Yesterday", "March 25, 2026"
- **Typing/loading indicator**: Animated dots while LLM responds
- **Suggested questions**: Shown on empty chat or after each response
- **Copy button**: On each assistant message
- **Scroll to bottom**: Floating button when scrolled up

### Info Panel Features (slide-out)

- **Tabs**:
  - **Charts**: Grid of chart thumbnails from this conversation
  - **Files**: List of CSV/data downloads with re-download buttons
  - **Queries**: List of SQL queries generated in this conversation

### Mobile Behavior

- Show EITHER sidebar OR conversation (not both)
- Back button in chat header to return to sidebar
- Info panel opens as full-screen sheet
- Swipe gestures for navigation (optional, future)

---

## 6. Markdown Rendering

### Stack

```
react-markdown + remark-gfm + remark-math + rehype-highlight + rehype-katex
```

### Features Required

| Feature | Plugin/Method |
|---------|---------------|
| Bold, italic, strikethrough | `remark-gfm` (built-in) |
| Headings (h1-h6) | Built-in, scaled down for chat |
| Bullet/numbered lists | Built-in |
| Tables | `remark-gfm`, custom scrollable wrapper |
| Code blocks + syntax highlighting | `rehype-highlight` + language detection |
| Copy button on code blocks | Custom `code` component override |
| Inline code | Custom styling (background pill) |
| Blockquotes | Custom border-left styling |
| Links | Open in new tab, sanitized |
| Math (LaTeX) | `remark-math` + `rehype-katex` |
| Emojis | Native Unicode (no library needed) |

### Heading Scale for Chat

Headings inside chat bubbles should be smaller than page headings:

```css
.chat-markdown h1 { font-size: 1.2em; font-weight: 700; }
.chat-markdown h2 { font-size: 1.1em; font-weight: 700; }
.chat-markdown h3 { font-size: 1.05em; font-weight: 600; }
```

### Code Block with Copy Button

Every fenced code block gets:
- Language label (top-left)
- Copy button (top-right)
- Dark background (even in light mode)
- Syntax highlighting via highlight.js
- Horizontal scroll for long lines

### LLM Prompt Instruction

Add to the system prompt for the LLM:

```
Formatting rules:
- Use markdown for structured responses (headings, bold, lists, tables)
- Use --- for horizontal rules between sections
- Do NOT use em dashes (-). Use regular dashes (-) or "to" instead.
- Use emoji sparingly for section headers only
- Format SQL in fenced code blocks with ```sql
- Format numbers with proper formatting (commas, percentages, dollar signs)
```

### Streaming Support

For streaming responses from the LLM:
- Split content on paragraph boundaries (double newline)
- Memoize completed paragraphs with `React.memo`
- Only re-render the last (in-progress) paragraph on each token
- This prevents flickering and improves performance

---

## 7. Theme System

### Implementation: next-themes + Tailwind CSS

```bash
npm install next-themes
```

### Color Palette

#### Dark Mode (Default)

```css
:root[data-theme="dark"] {
  --background: #0a0e17;
  --background-secondary: #111827;
  --foreground: #f1f5f9;
  --foreground-muted: #94a3b8;
  --border: rgba(30, 41, 59, 0.6);
  --primary: #6366f1;        /* Indigo */
  --primary-hover: #4f46e5;
  --secondary: #3b82f6;      /* Blue */
  --success: #10b981;        /* Green - retention */
  --danger: #ef4444;         /* Red - churn */
  --warning: #f59e0b;        /* Amber */
  --info: #06b6d4;           /* Cyan */
  --card: #111827;
  --card-hover: #1e293b;
  --sidebar: #0d1321;
  --input: #0c1120;
  --user-bubble: rgba(59, 130, 246, 0.08);
  --bot-bubble: rgba(99, 102, 241, 0.05);
}
```

#### Light Mode

```css
:root[data-theme="light"] {
  --background: #f8fafc;
  --background-secondary: #ffffff;
  --foreground: #0f172a;
  --foreground-muted: #64748b;
  --border: rgba(0, 0, 0, 0.08);
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --secondary: #2563eb;
  --success: #16a34a;
  --danger: #dc2626;
  --warning: #d97706;
  --info: #0891b2;
  --card: #ffffff;
  --card-hover: #f1f5f9;
  --sidebar: #1e293b;         /* Dark sidebar even in light mode */
  --input: #ffffff;
  --user-bubble: rgba(59, 130, 246, 0.08);
  --bot-bubble: rgba(0, 0, 0, 0.02);
}
```

### Theme Toggle Component

- Sun/Moon icon button in sidebar footer or header
- Stored in `localStorage` + cookie (for SSR)
- `next-themes` handles the `data-theme` attribute and flash prevention

### Chart Theme

Plotly charts adapt to theme:
- Dark mode: transparent background, light text, dark grid
- Light mode: white background, dark text, light grid
- Pass theme-aware colors to `<Plot>` layout

---

## 8. Responsive Design

### Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| Mobile | < 768px | Single panel (sidebar OR chat) |
| Tablet | 768px - 1024px | Sidebar (280px) + Chat |
| Desktop | > 1024px | Sidebar (320px) + Chat + Info Panel (optional) |

### Mobile Patterns

- **Conversation list**: Full screen, tap to open chat
- **Chat**: Full screen with back button in header
- **Info panel**: Opens as bottom sheet (slide up)
- **Dashboard**: Single column, stacked cards
- **Data Explorer**: Horizontal scroll on table, stacked filters

### Testing Devices

| Device | Resolution | Test In |
|--------|-----------|---------|
| iPhone SE | 375x667 | Playwright WebKit |
| iPhone 14 Pro | 393x852 | Playwright WebKit |
| iPad | 768x1024 | Playwright WebKit |
| iPad Pro | 1024x1366 | Playwright WebKit |
| Pixel 7 | 412x915 | Playwright Chromium |
| MacBook Air | 1440x900 | Playwright Chromium |
| 1080p Desktop | 1920x1080 | Playwright Chromium |

---

## 9. Cross-Browser Testing

### Playwright Configuration

Test in all major engines:
- **Chromium** (Chrome, Edge, Opera, Brave)
- **Firefox** (Mozilla Firefox)
- **WebKit** (Safari, all iOS browsers)

### Test Cases

```
For each page (chat, dashboard, explorer, login):
  For each breakpoint (mobile 375px, tablet 768px, desktop 1440px):
    For each browser (chromium, firefox, webkit):
      - Page loads without errors
      - All interactive elements are clickable
      - Layout matches expected (no overflow, no overlapping)
      - Dark and light mode render correctly
      - Screenshot comparison (visual regression)
```

### Accessibility

- All interactive elements keyboard-navigable
- ARIA labels on icon buttons
- Color contrast ratio >= 4.5:1
- Focus indicators visible
- Screen reader tested with axe-core

---

## 10. Implementation Phases

### Phase 1: Foundation (Database + Auth + Layout)

1. Set up Neon PostgreSQL database
2. Create Prisma schema (users, accounts, sessions, conversations, messages, attachments)
3. Migrate CRM data from Excel to PostgreSQL
4. Set up NextAuth.js v5 with Google OAuth
5. Create login page
6. Install shadcn/ui + Tailwind CSS
7. Build root layout with theme provider (next-themes)
8. Build responsive sidebar shell (3-panel layout)
9. Set up next-themes for dark/light toggle

### Phase 2: Chat System

1. Build conversation sidebar (list, search, new chat)
2. Build chat panel (message list, input, send)
3. Connect to FastAPI chat endpoint
4. Add markdown rendering (react-markdown + plugins)
5. Add code block copy buttons
6. Add inline chart rendering (Plotly)
7. Add inline table rendering
8. Add CSV download from chat
9. Add typing indicator / loading state
10. Add suggested questions
11. Add date separators between messages
12. Store messages in PostgreSQL via API

### Phase 3: Dashboard + Explorer

1. Rebuild dashboard page with shadcn/ui cards
2. KPI row with animated counters
3. Insight cards
4. Chart grid (Plotly)
5. Rebuild data explorer with filters, table, pagination
6. CSV download

### Phase 4: Chat Enhancements

1. Info panel (charts tab, files tab, queries tab)
2. Conversation rename
3. Conversation delete
4. Conversation pin
5. Conversation search
6. Message copy button
7. Scroll to bottom button

### Phase 5: Polish + Testing

1. Playwright setup with cross-browser config
2. Responsive tests for all pages at all breakpoints
3. Visual regression screenshots
4. Accessibility audit (axe-core)
5. Lighthouse performance audit
6. Loading skeletons for all data-fetching states
7. Error boundaries and fallback UI
8. 404 and error pages

### Phase 6: Deployment

1. Update Docker setup for PostgreSQL
2. Update Caddyfile
3. Set up Neon database in production
4. Configure Google OAuth for production domain
5. CI/CD pipeline update
6. Final testing on telecomco.chat

---

## 11. Database Schema

### Prisma Schema (Complete)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTH ====================

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  conversations Conversation[]
  messages      Message[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ==================== CHAT ====================

model Conversation {
  id        String   @id @default(cuid())
  userId    String
  title     String   @default("New Chat")
  pinned    Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@index([userId, updatedAt])
  @@index([userId, pinned])
}

model Message {
  id             String   @id @default(cuid())
  conversationId String
  userId         String?
  role           String   // "user" | "assistant" | "system"
  content        String
  sqlQuery       String?
  chartType      String?
  chartConfig    Json?
  dataColumns    Json?    // string[]
  dataRows       Json?    // any[][]
  queryTimeMs    Float?
  rowsReturned   Int?
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id])

  @@index([conversationId, createdAt])
}

// ==================== CRM DATA ====================
// The customers table is created via raw SQL migration
// (imported from Excel, not managed by Prisma)
```

### CRM Data in PostgreSQL

The `customers` table stays as raw SQL (not a Prisma model) because:
- It's imported from Excel once
- The LLM generates raw SQL against it
- Prisma doesn't need to manage it
- We create views/indexes via SQL migration

```sql
-- Migration: import CRM data
CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER,
    "State" VARCHAR(2),
    "Account length" INTEGER,
    "Area code" INTEGER,
    "International plan" VARCHAR(3),
    "Voice mail plan" VARCHAR(3),
    "Number vmail messages" INTEGER,
    "Total day minutes" DOUBLE PRECISION,
    "Total day calls" INTEGER,
    "Total day charge" DOUBLE PRECISION,
    "Total eve minutes" DOUBLE PRECISION,
    "Total eve calls" INTEGER,
    "Total eve charge" DOUBLE PRECISION,
    "Total night minutes" DOUBLE PRECISION,
    "Total night calls" INTEGER,
    "Total night charge" DOUBLE PRECISION,
    "Total intl minutes" DOUBLE PRECISION,
    "Total intl calls" INTEGER,
    "Total intl charge" DOUBLE PRECISION,
    "Customer service calls" INTEGER,
    "Churn" BOOLEAN
);

-- Indexes for common queries
CREATE INDEX idx_customers_state ON customers("State");
CREATE INDEX idx_customers_churn ON customers("Churn");
CREATE INDEX idx_customers_intl_plan ON customers("International plan");

-- Pre-computed views (replace DuckDB summary tables)
CREATE MATERIALIZED VIEW overall_kpis AS
SELECT
    COUNT(*) as total_customers,
    SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as total_churned,
    ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct,
    COUNT(DISTINCT "State") as num_states,
    ROUND(AVG("Account length")::numeric, 1) as avg_account_length
FROM customers;

CREATE MATERIALIZED VIEW state_summary AS
SELECT
    "State",
    COUNT(*) as total_customers,
    SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as churned,
    ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct,
    ROUND(AVG("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge")::numeric, 2) as avg_total_charge,
    ROUND(AVG("Customer service calls")::numeric, 2) as avg_service_calls
FROM customers
GROUP BY "State";

CREATE MATERIALIZED VIEW plan_summary AS
SELECT
    "International plan",
    "Voice mail plan",
    COUNT(*) as total_customers,
    ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct,
    ROUND(AVG("Total day minutes")::numeric, 2) as avg_day_minutes,
    ROUND(AVG("Customer service calls")::numeric, 2) as avg_service_calls
FROM customers
GROUP BY "International plan", "Voice mail plan";
```

---

## 12. API Endpoints

### Next.js API Routes (Auth + Chat History)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET/POST | `/api/auth/[...nextauth]` | No | NextAuth.js handlers |
| GET | `/api/conversations` | Yes | List user's conversations |
| POST | `/api/conversations` | Yes | Create new conversation |
| PATCH | `/api/conversations/[id]` | Yes | Rename/pin conversation |
| DELETE | `/api/conversations/[id]` | Yes | Delete conversation |
| GET | `/api/conversations/[id]/messages` | Yes | Get messages (paginated) |
| GET | `/api/conversations/[id]/media` | Yes | Get shared charts/files |

### FastAPI Endpoints (CRM Query Engine)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | No | Health check |
| POST | `/api/chat` | Yes* | NL question -> SQL -> results |
| GET | `/api/dashboard/kpis` | No | KPI metrics |
| GET | `/api/dashboard/insights` | No | Auto-generated insights |
| GET | `/api/dashboard/charts` | No | Dashboard chart data |
| GET | `/api/explorer/filters` | No | Filter options |
| GET | `/api/explorer/data` | No | Paginated data |
| GET | `/api/explorer/download` | No | CSV download |

*Auth token forwarded from Next.js API route

---

## 13. File Structure

```
frontend/
  src/
    app/
      (auth)/
        login/page.tsx              # Google OAuth login page
      (protected)/
        chat/
          layout.tsx                # 3-panel chat layout
          page.tsx                  # Conversation list (default)
          [conversationId]/
            page.tsx                # Active conversation
        dashboard/page.tsx          # KPI dashboard
        explorer/page.tsx           # Data explorer
      api/
        auth/[...nextauth]/route.ts # Auth handlers
        conversations/
          route.ts                  # List + create
          [id]/
            route.ts                # Update + delete
            messages/route.ts       # Get messages
            media/route.ts          # Get shared media
      layout.tsx                    # Root layout (theme + auth)
      page.tsx                      # Landing/redirect
    components/
      auth/
        LoginButton.tsx
        UserMenu.tsx
      chat/
        ConversationSidebar.tsx
        ConversationItem.tsx
        ChatPanel.tsx
        MessageBubble.tsx
        ChatInput.tsx
        ChatMarkdown.tsx            # Markdown renderer
        CodeBlock.tsx               # Code block with copy
        DateSeparator.tsx
        TypingIndicator.tsx
        SuggestedQuestions.tsx
        InfoPanel.tsx
        MediaGallery.tsx
      dashboard/
        KPICard.tsx
        InsightCard.tsx
        ChartGrid.tsx
      explorer/
        FilterBar.tsx
        DataTable.tsx
      layout/
        Sidebar.tsx                 # App navigation sidebar
        ThemeToggle.tsx
      shared/
        Chart.tsx                   # Plotly wrapper
        LoadingSkeleton.tsx
    lib/
      api.ts                        # Backend API client
      auth.ts                       # NextAuth config
      prisma.ts                     # Prisma client singleton
      types.ts                      # TypeScript interfaces
      utils.ts                      # Helpers (date formatting, etc.)
    styles/
      globals.css                   # Tailwind + CSS variables
      markdown.css                  # Chat markdown styles
    prisma/
      schema.prisma
      migrations/
  tests/
    e2e/
      chat.spec.ts
      dashboard.spec.ts
      explorer.spec.ts
      responsive.spec.ts
      auth.spec.ts
    playwright.config.ts
  public/
    favicon.svg
  tailwind.config.ts
  next.config.js
  package.json
  tsconfig.json
```

---

## 14. Deployment

### Docker Compose (Updated)

```yaml
services:
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AUTH_SECRET=${AUTH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on: [backend]
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on: [frontend, backend]
    restart: unless-stopped

volumes:
  caddy_data:
```

### Environment Variables Needed

```env
# Database
DATABASE_URL=postgresql://user:pass@host/telecomco

# Auth
AUTH_SECRET=<random 32+ char string>
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

# LLM
OPENROUTER_API_KEY=sk-or-v1-...

# App
NEXTAUTH_URL=https://telecomco.chat
```

---

## Appendix: LLM Prompt Update

Add to the system prompt for formatting:

```
Response formatting rules:
- Use markdown for all structured responses
- Use ### for section headings, **bold** for emphasis
- Use bullet lists for multiple items
- Use fenced code blocks with language tags for SQL: ```sql
- Use | tables | for | tabular data |
- Use --- for horizontal rules between major sections
- Do NOT use em dashes (-). Use regular dashes (-) or the word "to" instead.
- Use emoji sparingly, only for section header icons
- Format large numbers with commas (3,333 not 3333)
- Format percentages with one decimal (14.5% not 14.4916...)
- Format currency with dollar sign and two decimals ($59.64)
```

---

## 15. LLM Session Management

### Multi-Session Conversation Isolation

Each conversation is completely isolated by design:
- Messages table is keyed by `conversation_id`
- API loads only messages for the active conversation
- LLM is stateless (no server-side memory at OpenRouter/Claude level)
- No cross-conversation leakage is possible

### Token Budget per Request

For Claude Sonnet 4.6 (200K context window):

| Component | Tokens | Notes |
|-----------|--------|-------|
| System prompt + schema + rules + examples | 5-8K | Fixed |
| Conversation history (last 3-5 exchanges) | 5-15K | Include questions + SQL + result summaries |
| Current user question | 100-500 | Variable |
| Reserved for response | 4K | LLM output |
| **Total per request** | **~15-28K** | Well within 200K limit |

### Memory Strategy

**Default: Full history** (for conversations < 50 turns)
- Send all messages. At ~1K tokens/turn, 50 turns = 50K tokens. Safe.

**Fallback: Hybrid** (for conversations > 50 turns)
1. System prompt + schema (full fidelity, always)
2. Conversation summary (LLM-generated, ~1-2K tokens)
3. Last 10 messages verbatim
4. Current question

### What to Include in History

**Include:**
- User's previous questions (natural language)
- Generated SQL (helps with follow-ups like "now break that down by region")
- Whether query succeeded/failed
- Brief result summary ("returned 45 rows, avg churn rate was 26.5%")

**Exclude:**
- Full result datasets (too many tokens)
- Chart config JSON (irrelevant to SQL generation)
- Error stack traces from retries

### When to Start Fresh Context

- User creates "New Chat" (explicit)
- Token count exceeds 80% of window
- 3+ consecutive failures on the same question (history is polluted)

### Anti-Hallucination Strategy

1. **XML-tagged system prompt** (Claude is optimized for this):
   ```xml
   <schema>...</schema>
   <rules>...</rules>
   <examples>...</examples>
   ```

2. **3-5 few-shot examples** covering data quirks:
   - Boolean Churn column (true/false not Yes/No)
   - Column names with spaces (double-quoting)
   - Aggregation queries

3. **Chain-of-thought**: Ask LLM to explain reasoning before writing SQL

4. **Error feedback loop** (existing retry mechanism):
   - Feed exact database error message back
   - Limit to 3 retries
   - Research shows this takes accuracy from ~85% to near-100%

5. **Grounding rule** in system prompt:
   ```
   Always reference specific numbers from query results.
   Never make claims not supported by the data.
   If query returns no data, say so explicitly.
   ```

---

## 16. LLM Framework Decision

### Framework Comparison (Unbiased Research)

| Framework | GitHub Stars | Bundle/Overhead | Verdict |
|-----------|-------------|-----------------|---------|
| **LangChain** | ~95K | +15-25% latency, +83% memory | Overkill for our simple flow |
| **LangGraph** | ~10K | Complex state machines | Only for multi-agent branching |
| **LlamaIndex** | ~38K | RAG-focused | Not relevant (we have fixed schema) |
| **Semantic Kernel** | ~22K | Microsoft/.NET focused | Wrong ecosystem |
| **Vercel AI SDK** | ~12K | Minimal, Next.js native | Best for frontend chat UI |
| **Direct API calls** | N/A | Zero overhead | Best for backend SQL pipeline |

### Decision: Vercel AI SDK (frontend) + Direct OpenRouter calls (backend)

**Why not LangChain:**
- Our flow is: `question -> LLM -> SQL -> execute -> render` (one LLM call + retry)
- LangChain adds abstraction layers we don't need
- 15-25% latency overhead measured in benchmarks
- Frequent breaking API changes
- Community consensus in 2025: "Don't use LangChain for simple chat apps"

**Why Vercel AI SDK for frontend:**
- `useChat` hook handles streaming, message state, loading, errors in ~20 lines
- SSE-based streaming (standard, debuggable)
- `onFinish` callback for message persistence
- `initialMessages` prop for loading conversation history
- `@openrouter/ai-sdk-provider` for direct OpenRouter integration
- First-class Next.js App Router support

**Why direct API calls for backend:**
- Zero overhead
- Full control over prompt construction
- Existing retry-with-error-feedback works perfectly
- SQL validation (sqlglot) stays in Python
- No framework lock-in

### Implementation Pattern

```
Next.js Frontend                    FastAPI Backend
================                    ===============
useChat() hook          -- POST --> /api/chat
  - streams response                  - loads conversation from DB
  - manages UI state                  - builds prompt (system + history + question)
  - onFinish: save to DB              - calls OpenRouter (Claude Sonnet)
  - initialMessages: load from DB     - validates SQL (sqlglot)
                                      - executes on PostgreSQL
                                      - retries on error (up to 3x)
                                      - streams response back
```

### Vercel AI SDK Integration with FastAPI

The Vercel AI SDK's `useChat` can call our FastAPI backend as a custom endpoint:

```typescript
// Frontend: useChat with custom API
const { messages, input, handleSubmit, isLoading } = useChat({
  api: '/api/chat',  // Caddy proxies to FastAPI
  initialMessages: loadedMessages,
  onFinish: async (message) => {
    // Save assistant message to PostgreSQL
    await saveMessage(conversationId, message)
  },
})
```

The FastAPI backend returns a streaming response compatible with the AI SDK's expected format (SSE with text chunks).

### Key Insight from Research

> "A focused 300-token context often outperforms an unfocused 113K-token context."

For SQL tasks, what matters is:
1. The schema (always full fidelity)
2. The current question
3. The last 2-3 exchanges (for follow-ups)

Do NOT blindly stuff all history into the context. Quality over quantity.

---

## 17. Competitive Landscape and Feature Strategy

### Market Research: What Top AI CRM Products Offer

#### Salesforce Einstein AI
- Einstein Copilot: conversational assistant across Sales/Service/Marketing
- Lead scoring (1-100), opportunity scoring, deal risk flags
- Einstein Prediction Builder: no-code custom prediction models (including churn)
- Einstein Discovery: automated statistical analysis, explains patterns in plain English
- Tableau integration for NLQ ("Ask Data")
- Trust Layer: prompt injection defense, PII masking, audit trail
- Pricing: $165-500/user/month for AI features

#### HubSpot Breeze AI
- Breeze Copilot: summarize contacts, draft emails, generate reports
- Breeze Agents: content, social media, prospecting, customer support
- Predictive lead scoring, AI-powered forecasting
- Conversation intelligence (call transcription, competitor mentions)
- AI Report Builder (describe report in English)
- Pricing: $100-150/user/month for AI features

#### Zoho Zia AI
- Zia Ask: strongest NLQ in CRM - type questions, get interactive charts
- Supports follow-up questions (conversation mode)
- Native churn prediction with explainability
- Anomaly detection with proactive alerts
- Data enrichment from public sources
- Pricing: $50-65/user/month (best value)

#### Microsoft Dynamics 365 Copilot
- Power BI integration (best-in-class BI tool)
- Natural language to DAX queries
- Customer Insights CDP with built-in churn/CLV prediction
- Narrative visual: AI-generated text explanations
- Pricing: $105-150/user/month + $1,700/tenant for Customer Insights

#### ThoughtSpot Spotter
- Search-engine style NLQ with 4.6/5 accuracy rating
- Full conversation context retention
- Answer Explainer shows data lineage
- Multi-step analysis across data sources

### Feature Classification

**MUST-HAVE (every competitor has):**
1. AI chat/copilot interface
2. Natural language to data queries
3. Interactive charts and dashboards
4. Data tables with export (CSV/Excel)
5. KPI cards with trend indicators
6. Mobile responsive design
7. Dark/light mode

**DIFFERENTIATOR (only top products have):**
1. NLQ with conversation context (Zoho, ThoughtSpot, Dynamics)
2. Churn prediction with explainability (Zoho, Dynamics - only 2 of 7)
3. Anomaly detection with proactive alerts (Zoho, Dynamics)
4. AI-generated chart explanations in plain English (Salesforce)
5. Transparent SQL showing the query behind the answer (none - our unique feature)
6. Follow-up question suggestions after each response (Zoho, ThoughtSpot)
7. Thumbs up/down feedback on AI responses

**OUR COMPETITIVE ADVANTAGES:**
1. Open-source / self-hosted option (no competitor offers this)
2. Transparent SQL (builds trust - no competitor shows the query)
3. Instant setup (upload data, start querying - no weeks of setup)
4. LLM-agnostic via OpenRouter (no vendor lock-in)
5. Conversational drill-down with context retention
6. 10-100x cheaper than competitors ($0 self-hosted vs $150-500/user/month)
7. Rich markdown responses with inline charts (unique combination)

### Features to Implement (Priority Order)

#### P0 - Core (Phase 1-2)
- [x] Natural language to SQL queries
- [x] Interactive Plotly charts inline in chat
- [x] Data tables with CSV download
- [ ] Conversation history persistence (PostgreSQL)
- [ ] Google OAuth login
- [ ] Multi-conversation support (sidebar)
- [ ] Rich markdown rendering in responses
- [ ] Dark/light theme toggle

#### P1 - Competitive Parity (Phase 3-4)
- [ ] KPI dashboard with trend arrows and sparklines
- [ ] Follow-up question suggestions (2-3 chips after each response)
- [ ] Media gallery (Charts/Files/Queries tabs in info panel)
- [ ] Auto chart type selection with user override
- [ ] Transparent SQL (collapsible "Show query" section)
- [ ] Thumbs up/down feedback on responses
- [ ] Anomaly highlighting on dashboard
- [ ] Suggested questions in empty state (categorized)

#### P2 - Differentiator (Phase 5+)
- [ ] Churn prediction with explainability
- [ ] Customer health scoring (traffic light: red/yellow/green)
- [ ] Anomaly detection with proactive alerts
- [ ] PDF report generation and export
- [ ] Scheduled email reports
- [ ] Chart explanations in plain English
- [ ] Voice input for queries
- [ ] Conversation search across all chats

### UX Patterns to Follow

**Empty State (First Visit):**
- Welcome message with product description
- 4-6 categorized sample queries as clickable chips
- Categories: "Sales metrics", "Churn analysis", "Customer segments", "Billing"
- Each example demonstrates a different capability

**Follow-Up Suggestions:**
- 2-3 contextual suggestion chips below each AI response
- Generated based on the current answer (e.g., after churn by state: "Which state has most improvement?", "Break down by plan type", "Show customer details for top state")

**Feedback Loop:**
- Thumbs up/down on every AI response
- Thumbs down opens optional text field for reason
- Feedback stored in database for quality improvement

**Progressive Disclosure:**
- Show answer first (text + chart)
- Collapsible "Show SQL query" section
- Collapsible "Show raw data" table
- "Download CSV" and "Download chart" buttons

**Dashboard Layout:**
- Top row: 5 KPI cards (customers, churned, churn rate, states, avg tenure)
- Each card: big number + trend arrow + sparkline + delta
- Middle: 2x2 chart grid (state churn, plan comparison, service calls, churn pie)
- Bottom: key insights as cards with indigo left border
