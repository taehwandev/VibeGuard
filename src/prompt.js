import { sanitizePathForDisplay } from "./path-display.js";

const STATUS_ICON = {
  pass: "🟢",
  warn: "🟡",
  block: "🔴",
  info: "🔵"
};

const STATUS_LABEL = {
  pass: "진행 가능",
  warn: "확인 필요",
  block: "차단",
  info: "정보"
};

export function buildAgentPrompt(report, userRequest = "") {
  const lines = [];

  lines.push("# Vibe-Guard Safe Coding Prompt");
  lines.push("");
  lines.push("너는 비개발자 사용자를 대신해 안전하게 코딩하는 AI 에이전트다.");
  lines.push("설명보다 자동 점검과 안전한 수정이 우선이다.");
  lines.push("");
  lines.push("## 사용자 요청");
  lines.push(userRequest?.trim() ? userRequest.trim() : "(요청이 제공되지 않았습니다. 먼저 사용자의 구현 목표를 한 문장으로 확인하세요.)");
  lines.push("");
  lines.push("## 현재 감사 상태");
  lines.push(`- 프로젝트: ${sanitizePathForDisplay(report.root)}`);
  lines.push(`- 전체 상태: ${STATUS_ICON[report.summary.status]} ${STATUS_LABEL[report.summary.status]}`);
  lines.push(`- 차단: ${report.summary.blocks}, 주의: ${report.summary.warnings}, 자동수정 가능: ${report.summary.fixable}`);
  lines.push("");
  lines.push("| 항목 | 등급 | 메시지 |");
  lines.push("| --- | --- | --- |");
  for (const gate of Object.values(report.gates)) {
    lines.push(`| ${gate.label} | ${STATUS_ICON[gate.status]} ${STATUS_LABEL[gate.status]} | ${gate.message} |`);
  }

  if (report.findings.length > 0) {
    lines.push("");
    lines.push("## 처리해야 할 발견사항");
    for (const finding of report.findings.slice(0, 12)) {
      const where = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ""}` : "project";
      lines.push(`- ${STATUS_ICON[finding.severity] ?? "🔵"} ${where}: ${finding.message}`);
      if (finding.fixable) lines.push("  - 자동 수정 가능: `vibe-guard audit . --fix` 또는 동일한 안전 조치를 직접 적용");
    }
  }

  lines.push("");
  lines.push("## 에이전트 실행 규칙");
  lines.push("1. 코드를 쓰기 전에 현재 파일 구조, `.gitignore`, env 파일, package/script 구성을 확인한다.");
  lines.push("2. 비밀값을 발견하면 값을 출력하지 말고 ignored env 파일 또는 secret manager로 격리한다.");
  lines.push("3. `.env`, `.env.*`, `.env.vibeguard.local`은 ignore하고, `.env.example`에는 변수 이름만 남긴다.");
  lines.push("4. DB 삭제, 마이그레이션, 운영 배포, 결제/API 호출 증가는 사용자 승인 없이 실행하지 않는다.");
  lines.push("5. 질문은 정말 막힐 때만 최대 3개로 제한하고, 가능한 안전 수정은 먼저 수행한다.");
  lines.push("6. 변경 후 테스트, 빌드, 타입체크, 또는 가장 좁은 smoke check를 실행한다.");
  lines.push("7. 마지막에는 변경 파일, 검증 결과, 남은 위험만 짧게 보고한다.");

  if (report.rules.available) {
    lines.push("");
    lines.push("## 참고할 외부 룰셋");
    lines.push(`경로: ${sanitizePathForDisplay(report.rules.path)}`);
    for (const doc of report.rules.documents.slice(0, 6)) {
      lines.push(`- ${doc.relative}: ${doc.title}`);
    }
  }

  lines.push("");
  lines.push("## 지금 할 일");
  if (report.summary.fixable > 0) {
    lines.push("먼저 자동 수정 가능한 안전 문제를 처리한 뒤 사용자 요청 구현에 들어가라.");
  } else if (report.summary.blocks > 0) {
    lines.push("차단 이슈를 안전하게 해소하기 전에는 기능 구현을 시작하지 마라.");
  } else {
    lines.push("위 규칙을 지키면서 사용자 요청을 작은 변경 단위로 구현하라.");
  }

  return `${lines.join("\n")}\n`;
}
