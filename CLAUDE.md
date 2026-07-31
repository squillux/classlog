# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

중학교 정보과목 3단원 '알고리즘과 프로그래밍' 수업용 웹앱. 학생이 학급 코드로
들어와 활동을 하고 제출하면, 교사가 한 화면에서 제출물을 본다.

**UI 문구·주석·커밋 메시지는 모두 한국어로 쓴다.** 사용자는 현직 교사다.

## Commands

```bash
npm run dev              # 개발 서버 (http://localhost:5173)
npm test                 # 전체 테스트 (vitest run)
npm test -- Player       # 파일 이름으로 골라 실행
npm test -- -t "되감기"   # 테스트 이름으로 골라 실행
npm run test:watch       # 감시 모드
npm run build            # tsc -b + vite build (타입 오류가 여기서 잡힌다)
npm run lint             # oxlint
```

작업을 마쳤다고 말하기 전에 `npm test && npm run build && npm run lint` 를 모두
돌린다. `tsc` 는 `build` 에서만 도므로 테스트만 통과했다고 타입이 맞는 것은 아니다.

## 활동(Activity) 구조 — 이 저장소의 핵심

수업 활동은 `src/activities/<이름>/` 폴더 하나로 닫힌다. 활동을 추가할 때
기존 코드에서 손대는 곳은 `src/activities/index.ts` 의 배열 한 줄뿐이다.

활동이 지켜야 하는 계약은 `src/activities/types.ts` 의 이것 하나다.

```ts
type Activity = { id: string; title: string; Component: FC<ActivityProps> }
type ActivityProps = { onSubmit: (payload: unknown) => void | Promise<void> }
```

활동은 저장·인증·라우팅을 모른다. `src/routes/ActivityPage.tsx` 가 활동을
찾아 `onSubmit` 을 Supabase 저장에 연결한다.

**규칙과 화면을 반드시 가른다.** 게임 규칙·채점·알고리즘은 화면을 모르는 순수
함수로 `rules.ts` / `grading.ts` / `steps.ts` 에 두고, 컴포넌트는 상태와
렌더만 맡는다 (`river/rules.ts`, `tictactoe/rules.ts`, `visualizer/steps.ts`).
난수를 쓰는 함수는 `rng: () => number` 를 인자로 받아 테스트에서 결정적으로
만든다.

`src/activities/shared/` 에 활동들이 함께 쓰는 것이 있다.

- `payload.ts` — `buildPayload()` 로 제출물 모양을 통일한다:
  `{ solved, attempts, elapsedMs, result, note }`
- `QuestionSet.tsx` + `questions.ts` — 객관식/서술형 문항 화면과 채점
- `ReflectionForm.tsx` — 짧은 설명 한 칸

**`note` 는 교사 화면에서 바로 읽힌다.** 서술형 답이 있는 활동은 그 값을
`note` 로 올린다. `src/routes/submissionSummary.ts` 가 `payload` 모양을 보고
퀴즈면 점수, 미니게임이면 성공/미완으로 표에 표시한다.

## Supabase

스키마는 `supabase/schema.sql` 한 파일이다. **여러 번 실행해도 안전하도록
써야 한다** — 정책마다 `drop policy if exists` 를 앞에 붙인다. `create policy`
에는 `if not exists` 문법이 없다.

이 파일을 고치면 **사람이 Supabase SQL Editor 에 붙여넣어 직접 실행해야 한다.**
Claude 가 적용할 수 없다. 고쳤으면 사용자에게 실행을 요청한다.

**학생 신원은 `(class_id, number)` 다.** 익명 uid 는 브라우저 저장소에 묶여
있어 다음 시간이면 사라진다. `enter_class` RPC 가 번호로 학생을 찾아
`anon_uid` 를 덮어쓴다. 이 덕분에 다른 자리에 앉아도 같은 학생으로 이어진다.

`classes` 테이블은 익명 사용자에게 완전히 잠겨 있다. 학생은 `enter_class`
(`security definer`) 를 통해서만 학급에 들어온다. 학급 코드를 안다고 남의
제출물이 보이면 안 된다 — RLS 가 막는다.

교사 계정은 Supabase 대시보드에서 직접 만든다. 회원가입 화면은 없다.

설정 절차는 `README.md` 에 있다.

## 스타일

`DESIGN-notion.md` 의 Notion 디자인 언어를 따른다. 값은 전부
`src/styles/tokens.css` 에 있고 **컴포넌트나 CSS 에 색을 직접 적지 않는다.**

- 파랑(`--primary`)은 주요 동작 버튼과 링크에만. 구조나 장식에 쓰지 않는다
- 알록달록한 `--accent-*` 는 장식에만 (활동 카드 색 띠, 막대 그래프 상태)
- 배경은 따뜻한 종이색 `--canvas-soft`, 카드만 흰색
- CTA 는 알약(`--r-full`), 보조 버튼은 8px, **입력창은 4px 로 각지게**
- 다크 모드는 없다. 밝은 문서 느낌이 이 디자인의 핵심이다

조작은 **클릭만** 쓴다. 드래그 앤 드롭은 학교 PC 마우스와 태블릿에서 실패율이
높아 쓰지 않는다.

## 테스트

- Vitest 전역을 켜지 않는다. 각 파일에서 `import { describe, it, expect } from 'vitest'`
- 테스트 파일은 대상 파일과 나란히 둔다 (`rules.ts` → `rules.test.ts`)
- `src/test/setup.ts` 가 `afterEach(cleanup)` 을 직접 건다. 전역이 없어
  Testing Library 의 자동 정리가 등록되지 않기 때문이다. 빼면 DOM 이 쌓인다
- `vite.config.ts` 의 `test.env` 가 더미 Supabase 값을 준다. `src/lib/supabase.ts`
  는 환경 변수가 비면 import 시점에 던지므로, 이게 없으면 라우트를 간접적으로
  끌어오는 모든 테스트가 모킹을 강요당한다

**userEvent 와 가짜 타이머를 함께 쓰지 않는다.** 서로를 기다리다 멈춘다
(`advanceTimers` 나 `delay: null` 로도 안 풀린다). 타이머가 필요한
describe 안에서만 `vi.useFakeTimers()` 를 켜고 그 안에서는 `fireEvent` 를 쓴다.
`src/activities/visualizer/Player.test.tsx` 가 그 예다.

**반복 클릭에도 `fireEvent` 를 쓴다.** userEvent 의 클릭 시뮬레이션은 느려서
수십 번 반복하면 5초 제한을 넘긴다. 반복문에서는 버튼을 한 번만 찾는다 —
매번 `getByRole` 로 다시 찾으면 화면 전체를 그만큼 훑는다.

## 실제 동작 확인

브라우저 확장(claude-in-chrome)은 연결되어 있지 않다. 헤드리스 Chrome 을
CDP 로 몰아 확인한다.

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu \
  --remote-debugging-port=9222 --user-data-dir=<scratchpad>/cdp-profile about:blank
```

그다음 node 스크립트에서 `http://localhost:9222/json/new` 로 탭을 열고
WebSocket 으로 CDP 명령을 보낸다. React 가 제어하는 입력은 네이티브 setter 로
값을 넣고 `input` 이벤트를 쏴야 한다. **클릭을 몰아서 하지 않는다** — 한 틱에
여러 번 누르면 React 가 다시 그리지 못해 모든 클릭이 같은 상태를 읽는다.
사이에 `await new Promise(r => setTimeout(r, 0))` 을 넣는다.

RLS 같은 서버 동작은 브라우저 없이 `@supabase/supabase-js` 로 직접 확인하는
편이 빠르고 확실하다.

## 문서

- `docs/superpowers/specs/` — 설계. 무엇을 왜 그렇게 정했는지
- `docs/superpowers/plans/` — 구현 계획. 태스크별 테스트·코드

새 기능은 설계 → 계획 → 구현 순서로 간다 (superpowers 스킬: brainstorming →
writing-plans → executing-plans). 작업 전에 해당 spec 을 읽으면 맥락이 빠르게
잡힌다.

## 아직 없는 것

4단계 순서도/의사코드 작성(`@xyflow/react` 예정), 교사용 활동 배정, 교사용
문항 저작. 퀴즈 문항(`src/content/quiz.ts`)은 아직 샘플 3개다.
