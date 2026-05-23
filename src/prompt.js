import { normalizeLanguage, t } from "./i18n.js";
import { sanitizePathForDisplay } from "./path-display.js";

const STATUS_ICON = {
  pass: "🟢",
  warn: "🟡",
  block: "🔴",
  info: "🔵"
};

export function buildAgentPrompt(report, userRequest = "", options = {}) {
  const language = normalizeLanguage(options.language ?? report.language);
  const lines = [];

  lines.push(t(language, "prompt.title"));
  lines.push("");
  lines.push(t(language, "prompt.intro1"));
  lines.push(t(language, "prompt.intro2"));
  lines.push("");
  lines.push(t(language, "prompt.userRequest"));
  lines.push(userRequest?.trim() ? userRequest.trim() : t(language, "prompt.noRequest"));
  lines.push("");
  lines.push(t(language, "prompt.auditStatus"));
  lines.push(`- ${t(language, "prompt.project")}: ${sanitizePathForDisplay(report.root)}`);
  lines.push(`- ${t(language, "prompt.overall")}: ${STATUS_ICON[report.summary.status]} ${statusLabel(language, report.summary.status)}`);
  lines.push(`- ${t(language, "prompt.summary", {
    blocks: report.summary.blocks,
    warnings: report.summary.warnings,
    fixable: report.summary.fixable
  })}`);
  lines.push("");
  lines.push(`| ${t(language, "report.table.gate")} | ${t(language, "report.table.status")} | ${t(language, "report.table.message")} |`);
  lines.push("| --- | --- | --- |");
  for (const gate of Object.values(report.gates)) {
    lines.push(`| ${gate.label} | ${STATUS_ICON[gate.status]} ${statusLabel(language, gate.status)} | ${gate.message} |`);
  }

  if (report.findings.length > 0) {
    lines.push("");
    lines.push(t(language, "prompt.findings"));
    for (const finding of report.findings.slice(0, 12)) {
      const where = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ""}` : "project";
      lines.push(`- ${STATUS_ICON[finding.severity] ?? "🔵"} ${where}: ${finding.message}`);
      if (finding.fixable) lines.push(`  - ${t(language, "prompt.fixable")}`);
    }
  }

  lines.push("");
  lines.push(t(language, "prompt.rules"));
  lines.push(`1. ${t(language, "prompt.rule1")}`);
  lines.push(`2. ${t(language, "prompt.rule2")}`);
  lines.push(`3. ${t(language, "prompt.rule3")}`);
  lines.push(`4. ${t(language, "prompt.rule4")}`);
  lines.push(`5. ${t(language, "prompt.rule5")}`);
  lines.push(`6. ${t(language, "prompt.rule6")}`);
  lines.push(`7. ${t(language, "prompt.rule7")}`);
  lines.push(`8. ${t(language, "prompt.rule8")}`);
  lines.push(`9. ${t(language, "prompt.rule9")}`);
  lines.push(`10. ${t(language, "prompt.rule10")}`);
  lines.push(`11. ${t(language, "prompt.rule11")}`);
  lines.push(`12. ${t(language, "prompt.rule12")}`);

  if (report.rules.available) {
    lines.push("");
    lines.push(t(language, "prompt.externalRules"));
    lines.push(`${t(language, "prompt.path")}: ${sanitizePathForDisplay(report.rules.path)}`);
    for (const doc of report.rules.documents.slice(0, 6)) {
      lines.push(`- ${doc.relative}: ${doc.title}`);
    }
  }

  lines.push("");
  lines.push(t(language, "prompt.nextAction"));
  if (report.summary.fixable > 0) {
    lines.push(t(language, "prompt.nextFixable"));
  } else if (report.summary.blocks > 0) {
    lines.push(t(language, "prompt.nextBlocked"));
  } else {
    lines.push(t(language, "prompt.nextReady"));
  }

  return `${lines.join("\n")}\n`;
}

function statusLabel(language, status) {
  return t(language, `status.${status}`);
}
