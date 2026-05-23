import path from "node:path";
import { ensureEnvGitignore } from "./fix.js";
import { pathExists, readTextIfExists, writeTextFile } from "./fs-utils.js";

const AGENT_RULE_START_PATTERN = /<!-- vibe-guard:start(?: version=\d+)? -->/;
const AGENT_RULE_START = "<!-- vibe-guard:start version=1 -->";
const AGENT_RULE_END = "<!-- vibe-guard:end -->";

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
          rulesPath: options.rulesPath ?? "~/Documents/KeyFlowVault/agent",
          maxFileLines: 500,
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

  return applied;
}

function ensureAgentInstructions(projectRoot) {
  const agentPath = path.join(projectRoot, "AGENTS.md");
  const existing = readTextIfExists(agentPath);
  const block = agentInstructionTemplate();
  const startMatch = existing.match(AGENT_RULE_START_PATTERN);

  if (startMatch) {
    const endIndex = existing.indexOf(AGENT_RULE_END, startMatch.index);
    if (endIndex !== -1) {
      const before = existing.slice(0, startMatch.index).trimEnd();
      const after = existing.slice(endIndex + AGENT_RULE_END.length).trimStart();
      const next = joinMarkdownSections(before, block, after);
      if (next === existing) return null;
      writeTextFile(agentPath, next);
      return "Updated AGENTS.md Vibe-Guard instructions.";
    }
  }

  if (existing.trim().length === 0) {
    writeTextFile(agentPath, `${block}\n`);
    return "Created AGENTS.md Vibe-Guard instructions.";
  }

  writeTextFile(agentPath, `${existing.trimEnd()}\n\n${block}\n`);
  return "Added Vibe-Guard instructions to AGENTS.md.";
}

function joinMarkdownSections(...sections) {
  return `${sections.filter((section) => section.trim().length > 0).join("\n\n")}\n`;
}

function policyTemplate(rulesPath) {
  return `# VIBEGUARD.md

This project uses Vibe-Guard before AI-generated code changes.

## Operating Rule

The agent should inspect, auto-fix low-risk safety issues, and only ask the user
when a step can destroy data, spend money, deploy externally, or requires private
credentials.

## Gates

| Gate | Block When |
| --- | --- |
| Security | Secret values, private keys, unsafe auth, missing env ignore |
| Cost | Paid APIs without quota or test/prod separation |
| Data | DB deletion, migration, production data, destructive scripts |
| Structure | Oversized files, unclear ownership, risky one-shot edits |

## Local Shared Rules

${rulesPath ?? "~/Documents/KeyFlowVault/agent"}

## Required Workflow

1. Run \`vibe-guard audit .\`.
2. Run \`vibe-guard audit . --fix\` for fixable safety issues.
3. Do not print secret values.
4. Rotate any secret that may already have been exposed.
5. Show changed files and verification evidence before finishing.
`;
}

function agentInstructionTemplate() {
  return `${AGENT_RULE_START}
## VibeGuard

For every task that may change code, configuration, dependencies, data,
deployment, or credentials:

1. Run \`vibe-guard audit .\` before editing.
2. If \`vibe-guard\` is unavailable, run \`npm exec --yes --package github:taehwandev/VibeGuard -- vibe-guard audit .\` instead and use the same \`npm exec --yes --package github:taehwandev/VibeGuard -- vibe-guard ...\` form for fixes.
3. If fixable findings exist, run \`vibe-guard audit . --fix\` before implementing.
4. Never print detected secret values. Keep real secrets only in ignored local env files and keep \`.env.example\` value-free.
5. Ask before deleting data, running migrations, deploying to production, increasing paid API/model usage, or changing credentials.
6. After editing, run relevant tests and \`vibe-guard audit .\` again before finishing.

Refresh this managed block with \`vibe-guard init .\`, or with \`npm exec --yes --package github:taehwandev/VibeGuard -- vibe-guard init .\` when running directly from the repo link.
${AGENT_RULE_END}`;
}
