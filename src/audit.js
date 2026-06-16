import fs from "node:fs";
import path from "node:path";
import {
  hasEnvTemplateFile,
  isEnvFileName,
  isEnvTemplateFileName,
  isRuntimeEnvFileName,
  normalizeEnvValue,
  shouldScanEnvFileName
} from "./env-policy.js";
import { isSourceCodeFile, SCAN_IGNORE_DIRS } from "./file-policy.js";
import {
  isProbablyTextFile,
  lineNumberAt,
  listFiles,
  listGitVisibleFiles,
  pathExists,
  readJsonIfExists,
  readTextIfExists,
  relativePath
} from "./fs-utils.js";
import { checkGitSafety } from "./git-safety.js";
import { normalizeLanguage, t } from "./i18n.js";
import { loadRuleLibrary } from "./rules.js";
import { containsCredentialUrlSecret, findCredentialUrlSecretMatches } from "./secret-url.js";
import { staleUpdateFinding } from "./update-policy.js";

const KNOWN_SECRET_PATTERNS = [
  { label: "OpenAI API key", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { label: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g },
  { label: "npm access token", regex: /\bnpm_[A-Za-z0-9]{20,}\b/g },
  { label: "Stripe live secret key", regex: /\bsk_live_[A-Za-z0-9]{20,}\b/g },
  { label: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  { label: "Private key header", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
];

const PAID_INTEGRATION_HINTS = [
  "openai",
  "@openai",
  "anthropic",
  "@anthropic-ai",
  "stripe",
  "twilio",
  "sendgrid",
  "resend",
  "aws-sdk",
  "@aws-sdk",
  "firebase",
  "@google-cloud"
];

export function auditProject(projectPath, options = {}) {
  const root = path.resolve(projectPath);
  if (!pathExists(root)) throw new Error(`Project path does not exist: ${root}`);

  const configPath = path.join(root, ".vibeguard.json");
  const hasConfig = pathExists(configPath);
  const config = readJsonIfExists(configPath) ?? {};
  const language = normalizeLanguage(options.language ?? options.lang ?? config.language);
  const rulesPath = options.rulesPath ?? config.rulesPath;
  const maxFileLines = options.maxFileLines ?? config.maxFileLines;

  const report = {
    root,
    language,
    generatedAt: new Date().toISOString(),
    mode: config.mode ?? "guided",
    display: config.display ?? "emoji",
    project: detectProject(root),
    rules: loadRuleLibrary(root, rulesPath),
    findings: [],
    gates: {
      security: gate(t(language, "gate.security.label"), "pass", t(language, "gate.security.pass")),
      cost: gate(t(language, "gate.cost.label"), "pass", t(language, "gate.cost.pass")),
      data: gate(t(language, "gate.data.label"), "pass", t(language, "gate.data.pass")),
      structure: gate(t(language, "gate.structure.label"), "pass", t(language, "gate.structure.pass")),
      repository: gate(t(language, "gate.repository.label"), "pass", t(language, "gate.repository.pass")),
      environment: gate(t(language, "gate.environment.label"), "pass", t(language, "gate.environment.pass"))
    },
    stats: {
      scannedFiles: 0,
      skippedFiles: 0,
      scanMode: "full",
      changedFiles: 0
    }
  };

  checkProjectBasics(root, report);
  const staleUpdate = staleUpdateFinding(root, config, { hasConfig, language, now: options.now });
  if (staleUpdate) addFinding(report, staleUpdate);
  checkGitSafety(root, report, config, addFinding, { env: options.env ?? process.env });
  checkEnvSafety(root, report);
  checkPackageScripts(root, report);
  checkPaidIntegrations(root, report);
  const changedScanFiles = options.changedOnly && report.git ? report.git.changedFiles : null;
  checkFiles(root, report, {
    ...options,
    maxFileLines,
    scanFiles: changedScanFiles,
    scanMode: changedScanFiles ? "changed" : "full"
  });
  summarize(report);

  return report;
}

function gate(label, status, message) {
  return { label, status, message };
}

function addFinding(report, finding) {
  const complete = {
    id: `VG-${String(report.findings.length + 1).padStart(4, "0")}`,
    severity: "warn",
    category: "structure",
    file: null,
    line: null,
    fixable: false,
    ...finding
  };
  report.findings.push(complete);
  updateGate(report, complete.category, complete.severity, complete.message);
  return complete;
}

function updateGate(report, category, severity, message) {
  const gateInfo = report.gates[category];
  if (!gateInfo) return;

  const nextStatus = severity === "block" ? "block" : severity === "warn" ? "warn" : "pass";
  const rank = { pass: 0, warn: 1, block: 2 };
  if (rank[nextStatus] >= rank[gateInfo.status]) {
    gateInfo.status = nextStatus;
    gateInfo.message = message;
  }
}

function detectProject(root) {
  const project = {
    type: "unknown",
    packageManager: null,
    languages: []
  };

  if (pathExists(path.join(root, "package.json"))) {
    project.type = "node";
    project.languages.push("javascript");
    if (pathExists(path.join(root, "pnpm-lock.yaml"))) project.packageManager = "pnpm";
    else if (pathExists(path.join(root, "yarn.lock"))) project.packageManager = "yarn";
    else if (pathExists(path.join(root, "package-lock.json"))) project.packageManager = "npm";
    else project.packageManager = "npm";
  }

  if (pathExists(path.join(root, "pyproject.toml")) || pathExists(path.join(root, "requirements.txt"))) {
    project.type = project.type === "unknown" ? "python" : `${project.type}+python`;
    project.languages.push("python");
  }

  if (pathExists(path.join(root, "Cargo.toml"))) {
    project.type = project.type === "unknown" ? "rust" : `${project.type}+rust`;
    project.languages.push("rust");
  }

  if (pathExists(path.join(root, "Package.swift"))) {
    project.type = project.type === "unknown" ? "swift" : `${project.type}+swift`;
    project.languages.push("swift");
  }

  return project;
}

function checkProjectBasics(root, report) {
  const language = report.language;
  if (!pathExists(path.join(root, ".git"))) {
    addFinding(report, {
      severity: "warn",
      category: "environment",
      message: t(language, "finding.notGit.message"),
      recommendation: t(language, "finding.notGit.recommendation")
    });
  }

  if (!pathExists(path.join(root, "VIBEGUARD.md"))) {
    addFinding(report, {
      severity: "info",
      category: "environment",
      fixable: true,
      action: "init-policy",
      message: t(language, "finding.missingPolicy.message"),
      recommendation: t(language, "finding.missingPolicy.recommendation")
    });
  }
}

function checkEnvSafety(root, report) {
  const language = report.language;
  const rootEntries = fs.readdirSync(root);
  const envFiles = rootEntries.filter(isEnvFileName);
  const runtimeEnvFiles = envFiles.filter(isRuntimeEnvFileName);
  const gitignorePath = path.join(root, ".gitignore");
  const gitignore = readTextIfExists(gitignorePath);

  if (!pathExists(gitignorePath)) {
    addFinding(report, {
      severity: runtimeEnvFiles.length > 0 ? "block" : "warn",
      category: "security",
      fixable: true,
      action: "env-gitignore",
      message: t(language, "finding.missingGitignore.message"),
      recommendation: t(language, "finding.missingGitignore.recommendation")
    });
    return;
  }

  if (!hasEnvIgnoreProtection(gitignore)) {
    addFinding(report, {
      severity: runtimeEnvFiles.length > 0 ? "block" : "warn",
      category: "security",
      fixable: true,
      action: "env-gitignore",
      file: ".gitignore",
      message: t(language, "finding.envProtection.message"),
      recommendation: t(language, "finding.envProtection.recommendation")
    });
  }

  if (runtimeEnvFiles.length > 0 && !hasEnvTemplateFile(envFiles)) {
    addFinding(report, {
      severity: "warn",
      category: "security",
      fixable: true,
      action: "env-example",
      message: t(language, "finding.missingEnvExample.message"),
      recommendation: t(language, "finding.missingEnvExample.recommendation")
    });
  }
}

function hasEnvIgnoreProtection(gitignore) {
  const lines = gitignore.split(/\r?\n/).map((line) => line.trim());
  return lines.includes(".env") || lines.includes(".env*") || lines.includes(".env.*");
}

function checkPackageScripts(root, report) {
  const language = report.language;
  const packageJsonPath = path.join(root, "package.json");
  const packageJson = readJsonIfExists(packageJsonPath);
  if (!packageJson?.scripts) return;

  const riskyPatterns = [
    { labelKey: "risk.forceDelete", kind: "destructive", regex: /\brm\s+-rf\b/ },
    { labelKey: "risk.productionDeploy", kind: "environment", regex: /\b(vercel|netlify|firebase)\b.*\b(--prod|deploy)\b/ },
    { labelKey: "risk.databaseReset", kind: "data", regex: /\b(prisma\s+migrate\s+reset|dropdb|sequelize\s+db:drop)\b/ },
    { labelKey: "risk.acceptedDataLoss", kind: "data", regex: /\b--accept-data-loss\b/ },
    { labelKey: "risk.sqlDelete", kind: "data", regex: /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i }
  ];

  for (const [name, command] of Object.entries(packageJson.scripts)) {
    for (const pattern of riskyPatterns) {
      if (!pattern.regex.test(command)) continue;
      addFinding(report, {
        severity: pattern.kind === "data" || pattern.kind === "destructive" ? "block" : "warn",
        category: pattern.kind === "data" ? "data" : "environment",
        file: "package.json",
        message: t(language, "finding.riskyScript.message", { name, label: t(language, pattern.labelKey) }),
        recommendation: t(language, "finding.riskyScript.recommendation")
      });
    }
  }
}

function checkPaidIntegrations(root, report) {
  const language = report.language;
  const packageJson = readJsonIfExists(path.join(root, "package.json"));
  if (!packageJson) return;

  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.optionalDependencies
  };
  const found = Object.keys(deps ?? {}).filter((name) => {
    const lower = name.toLowerCase();
    return PAID_INTEGRATION_HINTS.some((hint) => lower.includes(hint));
  });

  if (found.length === 0) return;

  addFinding(report, {
    severity: "warn",
    category: "cost",
    file: "package.json",
    message: t(language, "finding.paidDependency.message", { dependencies: found.slice(0, 5).join(", ") }),
    recommendation: t(language, "finding.paidDependency.recommendation")
  });
}

function checkFiles(root, report, options) {
  const maxFileLines = options.maxFileLines ?? 800;
  const maxFileBytes = options.maxFileBytes ?? 1024 * 1024;
  const files = options.scanFiles
    ? resolveSelectedFiles(root, options.scanFiles, { ignoreDirs: SCAN_IGNORE_DIRS, maxFileBytes })
    : listGitVisibleFiles(root, { ignoreDirs: SCAN_IGNORE_DIRS, maxFileBytes }) ?? listFiles(root, { ignoreDirs: SCAN_IGNORE_DIRS, maxFileBytes });

  report.stats.scanMode = options.scanMode ?? "full";
  report.stats.changedFiles = options.scanFiles?.length ?? 0;

  for (const filePath of files) {
    const basename = path.basename(filePath);
    if (isEnvFileName(basename) && !shouldScanEnvFileName(basename)) {
      report.stats.skippedFiles += 1;
      continue;
    }

    if (!isProbablyTextFile(filePath)) {
      report.stats.skippedFiles += 1;
      continue;
    }

    const relative = relativePath(root, filePath);
    const content = fs.readFileSync(filePath, "utf8");
    report.stats.scannedFiles += 1;

    const lineCount = content.split(/\r?\n/).length;
    if (isSourceCodeFile(filePath) && lineCount > maxFileLines) {
      addFinding(report, {
        severity: lineCount > maxFileLines * 2 ? "block" : "warn",
        category: "structure",
        file: relative,
        message: t(report.language, "finding.largeFile.message", { lineCount }),
        recommendation: t(report.language, "finding.largeFile.recommendation")
      });
    }

    scanSecretAssignments(root, filePath, content, report);
    scanEnvTemplateAssignments(root, filePath, content, report);
    scanKnownSecretValues(root, filePath, content, report);
  }
}

function resolveSelectedFiles(root, relatives, options) {
  const files = [];
  for (const relative of relatives) {
    if (isInIgnoredDir(relative, options.ignoreDirs)) continue;

    const fullPath = path.resolve(root, relative);
    if (!isInsideRoot(root, fullPath)) continue;

    try {
      const stat = fs.statSync(fullPath);
      if (stat.isFile() && stat.size <= options.maxFileBytes) files.push(fullPath);
    } catch {
      // Ignore paths that disappeared between Git status and file inspection.
    }
  }
  return files;
}

function isInsideRoot(root, filePath) {
  const relative = path.relative(root, filePath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function isInIgnoredDir(relative, ignoreDirs) {
  return relative.split(/[\\/]+/).some((segment) => ignoreDirs.has(segment));
}

function scanSecretAssignments(root, filePath, content, report) {
  const extension = path.extname(filePath);
  const relative = relativePath(root, filePath);
  const patterns = assignmentPatternsFor(extension);

  for (const pattern of patterns) {
    pattern.regex.lastIndex = 0;
    for (const match of content.matchAll(pattern.regex)) {
      const name = match.groups?.name;
      const value = match.groups?.value;
      if (!name || !value) continue;
      const classification = classifySecretAssignment(name, value);
      if (!classification) continue;

      const valueStart = match.index + match[0].lastIndexOf(value);
      const quoteStart = valueStart - 1;
      const quoteEnd = valueStart + value.length + 1;
      const envName = toEnvName(name);
      const finding = {
        severity: classification.severity,
        category: "security",
        file: relative,
        line: lineNumberAt(content, match.index),
        fixable: classification.fixable,
        message: t(report.language, classification.messageKey, { envName }),
        recommendation: t(report.language, classification.recommendationKey),
        evidence: `${name}=<redacted>`
      };

      if (classification.action) finding.action = classification.action;
      if (classification.fixable) {
        finding.fix = {
          type: "secret-env",
          language: pattern.language,
          start: quoteStart,
          end: quoteEnd,
          envName
        };
      }

      addFinding(report, finding);
    }
  }
}

function assignmentPatternsFor(extension) {
  if ([".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx"].includes(extension)) {
    return [
      {
        language: "js",
        regex: /(?<lhs>\b(?:const|let|var)\s+(?<name>[A-Za-z_$][\w$]*)(?:\s*:\s*[^=]+)?\s*=\s*)(?<quote>["'`])(?<value>[^"'`\n]{12,})(?:\k<quote>)/g
      },
      {
        language: "js",
        regex: /(?<lhs>\b(?<name>[A-Za-z_$][\w$]*)\s*:\s*)(?<quote>["'`])(?<value>[^"'`\n]{12,})(?:\k<quote>)/g
      }
    ];
  }

  if (extension === ".py") {
    return [
      {
        language: "python",
        regex: /(?<lhs>^\s*(?<name>[A-Za-z_][\w]*)\s*=\s*)(?<quote>["'])(?<value>[^"'\n]{12,})(?:\k<quote>)/gm
      }
    ];
  }

  return [];
}

function scanKnownSecretValues(root, filePath, content, report) {
  const relative = relativePath(root, filePath);
  for (const pattern of KNOWN_SECRET_PATTERNS) {
    pattern.regex.lastIndex = 0;
    for (const match of content.matchAll(pattern.regex)) {
      if (isLikelyPlaceholder(match[0])) continue;
      if (isInGeneratedSecretFinding(report, relative, match.index)) continue;

      addFinding(report, {
        severity: "block",
        category: "security",
        file: relative,
        line: lineNumberAt(content, match.index),
        message: t(report.language, "finding.knownSecret.message", { label: pattern.label }),
        recommendation: t(report.language, "finding.knownSecret.recommendation"),
        evidence: "<redacted>"
      });
    }
  }

  for (const match of findCredentialUrlSecretMatches(content)) {
    if (isInGeneratedSecretFinding(report, relative, match.index)) continue;

    addFinding(report, {
      severity: "block",
      category: "security",
      file: relative,
      line: lineNumberAt(content, match.index),
      message: t(report.language, "finding.knownSecret.message", { label: match.label }),
      recommendation: t(report.language, "finding.knownSecret.recommendation"),
      evidence: "<redacted>"
    });
  }
}

function scanEnvTemplateAssignments(root, filePath, content, report) {
  const basename = path.basename(filePath);
  if (!isEnvTemplateFileName(basename)) return;

  const relative = relativePath(root, filePath);
  const pattern = /^\s*(?:export\s+)?(?<name>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<raw>.*)$/gm;
  for (const match of content.matchAll(pattern)) {
    const name = match.groups?.name;
    const value = normalizeEnvValue(match.groups?.raw ?? "");
    if (!name || !value) continue;
    if (isLikelyPlaceholder(value)) continue;
    if (matchesKnownSecretValue(value)) continue;
    if (!isSensitiveName(name)) continue;
    if (isDescriptiveSensitiveName(name)) continue;
    if (!looksLikeHighEntropySecret(value)) continue;

    addFinding(report, {
      severity: "warn",
      category: "security",
      file: relative,
      line: lineNumberAt(content, match.index),
      message: t(report.language, "finding.highEntropySensitiveAssignment.message", { envName: toEnvName(name) }),
      recommendation: t(report.language, "finding.highEntropySensitiveAssignment.recommendation"),
      evidence: `${name}=<redacted>`
    });
  }
}

function isInGeneratedSecretFinding(report, relative, index) {
  return report.findings.some((finding) => {
    return finding.file === relative && finding.fix?.start <= index && index <= finding.fix?.end;
  });
}

function classifySecretAssignment(name, value) {
  if (isLikelyPlaceholder(value)) return false;
  if (matchesKnownSecretValue(value)) {
    return {
      severity: "block",
      fixable: true,
      action: "secret-quarantine",
      messageKey: "finding.secretAssignment.message",
      recommendationKey: "finding.secretAssignment.recommendation"
    };
  }
  if (!isSensitiveName(name)) return false;
  if (isDescriptiveSensitiveName(name)) return false;
  if (looksLikeHumanText(value)) return false;
  if (looksLikeDocumentationPath(value)) return false;
  if (looksLikeWordPhrase(value)) return false;
  if (!looksLikeHighEntropySecret(value)) return false;
  return {
    severity: "warn",
    fixable: false,
    messageKey: "finding.highEntropySensitiveAssignment.message",
    recommendationKey: "finding.highEntropySensitiveAssignment.recommendation"
  };
}

function isSensitiveName(name) {
  return /(api[_-]?key|secret|token|password|passwd|pwd|private[_-]?key|credential|service[_-]?role)/i.test(name);
}

function isDescriptiveSensitiveName(name) {
  return /(format|policy|description|example|placeholder|schema|scope|path|manager|tokenizer|pattern|prefix|suffix|label|message|text|template|sample|mock|retry)/i.test(
    name
  );
}

function matchesKnownSecretValue(value) {
  if (containsCredentialUrlSecret(value)) return true;
  return KNOWN_SECRET_PATTERNS.some((pattern) => {
    const regex = new RegExp(pattern.regex.source);
    return regex.test(value);
  });
}

function isLikelyPlaceholder(value) {
  if (value.trim() === "") return true;
  const lower = value.toLowerCase();
  if (lower.includes("example") || lower.includes("placeholder")) return true;
  if (lower.includes("your_") || lower.includes("your-")) return true;
  if (lower.includes("changeme") || lower.includes("change_me")) return true;
  if (/[<>{}]/.test(value)) return true;
  if (/x{6,}/i.test(value)) return true;
  if (/^\*+$/.test(value)) return true;
  return false;
}

function looksLikeHumanText(value) {
  return /\s/.test(value);
}

function looksLikeDocumentationPath(value) {
  return /^\/[A-Za-z0-9._/-]+$/.test(value);
}

function looksLikeWordPhrase(value) {
  const tokens = value.split(/[-_./]+/).filter(Boolean);
  if (tokens.length < 3) return false;
  return tokens.every((token) => /^[A-Za-z]+[0-9]*$/.test(token) || /^[0-9]+$/.test(token));
}

function looksLikeHighEntropySecret(value) {
  if (value.length < 24) return false;
  if (/\s/.test(value)) return false;

  const characterClasses = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /[0-9]/.test(value),
    /[^A-Za-z0-9]/.test(value)
  ].filter(Boolean).length;
  if (characterClasses < 3) return false;

  return shannonEntropy(value) >= 3.5;
}

function shannonEntropy(value) {
  const counts = new Map();
  for (const char of value) counts.set(char, (counts.get(char) ?? 0) + 1);

  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

export function toEnvName(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

function summarize(report) {
  const blocks = report.findings.filter((finding) => finding.severity === "block").length;
  const warnings = report.findings.filter((finding) => finding.severity === "warn").length;
  const fixable = report.findings.filter((finding) => finding.fixable).length;

  report.summary = {
    status: blocks > 0 ? "block" : warnings > 0 ? "warn" : "pass",
    blocks,
    warnings,
    fixable
  };
}

export function sanitizeReport(report) {
  return JSON.parse(
    JSON.stringify(report, (key, value) => {
      if (key === "start" || key === "end") return undefined;
      return value;
    })
  );
}
