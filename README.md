# TelecomCo CRM Chat

A natural-language chat interface for querying telecom CRM data. Ask questions in plain English, get answers with interactive charts and downloadable tables.

## Features

### Chat Interface
- Ask natural-language questions about customer data
- Automatic SQL generation via Claude (Sonnet 4.6)
- Interactive Plotly charts with auto-selected chart types
- Conversation context for follow-up questions
- SQL transparency — view the generated query for every answer

### Dashboard
- KPI overview cards (total customers, churn rate, states)
- Pre-computed insights (e.g., "International plan holders churn 3.7x more")
- Four auto-generated charts: churn by state, by plan, service call distribution, churn breakdown

### Data Explorer
- Interactive filters (state, plan, churn status)
- Sortable/searchable data table
- CSV export

## Architecture

```
User Question
    │
    ▼
┌─────────────────┐
│ Claude Sonnet 4.6│  via OpenRouter API
│ (text-to-SQL)   │  Returns: SQL + chart config + explanation
└────────┬────────┘
         │
    ▼────▼────▼
┌──────────────────┐
│ SQL Validation    │  sqlglot schema check → fuzzy column fix → LIMIT enforcement
│ (3 retry loop)   │  Blocks: DROP, DELETE, INSERT, UPDATE (read-only)
└────────┬─────────┘
         │
    ▼────▼
┌──────────────────┐
│ DuckDB           │  In-process OLAP database
│ (analytical SQL) │  Pre-computed summary tables for fast responses
└────────┬─────────┘
         │
    ▼────▼
┌──────────────────┐
│ Streamlit UI      │  Chat + Dashboard + Data Explorer
│ + Plotly charts   │  Custom dark CRM theme, responsive
└──────────────────┘
```

### Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Database | DuckDB | Native xlsx reading, best analytical SQL dialect, in-process (no server), LLMs trained on PostgreSQL-like syntax |
| LLM | Claude Sonnet 4.6 | 94% accuracy on BI-style SQL benchmarks, best accuracy/cost ratio |
| Frontend | Streamlit | Best table + chart rendering of Python chat frameworks, fastest to build |
| Charts | Plotly | JSON spec that LLMs can generate directly, 40+ chart types, built-in export |
| SQL Validation | sqlglot | Parse-based schema validation catches hallucinated columns/tables before execution |
| API | OpenRouter | Multi-model access, OpenAI-compatible SDK, easy to swap models |

### Security

- **Read-only database**: All queries execute against DuckDB, which is loaded in-memory. No write operations possible.
- **SQL allowlisting**: Only SELECT statements are permitted. DROP, DELETE, INSERT, UPDATE, ALTER are blocked at the validation layer.
- **Schema validation**: Generated SQL is parsed and all table/column references are verified against the actual schema before execution.
- **Result limits**: All queries are capped at 500 rows. Query timeout is 30 seconds.
- **No PII exposure**: The dataset contains no personally identifiable information.

## Quick Start

### Prerequisites
- Python 3.11+
- An OpenRouter API key ([get one here](https://openrouter.ai/keys))

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd telecom-crm-chat

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set your API key
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY

# Run the app
PYTHONPATH=src streamlit run streamlit_app.py
```

The app will open at `http://localhost:8501`.

### Docker

```bash
docker build -t telecom-crm-chat .
docker run -p 8501:8501 -e OPENROUTER_API_KEY=your-key telecom-crm-chat
```

### Running Tests

```bash
PYTHONPATH=src pytest tests/ -v
```

## Project Structure

```
├── streamlit_app.py              # Main entry point (3 pages)
├── src/app/core/
│   ├── config.py                 # Settings from environment
│   ├── database.py               # DuckDB init + schema + summary tables
│   ├── llm.py                    # OpenRouter client + SQL generation
│   ├── prompt.py                 # System prompt + few-shot examples
│   ├── query_service.py          # Pipeline orchestrator with retry
│   └── sql_validator.py          # SQL validation + fuzzy column fixes
├── src/app/ui/
│   ├── charts.py                 # Plotly CRM theme + chart creation
│   └── styles.py                 # Custom CSS
├── tests/
│   ├── unit/test_sql_validator.py
│   └── integration/test_database.py
├── data-agent-task/
│   ├── churn-bigml-full.xlsx     # CRM dataset (3,333 customers)
│   └── churn-metadata.md         # Column descriptions
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

## Dataset

3,333 telecom customers with 21 columns:
- **Demographics**: State, Area code, Account length
- **Plans**: International plan, Voice mail plan
- **Usage**: Day/Evening/Night/International minutes, calls, charges
- **Service**: Customer service calls
- **Target**: Churn (boolean)

## What I Would Add With More Time

1. **Semantic caching**: Cache LLM responses by question embedding similarity (92%+ hit ratio for equivalent queries)
2. **Platform integrations**: Slack bot (via Bolt) and Microsoft Teams bot (via Azure Bot Service) — the FastAPI-extractable architecture makes this a thin adapter layer
3. **Churn prediction**: Simple logistic regression for per-customer risk scoring with feature importance visualization
4. **Conversation memory**: Persistent chat history across sessions with semantic search
5. **Power BI integration**: Custom visual embedding for enterprise dashboard workflows
6. **Query explanation**: Bidirectional validation — translate SQL back to English to verify intent match

## Author

**Mahdi BanisharifDehkordi** — [msharif@iastate.edu](mailto:msharif@iastate.edu)

Prior work: ["Automatic Generation of Business Intelligence Chatbot for Organizations" (IEEE CSICC 2022)](https://ieeexplore.ieee.org/document/9780490/)
