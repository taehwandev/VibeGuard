const SUPPORTED_LANGUAGES = new Set(["en", "ko"]);

const MESSAGES = {
  en: {
    "status.pass": "Ready",
    "status.warn": "Needs review",
    "status.block": "Blocked",
    "status.info": "Info",

    "gate.security.label": "Security",
    "gate.security.pass": "No blocking secret issues found",
    "gate.cost.label": "Cost",
    "gate.cost.pass": "No immediate cost spike signals found",
    "gate.data.label": "Data",
    "gate.data.pass": "No data-loss operation signals found",
    "gate.structure.label": "Structure",
    "gate.structure.pass": "No immediate structural blockers found",
    "gate.repository.label": "Repository",
    "gate.repository.pass": "Git remote and changed-file risk signals look acceptable",
    "gate.environment.label": "Environment",
    "gate.environment.pass": "Basic project environment signals found",

    "finding.notGit.message": "This is not a Git repository. Change tracking is limited before automatic fixes.",
    "finding.notGit.recommendation": "Run `git init` first, or use VibeGuard only in a backup-friendly experiment project.",
    "finding.missingPolicy.message": "VIBEGUARD.md is missing.",
    "finding.missingPolicy.recommendation": "Run `vibeguard init` to create the project safety policy.",
    "finding.staleUpdate.message": "VibeGuard guardrails have not been refreshed within the configured {intervalDays}-day interval. Last check age: {ageDays} day(s).",
    "finding.staleUpdate.recommendation": "Run `npx --yes @taehwandev/vibeguard@latest update .` once, then rerun `vibeguard audit .`.",
    "finding.missingGitignore.message": ".gitignore is missing, so local secret files may be committed.",
    "finding.missingGitignore.recommendation": "Run `vibeguard audit --fix` to create safe env ignore rules.",
    "finding.envProtection.message": ".gitignore does not fully protect local env files.",
    "finding.envProtection.recommendation": "Run `vibeguard audit --fix` to ignore runtime env files while allowing value-free env templates such as `.env.example` and `.env.sample`.",
    "finding.missingEnvExample.message": ".env.example is missing, so required env variable names are hard to share safely.",
    "finding.missingEnvExample.recommendation": "Run `vibeguard audit --fix` to create a value-free example env file.",
    "finding.riskyScript.message": "Risky script detected: {name} ({label})",
    "finding.riskyScript.recommendation": "Require explicit approval, backup status, and staging context before any AI agent runs this script.",
    "finding.paidDependency.message": "Paid or quota-based service dependency detected: {dependencies}",
    "finding.paidDependency.recommendation": "Confirm budget limits, request limits, simpler alternatives, and separation between test and production keys.",
    "finding.largeFile.message": "Source file has {lineCount} lines, which is too large for low-risk AI editing.",
    "finding.largeFile.recommendation": "Require a module split or a small-step implementation plan before adding new behavior.",
    "finding.secretAssignment.message": "Possible hard-coded secret assignment detected: {envName}",
    "finding.secretAssignment.recommendation": "Run `vibeguard audit --fix` to move the value into an ignored env file and read it from the environment.",
    "finding.highEntropySensitiveAssignment.message": "High-entropy value assigned to sensitive-looking name: {envName}",
    "finding.highEntropySensitiveAssignment.recommendation": "Review manually. If it is a real secret, move it to an ignored env file or secret manager and rotate it if exposed.",
    "finding.knownSecret.message": "Possible {label} found in a file.",
    "finding.knownSecret.recommendation": "Do not print the value. Move it to env or a secret manager immediately. Rotate the key if it may have been shared.",
    "finding.gitSensitiveChanges.message": "Sensitive-looking Git changes detected while repository visibility is {visibility}: {files}",
    "finding.gitSensitiveChanges.recommendation": "Confirm `git remote -v` and repository visibility before commit or push. Keep secrets, credentials, env files, and private keys out of Git; rotate anything already staged for a public or unknown-visibility repo.",
    "finding.gitSimilarRemote.message": "Git remote name is close to this project name but not exact: local `{localName}`, remote `{remoteName}`.",
    "finding.gitSimilarRemote.recommendation": "Confirm the remote target before commit or push. Similar repo names are a common source of accidental pushes to the wrong repository.",
    "finding.gitPublicOpsChanges.message": "Deployment or infrastructure files changed while repository visibility is {visibility}: {files}",
    "finding.gitPublicOpsChanges.recommendation": "Review environment, cost, and production impact before pushing these changes, especially if the repository is public or visibility is unknown.",

    "risk.forceDelete": "force delete",
    "risk.productionDeploy": "production deploy",
    "risk.databaseReset": "database reset",
    "risk.acceptedDataLoss": "accepted data loss",
    "risk.sqlDelete": "SQL delete",

    "report.title": "[VibeGuard Audit Report]",
    "report.project": "Project",
    "report.overall": "Overall",
    "report.scanned": "Scanned: {scanned} file(s), skipped {skipped}",
    "report.table.gate": "Gate",
    "report.table.status": "Status",
    "report.table.message": "Message",
    "report.findings": "Findings",
    "report.findings.none": "Findings: none",
    "report.findings.more": "...and {count} more finding(s).",
    "report.next.fixable": "Next: {count} item(s) can be handled automatically with `vibeguard audit . --fix`.",
    "report.rules.loaded": "Rules: loaded {count} document(s) from {path}",

    "fixes.none": "No automatic fixes were needed.",
    "fixes.header": "Applied fixes:",
    "fixes.gitignore": "Updated .gitignore env protection rules.",
    "fixes.envExample": "Updated .env.example with required variable names.",
    "fixes.createdConfig": "Created .vibeguard.json.",
    "fixes.updatedConfig": "Updated .vibeguard.json.",
    "fixes.updatedStateGitignore": "Updated .gitignore VibeGuard local state rules.",
    "fixes.updatedUpdateState": "Updated VibeGuard update check state.",
    "fixes.createdPolicy": "Created VIBEGUARD.md.",
    "fixes.createdAgents": "Created AGENTS.md VibeGuard instructions.",
    "fixes.updatedAgents": "Updated AGENTS.md VibeGuard instructions.",
    "fixes.addedAgents": "Added VibeGuard instructions to AGENTS.md.",
    "fixes.installedPreCommit": "Installed pre-commit VibeGuard hook.",
    "fixes.installedPrePush": "Installed pre-push VibeGuard hook.",
    "fixes.updatedPreCommit": "Updated pre-commit VibeGuard hook.",
    "fixes.updatedPrePush": "Updated pre-push VibeGuard hook.",
    "fixes.addedPreCommit": "Added VibeGuard check to existing pre-commit hook.",
    "fixes.addedPrePush": "Added VibeGuard check to existing pre-push hook.",
    "fixes.wrappedPreCommit": "Wrapped existing pre-commit hook with VibeGuard check.",
    "fixes.wrappedPrePush": "Wrapped existing pre-push hook with VibeGuard check.",
    "fixes.installedClaudeEvidence": "Installed Claude Code evidence hook.",
    "fixes.updatedClaudeEvidence": "Updated Claude Code evidence hook.",
    "fixes.agentEvidenceGitignore": "Updated .gitignore agent evidence rules.",
    "fixes.movedSecrets": "Moved {count} secret value(s) into .env.vibeguard.local.",
    "fixes.replacedSecrets": "Replaced hard-coded secret reads in: {files}.",

    "prompt.title": "# VibeGuard Safe Coding Prompt",
    "prompt.intro1": "You are an AI coding agent working safely on behalf of a non-developer user.",
    "prompt.intro2": "Prioritize automatic inspection and safe fixes over long explanations.",
    "prompt.userRequest": "## User Request",
    "prompt.noRequest": "(No request was provided. First confirm the user's implementation goal in one sentence.)",
    "prompt.auditStatus": "## Current Audit Status",
    "prompt.project": "Project",
    "prompt.overall": "Overall",
    "prompt.summary": "Blocks: {blocks}, warnings: {warnings}, fixable: {fixable}",
    "prompt.findings": "## Findings To Handle",
    "prompt.fixable": "Fixable: run `vibeguard audit . --fix` or apply the same safe remediation directly.",
    "prompt.rules": "## Agent Execution Rules",
    "prompt.rule1": "Before writing code, inspect the file structure, `.gitignore`, env files, and package/script setup.",
    "prompt.rule2": "If you find a secret value, do not print it. Move it to an ignored env file or secret manager.",
    "prompt.rule3": "Ignore runtime env files such as `.env`, `.env.local`, and `.env.vibeguard.local`; keep env templates such as `.env.example` and `.env.sample` value-free. Do not hard-code environment-specific URLs, API origins, redirect/callback URLs, or asset hosts in source; use the platform's normal local or deployment config mechanism instead.",
    "prompt.rule4": "Do not delete databases, run migrations, deploy to production, or increase paid API/model usage without user approval.",
    "prompt.rule5": "Ask questions only when blocked, limit them to three, and perform safe fixes first when possible.",
    "prompt.rule6": "After editing, run tests, build, typecheck, or the narrowest useful smoke check.",
    "prompt.rule7": "Finish with a short report of changed files, verification results, and remaining risks.",
    "prompt.rule8": "If execution evidence is available, summarize `vibeguard evidence .` and do not claim verification that was not observed.",
    "prompt.rule9": "Prefer cost-aware architecture: before adding paid services, databases, queues, model calls, analytics, or cloud resources, explain why existing code or a simpler local/server-side design is insufficient.",
    "prompt.rule10": "For web apps, commonize repeated API/model/provider calls behind shared server-side helpers or endpoints, then use server-side caching, batching, and rate limits before adding new client-side call paths.",
    "prompt.rule11": "Before commit or push, verify `git remote -v`, repository visibility, and changed files. If visibility is public or unknown, stop before pushing secrets, env files, credentials, deployment, infrastructure, or paid-service changes.",
    "prompt.rule12": "If the user pastes a secret in chat, treat it as exposed: do not repeat it, do not put it in commands, logs, files, GitHub secrets, deployment settings, or servers, and guide the user to rotate it and enter a new value only through a local provider UI or secret-store prompt.",
    "prompt.externalRules": "## External Rule Library",
    "prompt.path": "Path",
    "prompt.nextAction": "## Next Action",
    "prompt.nextFixable": "Handle fixable safety issues first, then implement the user request.",
    "prompt.nextBlocked": "Do not start feature implementation until blocking issues are resolved safely.",
    "prompt.nextReady": "Implement the user request in small changes while following the rules above."
  },

  ko: {
    "status.pass": "진행 가능",
    "status.warn": "확인 필요",
    "status.block": "차단",
    "status.info": "정보",

    "gate.security.label": "보안",
    "gate.security.pass": "차단할 민감정보 이슈 없음",
    "gate.cost.label": "비용",
    "gate.cost.pass": "즉시 비용이 급증할 징후 없음",
    "gate.data.label": "데이터",
    "gate.data.pass": "데이터 손실 작업 징후 없음",
    "gate.structure.label": "구조",
    "gate.structure.pass": "즉시 차단할 구조 문제 없음",
    "gate.repository.label": "저장소",
    "gate.repository.pass": "Git remote 및 변경 파일 위험 신호가 허용 범위입니다",
    "gate.environment.label": "환경",
    "gate.environment.pass": "기본 프로젝트 환경 단서 확인됨",

    "finding.notGit.message": "Git 저장소가 아닙니다. 자동 수정 전 변경 추적이 제한됩니다.",
    "finding.notGit.recommendation": "`git init`을 먼저 실행하거나, 백업 가능한 실험 프로젝트에서만 VibeGuard를 사용하세요.",
    "finding.missingPolicy.message": "VIBEGUARD.md가 없습니다.",
    "finding.missingPolicy.recommendation": "`vibeguard init`으로 프로젝트 안전 정책을 생성하세요.",
    "finding.staleUpdate.message": "VibeGuard 가드레일이 설정된 {intervalDays}일 주기 안에 갱신되지 않았습니다. 마지막 확인 후 경과: {ageDays}일.",
    "finding.staleUpdate.recommendation": "`npx --yes @taehwandev/vibeguard@latest update .`를 한 번 실행한 뒤 `vibeguard audit .`을 다시 실행하세요.",
    "finding.missingGitignore.message": ".gitignore가 없어 로컬 비밀 파일이 커밋될 수 있습니다.",
    "finding.missingGitignore.recommendation": "`vibeguard audit --fix`로 안전한 env ignore 규칙을 생성하세요.",
    "finding.envProtection.message": ".gitignore가 로컬 env 파일을 충분히 보호하지 않습니다.",
    "finding.envProtection.recommendation": "`vibeguard audit --fix`로 런타임 env 파일은 ignore하고 `.env.example`, `.env.sample` 같은 값 없는 env 템플릿은 공유 가능하게 두는 규칙을 추가하세요.",
    "finding.missingEnvExample.message": ".env.example이 없어 필요한 환경변수 이름을 안전하게 공유하기 어렵습니다.",
    "finding.missingEnvExample.recommendation": "`vibeguard audit --fix`로 값 없는 예시 env 파일을 생성하세요.",
    "finding.riskyScript.message": "위험 스크립트 감지: {name} ({label})",
    "finding.riskyScript.recommendation": "AI 에이전트가 이 스크립트를 실행하기 전에 명시 승인, 백업 상태, staging 여부를 확인해야 합니다.",
    "finding.paidDependency.message": "유료 또는 쿼터 기반 서비스 의존성 감지: {dependencies}",
    "finding.paidDependency.recommendation": "예산 제한, 요청 횟수 제한, 더 단순한 대안, 테스트 키와 운영 키 분리를 확인하세요.",
    "finding.largeFile.message": "소스 파일이 {lineCount}줄입니다. 저위험 AI 수정에는 너무 큽니다.",
    "finding.largeFile.recommendation": "새 동작을 추가하기 전에 모듈 분리 또는 작은 단계의 구현 계획을 요구하세요.",
    "finding.secretAssignment.message": "하드코딩된 비밀값 할당 후보 감지: {envName}",
    "finding.secretAssignment.recommendation": "`vibeguard audit --fix`로 값을 ignored env 파일로 옮기고 코드에서는 환경변수로 읽게 바꾸세요.",
    "finding.highEntropySensitiveAssignment.message": "민감해 보이는 이름에 고엔트로피 값이 할당되어 있습니다: {envName}",
    "finding.highEntropySensitiveAssignment.recommendation": "직접 확인하세요. 실제 비밀값이면 ignored env 파일 또는 secret manager로 옮기고 노출 가능성이 있으면 키를 회전하세요.",
    "finding.knownSecret.message": "{label} 후보가 파일에 포함되어 있습니다.",
    "finding.knownSecret.recommendation": "값을 출력하지 마세요. 즉시 env 또는 secret manager로 옮기세요. 공유되었을 가능성이 있으면 키를 회전하세요.",
    "finding.gitSensitiveChanges.message": "저장소 공개 상태가 {visibility}인 상태에서 민감해 보이는 Git 변경이 감지되었습니다: {files}",
    "finding.gitSensitiveChanges.recommendation": "커밋 또는 푸시 전에 `git remote -v`와 저장소 공개 상태를 확인하세요. 비밀값, 인증 정보, env 파일, private key는 Git에 올리지 말고, public 또는 공개 상태를 모르는 저장소에 이미 staged 되었다면 키 회전을 검토하세요.",
    "finding.gitSimilarRemote.message": "Git remote 이름이 현재 프로젝트 이름과 비슷하지만 정확히 같지 않습니다: local `{localName}`, remote `{remoteName}`.",
    "finding.gitSimilarRemote.recommendation": "커밋 또는 푸시 전에 remote 대상이 맞는지 확인하세요. 비슷한 저장소 이름은 잘못된 저장소로 푸시하는 흔한 원인입니다.",
    "finding.gitPublicOpsChanges.message": "저장소 공개 상태가 {visibility}인 상태에서 배포 또는 인프라 파일 변경이 감지되었습니다: {files}",
    "finding.gitPublicOpsChanges.recommendation": "푸시 전에 환경, 비용, 운영 영향도를 확인하세요. 저장소가 public이거나 공개 상태를 모를 때는 특히 주의해야 합니다.",

    "risk.forceDelete": "강제 삭제",
    "risk.productionDeploy": "운영 배포",
    "risk.databaseReset": "DB 리셋",
    "risk.acceptedDataLoss": "데이터 손실 허용",
    "risk.sqlDelete": "SQL 삭제",

    "report.title": "[VibeGuard 점검 리포트]",
    "report.project": "프로젝트",
    "report.overall": "전체 상태",
    "report.scanned": "스캔: {scanned}개 파일, 건너뜀 {skipped}개",
    "report.table.gate": "항목",
    "report.table.status": "상태",
    "report.table.message": "메시지",
    "report.findings": "발견사항",
    "report.findings.none": "발견사항: 없음",
    "report.findings.more": "...그 외 {count}개 발견사항이 더 있습니다.",
    "report.next.fixable": "다음: {count}개 항목은 `vibeguard audit . --fix`로 자동 처리할 수 있습니다.",
    "report.rules.loaded": "룰: {path}에서 문서 {count}개 로드됨",

    "fixes.none": "자동 수정이 필요하지 않습니다.",
    "fixes.header": "적용된 수정:",
    "fixes.gitignore": ".gitignore env 보호 규칙을 업데이트했습니다.",
    "fixes.envExample": ".env.example에 필요한 변수 이름을 업데이트했습니다.",
    "fixes.createdConfig": ".vibeguard.json을 생성했습니다.",
    "fixes.updatedConfig": ".vibeguard.json을 업데이트했습니다.",
    "fixes.updatedStateGitignore": ".gitignore VibeGuard 로컬 상태 규칙을 업데이트했습니다.",
    "fixes.updatedUpdateState": "VibeGuard 업데이트 확인 상태를 갱신했습니다.",
    "fixes.createdPolicy": "VIBEGUARD.md를 생성했습니다.",
    "fixes.createdAgents": "AGENTS.md VibeGuard 지침을 생성했습니다.",
    "fixes.updatedAgents": "AGENTS.md VibeGuard 지침을 업데이트했습니다.",
    "fixes.addedAgents": "AGENTS.md에 VibeGuard 지침을 추가했습니다.",
    "fixes.installedPreCommit": "pre-commit VibeGuard 훅을 설치했습니다.",
    "fixes.installedPrePush": "pre-push VibeGuard 훅을 설치했습니다.",
    "fixes.updatedPreCommit": "pre-commit VibeGuard 훅을 업데이트했습니다.",
    "fixes.updatedPrePush": "pre-push VibeGuard 훅을 업데이트했습니다.",
    "fixes.addedPreCommit": "기존 pre-commit 훅에 VibeGuard 검사를 추가했습니다.",
    "fixes.addedPrePush": "기존 pre-push 훅에 VibeGuard 검사를 추가했습니다.",
    "fixes.wrappedPreCommit": "기존 pre-commit 훅을 VibeGuard 검사로 감쌌습니다.",
    "fixes.wrappedPrePush": "기존 pre-push 훅을 VibeGuard 검사로 감쌌습니다.",
    "fixes.installedClaudeEvidence": "Claude Code 실행 증거 훅을 설치했습니다.",
    "fixes.updatedClaudeEvidence": "Claude Code 실행 증거 훅을 업데이트했습니다.",
    "fixes.agentEvidenceGitignore": ".gitignore agent evidence 규칙을 업데이트했습니다.",
    "fixes.movedSecrets": "비밀값 {count}개를 .env.vibeguard.local로 옮겼습니다.",
    "fixes.replacedSecrets": "하드코딩된 비밀값 읽기를 교체했습니다: {files}.",

    "prompt.title": "# VibeGuard 안전 코딩 프롬프트",
    "prompt.intro1": "당신은 비개발자 사용자를 대신해 안전하게 코딩하는 AI 에이전트입니다.",
    "prompt.intro2": "긴 설명보다 자동 점검과 안전한 수정을 우선합니다.",
    "prompt.userRequest": "## 사용자 요청",
    "prompt.noRequest": "(요청이 제공되지 않았습니다. 먼저 사용자의 구현 목표를 한 문장으로 확인하세요.)",
    "prompt.auditStatus": "## 현재 점검 상태",
    "prompt.project": "프로젝트",
    "prompt.overall": "전체 상태",
    "prompt.summary": "차단: {blocks}, 주의: {warnings}, 자동수정 가능: {fixable}",
    "prompt.findings": "## 처리할 발견사항",
    "prompt.fixable": "자동 수정 가능: `vibeguard audit . --fix`를 실행하거나 동일한 안전 조치를 직접 적용하세요.",
    "prompt.rules": "## 에이전트 실행 규칙",
    "prompt.rule1": "코드를 쓰기 전에 파일 구조, `.gitignore`, env 파일, package/script 구성을 확인하세요.",
    "prompt.rule2": "비밀값을 발견하면 값을 출력하지 마세요. ignored env 파일 또는 secret manager로 옮기세요.",
    "prompt.rule3": "`.env`, `.env.local`, `.env.vibeguard.local` 같은 런타임 env 파일은 ignore하고, `.env.example`, `.env.sample` 같은 env 템플릿에는 변수 이름과 placeholder만 남기세요. 환경별 URL, API origin, redirect/callback URL, asset host는 소스에 하드코딩하지 말고 플랫폼의 일반적인 로컬 또는 배포 설정 방식으로 읽으세요.",
    "prompt.rule4": "사용자 승인 없이 DB 삭제, 마이그레이션, 운영 배포, 유료 API/model 사용 증가를 실행하지 마세요.",
    "prompt.rule5": "질문은 막혔을 때만 최대 3개로 제한하고, 가능한 안전 수정은 먼저 수행하세요.",
    "prompt.rule6": "수정 후 테스트, 빌드, 타입체크 또는 가장 좁은 smoke check를 실행하세요.",
    "prompt.rule7": "마지막에는 변경 파일, 검증 결과, 남은 위험만 짧게 보고하세요.",
    "prompt.rule8": "실행 증거가 있으면 `vibeguard evidence .` 결과를 요약하고, 관측되지 않은 검증을 실행했다고 말하지 마세요.",
    "prompt.rule9": "비용을 고려한 아키텍처를 우선하세요. 유료 서비스, DB, queue, model call, analytics, cloud resource를 추가하기 전에 기존 코드나 더 단순한 local/server-side 설계로 부족한 이유를 설명하세요.",
    "prompt.rule10": "웹앱에서는 반복되는 API/model/provider 호출을 shared server-side helper 또는 endpoint로 공통화하고, 새 client-side 호출 경로를 만들기 전에 server-side caching, batching, rate limit을 먼저 검토하세요.",
    "prompt.rule11": "커밋 또는 푸시 전에 `git remote -v`, 저장소 공개 상태, 변경 파일을 확인하세요. public이거나 공개 상태를 모르는 저장소라면 비밀값, env 파일, 인증 정보, 배포, 인프라, 유료 서비스 변경을 푸시하기 전에 멈춰서 확인하세요.",
    "prompt.rule12": "사용자가 채팅에 비밀값을 붙여넣으면 노출된 것으로 취급하세요. 값을 반복하지 말고, 명령어/로그/파일/GitHub secret/배포 설정/서버에 넣지 말고, 새 값을 로컬 provider UI 또는 secret-store 프롬프트에만 입력하도록 안내하세요.",
    "prompt.externalRules": "## 외부 룰 라이브러리",
    "prompt.path": "경로",
    "prompt.nextAction": "## 다음 작업",
    "prompt.nextFixable": "먼저 자동 수정 가능한 안전 문제를 처리한 뒤 사용자 요청을 구현하세요.",
    "prompt.nextBlocked": "차단 이슈를 안전하게 해소하기 전에는 기능 구현을 시작하지 마세요.",
    "prompt.nextReady": "위 규칙을 지키면서 사용자 요청을 작은 변경 단위로 구현하세요."
  }
};

export function normalizeLanguage(input) {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return "en";
  const base = raw.split(/[_.-]/)[0];
  return SUPPORTED_LANGUAGES.has(base) ? base : "en";
}

export function resolveLanguage(input, env = process.env) {
  return normalizeLanguage(input ?? env.VIBEGUARD_LANG ?? "en");
}

export function supportedLanguages() {
  return [...SUPPORTED_LANGUAGES];
}

export function t(language, key, params = {}) {
  const normalized = normalizeLanguage(language);
  const template = MESSAGES[normalized]?.[key] ?? MESSAGES.en[key] ?? key;
  return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) => String(params[name] ?? ""));
}

export function cliHelp(language) {
  if (normalizeLanguage(language) === "ko") {
    return `VibeGuard

사용법:
  vibeguard init|setup [project] [--rules <path>] [--lang <en|ko>]
  vibeguard update [project] [--rules <path>] [--lang <en|ko>]
  vibeguard version [--json]
  vibeguard audit [project] [--fix] [--strict] [--json] [--rules <path>] [--lang <en|ko>]
  vibeguard hook run [project] [--event <name>] [--full] [--strict] [--quiet] [--json] [--rules <path>] [--lang <en|ko>]
  vibeguard hook status [project] [--json]
  vibeguard prompt [project] --request "<what you want>" [--rules <path>] [--lang <en|ko>]
  vibeguard evidence [project] [--json]
  vibeguard evidence install-claude-hook [project] [--json]
  vibeguard evidence claude-hook [project] [--json]

예시:
  vibeguard setup . --lang ko
  vibeguard update .
  vibeguard version
  vibeguard audit . --lang ko
  vibeguard audit . --fix --lang ko
  vibeguard audit . --strict --lang ko
  vibeguard hook run . --event post-edit
  vibeguard hook status .
  vibeguard prompt . --request "로그인 추가" --lang ko
  vibeguard evidence .
  vibeguard evidence install-claude-hook .

언어:
  --lang <en|ko> 또는 VIBEGUARD_LANG=<en|ko>

종료 코드:
  0 = 진행 가능, 1 = --strict 주의 항목, 2 = 차단 항목
`;
  }

  return `VibeGuard

Usage:
  vibeguard init|setup [project] [--rules <path>] [--lang <en|ko>]
  vibeguard update [project] [--rules <path>] [--lang <en|ko>]
  vibeguard version [--json]
  vibeguard audit [project] [--fix] [--strict] [--json] [--rules <path>] [--lang <en|ko>]
  vibeguard hook run [project] [--event <name>] [--full] [--strict] [--quiet] [--json] [--rules <path>] [--lang <en|ko>]
  vibeguard hook status [project] [--json]
  vibeguard prompt [project] --request "<what you want>" [--rules <path>] [--lang <en|ko>]
  vibeguard evidence [project] [--json]
  vibeguard evidence install-claude-hook [project] [--json]
  vibeguard evidence claude-hook [project] [--json]

Examples:
  vibeguard setup .
  vibeguard update .
  vibeguard version
  vibeguard audit .
  vibeguard audit . --fix
  vibeguard audit . --strict
  vibeguard hook run . --event post-edit
  vibeguard hook status .
  vibeguard prompt . --request "Add login"
  vibeguard evidence .
  vibeguard evidence install-claude-hook .

Language:
  --lang <en|ko> or VIBEGUARD_LANG=<en|ko>

Exit codes:
  0 = ready, 1 = warnings in --strict mode, 2 = blocked
`;
}
