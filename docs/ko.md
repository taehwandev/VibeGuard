# VibeGuard 한국어 안내

VibeGuard는 AI 코딩 에이전트가 실제 프로젝트를 수정하기 전에 실행하는 사전 안전 점검입니다.

- 웹사이트: https://vibeguard.thdev.app/
- AgentPlaybook: https://agentplaybook.thdev.app/
- GitHub: https://github.com/taehwandev/VibeGuard
- npm 패키지: `@taehwandev/vibeguard`

## AI 채팅창에 붙여넣을 문장

터미널을 직접 열 필요가 없다면, 아래 문장을 Cursor, Windsurf, Claude Code 같은 AI 코딩 채팅창에 붙여넣으세요.

```text
이 프로젝트에 VibeGuard를 적용해줘: https://github.com/taehwandev/VibeGuard
```

에이전트는 현재 프로젝트에서 VibeGuard를 설치하거나 갱신하고, audit을 실행한 뒤, 안전한 범위의 수정만 자동으로 처리해야 합니다. 데이터 삭제, 운영 배포, 비용 증가, 인증 정보 변경, 민감 파일 push처럼 위험한 작업은 멈추고 사용자에게 확인해야 합니다.

## 개발자가 직접 실행할 때

```bash
npx --yes @taehwandev/vibeguard@latest setup .
npx --yes @taehwandev/vibeguard@latest audit . --fix
npx --yes @taehwandev/vibeguard@latest audit .
```

언어는 `--lang ko` 또는 `VIBEGUARD_LANG=ko`로 지정할 수 있습니다.

```bash
vibeguard audit . --lang ko
VIBEGUARD_LANG=ko vibeguard audit .
```

## 무엇을 점검하나

- 비밀값: 하드코딩된 API key, token, database URL 후보를 감지하되 값을 출력하지 않습니다.
- env 파일: `.env`, `.env.local` 같은 런타임 env 파일은 Git에서 제외하고, `.env.example` 같은 템플릿에는 실제 값을 넣지 않게 합니다.
- 데이터 손실: DB reset, drop, destructive script, `rm -rf` 같은 작업 앞에서 멈추게 합니다.
- 비용: 새 유료 서비스, 모델 호출, 클라우드 리소스, 반복 비용 인프라를 추가하기 전에 기존 코드, 서버 측 공통 helper, 캐시, batch, rate limit을 먼저 검토하게 합니다.
- 서버 경계: provider key, service-role key, webhook secret처럼 서버에 있어야 할 값이 클라이언트 코드로 이동하지 않게 합니다.
- Git 안전: commit 또는 push 전에 원격 저장소, 공개 여부, 변경 파일을 확인합니다.

## 상태 표시

VibeGuard는 색상만으로 상태를 구분하지 않습니다.

- `✅ 진행 가능`: 차단 이슈가 없습니다.
- `⚠️ 확인 필요`: 진행은 가능하지만 확인할 경고가 있습니다.
- `🛑 차단`: 먼저 해결하거나 사용자의 명시적 승인이 필요합니다.
- `ℹ️ 정보`: 참고용 상태입니다.

## AgentPlaybook과의 관계

VibeGuard는 안전 게이트입니다. AgentPlaybook은 계획, 구현, 검증, 리뷰, 인수인계에 쓰는 외부 실행 플레이북입니다.

이 저장소는 AgentPlaybook을 복사하거나 포함하지 않습니다. 필요한 경우 기존 로컬 AgentPlaybook 경로를 설정해 읽고, VibeGuard는 비밀값, 비용, 데이터, 배포, 저장소 위험을 먼저 막는 역할에 집중합니다.

AgentPlaybook 웹사이트: https://agentplaybook.thdev.app/

## 더 읽기

- [Agent bootstrap](agent-bootstrap.md)
- [Guard scope](guard-scope.md)
- [Open source security](open-source-security.md)
- [Server-to-client security](server-client-security.md)
- [Release policy](release.md)
