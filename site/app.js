const translations = {
  en: {
    pageTitle: "VibeGuard - Safety Layer for AI Coding Agents",
    metaDescription: "Copy one sentence into an AI coding chat so the agent applies VibeGuard, checks local safety risks, and pauses before risky work.",
    brandHomeLabel: "VibeGuard home",
    primaryNavLabel: "Primary navigation",
    languageSelectorLabel: "Language selector",
    switchToEnglishLabel: "Switch to English",
    switchToKoreanLabel: "Switch to Korean",
    productHighlightsLabel: "Product highlights",
    simulatorTabsLabel: "Preview mode selector",
    chatMockupLabel: "Simulated AI chat workspace",
    terminalMockupLabel: "Terminal audit preview",

    navHow: "How it works",
    navChecks: "Safety Gates",
    navAudience: "Who it's for",
    eyebrow: "Safety layer for AI coding agents",
    heroTitle: "VibeGuard helps AI agents pause before risky coding work.",
    heroLead: "Copy one sentence into Cursor, Windsurf, Claude Code, or another AI coding chat. The agent applies local guardrails, fixes simple setup gaps, and asks before risky changes.",
    trustOne: "5 local safety gates",
    trustTwo: "No secret values printed",
    trustThree: "Cost-aware architecture before new services",
    magicPromptLabel: "Copy this sentence for your AI agent",
    magicPromptText: "Apply VibeGuard to this project: https://github.com/taehwandev/VibeGuard",
    copyButtonText: "Copy",
    copySuccessText: "Copied",
    copyFailureText: "Select text manually",
    copySuccessAnnouncement: "Copied to clipboard.",
    copyFailureAnnouncement: "Copy failed. Select the text manually.",
    githubButton: "Open GitHub",

    sceneAuditTitle: "VibeGuard audit",
    sceneSecret: "Secrets redacted",
    sceneCost: "Paid API boundary",
    sceneDeploy: "Production deploy pause",
    sceneStatus: "Needs approval",
    scenePauseTitle: "Stop before risky work",
    scenePauseText: "Data, credentials, cost, architecture, and production changes require an explicit user check.",

    audienceHeading: "A small safety layer for people who let AI edit real projects",
    nonDevTitle: "For non-developers",
    nonDevSub: "No terminal typing required",
    nonDevText: "You do not need to understand Git, CLI commands, or local setup. Paste the sentence into your AI assistant's chat window. VibeGuard guides the agent through local safety checks and asks before risky actions like spending money, exposing credentials, or changing data.",

    devTitle: "For developers",
    devSub: "Reduce costly and destructive mistakes",
    devText: "Flag hard-coded secrets, risky database scripts, production actions, paid-service changes, and unnecessary infrastructure before an AI agent moves too far. VibeGuard also installs managed agent instructions (AGENTS.md) and local git checks so safer habits stay with the project.",

    howEyebrow: "3-step workflow",
    howTitle: "Just copy once. The AI does the checking.",
    stepOneTitle: "1. Copy the instruction",
    stepOneText: "Copy the single-sentence VibeGuard directive prepared above.",
    stepTwoTitle: "2. Paste to your AI assistant",
    stepTwoText: "Paste it directly into Cursor, Windsurf, Claude Code, or any coding agent chat.",
    stepThreeTitle: "3. AI checks safely & pauses on risk",
    stepThreeText: "The agent applies VibeGuard to inspect the codebase, handles low-risk fixes when safe, and stops to ask before destructive, costly, production, or credential-sensitive work.",

    checksEyebrow: "Safety guardrails",
    checksTitle: "Built to reduce common AI coding mistakes.",
    securityTitle: "Secret Quarantine",
    securityText: "Detects likely hard-coded secrets and can move simple JS, TS, and Python assignments into gitignored env files without printing the values.",
    envTitle: "Env Protection",
    envText: "Ensures local env files are strictly gitignored while maintaining value-free `.env.example` templates.",
    dataTitle: "Data Loss Pause",
    dataText: "Flags database drops, reset scripts, and destructive shell commands (`rm -rf`) so the agent pauses before data loss risks.",
    costTitle: "Cost-Aware Architecture",
    costText: "Pushes the agent to reuse shared server-side helpers for repeated web calls, cache stable data on the server, and use batching or rate limits before adding paid services or recurring infrastructure.",
    gitTitle: "Git Gates",
    gitText: "Hooks into local git pre-commit and pre-push scripts to double-check code safety before remote pushes.",
    boundaryTitle: "Server/Client Boundary",
    boundaryText: "Checks for third-party secrets and privileged credentials that should stay on the server instead of client-side code.",

    terminalTitle: "Agent setup preview",
    tabChat: "AI chat simulation",
    tabTerminal: "Developer CLI terminal",
    chatUserName: "You",
    chatHeaderTitle: "Cursor / Windsurf AI assistant",
    chatUserMsg: "Apply VibeGuard to this project: https://github.com/taehwandev/VibeGuard",
    chatAgentName: "AI coding assistant",
    chatAgentIntro: "Understood. I will apply VibeGuard, inspect the project, and install local safety gates.",
    chatAgentLogGit: "[ok] Checked gitignore env protection rules.",
    chatAgentLogAgents: "[ok] Created AGENTS.md safety instructions.",
    chatAgentLogHooks: "[ok] Installed pre-commit safety hooks.",
    chatAgentOutro: "VibeGuard is applied. Before database deletion, large paid API usage, or sensitive production deploys, I will pause and ask for approval.",
    terminalOutput: `$ npx --yes @taehwandev/vibeguard setup .

Applied fixes:
[ok] Updated .gitignore env protection rules.
[ok] Created AGENTS.md VibeGuard instructions.
[ok] Installed local security pre-commit hooks.

[VibeGuard Audit Report]
Overall: Ready`,
    footerRepo: "Repository"
  },
  ko: {
    pageTitle: "VibeGuard - AI 코딩 에이전트를 위한 안전 레이어",
    metaDescription: "AI 코딩 채팅창에 한 문장을 복사하면 에이전트가 VibeGuard를 적용하고, 로컬 안전 위험을 점검한 뒤 위험한 작업 앞에서 멈춥니다.",
    brandHomeLabel: "VibeGuard 홈",
    primaryNavLabel: "기본 내비게이션",
    languageSelectorLabel: "언어 선택",
    switchToEnglishLabel: "영어로 전환",
    switchToKoreanLabel: "한국어로 전환",
    productHighlightsLabel: "제품 핵심 요약",
    simulatorTabsLabel: "예시 화면 선택",
    chatMockupLabel: "AI 채팅창 예시",
    terminalMockupLabel: "터미널 점검 예시",

    navHow: "작동 방식",
    navChecks: "안전 게이트",
    navAudience: "누구를 위한가",
    eyebrow: "AI 코딩 에이전트를 위한 안전 레이어",
    heroTitle: "VibeGuard는 AI가 위험한 코딩 작업 앞에서 멈추게 합니다.",
    heroLead: "한 문장을 Cursor, Windsurf, Claude Code 같은 AI 코딩 채팅창에 붙여넣으세요. 에이전트가 로컬 가드레일을 적용하고, 단순한 설정 문제를 고친 뒤 위험한 변경 앞에서 확인을 요청합니다.",
    trustOne: "로컬 안전 게이트 5개",
    trustTwo: "비밀값 출력 방지",
    trustThree: "새 서비스보다 비용 고려 설계 우선",
    magicPromptLabel: "AI 에이전트에게 보낼 한 문장",
    magicPromptText: "이 프로젝트에 VibeGuard를 적용해줘: https://github.com/taehwandev/VibeGuard",
    copyButtonText: "복사",
    copySuccessText: "복사 완료",
    copyFailureText: "직접 선택해 주세요",
    copySuccessAnnouncement: "클립보드에 복사되었습니다.",
    copyFailureAnnouncement: "복사에 실패했습니다. 문장을 직접 선택해 주세요.",
    githubButton: "GitHub 열기",

    sceneAuditTitle: "VibeGuard 점검",
    sceneSecret: "비밀값 가림",
    sceneCost: "유료 API 경계",
    sceneDeploy: "운영 배포 전 멈춤",
    sceneStatus: "승인 필요",
    scenePauseTitle: "위험한 작업 전 멈춤",
    scenePauseText: "데이터, 인증 정보, 비용, 아키텍처, 운영 변경은 사용자의 명시적인 확인을 요구합니다.",

    audienceHeading: "AI가 실제 프로젝트를 수정하기 전에 깔아두는 작은 안전 레이어",
    nonDevTitle: "비개발자용",
    nonDevSub: "터미널 입력 없이 시작",
    nonDevText: "터미널 명령어, Git, 복잡한 로컬 설정을 몰라도 괜찮습니다. AI 코딩 채팅창에 복사한 문장을 그대로 넣어주세요. VibeGuard는 에이전트가 로컬 안전 점검을 먼저 하도록 안내하고, 비용 증가, 인증 정보 노출, 데이터 변경 같은 위험 작업 앞에서 사용자에게 확인하게 만듭니다.",

    devTitle: "개발자용",
    devSub: "보안 사고와 파괴적 실수 줄이기",
    devText: "하드코딩된 비밀값, 위험한 DB 스크립트, 프로덕션 작업, 유료 서비스 변경, 불필요한 인프라 추가를 AI 에이전트가 너무 멀리 진행하기 전에 표시합니다. 프로젝트 로컬에는 관리되는 에이전트 지침(AGENTS.md)과 Git 점검 훅을 설치해 안전한 습관이 유지되도록 합니다.",

    howEyebrow: "3단계 작동 흐름",
    howTitle: "복사 한 번이면, AI가 점검을 처리합니다.",
    stepOneTitle: "1. 지시어 복사",
    stepOneText: "상단의 AI 에이전트용 지시어 문장을 복사합니다.",
    stepTwoTitle: "2. AI 채팅창에 붙여넣기",
    stepTwoText: "사용 중인 AI 코딩 도구(Cursor, Windsurf, Claude Code 등)의 채팅창에 붙여넣고 입력합니다.",
    stepThreeTitle: "3. 위험하면 멈춰서 확인",
    stepThreeText: "AI가 VibeGuard를 실행해 프로젝트를 점검하고, 안전한 수정은 처리하되 데이터 손실, 비용 증가, 운영 배포, 인증 정보 관련 작업 앞에서는 멈춰서 확인합니다.",

    checksEyebrow: "안전 점검 항목",
    checksTitle: "AI 코딩에서 자주 발생하는 실수를 줄입니다.",
    securityTitle: "비밀값 자동 격리",
    securityText: "하드코딩된 비밀값 후보를 감지하고, 단순한 JS, TS, Python 할당은 값을 출력하지 않은 채 git에서 제외된 env 파일로 옮길 수 있습니다.",
    envTitle: "로컬 설정 보호",
    envText: "로컬 중요 설정 파일(`.env`)을 gitignore로 보호하고, 값 없이 변수명만 남은 `.env.example`을 생성합니다.",
    dataTitle: "데이터 파괴 일시정지",
    dataText: "데이터베이스 초기화, 리셋 스크립트, 대량 삭제 명령(`rm -rf` 등)을 표시해 데이터 손실 위험 앞에서 멈추게 합니다.",
    costTitle: "비용 고려 아키텍처",
    costText: "반복되는 웹 호출은 서버 측 공통 함수나 엔드포인트로 묶고, 안정적인 데이터는 서버에서 캐시하며, 유료 서비스나 반복 비용 인프라를 추가하기 전에 일괄 처리와 사용량 제한을 먼저 검토하게 합니다.",
    gitTitle: "Git 커밋/푸시 게이트",
    gitText: "로컬 git pre-commit 및 pre-push에 점검을 연결해, 코드가 외부로 업로드되기 전에 한 번 더 확인합니다.",
    boundaryTitle: "서버/클라이언트 경계",
    boundaryText: "서버에 남아야 할 API Key와 권한 있는 인증 정보가 클라이언트 코드로 흘러들어가지 않았는지 확인합니다.",

    terminalTitle: "에이전트 작동 예시 화면",
    tabChat: "AI 채팅창 예시",
    tabTerminal: "개발자용 CLI 터미널",
    chatUserName: "사용자",
    chatHeaderTitle: "Cursor / Windsurf AI 채팅창",
    chatUserMsg: "이 프로젝트에 VibeGuard를 적용해줘: https://github.com/taehwandev/VibeGuard",
    chatAgentName: "AI 코딩 비서",
    chatAgentIntro: "알겠습니다. VibeGuard를 적용하고 프로젝트를 점검한 뒤 로컬 안전 게이트를 설치하겠습니다.",
    chatAgentLogGit: "[ok] .gitignore 중요 파일 보호 설정 확인",
    chatAgentLogAgents: "[ok] AGENTS.md 에이전트 안전 지침 생성",
    chatAgentLogHooks: "[ok] pre-commit 안전 훅 설치",
    chatAgentOutro: "VibeGuard 적용이 완료되었습니다. 이제 데이터 삭제, 유료 API 대량 사용, 민감한 운영 배포가 필요하면 먼저 멈춰서 승인을 요청하겠습니다.",
    terminalOutput: `$ npx --yes @taehwandev/vibeguard setup .

적용된 수정:
[ok] .gitignore env 보호 규칙을 업데이트했습니다.
[ok] AGENTS.md VibeGuard 지침을 생성했습니다.
[ok] 로컬 보안 pre-commit 훅을 설치했습니다.

[VibeGuard 점검 리포트]
전체 상태: 진행 가능`,
    footerRepo: "저장소"
  }
};

const languageButtons = document.querySelectorAll("[data-lang]");
const translatable = document.querySelectorAll("[data-i18n]");
const copyButton = document.getElementById("copy-btn");
const copyTextNode = document.getElementById("magic-prompt-text");
const ariaLiveNode = document.getElementById("copy-announcer");
let copyResetTimer;

function normalizeLanguage(value) {
  return value?.toLowerCase().startsWith("ko") ? "ko" : "en";
}

function setLanguage(language) {
  const nextLanguage = normalizeLanguage(language);
  const dictionary = translations[nextLanguage];

  document.documentElement.lang = nextLanguage;
  document.title = dictionary.pageTitle;
  setMetaContent("description", dictionary.metaDescription);
  setMetaContent("og:title", dictionary.pageTitle, "property");
  setMetaContent("og:description", dictionary.metaDescription, "property");

  for (const node of translatable) {
    const key = node.dataset.i18n;
    if (dictionary[key]) {
      // Keep translations as plain text to avoid treating copy as markup.
      node.textContent = dictionary[key];
    }
  }

  for (const node of document.querySelectorAll("[data-i18n-aria-label]")) {
    const key = node.dataset.i18nAriaLabel;
    if (dictionary[key]) node.setAttribute("aria-label", dictionary[key]);
  }

  for (const button of languageButtons) {
    button.classList.toggle("is-active", button.dataset.lang === nextLanguage);
  }

  if (copyButton && !copyButton.classList.contains("copied") && !copyButton.classList.contains("failed")) {
    setCopyButtonState("idle", dictionary.copyButtonText);
  }

  localStorage.setItem("vibeGuardLanguage", nextLanguage);
}

function setMetaContent(name, content, attribute = "name") {
  const node = document.querySelector(`meta[${attribute}="${name}"]`);
  if (node) node.setAttribute("content", content);
}

for (const button of languageButtons) {
  button.addEventListener("click", () => setLanguage(button.dataset.lang));
}

if (copyButton && copyTextNode) {
  copyButton.addEventListener("click", async () => {
    const textToCopy = copyTextNode.textContent.trim();
    const currentLang = document.documentElement.lang === "ko" ? "ko" : "en";
    const dictionary = translations[currentLang];

    try {
      await copyToClipboard(textToCopy, copyTextNode);
      showTemporaryCopyState("copied", dictionary.copySuccessText, dictionary.copySuccessAnnouncement, 2500);
    } catch {
      selectPromptText(copyTextNode);
      showTemporaryCopyState("failed", dictionary.copyFailureText, dictionary.copyFailureAnnouncement, 5000);
    }
  });
}

async function copyToClipboard(text, fallbackNode) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  selectPromptText(fallbackNode);
  if (!document.execCommand("copy")) throw new Error("copy command failed");
  window.getSelection()?.removeAllRanges();
}

function selectPromptText(node) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

function showTemporaryCopyState(state, label, announcement, delay) {
  window.clearTimeout(copyResetTimer);
  setCopyButtonState(state, label);
  if (ariaLiveNode) ariaLiveNode.textContent = announcement;

  copyResetTimer = window.setTimeout(() => {
    const currentLang = document.documentElement.lang === "ko" ? "ko" : "en";
    setCopyButtonState("idle", translations[currentLang].copyButtonText);
    if (ariaLiveNode) ariaLiveNode.textContent = "";
  }, delay);
}

function setCopyButtonState(state, label) {
  copyButton.classList.toggle("copied", state === "copied");
  copyButton.classList.toggle("failed", state === "failed");
  copyButton.replaceChildren();
  copyButton.appendChild(state === "copied" ? createCheckIcon() : createCopyIcon());
  const span = document.createElement("span");
  span.textContent = label;
  copyButton.appendChild(span);
}

function createCopyIcon() {
  const svg = createIcon("icon-copy", "0 0 24 24", "2.5");
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", "9");
  rect.setAttribute("y", "9");
  rect.setAttribute("width", "13");
  rect.setAttribute("height", "13");
  rect.setAttribute("rx", "2");
  rect.setAttribute("ry", "2");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1");

  svg.append(rect, path);
  return svg;
}

function createCheckIcon() {
  const svg = createIcon("icon-check", "0 0 24 24", "3");
  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", "20 6 9 17 4 12");
  svg.appendChild(polyline);
  return svg;
}

function createIcon(className, viewBox, strokeWidth) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", strokeWidth);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  return svg;
}

const initialLanguage = localStorage.getItem("vibeGuardLanguage") || navigator.language || "en";
setLanguage(initialLanguage);

// Simulator Tabs Event Listeners
const tabButtons = document.querySelectorAll(".tab-button");
const panes = document.querySelectorAll(".simulator-pane");

for (const button of tabButtons) {
  button.addEventListener("click", () => {
    const targetTab = button.dataset.tab;
    for (const btn of tabButtons) {
      btn.classList.toggle("is-active", btn.dataset.tab === targetTab);
      btn.setAttribute("aria-selected", btn.dataset.tab === targetTab);
    }
    for (const pane of panes) {
      pane.classList.toggle("is-active", pane.dataset.pane === targetTab);
    }
  });
}
