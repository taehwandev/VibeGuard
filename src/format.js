import { normalizeLanguage, t } from "./i18n.js";
import { relativePath, sanitizePathForDisplay } from "./path-display.js";

const STATUS_ICON = {
  pass: "🟢",
  warn: "🟡",
  block: "🔴",
  info: "🔵"
};

export function formatAuditReport(report, options = {}) {
  const language = normalizeLanguage(options.language ?? report.language);
  const lines = [];
  lines.push(t(language, "report.title"));
  lines.push("");
  lines.push(`${t(language, "report.project")}: ${sanitizePathForDisplay(report.root)}`);
  lines.push(`${t(language, "report.overall")}: ${STATUS_ICON[report.summary.status]} ${statusLabel(language, report.summary.status)}`);
  lines.push(t(language, "report.scanned", { scanned: report.stats.scannedFiles, skipped: report.stats.skippedFiles }));
  lines.push("");
  lines.push(`| ${t(language, "report.table.gate")} | ${t(language, "report.table.status")} | ${t(language, "report.table.message")} |`);
  lines.push("| --- | --- | --- |");
  for (const [key, gate] of Object.entries(report.gates)) {
    lines.push(`| ${gate.label} | ${STATUS_ICON[gate.status]} ${statusLabel(language, gate.status)} | ${gate.message} |`);
  }

  if (report.findings.length > 0) {
    lines.push("");
    lines.push(`${t(language, "report.findings")}:`);
    for (const finding of report.findings.slice(0, options.limit ?? 20)) {
      const icon = STATUS_ICON[finding.severity] ?? STATUS_ICON.info;
      const location = finding.file ? ` ${relativePath(finding.file)}${finding.line ? `:${finding.line}` : ""}` : "";
      const fixable = finding.fixable ? " [fixable]" : "";
      lines.push(`- ${icon}${location}${fixable} ${finding.message}`);
      if (finding.recommendation) lines.push(`  -> ${finding.recommendation}`);
    }
    if (report.findings.length > (options.limit ?? 20)) {
      lines.push(`- ${t(language, "report.findings.more", { count: report.findings.length - (options.limit ?? 20) })}`);
    }
  } else {
    lines.push("");
    lines.push(t(language, "report.findings.none"));
  }

  const fixableCount = report.summary.fixable;
  if (fixableCount > 0) {
    lines.push("");
    lines.push(t(language, "report.next.fixable", { count: fixableCount }));
  }

  if (report.rules.available) {
    lines.push("");
    lines.push(t(language, "report.rules.loaded", {
      count: report.rules.documents.length,
      path: sanitizePathForDisplay(report.rules.path)
    }));
  }

  return `${lines.join("\n")}\n`;
}

export function formatAppliedFixes(applied, options = {}) {
  const language = normalizeLanguage(options.language);
  if (applied.length === 0) return `${t(language, "fixes.none")}\n`;
  return `${t(language, "fixes.header")}\n${applied.map((item) => `- ${localizeAppliedFix(language, item)}`).join("\n")}\n`;
}

function statusLabel(language, status) {
  return t(language, `status.${status}`);
}

function localizeAppliedFix(language, item) {
  if (language === "en") return item;

  const movedSecrets = item.match(/^Moved (\d+) secret value\(s\) into \.env\.vibeguard\.local\.$/);
  if (movedSecrets) return t(language, "fixes.movedSecrets", { count: movedSecrets[1] });

  const replacedSecrets = item.match(/^Replaced hard-coded secret reads in: (.+)\.$/);
  if (replacedSecrets) return t(language, "fixes.replacedSecrets", { files: replacedSecrets[1] });

  const exactKeys = new Map([
    ["Updated .gitignore env protection rules.", "fixes.gitignore"],
    ["Updated .env.example with required variable names.", "fixes.envExample"],
    ["Created .vibeguard.json.", "fixes.createdConfig"],
    ["Created VIBEGUARD.md.", "fixes.createdPolicy"],
    ["Created AGENTS.md VibeGuard instructions.", "fixes.createdAgents"],
    ["Updated AGENTS.md VibeGuard instructions.", "fixes.updatedAgents"],
    ["Added VibeGuard instructions to AGENTS.md.", "fixes.addedAgents"],
    ["Installed pre-commit VibeGuard hook.", "fixes.installedPreCommit"],
    ["Installed pre-push VibeGuard hook.", "fixes.installedPrePush"],
    ["Updated pre-commit VibeGuard hook.", "fixes.updatedPreCommit"],
    ["Updated pre-push VibeGuard hook.", "fixes.updatedPrePush"],
    ["Added VibeGuard check to existing pre-commit hook.", "fixes.addedPreCommit"],
    ["Added VibeGuard check to existing pre-push hook.", "fixes.addedPrePush"],
    ["Wrapped existing pre-commit hook with VibeGuard check.", "fixes.wrappedPreCommit"],
    ["Wrapped existing pre-push hook with VibeGuard check.", "fixes.wrappedPrePush"],
    ["Installed Claude Code evidence hook.", "fixes.installedClaudeEvidence"],
    ["Updated Claude Code evidence hook.", "fixes.updatedClaudeEvidence"],
    ["Updated .gitignore agent evidence rules.", "fixes.agentEvidenceGitignore"]
  ]);

  const key = exactKeys.get(item);
  return key ? t(language, key) : item;
}
