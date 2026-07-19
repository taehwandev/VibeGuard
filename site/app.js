const translations = {
  en: {
    pageTitle: "VibeGuard - Preflight Checks for AI Coding Agents",
    metaDescription: "Paste one line into an AI coding chat so the agent checks secrets, cost, data, deploy, and repository risks before editing a real project.",
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
    navDocs: "Docs",
    navPlaybook: "Tao Agent OS",
    navAudience: "Who it's for",
    eyebrow: "Preflight checks for AI coding agents",
    heroTitle: "Before an AI edits your project, make it run VibeGuard.",
    heroLead: "Paste one line into Cursor, Windsurf, Claude Code, or another coding chat. The agent installs local guardrails, checks the risky parts first, and asks before changes that can expose secrets, spend money, alter data, or push to the wrong place.",
    trustOne: "Paste into any coding chat",
    trustTwo: "Secrets stay redacted",
    trustThree: "Cost and deploy checks before new infrastructure",
    magicPromptLabel: "One line to paste into your AI agent",
    magicPromptText: "Apply VibeGuard to this project: https://github.com/taehwandev/VibeGuard",
    copyButtonText: "Copy",
    copySuccessText: "Copied",
    copyFailureText: "Select text manually",
    copySuccessAnnouncement: "Copied to clipboard.",
    copyFailureAnnouncement: "Copy failed. Select the text manually.",
    githubButton: "Open GitHub",
    docsButton: "Read the guide",

    sceneAuditTitle: "VibeGuard audit",
    sceneSecret: "Secrets redacted",
    sceneCost: "Paid API boundary",
    sceneDeploy: "Production deploy pause",
    sceneStatus: "Needs approval",
    scenePauseTitle: "Stop before risky work",
    scenePauseText: "Data, credentials, cost, architecture, repository, and production changes require an explicit user check.",

    audienceHeading: "Two paths: paste-and-go for users, local guardrails for maintainers",
    nonDevTitle: "If you use an AI coding chat",
    nonDevSub: "Start without terminal work",
    nonDevText: "You can paste the instruction and let the agent do the setup. VibeGuard tells the agent to inspect the repo, fix low-risk guardrail gaps, and stop before actions that need your approval.",

    devTitle: "If you maintain the repo",
    devSub: "Keep AI edits inside known boundaries",
    devText: "VibeGuard adds managed AGENTS.md instructions, audit output, and optional git hooks. It catches hard-coded secrets, risky scripts, public-repo push hazards, paid-service drift, and client/server credential mistakes before they become release problems.",

    playbookHeading: "Use VibeGuard with Tao Agent OS when the work needs a full agent workflow.",
    playbookVibeTitle: "VibeGuard is the safety gate",
    playbookVibeSub: "Before risky edits",
    playbookVibeText: "It checks secrets, cost, data, deploy, server boundary, and repository risk before an AI agent changes a project.",
    playbookAgentTitle: "Tao Agent OS is the execution playbook",
    playbookAgentSub: "Plan, build, verify, review",
    playbookAgentText: "It gives agents reusable workflow, engineering, review, platform, and handoff guidance without copying long prompt files into every repo.",
    playbookButton: "Open Tao Agent OS",

    howEyebrow: "Workflow",
    howTitle: "The agent does the setup, but the risky calls still come back to you.",
    stepOneTitle: "1. Paste the instruction",
    stepOneText: "Use the line above in the AI coding chat that is already working on your project.",
    stepTwoTitle: "2. Let it run the checks",
    stepTwoText: "The agent installs or refreshes local guardrails, runs an audit, and applies only low-risk safety fixes.",
    stepThreeTitle: "3. Approve the risky parts",
    stepThreeText: "If the next step can delete data, expose credentials, spend money, deploy production, or push sensitive files, VibeGuard tells the agent to stop and ask.",

    checksEyebrow: "Safety guardrails",
    checksTitle: "The checks are practical: secrets, cost, data, deployment, and Git.",
    securityTitle: "Secret handling",
    securityText: "Detects likely hard-coded secrets without printing the value. Simple JS, TS, and Python assignments can be moved into an ignored env file.",
    envTitle: "Env file hygiene",
    envText: "Keeps runtime env files ignored and keeps shareable env templates value-free.",
    dataTitle: "Data-loss pause",
    dataText: "Flags database resets, destructive scripts, and shell commands that can remove data before the agent runs them.",
    costTitle: "Cost-aware architecture",
    costText: "Pushes repeated API, provider, and model calls toward shared server-side helpers, caching, batching, and rate limits before adding paid services.",
    gitTitle: "Repository checks",
    gitText: "Reviews the remote, repository visibility, and changed files before commit or push, with extra care for public or unknown-visibility repos.",
    boundaryTitle: "Server boundary",
    boundaryText: "Keeps provider keys, database URLs, service-role keys, and webhook secrets on the server side.",

    terminalTitle: "What the agent reports back",
    tabChat: "AI chat simulation",
    tabTerminal: "Developer CLI terminal",
    chatUserName: "You",
    chatHeaderTitle: "Cursor / Windsurf / Claude Code",
    chatUserMsg: "Apply VibeGuard to this project: https://github.com/taehwandev/VibeGuard",
    chatAgentName: "AI coding assistant",
    chatAgentIntro: "I will apply VibeGuard, inspect the project, and install the local safety gates.",
    chatAgentLogGit: "[ok] Checked env ignore rules.",
    chatAgentLogAgents: "[ok] Updated AGENTS.md safety instructions.",
    chatAgentLogHooks: "[ok] Installed commit and push checks.",
    chatAgentOutro: "VibeGuard is applied. I will continue with the task, but I will stop before database deletion, paid-service expansion, sensitive production deploys, or risky pushes.",
    terminalOutput: `$ npx --yes @taehwandev/vibeguard@latest setup .

Applied fixes:
✅ Updated .gitignore env protection rules.
✅ Updated AGENTS.md VibeGuard instructions.
✅ Installed local pre-commit and pre-push checks.

[VibeGuard Audit Report]
Overall: ✅ Ready`,
    footerRepo: "Repository"
  },
  ko: {
    pageTitle: "VibeGuard - AI 코딩 에이전트용 사전 안전 점검",
    metaDescription: "AI 코딩 채팅창에 한 줄을 붙여넣으면 에이전트가 실제 프로젝트를 수정하기 전에 비밀값, 비용, 데이터, 배포, Git 위험을 먼저 확인합니다.",
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
    navDocs: "문서",
    navPlaybook: "Tao Agent OS",
    navAudience: "누구를 위한가",
    eyebrow: "AI 코딩 에이전트용 사전 안전 점검",
    heroTitle: "AI가 프로젝트를 고치기 전에, 먼저 VibeGuard를 실행하게 하세요.",
    heroLead: "Cursor, Windsurf, Claude Code 같은 코딩 채팅창에 한 줄만 붙여넣으면 됩니다. 에이전트가 로컬 가드레일을 설치하고 위험한 지점을 먼저 확인한 뒤, 비밀값 노출, 비용 증가, 데이터 변경, 잘못된 push 앞에서 멈춥니다.",
    trustOne: "코딩 채팅창에 그대로 붙여넣기",
    trustTwo: "비밀값은 출력하지 않음",
    trustThree: "새 인프라보다 비용과 배포 위험 먼저 확인",
    magicPromptLabel: "AI 에이전트에게 붙여넣을 한 줄",
    magicPromptText: "이 프로젝트에 VibeGuard를 적용해줘: https://github.com/taehwandev/VibeGuard",
    copyButtonText: "복사",
    copySuccessText: "복사 완료",
    copyFailureText: "직접 선택해 주세요",
    copySuccessAnnouncement: "클립보드에 복사되었습니다.",
    copyFailureAnnouncement: "복사에 실패했습니다. 문장을 직접 선택해 주세요.",
    githubButton: "GitHub 열기",
    docsButton: "한국어 안내 보기",

    sceneAuditTitle: "VibeGuard 점검",
    sceneSecret: "비밀값 가림",
    sceneCost: "유료 API 경계",
    sceneDeploy: "운영 배포 전 멈춤",
    sceneStatus: "승인 필요",
    scenePauseTitle: "위험한 작업 전 멈춤",
    scenePauseText: "데이터, 인증 정보, 비용, 아키텍처, 저장소, 운영 변경은 사용자의 명시적인 확인이 필요합니다.",

    audienceHeading: "사용자는 한 줄만 붙여넣고, 관리자는 로컬 가드레일을 남깁니다",
    nonDevTitle: "AI 코딩 채팅을 쓰는 사람",
    nonDevSub: "터미널 없이 시작",
    nonDevText: "복사한 지시어를 채팅창에 넣으면 에이전트가 설정을 처리합니다. VibeGuard는 에이전트가 먼저 저장소를 살피고, 위험이 낮은 안전 설정만 고친 뒤, 사용자의 승인이 필요한 작업 앞에서 멈추게 합니다.",

    devTitle: "저장소를 관리하는 개발자",
    devSub: "AI 수정 범위를 프로젝트 안에 묶기",
    devText: "관리되는 AGENTS.md 지침, audit 출력, 선택형 Git 훅으로 AI 작업 흐름에 안전선을 남깁니다. 하드코딩된 비밀값, 위험한 스크립트, public repo push 위험, 유료 서비스 확장, 클라이언트로 새는 인증 정보를 릴리스 전에 확인합니다.",

    playbookHeading: "작업 흐름까지 필요하다면 VibeGuard와 Tao Agent OS을 함께 쓰세요.",
    playbookVibeTitle: "VibeGuard는 안전 게이트입니다",
    playbookVibeSub: "위험한 수정 전 점검",
    playbookVibeText: "AI가 프로젝트를 수정하기 전에 비밀값, 비용, 데이터, 배포, 서버 경계, 저장소 위험을 먼저 확인합니다.",
    playbookAgentTitle: "Tao Agent OS은 실행 플레이북입니다",
    playbookAgentSub: "계획, 구현, 검증, 리뷰",
    playbookAgentText: "긴 프롬프트를 저장소마다 복사하지 않고도 에이전트가 재사용할 수 있는 workflow, engineering, review, platform, handoff 지침을 제공합니다.",
    playbookButton: "Tao Agent OS 열기",

    howEyebrow: "작동 흐름",
    howTitle: "설정은 에이전트가 처리하고, 위험한 결정은 사용자에게 돌아옵니다.",
    stepOneTitle: "1. 지시어 붙여넣기",
    stepOneText: "상단의 한 줄을 현재 프로젝트를 수정 중인 AI 코딩 채팅창에 넣습니다.",
    stepTwoTitle: "2. 점검 실행시키기",
    stepTwoText: "에이전트가 로컬 가드레일을 설치하거나 갱신하고, audit을 실행한 뒤 낮은 위험의 안전 수정만 처리합니다.",
    stepThreeTitle: "3. 위험한 작업 승인하기",
    stepThreeText: "다음 작업이 데이터 삭제, 인증 정보 노출, 비용 증가, 운영 배포, 민감 파일 push로 이어질 수 있으면 VibeGuard가 에이전트를 멈추게 합니다.",

    checksEyebrow: "안전 점검 항목",
    checksTitle: "점검 범위는 명확합니다: 비밀값, 비용, 데이터, 배포, Git.",
    securityTitle: "비밀값 처리",
    securityText: "하드코딩된 비밀값 후보를 감지하되 값을 출력하지 않습니다. 단순한 JS, TS, Python 할당은 ignored env 파일로 옮길 수 있습니다.",
    envTitle: "Env 파일 정리",
    envText: "런타임 env 파일은 Git에서 제외하고, 공유 가능한 env 템플릿에는 실제 값이 들어가지 않게 합니다.",
    dataTitle: "데이터 손실 전 멈춤",
    dataText: "DB reset, destructive script, 삭제 명령처럼 데이터를 지울 수 있는 작업을 실행하기 전에 표시합니다.",
    costTitle: "비용 고려 아키텍처",
    costText: "반복되는 API, provider, model 호출은 서버 측 공통 helper, 캐시, batch, rate limit을 먼저 검토하게 합니다.",
    gitTitle: "저장소 점검",
    gitText: "commit 또는 push 전에 원격 저장소, 공개 여부, 변경 파일을 확인합니다. public 또는 unknown 저장소는 더 보수적으로 다룹니다.",
    boundaryTitle: "서버 경계",
    boundaryText: "provider key, database URL, service-role key, webhook secret처럼 서버에 남아야 할 값을 클라이언트 코드로 보내지 않게 합니다.",

    terminalTitle: "에이전트가 돌려주는 결과 예시",
    tabChat: "AI 채팅창 예시",
    tabTerminal: "개발자용 CLI 터미널",
    chatUserName: "사용자",
    chatHeaderTitle: "Cursor / Windsurf / Claude Code",
    chatUserMsg: "이 프로젝트에 VibeGuard를 적용해줘: https://github.com/taehwandev/VibeGuard",
    chatAgentName: "AI 코딩 비서",
    chatAgentIntro: "VibeGuard를 적용하고 프로젝트를 점검한 뒤 로컬 안전 게이트를 설치하겠습니다.",
    chatAgentLogGit: "[ok] env ignore 규칙 확인",
    chatAgentLogAgents: "[ok] AGENTS.md 안전 지침 갱신",
    chatAgentLogHooks: "[ok] commit/push 전 점검 설치",
    chatAgentOutro: "VibeGuard 적용이 완료되었습니다. 작업은 이어가되, DB 삭제, 유료 서비스 확장, 민감한 운영 배포, 위험한 push 앞에서는 멈춰서 확인하겠습니다.",
    terminalOutput: `$ npx --yes @taehwandev/vibeguard@latest setup .

적용된 수정:
✅ .gitignore env 보호 규칙을 업데이트했습니다.
✅ AGENTS.md VibeGuard 지침을 갱신했습니다.
✅ commit/push 전 점검을 설치했습니다.

[VibeGuard 점검 리포트]
전체 상태: ✅ 진행 가능`,
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
