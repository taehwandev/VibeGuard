import { sanitizePathForDisplay } from "./path-display.js";

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

export function buildAgentPrompt(report, userRequest = "") {
  const lines = [];

  lines.push("# Vibe-Guard Safe Coding Prompt");
  lines.push("");
  lines.push("You are an AI coding agent working safely on behalf of a non-developer user.");
  lines.push("Prioritize automatic inspection and safe fixes over long explanations.");
  lines.push("");
  lines.push("## User Request");
  lines.push(userRequest?.trim() ? userRequest.trim() : "(No request was provided. First confirm the user's implementation goal in one sentence.)");
  lines.push("");
  lines.push("## Current Audit Status");
  lines.push(`- Project: ${sanitizePathForDisplay(report.root)}`);
  lines.push(`- Overall: ${STATUS_ICON[report.summary.status]} ${STATUS_LABEL[report.summary.status]}`);
  lines.push(`- Blocks: ${report.summary.blocks}, warnings: ${report.summary.warnings}, fixable: ${report.summary.fixable}`);
  lines.push("");
  lines.push("| Gate | Status | Message |");
  lines.push("| --- | --- | --- |");
  for (const gate of Object.values(report.gates)) {
    lines.push(`| ${gate.label} | ${STATUS_ICON[gate.status]} ${STATUS_LABEL[gate.status]} | ${gate.message} |`);
  }

  if (report.findings.length > 0) {
    lines.push("");
    lines.push("## Findings To Handle");
    for (const finding of report.findings.slice(0, 12)) {
      const where = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ""}` : "project";
      lines.push(`- ${STATUS_ICON[finding.severity] ?? "🔵"} ${where}: ${finding.message}`);
      if (finding.fixable) lines.push("  - Fixable: run `vibe-guard audit . --fix` or apply the same safe remediation directly.");
    }
  }

  lines.push("");
  lines.push("## Agent Execution Rules");
  lines.push("1. Before writing code, inspect the file structure, `.gitignore`, env files, and package/script setup.");
  lines.push("2. If you find a secret value, do not print it. Move it to an ignored env file or secret manager.");
  lines.push("3. Ignore `.env`, `.env.*`, and `.env.vibeguard.local`; keep only variable names in `.env.example`.");
  lines.push("4. Do not delete databases, run migrations, deploy to production, or increase paid API/model usage without user approval.");
  lines.push("5. Ask questions only when blocked, limit them to three, and perform safe fixes first when possible.");
  lines.push("6. After editing, run tests, build, typecheck, or the narrowest useful smoke check.");
  lines.push("7. Finish with a short report of changed files, verification results, and remaining risks.");

  if (report.rules.available) {
    lines.push("");
    lines.push("## External Rule Library");
    lines.push(`Path: ${sanitizePathForDisplay(report.rules.path)}`);
    for (const doc of report.rules.documents.slice(0, 6)) {
      lines.push(`- ${doc.relative}: ${doc.title}`);
    }
  }

  lines.push("");
  lines.push("## Next Action");
  if (report.summary.fixable > 0) {
    lines.push("Handle fixable safety issues first, then implement the user request.");
  } else if (report.summary.blocks > 0) {
    lines.push("Do not start feature implementation until blocking issues are resolved safely.");
  } else {
    lines.push("Implement the user request in small changes while following the rules above.");
  }

  return `${lines.join("\n")}\n`;
}
