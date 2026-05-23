import { relativePath, sanitizePathForDisplay } from "./path-display.js";

const STATUS_ICON = {
  pass: "🟢",
  warn: "🟡",
  block: "🔴",
  info: "🔵"
};

const STATUS_LABEL = {
  pass: "Ready",
  warn: "Needs review",
  block: "Blocked",
  info: "Info"
};

export function formatAuditReport(report, options = {}) {
  const lines = [];
  lines.push("[Vibe-Guard Audit Report]");
  lines.push("");
  lines.push(`Project: ${sanitizePathForDisplay(report.root)}`);
  lines.push(`Overall: ${STATUS_ICON[report.summary.status]} ${STATUS_LABEL[report.summary.status]}`);
  lines.push(`Scanned: ${report.stats.scannedFiles} file(s), skipped ${report.stats.skippedFiles}`);
  lines.push("");
  lines.push("| Gate | Status | Message |");
  lines.push("| --- | --- | --- |");
  for (const [key, gate] of Object.entries(report.gates)) {
    lines.push(`| ${gate.label} | ${STATUS_ICON[gate.status]} ${STATUS_LABEL[gate.status]} | ${gate.message} |`);
  }

  if (report.findings.length > 0) {
    lines.push("");
    lines.push("Findings:");
    for (const finding of report.findings.slice(0, options.limit ?? 20)) {
      const icon = STATUS_ICON[finding.severity] ?? STATUS_ICON.info;
      const location = finding.file ? ` ${relativePath(finding.file)}${finding.line ? `:${finding.line}` : ""}` : "";
      const fixable = finding.fixable ? " [fixable]" : "";
      lines.push(`- ${icon}${location}${fixable} ${finding.message}`);
      if (finding.recommendation) lines.push(`  -> ${finding.recommendation}`);
    }
    if (report.findings.length > (options.limit ?? 20)) {
      lines.push(`- ...and ${report.findings.length - (options.limit ?? 20)} more finding(s).`);
    }
  } else {
    lines.push("");
    lines.push("Findings: none");
  }

  const fixableCount = report.summary.fixable;
  if (fixableCount > 0) {
    lines.push("");
    lines.push(`Next: ${fixableCount} item(s) can be handled automatically with \`vibe-guard audit . --fix\`.`);
  }

  if (report.rules.available) {
    lines.push("");
    lines.push(`Rules: loaded ${report.rules.documents.length} document(s) from ${sanitizePathForDisplay(report.rules.path)}`);
  }

  return `${lines.join("\n")}\n`;
}

export function formatAppliedFixes(applied) {
  if (applied.length === 0) return "No automatic fixes were needed.\n";
  return `Applied fixes:\n${applied.map((item) => `- ${item}`).join("\n")}\n`;
}
