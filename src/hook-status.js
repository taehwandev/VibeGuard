import path from "node:path";
import { auditProject, sanitizeReport } from "./audit.js";
import { readJsonIfExists, writeTextFile } from "./fs-utils.js";

const STATUS_SCHEMA = 1;
const STATUS_PATH = ".vibeguard/status.json";
const DEFAULT_FINDING_LIMIT = 5;

export function runHookStatus(projectRoot, options = {}) {
  const report = auditProject(projectRoot, {
    rulesPath: options.rulesPath,
    language: options.language,
    changedOnly: options.changedOnly ?? true
  });
  const status = buildHookStatus(report, options);
  writeHookStatus(projectRoot, status);
  return status;
}

export function buildHookStatus(report, options = {}) {
  const safeReport = sanitizeReport(report);
  const signal = signalForStatus(safeReport.summary.status);
  const status = {
    schema: STATUS_SCHEMA,
    kind: "vibeguard-hook-status",
    generatedAt: safeReport.generatedAt,
    event: normalizeEvent(options.event),
    signal,
    status: safeReport.summary.status,
    exitCode: hookExitCode(safeReport.summary.status, options),
    summary: safeReport.summary,
    scan: {
      mode: safeReport.stats.scanMode ?? "full",
      scannedFiles: safeReport.stats.scannedFiles,
      skippedFiles: safeReport.stats.skippedFiles,
      changedFiles: safeReport.stats.changedFiles ?? 0
    },
    gates: compactGates(safeReport.gates),
    findings: compactFindings(safeReport.findings, options.findingLimit ?? DEFAULT_FINDING_LIMIT),
    next: nextAction(safeReport.summary.status)
  };

  status.line = formatHookStatusLine(status);
  return status;
}

export function buildHookErrorStatus(error, options = {}) {
  const status = {
    schema: STATUS_SCHEMA,
    kind: "vibeguard-hook-status",
    generatedAt: new Date().toISOString(),
    event: normalizeEvent(options.event),
    signal: "error",
    status: "error",
    exitCode: 1,
    summary: {
      blocks: 0,
      warnings: 0,
      fixable: 0
    },
    scan: {
      mode: options.changedOnly === false ? "full" : "changed",
      scannedFiles: 0,
      skippedFiles: 0,
      changedFiles: 0
    },
    gates: {},
    findings: [
      {
        severity: "error",
        category: "environment",
        message: error?.message ?? "Hook status could not be produced."
      }
    ],
    next: "Run `vibeguard audit .` for the full error context."
  };

  status.line = formatHookStatusLine(status);
  return status;
}

export function writeHookStatus(projectRoot, status) {
  writeTextFile(hookStatusPath(projectRoot), `${JSON.stringify(status, null, 2)}\n`);
}

export function loadHookStatus(projectRoot) {
  return readJsonIfExists(hookStatusPath(projectRoot));
}

export function hookStatusPath(projectRoot) {
  return path.join(projectRoot, STATUS_PATH);
}

export function formatHookStatusLine(status) {
  const summary = status.summary ?? {};
  const scan = status.scan ?? {};
  const firstFinding = status.findings?.[0];
  const findingText = firstFinding
    ? `; first=${firstFinding.severity}/${firstFinding.category}${firstFinding.file ? ` ${firstFinding.file}` : ""}`
    : "";

  return [
    `VibeGuard hook: ${status.signal}`,
    `status=${status.status}`,
    `blocks=${summary.blocks ?? 0}`,
    `warnings=${summary.warnings ?? 0}`,
    `fixable=${summary.fixable ?? 0}`,
    `scan=${scan.mode ?? "unknown"}`,
    `scanned=${scan.scannedFiles ?? 0}${findingText}`
  ].join(" ");
}

function compactGates(gates) {
  return Object.fromEntries(
    Object.entries(gates).map(([key, gate]) => [
      key,
      {
        status: gate.status,
        message: gate.message
      }
    ])
  );
}

function compactFindings(findings, limit) {
  return findings.slice(0, limit).map((finding) => ({
    severity: finding.severity,
    category: finding.category,
    file: finding.file,
    line: finding.line,
    fixable: finding.fixable,
    action: finding.action,
    message: finding.message,
    recommendation: finding.recommendation
  }));
}

function signalForStatus(status) {
  if (status === "pass") return "green";
  if (status === "warn") return "yellow";
  if (status === "block") return "red";
  return "error";
}

function hookExitCode(status, options) {
  if (status === "block") return 2;
  if (options.strict && status === "warn") return 1;
  return 0;
}

function nextAction(status) {
  if (status === "block") return "Stop and run `vibeguard audit .` for the full report.";
  if (status === "warn") return "Review the compact findings or run `vibeguard audit .` for details.";
  if (status === "pass") return "Continue. Run full audit before commit or push.";
  return "Run `vibeguard audit .` for the full error context.";
}

function normalizeEvent(event) {
  return String(event ?? "manual").trim() || "manual";
}
