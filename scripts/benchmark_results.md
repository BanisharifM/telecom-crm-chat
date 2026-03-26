# Text-to-SQL Model Benchmark Results
**Date:** 2026-03-26 01:10:51
**Questions:** 8 | **Models:** 5

## Summary Comparison

| Model | Valid SQL | Executed | Non-Empty | Avg Latency (s) | Est. Cost/Query |
|-------|----------|----------|-----------|-----------------|----------------|
| claude-sonnet-4.6 | 8/8 | 8/8 | 8/8 | 3.87 | $0.00900 |
| claude-sonnet-4 | 8/8 | 8/8 | 8/8 | 2.66 | $0.00900 |
| claude-3.5-sonnet | 6/8 | 6/8 | 6/8 | 4.7 | $0.00900 |
| gemini-2.5-flash | 8/8 | 8/8 | 8/8 | 1.06 | $0.00040 |
| gpt-4o-mini | 8/8 | 8/8 | 8/8 | 2.84 | $0.00040 |

## Scoring (weighted)

Weights: Valid SQL = 1pt, Executes = 1pt, Non-Empty = 1pt, Latency bonus (< 3s = 0.5pt)

1. **claude-sonnet-4** — 24.5 pts
2. **gemini-2.5-flash** — 24.5 pts
3. **gpt-4o-mini** — 24.5 pts
4. **claude-sonnet-4.6** — 24.0 pts
5. **claude-3.5-sonnet** — 18.0 pts

## Detailed Results by Question

### [Simple] What is the overall churn rate?

| Model | Latency | Valid | Executes | Rows | Error |
|-------|---------|-------|----------|------|-------|
| claude-sonnet-4.6 | 3.86s | Y | Y | 1 |  |
| claude-sonnet-4 | 1.53s | Y | Y | 1 |  |
| claude-3.5-sonnet | 3.93s | Y | Y | 1 |  |
| gemini-2.5-flash | 0.77s | Y | Y | 1 |  |
| gpt-4o-mini | 2.03s | Y | Y | 1 |  |

### [Medium] Show churn rate by state, top 10

| Model | Latency | Valid | Executes | Rows | Error |
|-------|---------|-------|----------|------|-------|
| claude-sonnet-4.6 | 2.18s | Y | Y | 10 |  |
| claude-sonnet-4 | 2.08s | Y | Y | 10 |  |
| claude-3.5-sonnet | 3.58s | Y | Y | 10 |  |
| gemini-2.5-flash | 0.81s | Y | Y | 10 |  |
| gpt-4o-mini | 3.13s | Y | Y | 10 |  |

### [Medium] Average monthly bill in California

| Model | Latency | Valid | Executes | Rows | Error |
|-------|---------|-------|----------|------|-------|
| claude-sonnet-4.6 | 3.31s | Y | Y | 1 |  |
| claude-sonnet-4 | 2.36s | Y | Y | 1 |  |
| claude-3.5-sonnet | 3.62s | Y | Y | 1 |  |
| gemini-2.5-flash | 0.95s | Y | Y | 1 |  |
| gpt-4o-mini | 2.53s | Y | Y | 1 |  |

### [Complex] Compare churn rates for customers with and without international plans

| Model | Latency | Valid | Executes | Rows | Error |
|-------|---------|-------|----------|------|-------|
| claude-sonnet-4.6 | 3.52s | Y | Y | 4 |  |
| claude-sonnet-4 | 2.91s | Y | Y | 4 |  |
| claude-3.5-sonnet | 5.04s | Y | Y | 4 |  |
| gemini-2.5-flash | 0.88s | Y | Y | 4 |  |
| gpt-4o-mini | 3.63s | Y | Y | 2 |  |

### [Complex] Which states have above-average churn rates?

| Model | Latency | Valid | Executes | Rows | Error |
|-------|---------|-------|----------|------|-------|
| claude-sonnet-4.6 | 3.01s | Y | Y | 23 |  |
| claude-sonnet-4 | 2.26s | Y | Y | 23 |  |
| claude-3.5-sonnet | 4.91s | N | N | 0 | Validation error: Unknown table: 'avg_churn'. Available tabl |
| gemini-2.5-flash | 0.96s | Y | Y | 23 |  |
| gpt-4o-mini | 2.76s | Y | Y | 23 |  |

### [Hard] Show the correlation between customer service calls and churn, grouped by number of calls

| Model | Latency | Valid | Executes | Rows | Error |
|-------|---------|-------|----------|------|-------|
| claude-sonnet-4.6 | 4.88s | Y | Y | 10 |  |
| claude-sonnet-4 | 3.25s | Y | Y | 10 |  |
| claude-3.5-sonnet | 4.25s | Y | Y | 10 |  |
| gemini-2.5-flash | 1.56s | Y | Y | 10 |  |
| gpt-4o-mini | 3.93s | Y | Y | 10 |  |

### [Hard] What's the 90th percentile of total charges for churned vs non-churned customers?

| Model | Latency | Valid | Executes | Rows | Error |
|-------|---------|-------|----------|------|-------|
| claude-sonnet-4.6 | 4.88s | Y | Y | 2 |  |
| claude-sonnet-4 | 3.32s | Y | Y | 2 |  |
| claude-3.5-sonnet | 7.16s | N | N | 0 | Validation error: Unknown table: 'charges'. Available tables |
| gemini-2.5-flash | 1.53s | Y | Y | 2 |  |
| gpt-4o-mini | 2.64s | Y | Y | 2 |  |

### [Edge] Show me customer trends over time

| Model | Latency | Valid | Executes | Rows | Error |
|-------|---------|-------|----------|------|-------|
| claude-sonnet-4.6 | 5.34s | Y | Y | 212 |  |
| claude-sonnet-4 | 3.6s | Y | Y | 100 |  |
| claude-3.5-sonnet | 5.07s | Y | Y | 1 |  |
| gemini-2.5-flash | 1.01s | Y | Y | 1 |  |
| gpt-4o-mini | 2.08s | Y | Y | 212 |  |

## Generated SQL Samples

### claude-sonnet-4.6

**[Simple] What is the overall churn rate?** [OK]
```sql
SELECT total_customers, total_churned, churn_rate_pct FROM overall_kpis
```

**[Medium] Show churn rate by state, top 10** [OK]
```sql
SELECT "State", churn_rate_pct, total_customers, churned FROM state_summary ORDER BY churn_rate_pct DESC LIMIT 10
```

**[Medium] Average monthly bill in California** [OK]
```sql
SELECT ROUND(AVG("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge"), 2) as avg_monthly_bill, COUNT(*) as total_customers FROM customers WHERE "State" = 'CA'
```

**[Complex] Compare churn rates for customers with and without international plans** [OK]
```sql
SELECT "International plan", total_customers, churn_rate_pct, avg_service_calls FROM plan_summary GROUP BY "International plan", total_customers, churn_rate_pct, avg_service_calls ORDER BY churn_rate_pct DESC
```

**[Complex] Which states have above-average churn rates?** [OK]
```sql
SELECT "State", churn_rate_pct, total_customers, churned FROM state_summary WHERE churn_rate_pct > (SELECT churn_rate_pct FROM overall_kpis) ORDER BY churn_rate_pct DESC
```

**[Hard] Show the correlation between customer service calls and churn, grouped by number of calls** [OK]
```sql
SELECT "Customer service calls", COUNT(*) as total_customers, SUM(CASE WHEN "Churn" = true THEN 1 ELSE 0 END) as churned_customers, ROUND(AVG(CASE WHEN "Churn" = true THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct FROM customers GROUP BY "Customer service calls" ORDER BY "Customer service calls"
```

**[Hard] What's the 90th percentile of total charges for churned vs non-churned customers?** [OK]
```sql
SELECT CASE WHEN "Churn" THEN 'Churned' ELSE 'Active' END as status, ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY "Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge"), 2) as p90_total_charge FROM customers GROUP BY "Churn"
```

**[Edge] Show me customer trends over time** [OK]
```sql
SELECT "Account length", COUNT(*) as num_customers, ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct, ROUND(AVG("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge"), 2) as avg_total_charge FROM customers GROUP BY "Account length" ORDER BY "Account length"
```

### claude-sonnet-4

**[Simple] What is the overall churn rate?** [OK]
```sql
SELECT total_customers, total_churned, churn_rate_pct FROM overall_kpis
```

**[Medium] Show churn rate by state, top 10** [OK]
```sql
SELECT "State", churn_rate_pct, total_customers FROM state_summary ORDER BY churn_rate_pct DESC LIMIT 10
```

**[Medium] Average monthly bill in California** [OK]
```sql
SELECT ROUND(AVG("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge"), 2) as avg_monthly_bill FROM customers WHERE "State" = 'CA'
```

**[Complex] Compare churn rates for customers with and without international plans** [OK]
```sql
SELECT "International plan", total_customers, churn_rate_pct FROM plan_summary WHERE "Voice mail plan" IS NOT NULL GROUP BY "International plan", total_customers, churn_rate_pct ORDER BY "International plan"
```

**[Complex] Which states have above-average churn rates?** [OK]
```sql
SELECT "State", churn_rate_pct, total_customers FROM state_summary WHERE churn_rate_pct > (SELECT churn_rate_pct FROM overall_kpis) ORDER BY churn_rate_pct DESC
```

**[Hard] Show the correlation between customer service calls and churn, grouped by number of calls** [OK]
```sql
SELECT "Customer service calls", COUNT(*) as total_customers, SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as churned_customers, ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct FROM customers GROUP BY "Customer service calls" ORDER BY "Customer service calls"
```

**[Hard] What's the 90th percentile of total charges for churned vs non-churned customers?** [OK]
```sql
SELECT CASE WHEN "Churn" THEN 'Churned' ELSE 'Active' END as customer_status, ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY ("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge")), 2) as percentile_90_total_charge FROM customers GROUP BY "Churn"
```

**[Edge] Show me customer trends over time** [OK]
```sql
SELECT "Account length", COUNT(*) as num_customers, ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct FROM customers GROUP BY "Account length" ORDER BY "Account length" LIMIT 100
```

### claude-3.5-sonnet

**[Simple] What is the overall churn rate?** [OK]
```sql
SELECT total_customers, total_churned, churn_rate_pct FROM overall_kpis
```

**[Medium] Show churn rate by state, top 10** [OK]
```sql
SELECT "State", churn_rate_pct, total_customers FROM state_summary ORDER BY churn_rate_pct DESC LIMIT 10
```

**[Medium] Average monthly bill in California** [OK]
```sql
SELECT ROUND(AVG("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge"), 2) as avg_monthly_bill FROM customers WHERE "State" = 'CA'
```

**[Complex] Compare churn rates for customers with and without international plans** [OK]
```sql
SELECT "International plan", total_customers, churn_rate_pct, avg_service_calls FROM plan_summary WHERE "Voice mail plan" IN ('Yes', 'No') ORDER BY "International plan"
```

**[Complex] Which states have above-average churn rates?** [FAIL]
```sql
WITH avg_churn AS (SELECT AVG(churn_rate_pct) as avg_churn_rate FROM state_summary) SELECT s."State", s.churn_rate_pct, s.total_customers FROM state_summary s, avg_churn WHERE s.churn_rate_pct > avg_churn.avg_churn_rate ORDER BY s.churn_rate_pct DESC
```
> Error: Validation error: Unknown table: 'avg_churn'. Available tables: customers, overall_kpis, plan_summary, state_summary

**[Hard] Show the correlation between customer service calls and churn, grouped by number of calls** [OK]
```sql
SELECT "Customer service calls", COUNT(*) as total_customers, SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as churned_customers, ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate_pct FROM customers GROUP BY "Customer service calls" ORDER BY "Customer service calls"
```

**[Hard] What's the 90th percentile of total charges for churned vs non-churned customers?** [FAIL]
```sql
WITH charges AS (SELECT "Churn", ("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge") as total_charge FROM customers) SELECT CASE WHEN "Churn" THEN 'Churned' ELSE 'Active' END as status, ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY total_charge), 2) as p90_total_charge, COUNT(*) as customer_count FROM charges GROUP BY "Churn" ORDER BY status
```
> Error: Validation error: Unknown table: 'charges'. Available tables: customers, overall_kpis, plan_summary, state_summary

**[Edge] Show me customer trends over time** [OK]
```sql
SELECT 'N/A' as message
```

### gemini-2.5-flash

**[Simple] What is the overall churn rate?** [OK]
```sql
SELECT total_customers, total_churned, churn_rate_pct FROM overall_kpis
```

**[Medium] Show churn rate by state, top 10** [OK]
```sql
SELECT "State", churn_rate_pct, total_customers FROM state_summary ORDER BY churn_rate_pct DESC LIMIT 10
```

**[Medium] Average monthly bill in California** [OK]
```sql
SELECT AVG("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge") AS average_monthly_bill FROM customers WHERE "State" = 'CA'
```

**[Complex] Compare churn rates for customers with and without international plans** [OK]
```sql
SELECT "International plan", churn_rate_pct FROM plan_summary WHERE "Voice mail plan" = 'No' OR "Voice mail plan" = 'Yes' GROUP BY "International plan", churn_rate_pct ORDER BY "International plan"
```

**[Complex] Which states have above-average churn rates?** [OK]
```sql
SELECT "State", churn_rate_pct FROM state_summary WHERE churn_rate_pct > (SELECT AVG(churn_rate_pct) FROM state_summary) ORDER BY churn_rate_pct DESC
```

**[Hard] Show the correlation between customer service calls and churn, grouped by number of calls** [OK]
```sql
SELECT "Customer service calls", COUNT(*) AS total_customers, SUM(CASE WHEN Churn THEN 1 ELSE 0 END) AS churned_customers, ROUND(AVG(CASE WHEN Churn THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct FROM customers GROUP BY "Customer service calls" ORDER BY "Customer service calls"
```

**[Hard] What's the 90th percentile of total charges for churned vs non-churned customers?** [OK]
```sql
SELECT
    CASE WHEN "Churn" THEN 'Churned' ELSE 'Active' END AS churn_status,
    APPROX_QUANTILE("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge", 0.90) AS p90_total_charge
FROM
    customers
GROUP BY
    churn_status;
```

**[Edge] Show me customer trends over time** [OK]
```sql
SELECT 'No time-based data available in this dataset.' as message
```

### gpt-4o-mini

**[Simple] What is the overall churn rate?** [OK]
```sql
SELECT total_customers, total_churned, churn_rate_pct FROM overall_kpis
```

**[Medium] Show churn rate by state, top 10** [OK]
```sql
SELECT "State", churn_rate_pct, total_customers FROM state_summary ORDER BY churn_rate_pct DESC LIMIT 10
```

**[Medium] Average monthly bill in California** [OK]
```sql
SELECT ROUND(AVG("Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge"), 2) as avg_monthly_bill FROM customers WHERE "State" = 'CA'
```

**[Complex] Compare churn rates for customers with and without international plans** [OK]
```sql
SELECT "International plan", COUNT(*) as total, SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as churned, ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate FROM customers GROUP BY "International plan"
```

**[Complex] Which states have above-average churn rates?** [OK]
```sql
SELECT "State", churn_rate_pct FROM state_summary WHERE churn_rate_pct > (SELECT AVG(churn_rate_pct) FROM state_summary) ORDER BY churn_rate_pct DESC
```

**[Hard] Show the correlation between customer service calls and churn, grouped by number of calls** [OK]
```sql
SELECT "Customer service calls", COUNT(*) as num_customers, SUM(CASE WHEN "Churn" THEN 1 ELSE 0 END) as churned, ROUND(AVG(CASE WHEN "Churn" THEN 1.0 ELSE 0.0 END) * 100, 2) as churn_rate FROM customers GROUP BY "Customer service calls" ORDER BY "Customer service calls"
```

**[Hard] What's the 90th percentile of total charges for churned vs non-churned customers?** [OK]
```sql
SELECT "Churn", PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY "Total day charge" + "Total eve charge" + "Total night charge" + "Total intl charge") as percentile_90_total_charge FROM customers GROUP BY "Churn"
```

**[Edge] Show me customer trends over time** [OK]
```sql
SELECT "Account length", COUNT(*) as num_customers FROM customers GROUP BY "Account length" ORDER BY "Account length"
```
