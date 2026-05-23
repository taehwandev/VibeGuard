# Execution Evidence

VibeGuard should not rely only on an agent saying that a command ran. The
long-term guardrail is an execution evidence layer: adapters record what the
agent actually executed, and VibeGuard summarizes the evidence.

This is not a replacement for tests, CI, or code review. It is a lightweight way
to catch a common AI-agent failure mode: reporting that verification happened
when no matching command was observed.

## Local Ledger

VibeGuard records adapter events in:

```text
.vibeguard/session/events.jsonl
```

The ledger is local-only and ignored by Git. Events are JSON lines with redacted
commands and metadata:

```json
{
  "schema": 1,
  "agent": "claude-code",
  "event": "PostToolUse",
  "tool": "Bash",
  "command": "npm test",
  "status": "success",
  "exitCode": 0
}
```

Generate a summary:

```bash
vibeguard evidence .
```

## Claude Code Prototype

Claude Code hooks are the first practical adapter because they can observe tool
execution.

Install the local, non-shared Claude Code hook:

```bash
vibeguard evidence install-claude-hook .
```

This writes `.claude/settings.local.json` and adds ignore rules for the local
settings file and evidence ledger. The command is idempotent and preserves other
Claude Code settings.

The installed hook pipes hook input into VibeGuard:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "npx --yes @taehwandev/vibeguard@latest evidence claude-hook \"${CLAUDE_PROJECT_DIR:-.}\""
          }
        ]
      }
    ],
    "PostToolUseFailure": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "npx --yes @taehwandev/vibeguard@latest evidence claude-hook \"${CLAUDE_PROJECT_DIR:-.}\""
          }
        ]
      }
    ]
  }
}
```

VibeGuard redacts likely secrets before writing the event, including npm access
tokens, provider keys, database URLs, and private keys. It currently tracks
whether these command classes were observed:

- `vibeguard audit .`
- `vibeguard audit . --strict`
- common test commands such as `npm test`, `pytest`, `cargo test`, `go test`,
  and `swift test`

## Adapter Rule

Keep the core ledger agent-neutral. Claude Code, Codex, Antigravity, and future
tools should write the same event shape through small adapters. If an agent has
no reliable hook layer, VibeGuard should say that execution evidence is weak
rather than pretending it is enforced.

## Current Limit

This first version records evidence. It does not yet force rollback, retry, or
completion blocking. Those require a later controller layer that can safely
distinguish agent-owned changes from user-owned changes.
