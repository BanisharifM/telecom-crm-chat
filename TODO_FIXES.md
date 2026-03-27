# Outstanding Issues Tracker (TEMPORARY)

## Architecture
- [x] Switch to Claude tool use (function calling) - llm.py rewritten
- [x] Simplified system prompt for tool use - prompt.py rewritten
- [x] query_service.py updated to use new process_question
- [x] ChatInput component with auto-resize (react-textarea-autosize)
- [x] User messages use whitespace-pre-wrap (preserves newlines)
- [x] Assistant messages use ChatMarkdown (markdown rendering)
- [ ] Test tool use works via OpenRouter after deployment
- [ ] Verify duplicate message flash is gone after tool use deployment

## UI/CSS
- [x] Inline code styling (rgba backgrounds, monospace font)
- [x] Auto-expanding textarea (react-textarea-autosize, 1-8 rows)
- [x] Message actions below bubble (Claude pattern)
- [x] Settings dialog with gear button

## Needs Deployment Verification
- [ ] Tool use: "great"/"thanks" handled conversationally
- [ ] Tool use: "why?" explains without re-querying
- [ ] Tool use: "show as pie" modifies previous query
- [ ] Multi-query: "top 5 and bottom 5" works with UNION ALL
- [ ] Inline code readable in dark mode
- [ ] Settings dialog opens from gear icon
- [ ] Textarea expands with content
- [ ] User message newlines preserved
