# Vibe-Guard Operating Policy

Vibe-Guard blocks or fixes avoidable mistakes before AI-generated code changes a
project.

## Default Gates

| Gate | Status Meaning | Default Action |
| --- | --- | --- |
| Security | Secrets, auth, permissions, unsafe storage | Stop or auto-quarantine |
| Cost | Paid APIs, model calls, cloud services, large files | Require budget guardrails |
| Data | DB writes, migrations, destructive actions, user data | Require backup or staging |
| Structure | Large files, unclear boundaries, risky scripts | Split or ask for plan |

## Agent Rule

When Vibe-Guard finds an issue the tool can fix safely, it should fix it before
asking the user. Ask the user only when the next step can destroy data, spend
money, deploy externally, or requires private credentials.

## Secret Rule

Never print detected secret values. If a secret may have been committed or shared,
rotate it even after moving it into an ignored env file.

