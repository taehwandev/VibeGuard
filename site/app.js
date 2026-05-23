const translations = {
  en: {
    navHow: "How it works",
    navChecks: "Checks",
    navInstall: "Install",
    eyebrow: "Safety layer for AI coding agents",
    heroTitle: "Give your agent one link. Vibe-Guard handles the safety checks.",
    heroLead:
      "Vibe-Guard installs project guardrails, fixes low-risk issues, and tells AI coding agents when to stop and ask.",
    githubButton: "Open GitHub",
    installButton: "Use the link",
    terminal: `$ npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard setup .

Applied fixes:
- Updated .gitignore env protection rules.
- Created AGENTS.md Vibe-Guard instructions.

[Vibe-Guard Audit Report]
Overall: 🟢 Ready`,
    howEyebrow: "Link-only workflow",
    howTitle: "The user should not need to understand the tool.",
    stepOneTitle: "Paste the link",
    stepOneText: "The user gives an AI coding agent the Vibe-Guard repository link.",
    stepTwoTitle: "Agent applies it",
    stepTwoText: "The agent installs or refreshes guardrails in the current project.",
    stepThreeTitle: "Work continues safely",
    stepThreeText: "Safe fixes run first, risky work stops for approval, and the original request continues.",
    checksEyebrow: "Default checks",
    checksTitle: "Built for common AI coding mistakes.",
    securityTitle: "Secrets",
    securityText: "Detects likely hard-coded secrets and never prints the values.",
    envTitle: "Env safety",
    envText: "Protects local env files and keeps examples value-free.",
    dataTitle: "Data risk",
    dataText: "Flags destructive scripts, migrations, and production actions.",
    costTitle: "Cost risk",
    costText: "Warns when paid APIs or quota-based services need guardrails.",
    installEyebrow: "Agent instruction",
    installTitle: "Use this sentence.",
    copyText: "Apply https://github.com/taehwandev/VibeGuard to this project.",
    footerRepo: "Repository"
  },
  ko: {
    navHow: "작동 방식",
    navChecks: "점검 항목",
    navInstall: "적용하기",
    eyebrow: "AI 코딩 에이전트를 위한 안전 레이어",
    heroTitle: "에이전트에게 링크 하나만 주세요. Vibe-Guard가 안전 점검을 처리합니다.",
    heroLead:
      "Vibe-Guard는 프로젝트 가드레일을 설치하고, 낮은 위험의 문제를 자동 수정하며, 위험한 작업은 멈추고 확인하게 만듭니다.",
    githubButton: "GitHub 열기",
    installButton: "링크 사용하기",
    terminal: `$ npm --no-update-notifier exec --yes --package github:taehwandev/VibeGuard -- vibe-guard setup .

적용된 수정:
- .gitignore env 보호 규칙 업데이트
- AGENTS.md Vibe-Guard 지침 생성

[Vibe-Guard 점검 리포트]
전체 상태: 🟢 진행 가능`,
    howEyebrow: "링크만 주는 흐름",
    howTitle: "사용자는 도구를 이해할 필요가 없어야 합니다.",
    stepOneTitle: "링크를 붙여넣기",
    stepOneText: "사용자는 AI 코딩 에이전트에게 Vibe-Guard 저장소 링크를 전달합니다.",
    stepTwoTitle: "에이전트가 적용",
    stepTwoText: "에이전트가 현재 프로젝트에 가드레일을 설치하거나 갱신합니다.",
    stepThreeTitle: "안전하게 계속 진행",
    stepThreeText: "안전한 수정은 먼저 실행하고, 위험한 작업은 승인 전까지 멈춘 뒤 원래 요청을 이어갑니다.",
    checksEyebrow: "기본 점검",
    checksTitle: "AI 코딩에서 자주 생기는 실수를 막습니다.",
    securityTitle: "비밀값",
    securityText: "하드코딩된 비밀값 후보를 감지하고 실제 값은 출력하지 않습니다.",
    envTitle: "Env 안전",
    envText: "로컬 env 파일을 보호하고 예시 파일에는 값 없이 이름만 남깁니다.",
    dataTitle: "데이터 위험",
    dataText: "파괴적인 스크립트, 마이그레이션, 운영 작업을 표시합니다.",
    costTitle: "비용 위험",
    costText: "유료 API 또는 쿼터 기반 서비스에 가드레일이 필요한지 알려줍니다.",
    installEyebrow: "에이전트에게 줄 문장",
    installTitle: "이 문장을 사용하세요.",
    copyText: "이 프로젝트에 https://github.com/taehwandev/VibeGuard 적용해줘.",
    footerRepo: "저장소"
  }
};

const languageButtons = document.querySelectorAll("[data-lang]");
const translatable = document.querySelectorAll("[data-i18n]");

function normalizeLanguage(value) {
  return value?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

function setLanguage(language) {
  const nextLanguage = normalizeLanguage(language);
  const dictionary = translations[nextLanguage];

  document.documentElement.lang = nextLanguage;
  for (const node of translatable) {
    const key = node.dataset.i18n;
    if (dictionary[key]) node.textContent = dictionary[key];
  }

  for (const button of languageButtons) {
    button.classList.toggle("is-active", button.dataset.lang === nextLanguage);
  }

  localStorage.setItem("vibeGuardLanguage", nextLanguage);
}

for (const button of languageButtons) {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
}

const initialLanguage = localStorage.getItem("vibeGuardLanguage") || navigator.language || "en";
setLanguage(initialLanguage);
