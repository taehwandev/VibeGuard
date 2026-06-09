import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathExists, readTextIfExists, writeTextFile } from "./fs-utils.js";

const HOOK_RULE_START_PATTERN = /^# (?:(?:vibeguard|vibe-guard):start(?: version=\d+)?|vibeguard:managed-hook:start\b.*)$/m;
const HOOK_RULE_END_PATTERN = /^# (?:(?:vibeguard|vibe-guard):end|vibeguard:managed-hook:end\b.*)$/m;
const HOOK_RULE_NAME = "vibeguard-preflight";
const HOOK_RULE_VERSION = 2;

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
      const next = composeShellHook(joinHookSections(before, after), block);
      if (next === existing) return null;
      writeExecutableHook(hookPath, next);
      return `Updated ${hook.name} VibeGuard hook.`;
    }
  }

  if (existing.trim().length === 0) {
    writeExecutableHook(hookPath, composeShellHook("", block));
    return `Installed ${hook.name} VibeGuard hook.`;
  }

  if (isShellHook(existing)) {
    const next = composeShellHook(existing, block);
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
  return `# vibeguard:managed-hook:start name=${HOOK_RULE_NAME} version=${HOOK_RULE_VERSION} hook=${hook.name}
# Managed by VibeGuard (@taehwandev/vibeguard). Re-run \`vibeguard update .\` to refresh.
echo "VibeGuard: running ${hook.name} safety audit..." >&2
vibeguard_repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$vibeguard_repo_root" || exit 1
PATH="$vibeguard_repo_root/node_modules/.bin:$PATH"
if command -v vibeguard >/dev/null 2>&1; then
  vibeguard ${hook.command}
elif command -v npx >/dev/null 2>&1; then
  npx --yes @taehwandev/vibeguard@latest ${hook.command}
else
  echo "VibeGuard: install Node.js/npm or make vibeguard available before committing or pushing." >&2
  exit 1
fi
# vibeguard:managed-hook:end name=${HOOK_RULE_NAME}`;
}

function wrapperHook(block) {
  return composeShellHook(`vibeguard_original_hook="$0.vibeguard-original"
if [ -x "$vibeguard_original_hook" ]; then
  "$vibeguard_original_hook" "$@"
fi`, block);
}

function isShellHook(content) {
  const firstLine = content.split(/\r?\n/, 1)[0].trim();
  if (!firstLine.startsWith("#!")) return true;
  return /\b(?:sh|bash|zsh|dash)\b/.test(firstLine);
}

function joinHookSections(...sections) {
  return `${sections.filter((section) => section.trim().length > 0).map((section) => section.trimEnd()).join("\n\n")}\n`;
}

function composeShellHook(existing, block) {
  const trimmed = existing.trim();
  if (trimmed.length === 0) return `#!/bin/sh\n\n${block}\n`;

  const lines = existing.trimEnd().split(/\r?\n/);
  const firstLine = lines[0].trim();
  if (!firstLine.startsWith("#!")) {
    return joinHookSections("#!/bin/sh", block, existing);
  }

  const body = lines.slice(1).join("\n").trim();
  return joinHookSections(lines[0], block, body);
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
