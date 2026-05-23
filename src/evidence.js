import path from "node:path";
import { appendUniqueLines, pathExists, readJsonIfExists, readTextIfExists, writeTextFile } from "./fs-utils.js";

const EVIDENCE_FILE = path.join(".vibeguard", "session", "events.jsonl");
const CLAUDE_LOCAL_SETTINGS = path.join(".claude", "settings.local.json");
const CLAUDE_EVIDENCE_COMMAND = "npx --yes vibeguard evidence claude-hook \"${CLAUDE_PROJECT_DIR:-.}\"";
const CLAUDE_HOOK_EVENTS = ["PostToolUse", "PostToolUseFailure"];

const COMMAND_CHECKS = [
  { key: "audit", label: "VibeGuard audit", regex: /\b(?:vibeguard|vibe-guard)\s+audit\s+\./ },
  {
    key: "strictAudit",
    label: "VibeGuard strict audit",
    regex: /\b(?:vibeguard|vibe-guard)\s+audit\s+\.[^\n]*\s--strict\b/
  },
  {
    key: "test",
    label: "Project test command",
    regex: /\b(npm\s+(?:run\s+)?test|pnpm\s+test|yarn\s+test|pytest|python\s+-m\s+pytest|cargo\s+test|go\s+test|swift\s+test)\b/
  }
];

const REDACTION_PATTERNS = [
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{12,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9_]{12,}\b/g,
  /\bsk_live_[A-Za-z0-9]{12,}\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{12,}\b/g,
  /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis(?:s)?)?:\/\/[^:\s"'`]+:[^@\s"'`]+@[^\s"'`]+/g,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g
];

export function recordEvidenceEvent(projectRoot, event) {
  const filePath = evidenceFilePath(projectRoot);
  const safeEvent = sanitizeEvidenceEvent(event);
  const existing = readTextIfExists(filePath);
  const separator = existing && !existing.endsWith("\n") ? "\n" : "";
  writeTextFile(filePath, `${existing}${separator}${JSON.stringify(safeEvent)}\n`);
  return safeEvent;
}

export function evidenceFromClaudeHook(input) {
  const payload = typeof input === "string" ? JSON.parse(input) : input;
  const eventName = payload.hook_event_name ?? "unknown";
  const failed = eventName === "PostToolUseFailure" || Boolean(payload.error);
  const command = payload.tool_name === "Bash" ? payload.tool_input?.command : null;

  return {
    schema: 1,
    agent: "claude-code",
    event: eventName,
    tool: payload.tool_name ?? null,
    command,
    status: failed ? "failure" : "success",
    exitCode: failed ? parseExitCode(payload.error) : 0,
    cwd: payload.cwd ?? null,
    durationMs: payload.duration_ms ?? null,
    toolUseId: payload.tool_use_id ?? null,
    error: payload.error ?? null,
    timestamp: new Date().toISOString()
  };
}

export function loadEvidenceEvents(projectRoot) {
  const filePath = evidenceFilePath(projectRoot);
  if (!pathExists(filePath)) return [];

  return readTextIfExists(filePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function summarizeEvidence(events) {
  const commands = events.filter((event) => event.command);
  const failures = events.filter((event) => event.status === "failure" || event.exitCode > 0);

  return {
    eventCount: events.length,
    commandCount: commands.length,
    failureCount: failures.length,
    checks: Object.fromEntries(
      COMMAND_CHECKS.map((check) => {
        const matches = commands.filter((event) => check.regex.test(event.command));
        return [
          check.key,
          {
            label: check.label,
            observed: matches.length > 0,
            count: matches.length,
            last: matches.at(-1)?.timestamp ?? null
          }
        ];
      })
    ),
    recent: events.slice(-10)
  };
}

export function evidenceFilePath(projectRoot) {
  return path.join(projectRoot, EVIDENCE_FILE);
}

export function formatEvidenceReport(summary) {
  const lines = [];
  lines.push("[VibeGuard Evidence Report]");
  lines.push("");
  lines.push(`Events: ${summary.eventCount}`);
  lines.push(`Commands: ${summary.commandCount}`);
  lines.push(`Failures: ${summary.failureCount}`);
  lines.push("");
  lines.push("| Check | Status | Count | Last Seen |");
  lines.push("| --- | --- | --- | --- |");
  for (const check of Object.values(summary.checks)) {
    lines.push(`| ${check.label} | ${check.observed ? "observed" : "missing"} | ${check.count} | ${check.last ?? "-"} |`);
  }
  return `${lines.join("\n")}\n`;
}

export function installClaudeEvidenceHook(projectRoot) {
  const settingsPath = path.join(projectRoot, CLAUDE_LOCAL_SETTINGS);
  const before = readTextIfExists(settingsPath);
  const settings = readJsonIfExists(settingsPath) ?? {};
  settings.hooks = settings.hooks && typeof settings.hooks === "object" ? settings.hooks : {};

  for (const eventName of CLAUDE_HOOK_EVENTS) {
    settings.hooks[eventName] = ensureClaudeBashHook(settings.hooks[eventName], CLAUDE_EVIDENCE_COMMAND);
  }

  const next = `${JSON.stringify(settings, null, 2)}\n`;
  const applied = [];
  if (next !== before) {
    writeTextFile(settingsPath, next);
    applied.push(before ? "Updated Claude Code evidence hook." : "Installed Claude Code evidence hook.");
  }

  if (
    appendUniqueLines(path.join(projectRoot, ".gitignore"), [
      "# VibeGuard local agent evidence",
      ".claude/settings.local.json",
      ".vibeguard/session/"
    ])
  ) {
    applied.push("Updated .gitignore agent evidence rules.");
  }

  return {
    applied,
    settingsPath: path.relative(projectRoot, settingsPath),
    command: CLAUDE_EVIDENCE_COMMAND,
    events: CLAUDE_HOOK_EVENTS
  };
}

function sanitizeEvidenceEvent(event) {
  return JSON.parse(
    JSON.stringify({
      ...event,
      command: redactText(event.command),
      error: redactText(event.error)
    })
  );
}

function redactText(value) {
  if (typeof value !== "string") return value ?? null;
  return REDACTION_PATTERNS.reduce((next, pattern) => next.replace(pattern, "<redacted>"), value);
}

function parseExitCode(error) {
  if (typeof error !== "string") return 1;
  const match = error.match(/\b(?:exit|status) code (\d+)\b/i);
  return match ? Number.parseInt(match[1], 10) : 1;
}

function ensureClaudeBashHook(existing, command) {
  const groups = Array.isArray(existing) ? existing : [];
  const nextGroups = groups.map((group) => ({
    ...group,
    hooks: Array.isArray(group.hooks) ? group.hooks.filter((hook) => !isVibeGuardEvidenceHook(hook)) : []
  }));

  let bashGroup = nextGroups.find((group) => group.matcher === "Bash");
  if (!bashGroup) {
    bashGroup = { matcher: "Bash", hooks: [] };
    nextGroups.push(bashGroup);
  }

  bashGroup.hooks.push({
    type: "command",
    command
  });

  return nextGroups;
}

function isVibeGuardEvidenceHook(hook) {
  return hook?.type === "command" && /\bvibeguard\s+evidence\s+claude-hook\b/.test(hook.command ?? "");
}
