# VibeGuard 한국어 안내

VibeGuard는 AI 코딩 에이전트가 실제 프로젝트를 수정하기 전에 실행하는 사전 안전 점검입니다.

- 웹사이트: https://vibeguard.thdev.app/
- Tao Agent OS: https://tao.thdev.app/
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

## 기존 유료 의존성 확인 처리

이미 사용 중인 유료 또는 쿼터 기반 패키지의 예산, 요청 제한, 대안,
테스트/운영 환경 분리를 검토했다면 `.vibeguard.json`에 정확한 패키지명을
기록할 수 있습니다.

항목은 패키지명 문자열이거나, 비용을 감수할 수 있다고 본 근거를 함께 담은
객체일 수 있습니다.

```json
{
  "cost": {
    "acknowledgedPaidDependencies": [
      "@aws-sdk/client-s3",
      {
        "name": "firebase-admin",
        "reason": "Spark 무료 티어, 일 5만 문서 읽기 한도에 한참 못 미침",
        "reviewedAt": "2026-07-19"
      }
    ]
  }
}
```

이런 서비스는 일정 사용량 아래에서는 무료인 경우가 많아서, 그 기준선을 적어
두는 자리가 `reason` 필드입니다. 두 형태 모두 확인 처리로 인정되며, `reason`이
없는 항목은 감사를 실패시키지 않으면서 근거가 비어 있다는 사실만 정보성
항목으로 함께 표시됩니다.

유료 의존성 항목은 경고이지 차단이 아닙니다. `--strict`를 주지 않는 한
`vibeguard audit`는 종료 코드 `0`으로 끝납니다. 확인 처리는 정확히 일치하는
패키지 하나에만 적용됩니다. 관련 패키지를 묵시적으로 함께 승인하거나
`--strict`를 완화하지 않습니다. 목록에 없는 기존 의존성이나 새로 추가된 유료
의존성은 계속 Cost 경고를 발생시킵니다.

## 상태 표시

VibeGuard는 색상만으로 상태를 구분하지 않습니다.

- `✅ 진행 가능`: 차단 이슈가 없습니다.
- `⚠️ 확인 필요`: 진행은 가능하지만 확인할 경고가 있습니다.
- `🛑 차단`: 먼저 해결하거나 사용자의 명시적 승인이 필요합니다.
- `ℹ️ 정보`: 참고용 상태입니다.

## Tao Agent OS와의 관계

VibeGuard는 안전 게이트입니다. Tao Agent OS는 계획, 구현, 검증, 리뷰, 인수인계에 쓰는 외부 에이전트 실행 체계입니다.

이 저장소는 Tao Agent OS를 복사하거나 포함하지 않습니다. 필요한 경우 기존 로컬 Tao Agent OS 경로를 설정해 읽고, VibeGuard는 비밀값, 비용, 데이터, 배포, 저장소 위험을 먼저 막는 역할에 집중합니다.

Tao Agent OS 웹사이트: https://tao.thdev.app/

## 더 읽기

- [Agent bootstrap](agent-bootstrap.md)
- [Guard scope](guard-scope.md)
- [Open source security](open-source-security.md)
- [Server-to-client security](server-client-security.md)
- [Release policy](release.md)
