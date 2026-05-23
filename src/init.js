import path from "node:path";
import { ensureEnvGitignore } from "./fix.js";
import { pathExists, readTextIfExists, writeTextFile } from "./fs-utils.js";
import { ensureGitHooks } from "./git-hooks.js";

const AGENT_RULE_START_PATTERN = /<!-- (?:vibeguard|vibe-guard):start(?: version=\d+)? -->/;
const AGENT_RULE_END_PATTERN = /<!-- (?:vibeguard|vibe-guard):end -->/;
const AGENT_RULE_START = "<!-- vibeguard:start version=1 -->";
const AGENT_RULE_END = "<!-- vibeguard:end -->";

export function initProject(projectRoot, options = {}) {
  const applied = [];

  if (ensureEnvGitignore(projectRoot)) {
    applied.push("Updated .gitignore env protection rules.");
  }

  const configPath = path.join(projectRoot, ".vibeguard.json");
  if (!pathExists(configPath)) {
    writeTextFile(
      configPath,
      `${JSON.stringify(
        {
          mode: "guided",
          display: "traffic-light",
          rulesPath: options.rulesPath ?? null,
          maxFileLines: 800,
          repository: {
            visibility: "unknown"
          },
          autoFix: {
            envGitignore: true,
            envExample: true,
            simpleSecretQuarantine: true
          }
        },
        null,
        2
      )}\n`
    );
    applied.push("Created .vibeguard.json.");
  }

  const policyPath = path.join(projectRoot, "VIBEGUARD.md");
  if (!pathExists(policyPath)) {
    writeTextFile(policyPath, policyTemplate(options.rulesPath));
    applied.push("Created VIBEGUARD.md.");
  }

  const agentInstructionChange = ensureAgentInstructions(projectRoot);
  if (agentInstructionChange) applied.push(agentInstructionChange);

  applied.push(...ensureGitHooks(projectRoot));

  return applied;
}

function ensureAgentInstructions(projectRoot) {
  const agentPath = path.join(projectRoot, "AGENTS.md");
  const existing = readTextIfExists(agentPath);
  const block = agentInstructionTemplate();
  const startMatch = existing.match(AGENT_RULE_START_PATTERN);

  if (startMatch) {
    const endMatch = existing.slice(startMatch.index).match(AGENT_RULE_END_PATTERN);
    if (endMatch) {
      const endIndex = startMatch.index + endMatch.index;
      const before = existing.slice(0, startMatch.index).trimEnd();
      const after = existing.slice(endIndex + endMatch[0].length).trimStart();
      const next = joinMarkdownSections(before, block, after);
      if (next === existing) return null;
      writeTextFile(agentPath, next);
      return "Updated AGENTS.md VibeGuard instructions.";
    }
  }

  if (existing.trim().length === 0) {
    writeTextFile(agentPath, `${block}\n`);
    return "Created AGENTS.md VibeGuard instructions.";
  }

  writeTextFile(agentPath, `${existing.trimEnd()}\n\n${block}\n`);
  return "Added VibeGuard instructions to AGENTS.md.";
}

function joinMarkdownSections(...sections) {
  return `${sections.filter((section) => section.trim().length > 0).join("\n\n")}\n`;
}

function policyTemplate(rulesPath) {
  return `# VIBEGUARD.md

This project uses VibeGuard before AI-generated code changes.

## Operating Rule

The agent should inspect, auto-fix low-risk safety issues, and only ask the user
when a step can destroy data, spend money, deploy externally, or requires private
credentials.

## Chat Secret Rule

If the user pastes a secret in chat, treat it as exposed. Do not repeat it, pass
it as a command argument, write it to logs, save it to repository files, add it
to GitHub secrets yourself, or deploy it to a server. Tell the user to rotate
the value and enter a new one only through a local provider UI or a secret-store
prompt.

## Audience

The default mode is for non-developers. Show traffic-light status, keep the
summary simple, and handle safe fixes behind the scenes. Developers can adjust
\`.vibeguard.json\` for stricter thresholds and project-specific rules.

## Gates

| Gate | Block When |
| --- | --- |
| Security | Secret values, private keys, unsafe auth, missing env ignore |
| Cost | Paid APIs, recurring infrastructure, model calls, or cloud services without simpler alternatives, quotas, or test/prod separation |
| Data | DB deletion, migration, production data, destructive scripts |
| Structure | Oversized files, unclear ownership, risky one-shot edits |
| Repository | Wrong remote, public/unknown visibility, sensitive Git changes |

## Local Shared Rules

${rulesPath ?? "No external rule source is configured."}

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

## Required Workflow

1. Run \`vibeguard audit .\`.
2. Run \`vibeguard audit . --fix\` for fixable safety issues.
3. Do not print secret values.
4. Rotate any secret that may already have been exposed.
5. Before commit or push, confirm \`git remote -v\`, repository visibility, and changed files.
6. Show changed files and verification evidence before finishing.
`;
}

function agentInstructionTemplate() {
  return `${AGENT_RULE_START}
## VibeGuard

For every task that may change code, configuration, dependencies, data,
deployment, or credentials:

1. Run \`vibeguard audit .\` before editing.
2. If \`vibeguard\` is unavailable, run \`npx --yes vibeguard audit .\` instead and use the same \`npx --yes vibeguard ...\` form for fixes.
3. If fixable findings exist, run \`vibeguard audit . --fix\` before implementing.
4. Never print detected secret values. Keep real secrets only in ignored local env files and keep \`.env.example\` value-free.
5. Ask before deleting data, running migrations, deploying to production, increasing paid API/model usage, adding recurring infrastructure, or changing credentials.
6. Prefer cost-aware architecture. Before adding a paid service, database, queue, background worker, model call, analytics SDK, or cloud resource, explain why existing code or a simpler local/server-side design is insufficient.
7. For web apps, commonize repeated API/model/provider calls behind shared server-side helpers or endpoints. Prefer server-side caching, batching, and rate limits before adding new client-side call paths.
8. Before commit or push, verify \`git remote -v\`, repository visibility, and changed files. If the repository is public or visibility is unknown, stop before pushing secrets, env files, credentials, deployment, infrastructure, or paid-service changes.
9. After editing, run relevant tests and \`vibeguard audit .\` again before finishing.
10. Before creating a commit, run \`vibeguard audit .\`; before pushing or publishing, run \`vibeguard audit . --strict\`.
11. If execution evidence is available, run \`vibeguard evidence .\` before the final response and do not claim tests or audits ran unless they were observed.
12. Keep secrets server-side. Do not expose provider keys, database URLs, signing secrets, service-role keys, or webhook secrets to client code.
13. If the user pastes a secret in chat, treat it as exposed. Do not repeat it, put it in commands/logs/files/GitHub secrets/deployment settings/servers, or continue with deployment using that value. Guide the user to rotate it and enter a new value only through a local provider UI or secret-store prompt.
14. Keep VibeGuard scoped to guardrails. Do not clone, vendor, install, or link external playbooks or rule libraries unless the user explicitly asks for that separate setup.
15. Preserve existing repo-local instructions. Only update the managed VibeGuard block between the \`vibeguard:start\` and \`vibeguard:end\` markers.

Refresh this managed block with \`vibeguard init .\`, or with \`npx --yes vibeguard init .\` when running directly from the repo link.
${AGENT_RULE_END}`;
}
