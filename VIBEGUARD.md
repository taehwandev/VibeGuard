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

## Secret Rule

Never print detected secret values. If a secret may have been committed or shared,
rotate it even after moving it into an ignored env file.

## Git Gate Rule

Run `vibeguard audit .` before commits and `vibeguard audit . --strict`
before pushes or public package publication.

Before commit or push, verify the actual remote target with `git remote -v`,
confirm whether the repository is public, private, or internal, and review the
changed files. If visibility is public or unknown, do not push credentials,
env files, private keys, deployment changes, infrastructure changes, or
paid-service changes without explicit review.

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
