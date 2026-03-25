# Case Study

Imagine you are a Customer Success Engineer at TelecomCo, a national telecommunications provider. You have access to a CRM data extract covering multiple customers over the past 12 months. Your goal is to provide a chat interface for marketers to access information about your dataset.

## Data

- A CRM extract in CSV format (one row per TelecomCo customer)
- A separate file describing the dataset columns

## Requirements

Build a simple chat UI (it does not need to be visually polished), where the user should be able to type natural-language questions such as:

"What is the average monthly bill in California?"

"How many customers churned in the last 3 months?"

"Show me the 10 highest-spending customers."

The system should use an LLM to convert the user's message into a SQL query, execute the SQL query against the dataset, then return a clear answer to the user (text + table/plot).

## Technical Constraints

- Use any frontend stack you are comfortable with
- You may use any charting or visualization library
- You are welcome to use AI coding tools, frameworks, or libraries to speed up development, but you should be able to clearly explain:
  - How your code works
  - The key design and technical decisions you made

Do not spend more than 4 hours on this! If you have additional time, you're welcome to extend the system in any direction you find interesting. We're less interested in polish and more interested in seeing how you think about what's valuable to add and why.