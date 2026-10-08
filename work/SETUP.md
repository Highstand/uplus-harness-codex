# R8 설치와 새 대화 시작

현재 상태: 하네스와 Next.js 뼈대의 준비·검사는 완료했지만, `.codex/` 설치와 Git 초기화는 미완료다.
현재 Codex 세션에서 `.codex/`와 `.git/`가 읽기 전용으로 보호되어 쓰기가 거절됐다.
에이전트와 훅 정의는 `work/setup/`에 준비했다. 보호를 우회해 설치하지 않았다.

사용자 터미널에서 이 프로젝트로 이동해 실행한다:

```sh
cd /Users/bibi/uplus-harness-codex
node scripts/install-harness.mjs --install
```

이 명령은 검사 → Git 준비 → 에이전트·설정 설치 → 훅 마지막 설치 → 초기 커밋을 수행한다.
이미 존재하는 설정의 내용이 다르면 덮어쓰지 않고 멈춘다.
Git 사용자 이름·이메일이 없으면 커밋이 실패한다. 사용자가 자신의 Git 정보를 설정한 뒤 다시 실행한다.
docs/·reference/·README.md·AGENTS.md는 설치 명령이 수정하지 않는다.
설치 전 읽기 전용 확인은 `node scripts/install-harness.mjs --check`다.

설치 후 **새 Codex 대화**에서 진행한다:

1. 프로젝트 설정을 신뢰할 수 있는 상태인지 확인한다.
2. `/hooks`를 열어 이 프로젝트의 훅을 검토하고 승인한다. 승인 전에는 훅이 실행되지 않는다.
3. `페이즈 1 시작`이라고 입력한다. 페이즈 안내만 나와야 한다.
4. `진행해`라고 입력한다. requirements-reader가 결과를 만든 뒤 사람 검수에서 멈춰야 한다.
5. 검수 후 승인하면 커밋한다. 다음 단계는 안내 후 새 `진행해`를 받아야 한다.

현재 `work/progress.json`은 페이즈 1 실행 전 상태다. R8 테스트는 임시 폴더에서 했으며 실제 단계는 수행하지 않았다.
현재 앱은 초기 뼈대다. 5개 화면은 이후 페이즈에서 만든다.

## 검증 범위

- `node checks/selftest.mjs`: 주소 일치·누락·중복 수, 토큰 위반, 생성 CSS 불일치,
  금지 문구, 승인 전 진행 금지, 승인 후 커밋 전 정지, 수정 시 판정 무효화, 훅 입력·출력 등을 검사한다.
- `npm run build`: Next.js 16.4.0 뼈대 빌드. 제한된 환경에서 포트를 사용하지 않는 webpack 빌드를 사용한다.
- `npm run lint`: 앱과 하네스 코드 검사. docs/와 reference/는 제외한다.
- `.codex/` 파일 설치 후 실제 Codex 세션에서 훅이 로드되는지는 이 세션에서 확인하지 못했다.
- Node의 사람 승인 명령은 대화의 실제 승인에 근거해 메인이 호출한다. 사용자 신원 인증 기능은 아니다.
- 토큰 검사는 명시적 CSS와 정적 className을 대상으로 하는 수업용 검사다. 브라우저의 모든 계산 스타일을 증명하지 않는다.
- 설치된 의존성은 로컬 npm 캐시의 공식 패키지에서 복원했다. package-lock.json의 resolved는 공식 registry URL이다.
  외부 접속이 가능한 환경에서는 `npm ci`로 재설치할 수 있다.

## 현재 예상되는 3단계 정지

`node checks/tokens.mjs --coverage-only`는 현재 원본을 기준으로 실패하는 것이 정상이다.
줄높이·글자 굵기·12px 글자 크기와 일부 고정 요소 크기에 필요한 토큰이 없다.
필요한 값은 게이트에서 보고한다. 임의 값으로 대체하거나 docs/tokens.json을 자동 수정하지 않는다.
상세 목록은 `work/setup-token-gaps.json`에 있다.

## 확인한 공식 문서

- [Codex 사용자 정의 에이전트](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Codex 훅과 /hooks 승인](https://learn.chatgpt.com/docs/hooks)
- [Next.js agentRules: false와 --no-agents-md](https://nextjs.org/docs/app/api-reference/config/next-config-js/agentRules)
- [Tailwind의 Next.js PostCSS 구성](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
