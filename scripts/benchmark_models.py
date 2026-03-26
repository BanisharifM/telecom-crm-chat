#!/usr/bin/env python3
"""Benchmark multiple OpenRouter models for text-to-SQL on the telecom CRM dataset."""

from __future__ import annotations

import json
import time
import traceback
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from app.core.config import Settings
from app.core.database import init_database, execute_query
from app.core.llm import create_client, generate_sql, LLMResponse
from app.core.sql_validator import validate_sql, fuzzy_fix_columns, SQLValidationError

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODELS = [
    "anthropic/claude-sonnet-4.6",
    "anthropic/claude-sonnet-4",
    "anthropic/claude-3.5-sonnet",
    "google/gemini-2.5-flash",
    "openai/gpt-4o-mini",
]

# Approximate cost per 1M tokens (input/output) from OpenRouter pricing
# Used only for rough estimates
COST_PER_1M = {
    "anthropic/claude-sonnet-4.6":  {"input": 3.0,  "output": 15.0},
    "anthropic/claude-sonnet-4":    {"input": 3.0,  "output": 15.0},
    "anthropic/claude-3.5-sonnet":  {"input": 3.0,  "output": 15.0},
    "google/gemini-2.5-flash":      {"input": 0.15, "output": 0.60},
    "openai/gpt-4o-mini":           {"input": 0.15, "output": 0.60},
}

TEST_QUESTIONS = [
    {"question": "What is the overall churn rate?", "difficulty": "Simple"},
    {"question": "Show churn rate by state, top 10", "difficulty": "Medium"},
    {"question": "Average monthly bill in California", "difficulty": "Medium"},
    {
        "question": "Compare churn rates for customers with and without international plans",
        "difficulty": "Complex",
    },
    {"question": "Which states have above-average churn rates?", "difficulty": "Complex"},
    {
        "question": "Show the correlation between customer service calls and churn, grouped by number of calls",
        "difficulty": "Hard",
    },
    {
        "question": "What's the 90th percentile of total charges for churned vs non-churned customers?",
        "difficulty": "Hard",
    },
    {
        "question": "Show me customer trends over time",
        "difficulty": "Edge",
    },
]

# Estimated prompt tokens (system + question) per request — rough constant
EST_INPUT_TOKENS = 1500
EST_OUTPUT_TOKENS = 300


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class TestResult:
    model: str
    question: str
    difficulty: str
    latency_s: float = 0.0
    sql: str = ""
    explanation: str = ""
    validation_ok: bool = False
    execution_ok: bool = False
    rows_returned: int = 0
    error: str = ""


@dataclass
class ModelSummary:
    model: str
    total: int = 0
    valid_sql: int = 0
    executed: int = 0
    non_empty: int = 0
    avg_latency: float = 0.0
    est_cost_per_query: float = 0.0
    results: list[TestResult] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Benchmark logic
# ---------------------------------------------------------------------------

def run_benchmark() -> list[ModelSummary]:
    settings = Settings()
    client = create_client(settings)

    project_root = Path(__file__).resolve().parent.parent
    data_file = str(project_root / settings.data_file)

    print("Initializing DuckDB database...")
    conn = init_database(data_file)
    row_count = conn.execute("SELECT COUNT(*) FROM customers").fetchone()[0]
    print(f"Database ready: {row_count} rows\n")

    summaries: list[ModelSummary] = []

    for model in MODELS:
        short = model.split("/")[-1]
        print(f"{'='*70}")
        print(f"  MODEL: {model}")
        print(f"{'='*70}")

        summary = ModelSummary(model=model, total=len(TEST_QUESTIONS))
        latencies: list[float] = []

        for i, tq in enumerate(TEST_QUESTIONS, 1):
            q = tq["question"]
            diff = tq["difficulty"]
            print(f"\n  [{i}/{len(TEST_QUESTIONS)}] ({diff}) {q}")

            result = TestResult(model=model, question=q, difficulty=diff)

            # 1. Generate SQL via LLM
            try:
                t0 = time.time()
                llm_resp: LLMResponse = generate_sql(client, q, model=model)
                result.latency_s = round(time.time() - t0, 2)
                result.sql = llm_resp.sql
                result.explanation = llm_resp.explanation
                latencies.append(result.latency_s)
                print(f"        Latency: {result.latency_s}s")
                print(f"        SQL: {result.sql[:120]}...")
            except Exception as e:
                result.latency_s = round(time.time() - t0, 2)
                result.error = f"LLM error: {e}"
                print(f"        ERROR (LLM): {e}")
                summary.results.append(result)
                continue

            # 2. Validate SQL
            try:
                fixed_sql = fuzzy_fix_columns(result.sql)
                validated_sql = validate_sql(fixed_sql)
                result.validation_ok = True
                print(f"        Validation: PASS")
            except SQLValidationError as e:
                result.error = f"Validation error: {e}"
                print(f"        Validation: FAIL — {e}")
                summary.results.append(result)
                continue

            # 3. Execute against DuckDB
            try:
                df = execute_query(conn, validated_sql)
                result.execution_ok = True
                result.rows_returned = len(df)
                print(f"        Execution: PASS ({len(df)} rows)")
            except Exception as e:
                result.error = f"Execution error: {e}"
                print(f"        Execution: FAIL — {e}")

            summary.results.append(result)

        # Compute summary
        summary.valid_sql = sum(1 for r in summary.results if r.validation_ok)
        summary.executed = sum(1 for r in summary.results if r.execution_ok)
        summary.non_empty = sum(1 for r in summary.results if r.rows_returned > 0)
        summary.avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 0.0

        pricing = COST_PER_1M.get(model, {"input": 3.0, "output": 15.0})
        summary.est_cost_per_query = round(
            (EST_INPUT_TOKENS * pricing["input"] + EST_OUTPUT_TOKENS * pricing["output"]) / 1_000_000,
            5,
        )

        summaries.append(summary)
        print(f"\n  Summary: {summary.valid_sql}/{summary.total} valid, "
              f"{summary.executed}/{summary.total} executed, "
              f"avg latency {summary.avg_latency}s\n")

    conn.close()
    return summaries


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------

def generate_report(summaries: list[ModelSummary]) -> str:
    lines: list[str] = []
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines.append(f"# Text-to-SQL Model Benchmark Results")
    lines.append(f"**Date:** {now}")
    lines.append(f"**Questions:** {len(TEST_QUESTIONS)} | **Models:** {len(MODELS)}")
    lines.append("")

    # Comparison table
    lines.append("## Summary Comparison")
    lines.append("")
    lines.append("| Model | Valid SQL | Executed | Non-Empty | Avg Latency (s) | Est. Cost/Query |")
    lines.append("|-------|----------|----------|-----------|-----------------|----------------|")
    for s in summaries:
        short = s.model.split("/")[-1]
        lines.append(
            f"| {short} | {s.valid_sql}/{s.total} | {s.executed}/{s.total} | "
            f"{s.non_empty}/{s.total} | {s.avg_latency} | ${s.est_cost_per_query:.5f} |"
        )
    lines.append("")

    # Scoring: rank models
    lines.append("## Scoring (weighted)")
    lines.append("")
    lines.append("Weights: Valid SQL = 1pt, Executes = 1pt, Non-Empty = 1pt, Latency bonus (< 3s = 0.5pt)")
    lines.append("")
    scored = []
    for s in summaries:
        score = s.valid_sql + s.executed + s.non_empty + (0.5 if s.avg_latency < 3.0 else 0)
        scored.append((s.model.split("/")[-1], score, s))
    scored.sort(key=lambda x: x[1], reverse=True)
    for rank, (name, score, _) in enumerate(scored, 1):
        lines.append(f"{rank}. **{name}** — {score:.1f} pts")
    lines.append("")

    # Per-question detail
    lines.append("## Detailed Results by Question")
    lines.append("")
    for tq in TEST_QUESTIONS:
        q = tq["question"]
        diff = tq["difficulty"]
        lines.append(f"### [{diff}] {q}")
        lines.append("")
        lines.append("| Model | Latency | Valid | Executes | Rows | Error |")
        lines.append("|-------|---------|-------|----------|------|-------|")
        for s in summaries:
            for r in s.results:
                if r.question == q:
                    short = s.model.split("/")[-1]
                    err = r.error[:60].replace("|", "/") if r.error else ""
                    lines.append(
                        f"| {short} | {r.latency_s}s | "
                        f"{'Y' if r.validation_ok else 'N'} | "
                        f"{'Y' if r.execution_ok else 'N'} | "
                        f"{r.rows_returned} | {err} |"
                    )
        lines.append("")

    # SQL samples
    lines.append("## Generated SQL Samples")
    lines.append("")
    for s in summaries:
        short = s.model.split("/")[-1]
        lines.append(f"### {short}")
        lines.append("")
        for r in s.results:
            status = "OK" if r.execution_ok else "FAIL"
            lines.append(f"**[{r.difficulty}] {r.question}** [{status}]")
            if r.sql:
                lines.append(f"```sql\n{r.sql}\n```")
            if r.error:
                lines.append(f"> Error: {r.error}")
            lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 70)
    print("  TEXT-TO-SQL MODEL BENCHMARK")
    print("=" * 70)
    print()

    summaries = run_benchmark()

    report = generate_report(summaries)
    out_path = Path(__file__).resolve().parent / "benchmark_results.md"
    out_path.write_text(report)
    print(f"\nReport saved to: {out_path}")
    print("\n" + report)
