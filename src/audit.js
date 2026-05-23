import fs from "node:fs";
import path from "node:path";
import {
  isProbablyTextFile,
  lineNumberAt,
  listFiles,
  pathExists,
  readJsonIfExists,
  readTextIfExists,
  relativePath
} from "./fs-utils.js";
import { loadRuleLibrary } from "./rules.js";

const IGNORE_DIRS = new Set([
  ".git",
  ".next",
  ".turbo",
  ".vibeguard",
  ".venv",
  "build",
  "coverage",
  "DerivedData",
  "dist",
  "node_modules",
  "Pods",
  "target",
  "venv",
  "__pycache__"
]);

const KNOWN_SECRET_PATTERNS = [
  { label: "OpenAI API key", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { label: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g },
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
  if (!pathExists(root)) {
    throw new Error(`Project path does not exist: ${root}`);
  }

  const report = {
    root,
    generatedAt: new Date().toISOString(),
    project: detectProject(root),
    rules: loadRuleLibrary(root, options.rulesPath),
    findings: [],
    gates: {
      security: gate("보안", "pass", "민감정보 차단 이슈 없음"),
      cost: gate("비용", "pass", "즉시 비용 폭탄 징후 없음"),
      data: gate("데이터", "pass", "데이터 손실 작업 징후 없음"),
      structure: gate("구조", "pass", "구조상 즉시 차단할 문제 없음"),
      environment: gate("환경", "pass", "기본 실행 환경 단서 확인됨")
    },
    stats: {
      scannedFiles: 0,
      skippedFiles: 0
    }
  };

  checkProjectBasics(root, report);
  checkEnvSafety(root, report);
  checkPackageScripts(root, report);
  checkPaidIntegrations(root, report);
  checkFiles(root, report, options);
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
  if (!pathExists(path.join(root, ".git"))) {
    addFinding(report, {
      severity: "warn",
      category: "environment",
      message: "Git 저장소가 아닙니다. 자동 수정 전 변경 추적이 어렵습니다.",
      recommendation: "`git init` 후 작업하거나 백업 가능한 실험 프로젝트에서 실행하세요."
    });
  }

  if (!pathExists(path.join(root, "VIBEGUARD.md"))) {
    addFinding(report, {
      severity: "info",
      category: "environment",
      fixable: true,
      action: "init-policy",
      message: "VIBEGUARD.md 정책 파일이 없습니다.",
      recommendation: "`vibe-guard init`으로 프로젝트별 안전 정책을 생성하세요."
    });
  }
}

function checkEnvSafety(root, report) {
  const rootEntries = fs.readdirSync(root);
  const envFiles = rootEntries.filter((name) => name === ".env" || (name.startsWith(".env.") && name !== ".env.example"));
  const gitignorePath = path.join(root, ".gitignore");
  const gitignore = readTextIfExists(gitignorePath);

  if (!pathExists(gitignorePath)) {
    addFinding(report, {
      severity: envFiles.length > 0 ? "block" : "warn",
      category: "security",
      fixable: true,
      action: "env-gitignore",
      message: ".gitignore가 없어 로컬 비밀 파일이 커밋될 수 있습니다.",
      recommendation: "`vibe-guard audit --fix`로 env ignore 규칙을 생성하세요."
    });
    return;
  }

  if (!hasEnvIgnoreProtection(gitignore)) {
    addFinding(report, {
      severity: envFiles.length > 0 ? "block" : "warn",
      category: "security",
      fixable: true,
      action: "env-gitignore",
      file: ".gitignore",
      message: ".env 파일을 보호하는 ignore 규칙이 부족합니다.",
      recommendation: "`vibe-guard audit --fix`로 .env, .env.*, !.env.example 규칙을 추가하세요."
    });
  }

  if (envFiles.length > 0 && !pathExists(path.join(root, ".env.example"))) {
    addFinding(report, {
      severity: "warn",
      category: "security",
      fixable: true,
      action: "env-example",
      message: ".env.example이 없어 필요한 환경변수 이름을 안전하게 공유하기 어렵습니다.",
      recommendation: "`vibe-guard audit --fix`로 값 없는 예시 파일을 생성하세요."
    });
  }
}

function hasEnvIgnoreProtection(gitignore) {
  const lines = gitignore.split(/\r?\n/).map((line) => line.trim());
  return lines.includes(".env") || lines.includes(".env*") || lines.includes(".env.*");
}

function checkPackageScripts(root, report) {
  const packageJsonPath = path.join(root, "package.json");
  const packageJson = readJsonIfExists(packageJsonPath);
  if (!packageJson?.scripts) return;

  const riskyPatterns = [
    { label: "강제 삭제", regex: /\brm\s+-rf\b/ },
    { label: "운영 배포", regex: /\b(vercel|netlify|firebase)\b.*\b(--prod|deploy)\b/ },
    { label: "DB 리셋", regex: /\b(prisma\s+migrate\s+reset|dropdb|sequelize\s+db:drop)\b/ },
    { label: "데이터 손실 허용", regex: /\b--accept-data-loss\b/ },
    { label: "SQL 삭제", regex: /\bDROP\s+(TABLE|DATABASE|SCHEMA)\b/i }
  ];

  for (const [name, command] of Object.entries(packageJson.scripts)) {
    for (const pattern of riskyPatterns) {
      if (!pattern.regex.test(command)) continue;
      addFinding(report, {
        severity: pattern.label.includes("DB") || pattern.label.includes("삭제") ? "block" : "warn",
        category: pattern.label.includes("DB") || pattern.label.includes("데이터") ? "data" : "environment",
        file: "package.json",
        message: `위험 스크립트 감지: ${name} (${pattern.label})`,
        recommendation: "AI 에이전트가 이 스크립트를 실행하기 전 명시 승인, 백업, staging 여부를 확인해야 합니다."
      });
    }
  }
}

function checkPaidIntegrations(root, report) {
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
    message: `외부 유료/쿼터형 서비스 의존성 감지: ${found.slice(0, 5).join(", ")}`,
    recommendation: "예산 제한, 호출 횟수 제한, 테스트 키와 운영 키 분리를 확인하세요."
  });
}

function checkFiles(root, report, options) {
  const maxFileLines = options.maxFileLines ?? 500;
  const files = listFiles(root, { ignoreDirs: IGNORE_DIRS });

  for (const filePath of files) {
    const basename = path.basename(filePath);
    if (basename.startsWith(".env") && basename !== ".env.example") {
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
    if (lineCount > maxFileLines) {
      addFinding(report, {
        severity: lineCount > maxFileLines * 2 ? "block" : "warn",
        category: "structure",
        file: relative,
        message: `파일이 ${lineCount}줄입니다. 비개발자 AI 수정에는 너무 큽니다.`,
        recommendation: "새 기능 추가 전 모듈 분리나 작은 변경 단위 계획을 요구하세요."
      });
    }

    scanSecretAssignments(root, filePath, content, report);
    scanKnownSecretValues(root, filePath, content, report);
  }
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
      if (!shouldFlagAssignment(name, value)) continue;

      const valueStart = match.index + match[0].lastIndexOf(value);
      const quoteStart = valueStart - 1;
      const quoteEnd = valueStart + value.length + 1;

      addFinding(report, {
        severity: "block",
        category: "security",
        file: relative,
        line: lineNumberAt(content, match.index),
        fixable: true,
        action: "secret-quarantine",
        message: `하드코딩된 비밀값 후보 감지: ${toEnvName(name)}`,
        recommendation: "`vibe-guard audit --fix`로 값을 ignored env 파일로 격리하고 코드에서는 환경변수를 읽게 바꾸세요.",
        evidence: `${name}=<redacted>`,
        fix: {
          type: "secret-env",
          language: pattern.language,
          start: quoteStart,
          end: quoteEnd,
          envName: toEnvName(name)
        }
      });
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
        message: `${pattern.label} 후보가 파일에 포함되어 있습니다.`,
        recommendation: "값을 출력하지 말고 즉시 env/secret manager로 이동하세요. 이미 공유되었으면 키를 회전하세요.",
        evidence: "<redacted>"
      });
    }
  }
}

function isInGeneratedSecretFinding(report, relative, index) {
  return report.findings.some((finding) => {
    return finding.file === relative && finding.fix?.start <= index && index <= finding.fix?.end;
  });
}

function shouldFlagAssignment(name, value) {
  if (isLikelyPlaceholder(value)) return false;
  return isSensitiveName(name) || matchesKnownSecretValue(value);
}

function isSensitiveName(name) {
  return /(api[_-]?key|secret|token|password|passwd|pwd|private[_-]?key|credential|service[_-]?role)/i.test(name);
}

function matchesKnownSecretValue(value) {
  return KNOWN_SECRET_PATTERNS.some((pattern) => {
    const regex = new RegExp(pattern.regex.source);
    return regex.test(value);
  });
}

function isLikelyPlaceholder(value) {
  const lower = value.toLowerCase();
  if (lower.includes("example") || lower.includes("placeholder")) return true;
  if (lower.includes("your_") || lower.includes("your-")) return true;
  if (lower.includes("changeme") || lower.includes("change_me")) return true;
  if (/[<>{}]/.test(value)) return true;
  if (/x{6,}/i.test(value)) return true;
  if (/^\*+$/.test(value)) return true;
  return false;
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
