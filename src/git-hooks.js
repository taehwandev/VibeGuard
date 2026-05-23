import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathExists, readTextIfExists, writeTextFile } from "./fs-utils.js";

const HOOK_RULE_START_PATTERN = /# (?:vibeguard|vibe-guard):start(?: version=\d+)?/;
const HOOK_RULE_END_PATTERN = /# (?:vibeguard|vibe-guard):end/;
const HOOK_RULE_START = "# vibeguard:start version=1";
const HOOK_RULE_END = "# vibeguard:end";

const HOOKS = [
  { name: "pre-commit", command: "audit ." },
  { name: "pre-push", command: "audit . --strict" }
];

export function ensureGitHooks(projectRoot) {
  const applied = [];
  for (const hook of HOOKS) {
    const result = ensureGitHook(projectRoot, hook);
    if (result) applied.push(result);
  }
  return applied;
}

export function ensureGitHook(projectRoot, hook) {
  const hookPath = resolveHookPath(projectRoot, hook.name);
  if (!hookPath) return null;

  const existing = readTextIfExists(hookPath);
  const block = hookBlock(hook);
  const startMatch = existing.match(HOOK_RULE_START_PATTERN);

  if (startMatch) {
    const endMatch = existing.slice(startMatch.index).match(HOOK_RULE_END_PATTERN);
    if (endMatch) {
      const endIndex = startMatch.index + endMatch.index;
      const before = existing.slice(0, startMatch.index).trimEnd();
      const after = existing.slice(endIndex + endMatch[0].length).trimStart();
      const next = joinHookSections(before, block, after);
      if (next === existing) return null;
      writeExecutableHook(hookPath, next);
      return `Updated ${hook.name} VibeGuard hook.`;
    }
  }

  if (existing.trim().length === 0) {
    writeExecutableHook(hookPath, `#!/bin/sh\n\n${block}\n`);
    return `Installed ${hook.name} VibeGuard hook.`;
  }

  if (isShellHook(existing)) {
    const next = joinHookSections(existing, block);
    if (next === existing) return null;
    writeExecutableHook(hookPath, next);
    return `Added VibeGuard check to existing ${hook.name} hook.`;
  }

  const originalHookPath = `${hookPath}.vibeguard-original`;
  if (!pathExists(originalHookPath)) {
    fs.mkdirSync(path.dirname(originalHookPath), { recursive: true });
    fs.renameSync(hookPath, originalHookPath);
    makeExecutable(originalHookPath);
  }

  writeExecutableHook(hookPath, wrapperHook(block));
  return `Wrapped existing ${hook.name} hook with VibeGuard check.`;
}

function resolveHookPath(projectRoot, hookName) {
  try {
    const hookPath = execFileSync("git", ["rev-parse", "--git-path", `hooks/${hookName}`], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    if (!hookPath) return null;
    return path.isAbsolute(hookPath) ? hookPath : path.join(projectRoot, hookPath);
  } catch {
    const gitPath = path.join(projectRoot, ".git");
    if (!pathExists(gitPath)) return null;
    try {
      if (fs.statSync(gitPath).isDirectory()) return path.join(gitPath, "hooks", hookName);
    } catch {
      return null;
    }
    return null;
  }
}

function hookBlock(hook) {
  return `${HOOK_RULE_START}
# Managed by VibeGuard. Re-run \`vibeguard init .\` to refresh.
echo "VibeGuard: running ${hook.name} safety audit..." >&2
vibeguard_repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$vibeguard_repo_root" || exit 1
PATH="$vibeguard_repo_root/node_modules/.bin:$PATH"
if command -v vibeguard >/dev/null 2>&1; then
  vibeguard ${hook.command}
elif command -v npx >/dev/null 2>&1; then
  npx --yes vibeguard ${hook.command}
else
  echo "VibeGuard: install Node.js/npm or make vibeguard available before committing or pushing." >&2
  exit 1
fi
${HOOK_RULE_END}`;
}

function wrapperHook(block) {
  return `#!/bin/sh

${block}

vibeguard_original_hook="$0.vibeguard-original"
if [ -x "$vibeguard_original_hook" ]; then
  "$vibeguard_original_hook" "$@"
fi
`;
}

function isShellHook(content) {
  const firstLine = content.split(/\r?\n/, 1)[0].trim();
  if (!firstLine.startsWith("#!")) return true;
  return /\b(?:sh|bash|zsh|dash)\b/.test(firstLine);
}

function joinHookSections(...sections) {
  return `${sections.filter((section) => section.trim().length > 0).map((section) => section.trimEnd()).join("\n\n")}\n`;
}

function writeExecutableHook(filePath, content) {
  writeTextFile(filePath, content);
  makeExecutable(filePath);
}

function makeExecutable(filePath) {
  try {
    fs.chmodSync(filePath, 0o755);
  } catch {
    // Best-effort only. Git will report hook permission issues if chmod fails.
  }
}
