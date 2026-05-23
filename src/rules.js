import path from "node:path";
import { expandHome, pathExists, readJsonIfExists, readTextIfExists } from "./fs-utils.js";

const DEFAULT_RULE_DOCS = [
  "AGENTS.md",
  "index.md",
  "common/agent-operating-skill.md",
  "common/secure-development-baseline.md",
  "common/security-privacy-review.md",
  "common/agent-editing-safety.md"
];

export function readConfig(projectRoot) {
  return readJsonIfExists(path.join(projectRoot, ".vibeguard.json")) ?? {};
}

export function resolveRulesPath(projectRoot, explicitRulesPath) {
  if (explicitRulesPath) return path.resolve(expandHome(explicitRulesPath));

  const config = readConfig(projectRoot);
  if (config.rulesPath) return path.resolve(expandHome(config.rulesPath));

  const defaultPath = path.resolve(expandHome("~/Documents/KeyFlowVault/agent"));
  return pathExists(defaultPath) ? defaultPath : null;
}

export function loadRuleLibrary(projectRoot, explicitRulesPath) {
  const rulesPath = resolveRulesPath(projectRoot, explicitRulesPath);
  if (!rulesPath || !pathExists(rulesPath)) {
    return {
      path: rulesPath,
      available: false,
      documents: []
    };
  }

  const documents = [];
  for (const relative of DEFAULT_RULE_DOCS) {
    const filePath = path.join(rulesPath, relative);
    if (!pathExists(filePath)) continue;
    const content = readTextIfExists(filePath);
    documents.push({
      relative,
      title: extractTitle(content) ?? relative,
      excerpt: compactExcerpt(content)
    });
  }

  return {
    path: rulesPath,
    available: true,
    documents
  };
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function compactExcerpt(content) {
  return content
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith("---") && !trimmed.startsWith("keyflow_id:");
    })
    .slice(0, 12)
    .join("\n");
}

