# VibeGuard Operating Policy

VibeGuard blocks or fixes avoidable mistakes before AI-generated code changes a
project.

## Default Gates

| Gate | Status Meaning | Default Action |
| --- | --- | --- |
| Security | Secrets, auth, permissions, unsafe storage | Stop or auto-quarantine |
| Cost | Paid APIs, model calls, cloud services, recurring infrastructure | Require budget guardrails and simpler alternatives |
| Data | DB writes, migrations, destructive actions, user data | Require backup or staging |
| Structure | Large files, unclear boundaries, risky scripts | Split or ask for plan |
| Repository | Wrong remote, public/unknown visibility, sensitive Git changes | Verify target before commit or push |

## Agent Rule

When VibeGuard finds an issue the tool can fix safely, it should fix it before
asking the user. Ask the user only when the next step can destroy data, spend
money, deploy externally, or requires private credentials.

## Update Cadence Rule

Do not refresh VibeGuard on every task. Run the audit first. If the audit says
the local guardrails are stale, run
`npx --yes @taehwandev/vibeguard@latest update .` once and rerun the audit.
The default refresh interval is 7 days and can be tuned in `.vibeguard.json`.

## Secret Rule

Never print detected secret values. If a secret may have been committed or shared,
rotate it even after moving it into an ignored env file.

If the user pastes a secret in chat, treat it as exposed. Do not repeat it, pass
it as a command argument, write it to logs, save it to repository files, add it
to GitHub secrets yourself, or deploy it to a server. Tell the user to rotate
the value and enter a new one only through a local provider UI or a secret-store
prompt.

## Git Gate Rule

Run `vibeguard audit .` before commits and `vibeguard audit . --strict`
before pushes or public package publication.

Before commit or push, verify the actual remote target with `git remote -v`,
confirm whether the repository is public, private, or internal, and review the
changed files. If visibility is public or unknown, do not push credentials,
env files, private keys, deployment changes, infrastructure changes, or
paid-service changes without explicit review.

## Env File Rule

Runtime env files such as `.env`, `.env.local`, `.env.dev`, and
`.env.production` are local secret containers and must stay ignored. Env template
files such as `.env.example`, `.env.sample`, `.env.template`, and `.env.dist`
may be shared only when they contain names and placeholders, not real keys,
tokens, credentials, private keys, or password-bearing URLs.

## Environment-Specific Configuration Rule

Do not hard-code environment-specific web URLs, API origins, redirect/callback
URLs, or asset hosts in source code. When values differ between development,
staging, and production, read them from the platform's normal configuration
mechanism: web env/deployment variables, Android `local.properties` or Gradle
properties, and iOS `.xcconfig`, scheme environment variables, or build
settings. Shared templates may document only names and placeholders.

## Cost-Aware Architecture Rule

Do not solve small product requests by stacking paid services, new databases,
queues, background workers, model calls, analytics SDKs, or cloud resources by
default. Prefer existing code, static/local behavior, server-side reuse,
caching, batching, rate limits, and explicit budget boundaries. Ask before
adding anything that can create recurring cost or operational burden.

## Web Architecture Reuse Rule

For web projects, do not duplicate client-side fetching, model calls, paid API
calls, or provider SDK setup in many components. Route repeated work through
shared server-side helpers or endpoints, cache stable or slow-changing data on
the server, batch repeated requests, and add rate limits before exposing a path
that can create cost or quota pressure.

## Server Boundary Rule

Keep provider keys, database URLs, signing secrets, service-role keys, webhook
secrets, and privileged credentials server-side. Client code may receive only
values that are intentionally public and scoped for exposure.
