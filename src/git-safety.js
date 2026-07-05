import { execFileSync } from "node:child_process";
import path from "node:path";
import { isEnvFileName, isRuntimeEnvFileName } from "./env-policy.js";
import { pathExists, readJsonIfExists } from "./fs-utils.js";
import { t } from "./i18n.js";

const SENSITIVE_GIT_PATH_PATTERNS = [
  /(^|\/)\.env(?:\.|$)/i,
  /(^|\/)(?:id_rsa|id_dsa|id_ecdsa|id_ed25519|known_hosts)$/i,
  /(^|\/).*\.(?:pem|p12|pfx|key)$/i,
  /(^|\/).*(?:secret|credential|credentials|service-account|service_account|private-key|private_key).*\.(?:json|ya?ml|toml|env|txt|plist)$/i,
  /(^|\/)(?:google-services\.json|GoogleService-Info\.plist)$/i
];

const PUBLIC_REVIEW_PATH_PATTERNS = [
  /(^|\/)\.github\/workflows\//i,
  /(^|\/)(?:Dockerfile|docker-compose\.ya?ml)$/i,
  /(^|\/)(?:vercel\.json|netlify\.toml|firebase\.json|app\.yaml)$/i,
  /(^|\/)(?:infra|terraform|pulumi|cloudformation)\//i,
  /(^|\/)(?:prisma\/migrations|migrations|supabase\/migrations)\//i
];

export function checkGitSafety(root, report, config, addFinding, options = {}) {
  if (!pathExists(path.join(root, ".git"))) return;

  const context = readGitContext(root, config, options.env ?? process.env);
  if (options.pathspecs?.length) {
    context.changedFiles = context.changedFiles.filter((file) => matchesPathspec(file, options.pathspecs));
  }
  report.git = context;
  if (!context.remoteName && context.changedFiles.length === 0) return;

  const sensitiveFiles = context.changedFiles.filter((file) => isSensitiveGitPath(file));
  if (sensitiveFiles.length > 0) {
    addFinding(report, {
      severity: repositoryPathFindingSeverity(context, { publicSeverity: "block" }),
      category: "repository",
      message: t(report.language, "finding.gitSensitiveChanges.message", {
        visibility: context.visibility,
        files: formatFileList(sensitiveFiles)
      }),
      recommendation: t(report.language, "finding.gitSensitiveChanges.recommendation")
    });
  }

  if (context.remoteName && context.projectName && isSuspiciouslySimilarName(context.projectName, context.remoteName)) {
    addFinding(report, {
      severity: "warn",
      category: "repository",
      message: t(report.language, "finding.gitSimilarRemote.message", {
        localName: context.projectName,
        remoteName: context.remoteName
      }),
      recommendation: t(report.language, "finding.gitSimilarRemote.recommendation")
    });
  }

  const reviewFiles = context.changedFiles.filter(isPublicReviewPath);
  if (!isTrustedPrivateVisibility(context.visibility) && reviewFiles.length > 0) {
    addFinding(report, {
      severity: repositoryPathFindingSeverity(context, { publicSeverity: "warn" }),
      category: "repository",
      message: t(report.language, "finding.gitPublicOpsChanges.message", {
        visibility: context.visibility,
        files: formatFileList(reviewFiles)
      }),
      recommendation: t(report.language, "finding.gitPublicOpsChanges.recommendation")
    });
  }
}

function readGitContext(root, config, env) {
  const remoteUrl = gitOutput(root, ["config", "--get", "remote.origin.url"]) || null;
  const remote = parseGitRemote(remoteUrl);
  const projectName = detectProjectName(root);
  const visibility = resolveRepositoryVisibility(root, config, remote, env);

  return {
    remote: remote ? `${remote.owner}/${remote.repo}` : null,
    remoteHost: remote?.host ?? null,
    remoteName: remote?.repo ?? null,
    projectName,
    visibility: visibility.value,
    visibilitySource: visibility.source,
    changedFiles: readGitChangedFiles(root)
  };
}

function resolveRepositoryVisibility(root, config, remote, env) {
  const candidates = [
    ["config", config.repository?.visibility],
    ["config", config.git?.visibility],
    ["git-config", gitOutput(root, ["config", "--get", "vibeguard.repositoryVisibility"])],
    ["env", env?.VIBEGUARD_REPOSITORY_VISIBILITY],
    ["github-actions", githubActionsVisibility(remote, env)],
    ["gitlab-ci", gitlabCiVisibility(remote, env)]
  ];

  for (const [source, value] of candidates) {
    const normalized = normalizeRepositoryVisibility(value);
    if (isKnownRepositoryVisibility(normalized)) return { value: normalized, source };
  }

  return { value: "unknown", source: "unknown" };
}

function gitOutput(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2000
    }).trim();
  } catch {
    return null;
  }
}

function parseGitRemote(remoteUrl) {
  if (!remoteUrl) return null;
  const sshMatch = remoteUrl.match(/^(?:ssh:\/\/)?git@([^:/]+)[:/](.+?)(?:\.git)?$/i);
  if (sshMatch) {
    return remoteFromPath(sshMatch[1], sshMatch[2]);
  }

  try {
    const parsed = new URL(remoteUrl);
    return remoteFromPath(parsed.hostname, parsed.pathname);
  } catch {
    return null;
  }

  return null;
}

function remoteFromPath(host, remotePath) {
  const parts = String(remotePath ?? "")
    .replace(/^\/|\.git$/g, "")
    .split("/")
    .filter(Boolean);
  if (parts.length < 2) return null;
  return {
    host: String(host).toLowerCase(),
    owner: parts.slice(0, -1).join("/"),
    repo: parts.at(-1)
  };
}

function detectProjectName(root) {
  const packageJson = readJsonIfExists(path.join(root, "package.json"));
  const packageName = packageJson?.name?.replace(/^@[^/]+\//, "");
  return packageName || path.basename(root);
}

function githubActionsVisibility(remote, env) {
  if (!remote || remote.host !== "github.com") return null;
  const currentRepo = env?.GITHUB_REPOSITORY;
  const visibility = env?.GITHUB_REPOSITORY_VISIBILITY;
  if (!visibility) return null;
  if (currentRepo && currentRepo.toLowerCase() !== `${remote.owner}/${remote.repo}`.toLowerCase()) return null;
  return visibility;
}

function gitlabCiVisibility(remote, env) {
  const visibility = env?.CI_PROJECT_VISIBILITY;
  if (!visibility) return null;
  if (!remote) return visibility;

  const serverHost = env?.CI_SERVER_HOST;
  if (serverHost && remote.host !== serverHost.toLowerCase()) return null;

  const projectPath = env?.CI_PROJECT_PATH;
  if (projectPath && projectPath.toLowerCase() !== `${remote.owner}/${remote.repo}`.toLowerCase()) return null;

  return visibility;
}

function normalizeRepositoryVisibility(value) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["public", "private", "internal"].includes(normalized)) return normalized;
  return "unknown";
}

function isKnownRepositoryVisibility(value) {
  return value === "public" || value === "private" || value === "internal";
}

function isTrustedPrivateVisibility(value) {
  return value === "private" || value === "internal";
}

function repositoryPathFindingSeverity(context, { publicSeverity }) {
  if (context.visibility === "public") return publicSeverity;
  if (isTrustedPrivateVisibility(context.visibility)) return "warn";
  return "info";
}

function readGitChangedFiles(root) {
  const files = new Set();
  const commands = [
    ["diff", "--name-only", "--cached", "--diff-filter=ACMR"],
    ["diff", "--name-only", "--diff-filter=ACMR"],
    ["ls-files", "--others", "--exclude-standard"]
  ];

  for (const args of commands) {
    const output = gitOutput(root, args);
    if (!output) continue;
    for (const file of output.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
      files.add(file);
    }
  }
  return [...files].sort();
}

function isSensitiveGitPath(filePath) {
  const basename = path.basename(filePath);
  if (isEnvFileName(basename)) return isRuntimeEnvFileName(basename);
  return SENSITIVE_GIT_PATH_PATTERNS.some((pattern) => pattern.test(filePath));
}

function isPublicReviewPath(filePath) {
  return PUBLIC_REVIEW_PATH_PATTERNS.some((pattern) => pattern.test(filePath));
}

function matchesPathspec(filePath, pathspecs) {
  const normalizedFile = normalizePathspec(filePath);
  return pathspecs.some((pathspec) => {
    const normalizedPathspec = normalizePathspec(pathspec);
    return (
      normalizedFile === normalizedPathspec ||
      normalizedFile.startsWith(`${normalizedPathspec}/`)
    );
  });
}

function normalizePathspec(value) {
  return String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+$/g, "");
}

function isSuspiciouslySimilarName(localName, remoteName) {
  const local = normalizeComparableName(localName);
  const remote = normalizeComparableName(remoteName);
  if (!local || !remote || local === remote) return false;
  if (local.length < 4 || remote.length < 4) return false;
  if (local.includes(remote) || remote.includes(local)) return true;
  return similarity(local, remote) >= 0.78;
}

function normalizeComparableName(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function similarity(left, right) {
  const maxLength = Math.max(left.length, right.length);
  if (maxLength === 0) return 1;
  return 1 - levenshteinDistance(left, right) / maxLength;
}

function levenshteinDistance(left, right) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function formatFileList(files) {
  const visible = files.slice(0, 5);
  const suffix = files.length > visible.length ? `, +${files.length - visible.length} more` : "";
  return `${visible.join(", ")}${suffix}`;
}
