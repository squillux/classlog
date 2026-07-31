# 2단계: 미니게임 3종 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 햄버거 만들기·강 건너기·틱택토 세 활동을 추가하고, 교사가 학생이 쓴 설명을 읽을 수 있게 한다.

**Architecture:** 각 게임은 `src/activities/<game>/` 폴더 하나로 닫힌다. 규칙은 `rules.ts` 순수 함수에, 화면은 컴포넌트에 둔다. 세 게임은 같은 `MinigamePayload` 모양으로 제출하고 설명 입력은 공통 `ReflectionForm` 을 쓴다. 기존 `Activity` 인터페이스만 지키므로 1단계 코드는 레지스트리 한 줄씩 외에 건드리지 않는다.

**Tech Stack:** React 19, TypeScript 6, Vitest + Testing Library. 새 의존성 없음.

## Global Constraints

- 조작은 **클릭만**. 드래그 앤 드롭을 쓰지 않는다. 학교 PC 마우스와 태블릿 양쪽에서 실패율이 높다.
- 난수를 쓰는 함수는 `rng: () => number` 를 인자로 받는다. 테스트에서 결정적으로 만들기 위해서다.
- 설명(`note`)이 비어 있으면 제출할 수 없다. 이 활동들의 목적이 설명이다.
- 재제출을 막지 않는다. 활동을 다시 열어 또 낼 수 있고 제출물이 한 줄씩 쌓인다.
- 테스트 파일은 대상 파일과 나란히 둔다 (`rules.ts` → `rules.test.ts`).
- Vitest 전역을 켜지 않는다. 각 테스트 파일에서 `import { describe, it, expect } from 'vitest'` 로 가져온다.
- 색·간격·모서리 값은 `src/styles/tokens.css` 의 변수만 쓴다. 컴포넌트나 CSS에 색을 직접 적지 않는다.
- 커밋 메시지는 한국어. 본문 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/activities/shared/payload.ts` | `MinigamePayload` 타입과 조립 함수 |
| `src/activities/shared/ReflectionForm.tsx` | 설명 입력 + 제출 버튼 (세 게임 공용) |
| `src/activities/burger/rules.ts` | 재료 목록, 정답 순서, 순서 검사, 섞기 |
| `src/activities/burger/BurgerActivity.tsx` | 햄버거 화면 |
| `src/activities/river/rules.ts` | 강 건너기 상태·이동·위반 판정 |
| `src/activities/river/RiverActivity.tsx` | 강 건너기 화면 |
| `src/activities/tictactoe/rules.ts` | 승패 판정, 컴퓨터 수 고르기 |
| `src/activities/tictactoe/TicTacToeActivity.tsx` | 틱택토 화면 |
| `src/activities/index.ts` | (수정) 레지스트리에 세 줄 추가 |
| `src/routes/TeacherDashboard.tsx` | (수정) 제출물 펼쳐 보기 |
| `src/index.css` | (수정) 게임 화면 스타일 |

---

### Task 1: 공통 제출물과 설명 입력 폼

**Files:**
- Create: `src/activities/shared/payload.ts`
- Test: `src/activities/shared/payload.test.ts`
- Create: `src/activities/shared/ReflectionForm.tsx`
- Test: `src/activities/shared/ReflectionForm.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type MinigamePayload = { solved: boolean; attempts: number; elapsedMs: number; result: unknown; note: string }`
  - `buildPayload(startedAt: number, parts: { solved: boolean; attempts: number; result: unknown; note: string }, now?: () => number): MinigamePayload`
  - `ReflectionForm` 기본 export. props: `{ question: string; hint?: string; onSubmit: (note: string) => void | Promise<void> }`

- [ ] **Step 1: payload 테스트 작성**

`src/activities/shared/payload.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildPayload } from './payload'

describe('buildPayload', () => {
  it('시작 시각과 지금 시각의 차이를 elapsedMs 로 넣는다', () => {
    const p = buildPayload(
      1000,
      { solved: true, attempts: 2, result: { a: 1 }, note: '설명' },
      () => 4500,
    )
    expect(p.elapsedMs).toBe(3500)
  })

  it('나머지 값을 그대로 담는다', () => {
    const p = buildPayload(
      0,
      { solved: false, attempts: 5, result: ['x'], note: '  적어봤어요  ' },
      () => 0,
    )
    expect(p.solved).toBe(false)
    expect(p.attempts).toBe(5)
    expect(p.result).toEqual(['x'])
  })

  it('설명의 앞뒤 공백을 정리한다', () => {
    const p = buildPayload(0, { solved: true, attempts: 1, result: null, note: '  답  ' }, () => 0)
    expect(p.note).toBe('답')
  })

  it('시계가 거꾸로 가도 elapsedMs 가 음수가 되지 않는다', () => {
    const p = buildPayload(5000, { solved: true, attempts: 1, result: null, note: 'a' }, () => 1000)
    expect(p.elapsedMs).toBe(0)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- payload`
Expected: FAIL — `./payload` 모듈이 없다

- [ ] **Step 3: `src/activities/shared/payload.ts` 구현**

```ts
/** 세 미니게임이 공통으로 내는 제출물 모양. */
export type MinigamePayload = {
  solved: boolean
  attempts: number
  elapsedMs: number
  result: unknown
  note: string
}

export function buildPayload(
  startedAt: number,
  parts: { solved: boolean; attempts: number; result: unknown; note: string },
  now: () => number = Date.now,
): MinigamePayload {
  return {
    solved: parts.solved,
    attempts: parts.attempts,
    // 기기 시계가 흔들려도 음수가 나오지 않게 막는다.
    elapsedMs: Math.max(0, now() - startedAt),
    result: parts.result,
    note: parts.note.trim(),
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- payload`
Expected: PASS (4개)

- [ ] **Step 5: ReflectionForm 테스트 작성**

`src/activities/shared/ReflectionForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReflectionForm from './ReflectionForm'

describe('ReflectionForm', () => {
  it('질문을 보여준다', () => {
    render(<ReflectionForm question="왜 그럴까요?" onSubmit={vi.fn()} />)
    expect(screen.getByText('왜 그럴까요?')).toBeInTheDocument()
  })

  it('설명이 비어 있으면 제출 버튼이 잠긴다', () => {
    render(<ReflectionForm question="Q" onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: '제출하기' })).toBeDisabled()
  })

  it('공백만 쓰면 여전히 잠겨 있다', async () => {
    const user = userEvent.setup()
    render(<ReflectionForm question="Q" onSubmit={vi.fn()} />)
    await user.type(screen.getByLabelText('왜 그럴까요?'), '   ')
    expect(screen.getByRole('button', { name: '제출하기' })).toBeDisabled()
  })

  it('설명을 쓰면 제출할 수 있고 내용을 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReflectionForm question="왜 그럴까요?" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('왜 그럴까요?'), '빵이 먼저여야 해요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(onSubmit).toHaveBeenCalledWith('빵이 먼저여야 해요')
  })

  it('힌트를 주면 보여준다', () => {
    render(<ReflectionForm question="Q" hint="한 문장이면 충분해요" onSubmit={vi.fn()} />)
    expect(screen.getByText('한 문장이면 충분해요')).toBeInTheDocument()
  })
})
```

`question` 을 label 로도 쓰기 때문에 `getByLabelText('왜 그럴까요?')` 가 통한다.

- [ ] **Step 6: 테스트가 실패하는지 확인**

Run: `npm test -- ReflectionForm`
Expected: FAIL — `./ReflectionForm` 모듈이 없다

- [ ] **Step 7: `src/activities/shared/ReflectionForm.tsx` 구현**

```tsx
import { useId, useState } from 'react'

type Props = {
  question: string
  hint?: string
  onSubmit: (note: string) => void | Promise<void>
}

export default function ReflectionForm({ question, hint, onSubmit }: Props) {
  const id = useId()
  const [note, setNote] = useState('')
  const ready = note.trim().length > 0

  return (
    <div className="card stack stack--tight">
      <label htmlFor={id} className="reflection__question">{question}</label>
      {hint && <p className="faint">{hint}</p>}

      <textarea
        id={id}
        className="input reflection__input"
        rows={4}
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <button
        type="button"
        className="btn btn--primary"
        disabled={!ready}
        onClick={() => onSubmit(note)}
      >
        제출하기
      </button>
    </div>
  )
}
```

- [ ] **Step 8: 스타일 추가**

`src/index.css` 끝의 반응형 블록 앞에 넣는다.

```css
/* ── 미니게임 공통 ───────────────────────────────────────────────── */

.reflection__question {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.125px;
  color: var(--ink);
}

.reflection__input {
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
}

.game__board {
  background: var(--canvas-soft);
  border-radius: var(--r-lg);
  padding: var(--s-lg);
}

.game__status {
  font-size: 15px;
  color: var(--ink-secondary);
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-xs);
}

.chip {
  font-family: inherit;
  font-size: 15px;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--hairline);
  border-radius: var(--r-full);
  padding: 8px 16px;
  cursor: pointer;
}

.chip:disabled {
  opacity: 0.35;
  cursor: default;
}

.chip[aria-pressed='true'] {
  border-color: var(--primary);
  color: var(--primary);
}
```

- [ ] **Step 9: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 전체 PASS, 빌드 성공

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "미니게임 공통 제출물 모양과 설명 입력 폼 추가"
```

---

### Task 2: 햄버거 만들기 — 규칙

**Files:**
- Create: `src/activities/burger/rules.ts`
- Test: `src/activities/burger/rules.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Ingredient = { id: string; label: string }`
  - `INGREDIENTS: Ingredient[]` — 정답 순서대로 담긴 7개
  - `CORRECT_ORDER: string[]` — `INGREDIENTS` 의 id 를 아래부터 나열
  - `isComplete(stack: string[]): boolean`
  - `isCorrect(stack: string[]): boolean`
  - `shuffle(items: Ingredient[], rng: () => number): Ingredient[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/burger/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { INGREDIENTS, CORRECT_ORDER, isComplete, isCorrect, shuffle } from './rules'

describe('재료 목록', () => {
  it('재료가 7개다', () => {
    expect(INGREDIENTS).toHaveLength(7)
  })

  it('id 가 겹치지 않는다', () => {
    expect(new Set(INGREDIENTS.map((i) => i.id)).size).toBe(7)
  })

  it('CORRECT_ORDER 는 INGREDIENTS 의 id 순서와 같다', () => {
    expect(CORRECT_ORDER).toEqual(INGREDIENTS.map((i) => i.id))
  })

  it('맨 아래는 아래빵, 맨 위는 위빵이다', () => {
    expect(CORRECT_ORDER[0]).toBe('bottom-bun')
    expect(CORRECT_ORDER[6]).toBe('top-bun')
  })
})

describe('isComplete', () => {
  it('7개를 다 쌓아야 완성이다', () => {
    expect(isComplete(CORRECT_ORDER)).toBe(true)
    expect(isComplete(CORRECT_ORDER.slice(0, 6))).toBe(false)
  })
})

describe('isCorrect', () => {
  it('정답 순서와 같으면 맞다', () => {
    expect(isCorrect(CORRECT_ORDER)).toBe(true)
  })

  it('순서가 하나라도 다르면 틀리다', () => {
    const swapped = [...CORRECT_ORDER]
    ;[swapped[1], swapped[2]] = [swapped[2], swapped[1]]
    expect(isCorrect(swapped)).toBe(false)
  })

  it('덜 쌓았으면 틀리다', () => {
    expect(isCorrect(CORRECT_ORDER.slice(0, 6))).toBe(false)
  })
})

describe('shuffle', () => {
  it('재료를 하나도 잃지 않는다', () => {
    const out = shuffle(INGREDIENTS, () => 0.5)
    expect(out.map((i) => i.id).sort()).toEqual([...CORRECT_ORDER].sort())
  })

  it('원본을 바꾸지 않는다', () => {
    const before = INGREDIENTS.map((i) => i.id)
    shuffle(INGREDIENTS, () => 0.9)
    expect(INGREDIENTS.map((i) => i.id)).toEqual(before)
  })

  it('rng 가 0 이면 순서가 뒤집힌다', () => {
    // Fisher-Yates 에서 rng()=0 이면 매번 0번 자리와 바꾼다.
    const out = shuffle(INGREDIENTS, () => 0)
    expect(out.map((i) => i.id)).not.toEqual(CORRECT_ORDER)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- burger`
Expected: FAIL — `./rules` 모듈이 없다

- [ ] **Step 3: `src/activities/burger/rules.ts` 구현**

```ts
export type Ingredient = { id: string; label: string }

/** 아래부터 위로. 이 순서가 곧 정답이다. */
export const INGREDIENTS: Ingredient[] = [
  { id: 'bottom-bun', label: '아래빵' },
  { id: 'sauce', label: '소스' },
  { id: 'lettuce', label: '양상추' },
  { id: 'tomato', label: '토마토' },
  { id: 'patty', label: '패티' },
  { id: 'cheese', label: '치즈' },
  { id: 'top-bun', label: '위빵' },
]

export const CORRECT_ORDER: string[] = INGREDIENTS.map((i) => i.id)

export function isComplete(stack: string[]): boolean {
  return stack.length === CORRECT_ORDER.length
}

export function isCorrect(stack: string[]): boolean {
  return (
    isComplete(stack) && stack.every((id, index) => id === CORRECT_ORDER[index])
  )
}

export function shuffle(items: Ingredient[], rng: () => number): Ingredient[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- burger`
Expected: PASS (10개)

- [ ] **Step 5: 커밋**

```bash
git add src/activities/burger
git commit -m "햄버거 만들기 규칙 추가"
```

---

### Task 3: 햄버거 만들기 — 화면

**Files:**
- Create: `src/activities/burger/BurgerActivity.tsx`
- Test: `src/activities/burger/BurgerActivity.test.tsx`
- Modify: `src/activities/index.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `INGREDIENTS`, `CORRECT_ORDER`, `isComplete`, `isCorrect`, `shuffle` (Task 2), `buildPayload`, `ReflectionForm` (Task 1), `ActivityProps` (`src/activities/types.ts`)
- Produces: `BurgerActivity` 기본 export. 레지스트리 id `burger`, 제목 `햄버거 만들기`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/burger/BurgerActivity.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BurgerActivity from './BurgerActivity'
import { INGREDIENTS } from './rules'

/** 정답 순서대로 재료를 클릭한다. */
async function stackCorrectly(user: ReturnType<typeof userEvent.setup>) {
  for (const ing of INGREDIENTS) {
    await user.click(screen.getByRole('button', { name: ing.label }))
  }
}

describe('BurgerActivity', () => {
  it('재료 7개를 모두 보여준다', () => {
    render(<BurgerActivity onSubmit={vi.fn()} />)
    for (const ing of INGREDIENTS) {
      expect(screen.getByRole('button', { name: ing.label })).toBeInTheDocument()
    }
  })

  it('쌓기 전에는 설명 폼이 없다', () => {
    render(<BurgerActivity onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '제출하기' })).not.toBeInTheDocument()
  })

  it('정답 순서로 쌓으면 성공을 알리고 설명 폼이 나온다', async () => {
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={vi.fn()} />)

    await stackCorrectly(user)

    expect(await screen.findByText('순서가 맞습니다!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제출하기' })).toBeInTheDocument()
  })

  it('순서가 틀리면 알리고 다시 쌓게 한다', async () => {
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={vi.fn()} />)

    // 위빵부터 거꾸로 쌓는다.
    for (const ing of [...INGREDIENTS].reverse()) {
      await user.click(screen.getByRole('button', { name: ing.label }))
    }

    expect(await screen.findByText('순서가 다릅니다. 다시 해 보세요.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '제출하기' })).not.toBeInTheDocument()
  })

  it('틀렸을 때 다시 쌓기로 한 번에 비운다', async () => {
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={vi.fn()} />)

    for (const ing of [...INGREDIENTS].reverse()) {
      await user.click(screen.getByRole('button', { name: ing.label }))
    }
    await user.click(screen.getByRole('button', { name: '다시 쌓기' }))

    expect(screen.getByText('아직 아무것도 쌓지 않았어요.')).toBeInTheDocument()
    for (const ing of INGREDIENTS) {
      expect(screen.getByRole('button', { name: ing.label })).toBeEnabled()
    }
  })

  it('맨 위 재료를 빼낼 수 있다', async () => {
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '아래빵' }))
    expect(screen.getByRole('button', { name: '아래빵' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '맨 위 빼기' }))
    expect(screen.getByRole('button', { name: '아래빵' })).toBeEnabled()
  })

  it('제출하면 쌓은 순서와 설명을 담아 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={onSubmit} />)

    await stackCorrectly(user)
    await user.type(screen.getByLabelText(/왜 이 순서여야/), '빵이 먼저예요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const payload = onSubmit.mock.calls[0][0]
    expect(payload.solved).toBe(true)
    expect(payload.note).toBe('빵이 먼저예요')
    expect(payload.result.order).toEqual(INGREDIENTS.map((i) => i.id))
    expect(payload.attempts).toBe(1)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- BurgerActivity`
Expected: FAIL — `./BurgerActivity` 모듈이 없다

- [ ] **Step 3: `src/activities/burger/BurgerActivity.tsx` 구현**

```tsx
import { useMemo, useState } from 'react'
import type { ActivityProps } from '../types'
import { buildPayload } from '../shared/payload'
import ReflectionForm from '../shared/ReflectionForm'
import { INGREDIENTS, isComplete, isCorrect, shuffle } from './rules'

const QUESTION = '왜 이 순서여야 할까요? 순서를 바꾸면 어떤 일이 생기나요?'

export default function BurgerActivity({ onSubmit }: ActivityProps) {
  const tray = useMemo(() => shuffle(INGREDIENTS, Math.random), [])
  const [startedAt] = useState(() => Date.now())
  const [stack, setStack] = useState<string[]>([])
  const [attempts, setAttempts] = useState(0)
  const [checked, setChecked] = useState<'none' | 'right' | 'wrong'>('none')

  function put(id: string) {
    const next = [...stack, id]
    setStack(next)
    if (isComplete(next)) {
      setAttempts((n) => n + 1)
      setChecked(isCorrect(next) ? 'right' : 'wrong')
    }
  }

  function pop() {
    setStack((prev) => prev.slice(0, -1))
    setChecked('none')
  }

  function clear() {
    setStack([])
    setChecked('none')
  }

  const solved = checked === 'right'

  return (
    <section className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">활동</p>
        <h2>햄버거 만들기</h2>
        <p className="muted">재료를 아래부터 순서대로 쌓아 보세요.</p>
      </div>

      <div className="game__board stack stack--tight">
        <p className="eyebrow">재료</p>
        <div className="chip-row">
          {tray.map((ing) => (
            <button
              key={ing.id}
              type="button"
              className="chip"
              disabled={stack.includes(ing.id) || solved}
              onClick={() => put(ing.id)}
            >
              {ing.label}
            </button>
          ))}
        </div>
      </div>

      <div className="game__board stack stack--tight">
        <p className="eyebrow">쌓은 모양 (위 → 아래)</p>
        {stack.length === 0 ? (
          <p className="faint">아직 아무것도 쌓지 않았어요.</p>
        ) : (
          <ul className="plain-list burger-stack">
            {[...stack].reverse().map((id, i) => (
              <li key={`${id}-${i}`} className="burger-layer">
                {INGREDIENTS.find((ing) => ing.id === id)?.label}
              </li>
            ))}
          </ul>
        )}
        {stack.length > 0 && !solved && (
          <button type="button" className="btn btn--utility" onClick={pop}>
            맨 위 빼기
          </button>
        )}
      </div>

      {checked === 'right' && <p className="notice notice--ok">순서가 맞습니다!</p>}
      {checked === 'wrong' && (
        <>
          <p className="notice notice--error">순서가 다릅니다. 다시 해 보세요.</p>
          <button type="button" className="btn btn--utility" onClick={clear}>
            다시 쌓기
          </button>
        </>
      )}

      {solved && (
        <ReflectionForm
          question={QUESTION}
          hint="두세 문장이면 충분해요."
          onSubmit={(note) =>
            onSubmit(
              buildPayload(startedAt, {
                solved: true,
                attempts,
                result: { order: stack },
                note,
              }),
            )
          }
        />
      )}
    </section>
  )
}
```

- [ ] **Step 4: 레지스트리에 등록**

`src/activities/index.ts` 를 이렇게 바꾼다.

```ts
import QuizActivity from './quiz/QuizActivity'
import BurgerActivity from './burger/BurgerActivity'
import type { Activity } from './types'

export type { Activity, ActivityProps } from './types'

export const activities: Activity[] = [
  { id: 'quiz', title: '퀴즈 · 빈칸 채우기', Component: QuizActivity },
  { id: 'burger', title: '햄버거 만들기', Component: BurgerActivity },
]

export function findActivity(id: string): Activity | undefined {
  return activities.find((activity) => activity.id === id)
}
```

- [ ] **Step 5: 스타일 추가**

`src/index.css` 의 미니게임 공통 블록 뒤에 넣는다.

```css
.burger-stack {
  display: flex;
  flex-direction: column;
  gap: var(--s-xxs);
}

.burger-layer {
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  padding: 10px var(--s-md);
  font-size: 15px;
  text-align: center;
}
```

- [ ] **Step 6: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 전체 PASS, 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "햄버거 만들기 활동 추가"
```

---

### Task 4: 강 건너기 — 규칙

**Files:**
- Create: `src/activities/river/rules.ts`
- Test: `src/activities/river/rules.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Item = 'wolf' | 'goat' | 'cabbage'`, `type Side = 'left' | 'right'`
  - `type RiverState = { farmer: Side; positions: Record<Item, Side> }`
  - `INITIAL: RiverState`, `ITEM_LABEL: Record<Item, string>`
  - `move(state: RiverState, carried: Item | null): RiverState`
  - `violation(state: RiverState): Item | null`
  - `violationMessage(item: Item): string`
  - `isSolved(state: RiverState): boolean`
  - `canCarry(state: RiverState, item: Item): boolean`
  - `moveLabel(carried: Item | null, from: Side): string`
  - `SOLUTION: (Item | null)[]` — 7수 정답 경로

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/river/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  INITIAL, move, violation, violationMessage, isSolved, canCarry, moveLabel, SOLUTION,
  type RiverState,
} from './rules'

describe('move', () => {
  it('농부를 반대편으로 옮긴다', () => {
    expect(move(INITIAL, null).farmer).toBe('right')
  })

  it('태운 물건도 함께 옮긴다', () => {
    const next = move(INITIAL, 'goat')
    expect(next.positions.goat).toBe('right')
    expect(next.positions.wolf).toBe('left')
  })

  it('원본 상태를 바꾸지 않는다', () => {
    move(INITIAL, 'goat')
    expect(INITIAL.farmer).toBe('left')
    expect(INITIAL.positions.goat).toBe('left')
  })
})

describe('canCarry', () => {
  it('농부와 같은 편에 있어야 태울 수 있다', () => {
    expect(canCarry(INITIAL, 'goat')).toBe(true)
  })

  it('농부와 다른 편이면 태울 수 없다', () => {
    const after = move(INITIAL, 'goat')
    expect(canCarry(after, 'wolf')).toBe(false)
  })
})

describe('violation', () => {
  it('농부가 없는 쪽에 늑대와 양이 있으면 양이 잡아먹힌다', () => {
    // 농부가 양배추만 데리고 건너가 늑대와 양을 남긴다.
    const state = move(INITIAL, 'cabbage')
    expect(violation(state)).toBe('goat')
  })

  it('농부가 없는 쪽에 양과 양배추가 있으면 양배추가 먹힌다', () => {
    const state = move(INITIAL, 'wolf')
    expect(violation(state)).toBe('cabbage')
  })

  it('늑대와 양배추만 남는 것은 괜찮다', () => {
    const state = move(INITIAL, 'goat')
    expect(violation(state)).toBeNull()
  })

  it('농부가 같이 있으면 아무 일도 없다', () => {
    expect(violation(INITIAL)).toBeNull()
  })
})

describe('violationMessage', () => {
  it('무엇이 왜 사라지는지 알려준다', () => {
    expect(violationMessage('goat')).toContain('늑대')
    expect(violationMessage('cabbage')).toContain('양')
  })
})

describe('isSolved', () => {
  it('처음에는 아니다', () => {
    expect(isSolved(INITIAL)).toBe(false)
  })

  it('농부와 셋이 모두 건너편에 있으면 끝이다', () => {
    const done: RiverState = {
      farmer: 'right',
      positions: { wolf: 'right', goat: 'right', cabbage: 'right' },
    }
    expect(isSolved(done)).toBe(true)
  })
})

describe('moveLabel', () => {
  it('태운 것과 방향을 적는다', () => {
    expect(moveLabel('goat', 'left')).toBe('양:건너감')
    expect(moveLabel('goat', 'right')).toBe('양:돌아옴')
  })

  it('아무것도 안 태우면 혼자라고 적는다', () => {
    expect(moveLabel(null, 'right')).toBe('혼자:돌아옴')
  })
})

describe('SOLUTION', () => {
  it('7수다', () => {
    expect(SOLUTION).toHaveLength(7)
  })

  it('규칙을 한 번도 어기지 않고 문제를 푼다', () => {
    let state = INITIAL
    for (const carried of SOLUTION) {
      state = move(state, carried)
      expect(violation(state)).toBeNull()
    }
    expect(isSolved(state)).toBe(true)
  })

  it('정답 경로를 라벨로 적으면 설계 문서와 같다', () => {
    let state = INITIAL
    const labels: string[] = []
    for (const carried of SOLUTION) {
      labels.push(moveLabel(carried, state.farmer))
      state = move(state, carried)
    }
    expect(labels).toEqual([
      '양:건너감', '혼자:돌아옴', '늑대:건너감', '양:돌아옴',
      '양배추:건너감', '혼자:돌아옴', '양:건너감',
    ])
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- river`
Expected: FAIL — `./rules` 모듈이 없다

- [ ] **Step 3: `src/activities/river/rules.ts` 구현**

```ts
export type Item = 'wolf' | 'goat' | 'cabbage'
export type Side = 'left' | 'right'

export type RiverState = {
  farmer: Side
  positions: Record<Item, Side>
}

export const ITEM_LABEL: Record<Item, string> = {
  wolf: '늑대',
  goat: '양',
  cabbage: '양배추',
}

export const INITIAL: RiverState = {
  farmer: 'left',
  positions: { wolf: 'left', goat: 'left', cabbage: 'left' },
}

const other = (side: Side): Side => (side === 'left' ? 'right' : 'left')

export function canCarry(state: RiverState, item: Item): boolean {
  return state.positions[item] === state.farmer
}

export function move(state: RiverState, carried: Item | null): RiverState {
  const to = other(state.farmer)
  return {
    farmer: to,
    positions: carried
      ? { ...state.positions, [carried]: to }
      : { ...state.positions },
  }
}

/** 농부가 없는 쪽에서 사라지는 물건. 없으면 null. */
export function violation(state: RiverState): Item | null {
  const away = other(state.farmer)
  const at = (item: Item) => state.positions[item] === away
  if (at('wolf') && at('goat')) return 'goat'
  if (at('goat') && at('cabbage')) return 'cabbage'
  return null
}

export function violationMessage(item: Item): string {
  return item === 'goat'
    ? '농부가 없으면 늑대가 양을 잡아먹습니다.'
    : '농부가 없으면 양이 양배추를 먹습니다.'
}

export function isSolved(state: RiverState): boolean {
  return (
    state.farmer === 'right' &&
    (['wolf', 'goat', 'cabbage'] as Item[]).every(
      (item) => state.positions[item] === 'right',
    )
  )
}

export function moveLabel(carried: Item | null, from: Side): string {
  const what = carried ? ITEM_LABEL[carried] : '혼자'
  return `${what}:${from === 'left' ? '건너감' : '돌아옴'}`
}

/** 최소 해. 테스트가 이 경로로 규칙 전체를 훑는다. */
export const SOLUTION: (Item | null)[] = [
  'goat', null, 'wolf', 'goat', 'cabbage', null, 'goat',
]
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- river`
Expected: PASS (16개)

- [ ] **Step 5: 커밋**

```bash
git add src/activities/river
git commit -m "강 건너기 규칙 추가"
```

---

### Task 5: 강 건너기 — 화면

**Files:**
- Create: `src/activities/river/RiverActivity.tsx`
- Test: `src/activities/river/RiverActivity.test.tsx`
- Modify: `src/activities/index.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Task 4 의 모든 export, `buildPayload`·`ReflectionForm` (Task 1), `ActivityProps`
- Produces: `RiverActivity` 기본 export. 레지스트리 id `river`, 제목 `강 건너기`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/river/RiverActivity.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RiverActivity from './RiverActivity'

type User = ReturnType<typeof userEvent.setup>

async function cross(user: User, label: string | null) {
  if (label) await user.click(screen.getByRole('button', { name: label }))
  await user.click(screen.getByRole('button', { name: '건너가기' }))
}

/** 7수 정답을 그대로 밟는다. */
async function solve(user: User) {
  for (const label of ['양', null, '늑대', '양', '양배추', null, '양']) {
    await cross(user, label)
  }
}

describe('RiverActivity', () => {
  it('처음에는 셋 다 이쪽 편에 있다', () => {
    render(<RiverActivity onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: '늑대' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '양' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '양배추' })).toBeEnabled()
  })

  it('규칙을 어기면 되돌리고 이유를 알려준다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)

    // 양배추를 데려가면 늑대와 양이 남는다.
    await cross(user, '양배추')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '농부가 없으면 늑대가 양을 잡아먹습니다.',
    )
    // 되돌아왔으므로 양배추를 다시 고를 수 있다.
    expect(screen.getByRole('button', { name: '양배추' })).toBeEnabled()
  })

  it('풀기 전에는 설명 폼이 없다', () => {
    render(<RiverActivity onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '제출하기' })).not.toBeInTheDocument()
  })

  it('다 건너면 성공을 알리고 설명 폼이 나온다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)

    await solve(user)

    expect(await screen.findByText('모두 무사히 건넜습니다!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제출하기' })).toBeInTheDocument()
  })

  it('제출하면 이동 기록과 어긴 횟수를 담아 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={onSubmit} />)

    await cross(user, '양배추') // 일부러 한 번 어긴다
    await solve(user)
    await user.type(screen.getByLabelText(/꼭 기억해야 하는 규칙/), '양을 혼자 두면 안 돼요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    const payload = onSubmit.mock.calls[0][0]
    expect(payload.solved).toBe(true)
    expect(payload.result.violations).toBe(1)
    expect(payload.result.moves).toEqual([
      '양:건너감', '혼자:돌아옴', '늑대:건너감', '양:돌아옴',
      '양배추:건너감', '혼자:돌아옴', '양:건너감',
    ])
  })

  it('처음부터 다시 하면 기록이 지워진다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)

    await cross(user, '양')
    await user.click(screen.getByRole('button', { name: '처음부터' }))

    expect(screen.getByRole('button', { name: '양' })).toBeEnabled()
    expect(screen.getByText('아직 아무도 건너지 않았어요.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- RiverActivity`
Expected: FAIL — `./RiverActivity` 모듈이 없다

- [ ] **Step 3: `src/activities/river/RiverActivity.tsx` 구현**

```tsx
import { useState } from 'react'
import type { ActivityProps } from '../types'
import { buildPayload } from '../shared/payload'
import ReflectionForm from '../shared/ReflectionForm'
import {
  INITIAL, ITEM_LABEL, canCarry, isSolved, move, moveLabel, violation,
  violationMessage, type Item, type RiverState,
} from './rules'

const ITEMS: Item[] = ['wolf', 'goat', 'cabbage']
const QUESTION = '이 문제를 풀 때 꼭 기억해야 하는 규칙은 무엇이었나요?'

export default function RiverActivity({ onSubmit }: ActivityProps) {
  const [startedAt] = useState(() => Date.now())
  const [state, setState] = useState<RiverState>(INITIAL)
  const [carried, setCarried] = useState<Item | null>(null)
  const [moves, setMoves] = useState<string[]>([])
  const [violations, setViolations] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  const solved = isSolved(state)

  function go() {
    const next = move(state, carried)
    const bad = violation(next)
    if (bad) {
      // 되돌린다. 벌점 대신 이유를 알려준다.
      setViolations((n) => n + 1)
      setMessage(violationMessage(bad))
      setCarried(null)
      return
    }
    setMoves((prev) => [...prev, moveLabel(carried, state.farmer)])
    setState(next)
    setCarried(null)
    setMessage(null)
  }

  function reset() {
    setState(INITIAL)
    setCarried(null)
    setMoves([])
    setMessage(null)
  }

  return (
    <section className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">활동</p>
        <h2>강 건너기</h2>
        <p className="muted">
          농부가 늑대·양·양배추를 건너편으로 옮깁니다. 배에는 하나만 태울 수 있어요.
        </p>
      </div>

      <div className="game__board river">
        {(['left', 'right'] as const).map((side) => (
          <div key={side} className="river__bank">
            <p className="eyebrow">{side === 'left' ? '이쪽 편' : '건너편'}</p>
            <div className="chip-row">
              {state.farmer === side && <span className="chip chip--static">농부</span>}
              {ITEMS.filter((item) => state.positions[item] === side).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chip"
                  aria-pressed={carried === item}
                  disabled={!canCarry(state, item) || solved}
                  onClick={() => setCarried(carried === item ? null : item)}
                >
                  {ITEM_LABEL[item]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {message && <p className="notice notice--error" role="alert">{message}</p>}

      {!solved && (
        <div className="chip-row">
          <button type="button" className="btn btn--primary" onClick={go}>건너가기</button>
          <button type="button" className="btn btn--utility" onClick={reset}>처음부터</button>
        </div>
      )}

      <div className="game__board stack stack--tight">
        <p className="eyebrow">지나온 길</p>
        {moves.length === 0 ? (
          <p className="faint">아직 아무도 건너지 않았어요.</p>
        ) : (
          <p className="game__status">{moves.join(' · ')}</p>
        )}
      </div>

      {solved && <p className="notice notice--ok">모두 무사히 건넜습니다!</p>}

      {solved && (
        <ReflectionForm
          question={QUESTION}
          hint="규칙을 어겼을 때 무엇이 사라졌는지 떠올려 보세요."
          onSubmit={(note) =>
            onSubmit(
              buildPayload(startedAt, {
                solved: true,
                attempts: violations + 1,
                result: { moves, violations },
                note,
              }),
            )
          }
        />
      )}
    </section>
  )
}
```

- [ ] **Step 4: 레지스트리에 등록**

`src/activities/index.ts` 에 `import RiverActivity from './river/RiverActivity'` 를 더하고 배열에 한 줄 추가한다.

```ts
  { id: 'river', title: '강 건너기', Component: RiverActivity },
```

- [ ] **Step 5: 스타일 추가**

```css
.river {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-lg);
}

.river__bank {
  display: flex;
  flex-direction: column;
  gap: var(--s-xs);
  min-height: 96px;
}

.chip--static {
  background: var(--canvas-soft);
  color: var(--ink-muted);
  cursor: default;
}

@media (max-width: 600px) {
  .river {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 전체 PASS, 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "강 건너기 활동 추가"
```

---

### Task 6: 틱택토 — 규칙

**Files:**
- Create: `src/activities/tictactoe/rules.ts`
- Test: `src/activities/tictactoe/rules.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Mark = 'O' | 'X'`, `type Cell = Mark | null`, `type Board = Cell[]`
  - `EMPTY_BOARD: Board`, `LINES: number[][]`, `BLUNDER_CHANCE = 0.35`
  - `winner(board: Board): Mark | null`
  - `isFull(board: Board): boolean`
  - `winningMove(board: Board, mark: Mark): number | null`
  - `chooseComputerMove(board: Board, rng: () => number): number`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/tictactoe/rules.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  EMPTY_BOARD, LINES, winner, isFull, winningMove, chooseComputerMove, type Board,
} from './rules'

/** '.' 은 빈 칸. 'OX.......' 처럼 아홉 글자로 판을 적는다. */
function board(text: string): Board {
  return [...text].map((c) => (c === '.' ? null : (c as 'O' | 'X')))
}

/** 정해진 값을 순서대로 돌려주는 난수원. 다 쓰면 마지막 값을 반복한다. */
function fakeRng(...values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

describe('LINES', () => {
  it('이길 수 있는 줄이 8개다', () => {
    expect(LINES).toHaveLength(8)
  })
})

describe('winner', () => {
  it('빈 판에는 승자가 없다', () => {
    expect(winner(EMPTY_BOARD)).toBeNull()
  })

  it('가로줄을 잡아낸다', () => {
    expect(winner(board('OOO..X.X.'))).toBe('O')
  })

  it('세로줄을 잡아낸다', () => {
    expect(winner(board('X.OX.OX..'))).toBe('X')
  })

  it('대각선을 잡아낸다', () => {
    expect(winner(board('O..XO..XO'))).toBe('O')
    expect(winner(board('..X.X.X..'))).toBe('X')
  })

  it('여덟 줄을 모두 알아본다', () => {
    for (const line of LINES) {
      const b: Board = Array(9).fill(null)
      for (const i of line) b[i] = 'O'
      expect(winner(b)).toBe('O')
    }
  })
})

describe('isFull', () => {
  it('빈 칸이 남아 있으면 아니다', () => {
    expect(isFull(board('OXOXOXOX.'))).toBe(false)
  })

  it('아홉 칸이 다 차면 맞다', () => {
    expect(isFull(board('OXOXOXOXO'))).toBe(true)
  })
})

describe('winningMove', () => {
  it('한 수로 이길 자리를 찾는다', () => {
    expect(winningMove(board('XX.......'), 'X')).toBe(2)
  })

  it('막을 자리도 같은 함수로 찾는다', () => {
    expect(winningMove(board('OO.......'), 'O')).toBe(2)
  })

  it('그런 자리가 없으면 null', () => {
    expect(winningMove(board('X.O......'), 'X')).toBeNull()
  })

  it('이미 찬 칸은 고르지 않는다', () => {
    expect(winningMove(board('XXO......'), 'X')).toBeNull()
  })
})

describe('chooseComputerMove', () => {
  it('실수하지 않을 때는 이길 자리를 고른다', () => {
    // 첫 난수는 실수 판정용. 0.9 는 실수 확률(0.35)보다 크므로 실수하지 않는다.
    expect(chooseComputerMove(board('XX.OO....'), fakeRng(0.9))).toBe(2)
  })

  it('이길 수 없으면 학생이 이길 자리를 막는다', () => {
    expect(chooseComputerMove(board('OO.X.....'), fakeRng(0.9))).toBe(2)
  })

  it('이길 자리를 막을 자리보다 먼저 고른다', () => {
    // X 는 0,1 로 2에서 이길 수 있고 O 는 3,4 로 5에서 이길 수 있다.
    expect(chooseComputerMove(board('XX.OO....'), fakeRng(0.9))).toBe(2)
  })

  it('실수할 때는 막지 않고 아무 데나 둔다', () => {
    // 첫 난수 0.1 < 0.35 이므로 실수한다. 두 번째 난수로 빈 칸을 고른다.
    // 빈 칸은 [2,4,5,6,7,8]. 0.99 를 주면 마지막인 8 을 고르므로 2 를 막지 않는다.
    const move = chooseComputerMove(board('OO.X.....'), fakeRng(0.1, 0.99))
    expect(move).not.toBe(2)
  })

  it('언제나 빈 칸을 고른다', () => {
    const b = board('OXOXOX...')
    for (const r of [0, 0.2, 0.5, 0.99]) {
      expect(b[chooseComputerMove(b, fakeRng(r, r))]).toBeNull()
    }
  })

  it('둘 곳이 없으면 -1 을 준다', () => {
    expect(chooseComputerMove(board('OXOXOXOXO'), fakeRng(0.9))).toBe(-1)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- tictactoe`
Expected: FAIL — `./rules` 모듈이 없다

- [ ] **Step 3: `src/activities/tictactoe/rules.ts` 구현**

```ts
export type Mark = 'O' | 'X'
export type Cell = Mark | null
export type Board = Cell[]

export const EMPTY_BOARD: Board = Array(9).fill(null)

export const LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

/**
 * 컴퓨터가 최선을 놓칠 확률. 완벽한 틱택토는 절대 지지 않아
 * 학생이 이길 기회가 없다. 수업 반응을 보고 조절한다.
 */
export const BLUNDER_CHANCE = 0.35

export function winner(board: Board): Mark | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

export function isFull(board: Board): boolean {
  return board.every((cell) => cell !== null)
}

/** mark 가 한 수로 이길 수 있는 자리. 없으면 null. */
export function winningMove(board: Board, mark: Mark): number | null {
  for (let i = 0; i < board.length; i++) {
    if (board[i]) continue
    const trial = [...board]
    trial[i] = mark
    if (winner(trial) === mark) return i
  }
  return null
}

/** 컴퓨터(X)의 다음 수. 둘 곳이 없으면 -1. */
export function chooseComputerMove(board: Board, rng: () => number): number {
  const empties = board
    .map((cell, i) => (cell === null ? i : -1))
    .filter((i) => i >= 0)
  if (empties.length === 0) return -1

  // 일부러 최선을 놓치는 경우. 이것이 학생이 이길 수 있는 빈틈이다.
  if (rng() >= BLUNDER_CHANCE) {
    const win = winningMove(board, 'X')
    if (win !== null) return win
    const block = winningMove(board, 'O')
    if (block !== null) return block
  }

  return empties[Math.min(empties.length - 1, Math.floor(rng() * empties.length))]
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- tictactoe`
Expected: PASS (17개)

- [ ] **Step 5: 커밋**

```bash
git add src/activities/tictactoe
git commit -m "틱택토 규칙과 컴퓨터 수 고르기 추가"
```

---

### Task 7: 틱택토 — 화면

**Files:**
- Create: `src/activities/tictactoe/TicTacToeActivity.tsx`
- Test: `src/activities/tictactoe/TicTacToeActivity.test.tsx`
- Modify: `src/activities/index.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: Task 6 의 export, `buildPayload`·`ReflectionForm` (Task 1), `ActivityProps`
- Produces: `TicTacToeActivity` 기본 export. 레지스트리 id `tictactoe`, 제목 `틱택토`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/tictactoe/TicTacToeActivity.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TicTacToeActivity from './TicTacToeActivity'

describe('TicTacToeActivity', () => {
  it('빈 칸 9개를 보여준다', () => {
    render(<TicTacToeActivity onSubmit={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: '빈 칸' })).toHaveLength(9)
  })

  it('칸을 누르면 O 가 놓이고 컴퓨터도 한 수 둔다', async () => {
    const user = userEvent.setup()
    render(<TicTacToeActivity onSubmit={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: '빈 칸' })[0])

    expect(screen.getAllByRole('button', { name: 'O' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'X' })).toHaveLength(1)
  })

  it('이미 놓인 칸은 다시 누를 수 없다', async () => {
    const user = userEvent.setup()
    render(<TicTacToeActivity onSubmit={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: '빈 칸' })[0])

    expect(screen.getByRole('button', { name: 'O' })).toBeDisabled()
  })

  it('전적을 처음에 0으로 보여준다', () => {
    render(<TicTacToeActivity onSubmit={vi.fn()} />)
    expect(screen.getByText('0승 0무 0패')).toBeInTheDocument()
  })

  it('설명을 쓰면 언제든 제출할 수 있다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TicTacToeActivity onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/이기는 방법/), '가운데를 먼저 잡아요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    const payload = onSubmit.mock.calls[0][0]
    expect(payload.note).toBe('가운데를 먼저 잡아요')
    expect(payload.result.wins).toBe(0)
    expect(payload.solved).toBe(false)
  })

  it('다시 하기를 누르면 판이 비워진다', async () => {
    const user = userEvent.setup()
    render(<TicTacToeActivity onSubmit={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: '빈 칸' })[0])
    await user.click(screen.getByRole('button', { name: '다시 하기' }))

    expect(screen.getAllByRole('button', { name: '빈 칸' })).toHaveLength(9)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- TicTacToeActivity`
Expected: FAIL — `./TicTacToeActivity` 모듈이 없다

- [ ] **Step 3: `src/activities/tictactoe/TicTacToeActivity.tsx` 구현**

```tsx
import { useState } from 'react'
import type { ActivityProps } from '../types'
import { buildPayload } from '../shared/payload'
import ReflectionForm from '../shared/ReflectionForm'
import {
  EMPTY_BOARD, chooseComputerMove, isFull, winner, type Board,
} from './rules'

const QUESTION = '이기는 방법을 찾았나요? 규칙으로 말해 보세요.'

type Tally = { wins: number; draws: number; losses: number }

export default function TicTacToeActivity({ onSubmit }: ActivityProps) {
  const [startedAt] = useState(() => Date.now())
  const [board, setBoard] = useState<Board>(EMPTY_BOARD)
  const [tally, setTally] = useState<Tally>({ wins: 0, draws: 0, losses: 0 })

  const won = winner(board)
  const over = won !== null || isFull(board)

  /**
   * 판이 끝나는 그 수에서만 불린다. play() 가 이미 끝난 판에서는 곧장
   * 돌아가므로 한 판이 두 번 세어지지 않는다.
   */
  function record(next: Board) {
    const w = winner(next)
    if (w === 'O') setTally((t) => ({ ...t, wins: t.wins + 1 }))
    else if (w === 'X') setTally((t) => ({ ...t, losses: t.losses + 1 }))
    else if (isFull(next)) setTally((t) => ({ ...t, draws: t.draws + 1 }))
  }

  function play(index: number) {
    if (board[index] || over) return

    const afterStudent = [...board]
    afterStudent[index] = 'O'
    if (winner(afterStudent) || isFull(afterStudent)) {
      setBoard(afterStudent)
      record(afterStudent)
      return
    }

    const reply = chooseComputerMove(afterStudent, Math.random)
    const afterComputer = [...afterStudent]
    if (reply >= 0) afterComputer[reply] = 'X'
    setBoard(afterComputer)
    record(afterComputer)
  }

  function again() {
    setBoard(EMPTY_BOARD)
  }

  const games = tally.wins + tally.draws + tally.losses

  return (
    <section className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">활동</p>
        <h2>틱택토</h2>
        <p className="muted">
          O 로 먼저 두세요. 여러 판 두면서 이기는 규칙을 찾아보세요.
        </p>
      </div>

      <div className="game__board stack stack--tight">
        <p className="game__status">
          {tally.wins}승 {tally.draws}무 {tally.losses}패
        </p>

        <div className="ttt">
          {board.map((cell, i) => (
            <button
              key={i}
              type="button"
              className="ttt__cell"
              aria-label={cell ?? '빈 칸'}
              disabled={cell !== null || over}
              onClick={() => play(i)}
            >
              {cell}
            </button>
          ))}
        </div>

        {over && (
          <p className="game__status">
            {won === 'O' ? '이겼습니다!' : won === 'X' ? '졌습니다.' : '비겼습니다.'}
          </p>
        )}

        <button type="button" className="btn btn--utility" onClick={again}>
          다시 하기
        </button>
      </div>

      <ReflectionForm
        question={QUESTION}
        hint="아직 못 이겼어도 괜찮아요. 무엇을 알아냈는지 적어 보세요."
        onSubmit={(note) =>
          onSubmit(
            buildPayload(startedAt, {
              solved: tally.wins > 0,
              attempts: games,
              result: { ...tally, lastBoard: board },
              note,
            }),
          )
        }
      />
    </section>
  )
}
```

- [ ] **Step 4: 레지스트리에 등록**

`src/activities/index.ts` 에 `import TicTacToeActivity from './tictactoe/TicTacToeActivity'` 를 더하고 배열에 한 줄 추가한다.

```ts
  { id: 'tictactoe', title: '틱택토', Component: TicTacToeActivity },
```

- [ ] **Step 5: 스타일 추가**

```css
.ttt {
  display: grid;
  grid-template-columns: repeat(3, 72px);
  gap: var(--s-xxs);
}

.ttt__cell {
  width: 72px;
  height: 72px;
  font-family: inherit;
  font-size: 30px;
  font-weight: 700;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--hairline);
  border-radius: var(--r-md);
  cursor: pointer;
}

.ttt__cell:disabled {
  cursor: default;
}
```

- [ ] **Step 6: 테스트와 빌드 확인**

Run: `npm test && npm run build`
Expected: 전체 PASS, 빌드 성공

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "틱택토 활동 추가"
```

---

### Task 8: 교사 화면에서 제출물 펼쳐 보기

**Files:**
- Modify: `src/routes/TeacherDashboard.tsx`
- Modify: `src/routes/TeacherDashboard.test.tsx`
- Create: `src/routes/submissionSummary.ts`
- Test: `src/routes/submissionSummary.test.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `findActivity` (`src/activities/index.ts`), `SubmissionRow` (`src/lib/submission.ts`)
- Produces:
  - `summarize(payload: unknown): string` — 퀴즈면 `'2 / 3'`, 미니게임이면 `'성공'`/`'미완'`, 알 수 없으면 `'—'`
  - `noteOf(payload: unknown): string | null`
  - `detailsOf(payload: unknown): string | null` — 시도 횟수·걸린 시간을 사람이 읽는 문장으로

- [ ] **Step 1: 요약 함수 테스트 작성**

`src/routes/submissionSummary.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { summarize, noteOf, detailsOf } from './submissionSummary'

describe('summarize', () => {
  it('퀴즈는 점수로 보여준다', () => {
    expect(summarize({ score: 2, total: 3 })).toBe('2 / 3')
  })

  it('미니게임은 성공 여부로 보여준다', () => {
    expect(summarize({ solved: true, attempts: 1 })).toBe('성공')
    expect(summarize({ solved: false, attempts: 4 })).toBe('미완')
  })

  it('점수가 있으면 점수를 먼저 쓴다', () => {
    expect(summarize({ score: 1, total: 3, solved: false })).toBe('1 / 3')
  })

  it('알 수 없는 모양은 줄표', () => {
    expect(summarize(null)).toBe('—')
    expect(summarize({})).toBe('—')
    expect(summarize('이상한 값')).toBe('—')
  })
})

describe('noteOf', () => {
  it('학생이 쓴 설명을 꺼낸다', () => {
    expect(noteOf({ note: '빵이 먼저예요' })).toBe('빵이 먼저예요')
  })

  it('설명이 없으면 null', () => {
    expect(noteOf({ score: 1 })).toBeNull()
    expect(noteOf({ note: '   ' })).toBeNull()
    expect(noteOf(null)).toBeNull()
  })
})

describe('detailsOf', () => {
  it('시도 횟수와 걸린 시간을 문장으로 만든다', () => {
    expect(detailsOf({ attempts: 3, elapsedMs: 90_000 })).toBe('3번 시도 · 1분 30초')
  })

  it('1분이 안 되면 초만 쓴다', () => {
    expect(detailsOf({ attempts: 1, elapsedMs: 45_000 })).toBe('1번 시도 · 45초')
  })

  it('미니게임이 아니면 null', () => {
    expect(detailsOf({ score: 2, total: 3 })).toBeNull()
    expect(detailsOf(null)).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- submissionSummary`
Expected: FAIL — `./submissionSummary` 모듈이 없다

- [ ] **Step 3: `src/routes/submissionSummary.ts` 구현**

```ts
type Bag = Record<string, unknown>

function asBag(payload: unknown): Bag | null {
  return payload && typeof payload === 'object' ? (payload as Bag) : null
}

export function summarize(payload: unknown): string {
  const p = asBag(payload)
  if (!p) return '—'
  if (typeof p.score === 'number' && typeof p.total === 'number') {
    return `${p.score} / ${p.total}`
  }
  if (typeof p.solved === 'boolean') return p.solved ? '성공' : '미완'
  return '—'
}

export function noteOf(payload: unknown): string | null {
  const p = asBag(payload)
  if (!p || typeof p.note !== 'string') return null
  const trimmed = p.note.trim()
  return trimmed === '' ? null : trimmed
}

export function detailsOf(payload: unknown): string | null {
  const p = asBag(payload)
  if (!p || typeof p.attempts !== 'number' || typeof p.elapsedMs !== 'number') {
    return null
  }
  const seconds = Math.round(p.elapsedMs / 1000)
  const time = seconds < 60
    ? `${seconds}초`
    : `${Math.floor(seconds / 60)}분 ${seconds % 60}초`
  return `${p.attempts}번 시도 · ${time}`
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- submissionSummary`
Expected: PASS (10개)

- [ ] **Step 5: 대시보드 테스트 추가**

`src/routes/TeacherDashboard.test.tsx` 의 파일 맨 위 `vi.mock('../lib/submission', ...)` 아래에 활동 레지스트리 모의를 더한다.

```ts
vi.mock('../activities', () => ({
  findActivity: (id: string) =>
    id === 'burger' ? { id: 'burger', title: '햄버거 만들기' } : undefined,
}))
```

그리고 파일 끝에 이 블록을 더한다.

```tsx
describe('TeacherDashboard 제출물 펼쳐 보기', () => {
  const submission = {
    id: 'sub1', activityId: 'burger',
    payload: { solved: true, attempts: 2, elapsedMs: 90_000, note: '빵이 먼저예요' },
    createdAt: '2026-07-31T01:00:00Z', studentName: '김하늘', studentNumber: 7,
  }

  it('활동 id 대신 활동 이름을 보여준다', async () => {
    listSubmissions.mockResolvedValue([submission])
    render(<TeacherDashboard />)
    expect(await screen.findByText('햄버거 만들기')).toBeInTheDocument()
  })

  it('미니게임은 점수 대신 성공 여부를 보여준다', async () => {
    listSubmissions.mockResolvedValue([submission])
    render(<TeacherDashboard />)
    expect(await screen.findByText('성공')).toBeInTheDocument()
  })

  it('펼치기 전에는 학생이 쓴 설명이 안 보인다', async () => {
    listSubmissions.mockResolvedValue([submission])
    render(<TeacherDashboard />)
    await screen.findByText('햄버거 만들기')
    expect(screen.queryByText('빵이 먼저예요')).not.toBeInTheDocument()
  })

  it('줄을 누르면 설명과 기록이 펼쳐진다', async () => {
    listSubmissions.mockResolvedValue([submission])
    const user = userEvent.setup()
    render(<TeacherDashboard />)

    await user.click(await screen.findByRole('button', { name: /7번 김하늘/ }))

    expect(screen.getByText('빵이 먼저예요')).toBeInTheDocument()
    expect(screen.getByText('2번 시도 · 1분 30초')).toBeInTheDocument()
  })

  it('다시 누르면 접힌다', async () => {
    listSubmissions.mockResolvedValue([submission])
    const user = userEvent.setup()
    render(<TeacherDashboard />)

    const row = await screen.findByRole('button', { name: /7번 김하늘/ })
    await user.click(row)
    await user.click(row)

    expect(screen.queryByText('빵이 먼저예요')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 6: 테스트가 실패하는지 확인**

Run: `npm test -- TeacherDashboard`
Expected: FAIL — 활동 이름과 펼치기가 없다

- [ ] **Step 7: 대시보드 제출물 표 교체**

`src/routes/TeacherDashboard.tsx` 에서 `scoreOf` 함수를 지우고 아래 import 를 더한다.

```tsx
import { findActivity } from '../activities'
import { summarize, noteOf, detailsOf } from './submissionSummary'
```

컴포넌트 안에 펼침 상태를 더한다.

```tsx
const [opened, setOpened] = useState<string | null>(null)
```

제출물 `<tbody>` 를 이렇게 바꾼다.

```tsx
<tbody>
  {submissions.map((row) => {
    const note = noteOf(row.payload)
    const details = detailsOf(row.payload)
    const isOpen = opened === row.id
    return (
      <Fragment key={row.id}>
        <tr>
          <td>
            <button type="button" className="btn btn--quiet"
              aria-expanded={isOpen}
              onClick={() => setOpened(isOpen ? null : row.id)}>
              {row.studentNumber}번 {row.studentName}
            </button>
          </td>
          <td>{findActivity(row.activityId)?.title ?? row.activityId}</td>
          <td>{summarize(row.payload)}</td>
          <td className="faint">{new Date(row.createdAt).toLocaleString('ko-KR')}</td>
        </tr>
        {isOpen && (
          <tr>
            <td colSpan={4} className="submission-detail">
              {note ? <p>{note}</p> : <p className="faint">쓴 설명이 없습니다.</p>}
              {details && <p className="faint">{details}</p>}
            </td>
          </tr>
        )}
      </Fragment>
    )
  })}
</tbody>
```

`Fragment` 를 react 에서 가져온다: `import { Fragment, useEffect, useState, type FormEvent } from 'react'`

- [ ] **Step 8: 스타일 추가**

```css
.submission-detail {
  background: var(--canvas-soft);
  white-space: pre-wrap;
}
```

- [ ] **Step 9: 테스트와 빌드 확인**

Run: `npm test && npm run build && npm run lint`
Expected: 전체 PASS, 빌드 성공, 린트 경고 0

- [ ] **Step 10: 커밋**

```bash
git add -A
git commit -m "교사 화면에서 제출물을 펼쳐 학생 설명을 읽을 수 있게 함"
```

---

## 통합 검증

자동 테스트가 끝난 뒤 사람이(또는 CDP 스크립트로) 실제로 밟는다. 1단계에서 쓴
`flow.mjs` 방식 — 폼을 실제로 채워 넣는 Chrome 원격 제어 — 을 그대로 쓴다.

- [ ] **활동 목록에 네 개가 보이는지** — 퀴즈, 햄버거 만들기, 강 건너기, 틱택토
- [ ] **햄버거** — 정답 순서로 쌓아 성공을 확인하고, 설명을 써서 제출
- [ ] **강 건너기** — 일부러 규칙을 어겨 되돌려지는지 보고, 7수로 풀어 제출
- [ ] **틱택토** — 몇 판 두고 전적이 쌓이는지 본 뒤 제출
- [ ] **제출한 활동에 도장이 찍히고 목록 맨 뒤로 가는지** — 1단계 기능이
      활동이 넷일 때도 그대로 도는지 확인한다
- [ ] **교사 화면** — 네 활동의 제출물이 활동 이름으로 보이고, 줄을 눌러
      학생이 쓴 설명이 펼쳐지는지 눈으로 확인
- [ ] **화면 캡처** — 네 활동과 교사 화면 펼친 모습

## 남는 일

- 틱택토 실수 확률 `BLUNDER_CHANCE` 는 0.35 로 두었다. 수업에서 써 보고
  조절한다. `src/activities/tictactoe/rules.ts` 의 상수 하나다.
- 활동 배정(어떤 활동을 이번 차시에 열지 고르기)은 다음 단계다. 지금은 네
  활동이 항상 모두 보인다.
- 활동 카드 색 띠는 네 가지가 돌아가며 쓰인다. 활동이 다섯 개를 넘으면
  색이 반복된다.
