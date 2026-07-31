# 3단계: 알고리즘 시각화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택정렬·버블정렬·순차탐색이 한 단계씩 도는 모습을 막대 그래프로 보여주고, 학생이 관찰한 차이를 문항으로 정리해 제출하게 한다.

**Architecture:** 세 알고리즘은 화면을 모르는 순수 함수가 `Step[]` 스냅샷을 미리 만든다. 화면은 `steps[i]` 를 그리고 `i` 를 움직일 뿐이라 되감기·단계 이동이 따라온다. 막대(`Bars`)와 재생 조작(`Player`)은 알고리즘을 모른다. 마무리 문항 화면은 강 건너기에서 쓰던 것을 `shared/` 로 옮겨 함께 쓴다.

**Tech Stack:** React 19, TypeScript 6, Vitest + Testing Library. 새 의존성 없음.

## Global Constraints

- 데이터는 `[5, 2, 8, 1, 9, 3, 7, 4]`, 탐색 목표는 `7` 로 고정한다. 학생이 바꿀 수 없다.
- 실제 횟수는 아래와 정확히 같아야 한다. 테스트가 이 숫자를 확인한다.

  | 알고리즘 | 비교 | 교환 |
  |---|---|---|
  | 선택정렬 | 28 | 5 |
  | 버블정렬 (조기 종료) | 25 | 13 |
  | 순차 탐색 | 7 | — |

- 파랑(`--primary`)은 동작 버튼에만 쓴다. 막대 색은 장식용 팔레트에서 가져온다:
  기본 `--ink-faint`, 비교 중 `--accent-orange`, 자리 잡음 `--accent-green`, 찾음 `--accent-pink`.
- 모든 `Step` 에 자막(`caption`)을 채운다. 빈 자막을 남기지 않는다.
- 세 알고리즘을 모두 끝까지 본 뒤에만 문항이 열린다.
- 테스트 파일은 대상 파일과 나란히 둔다. Vitest 전역을 쓰지 않고 각 파일에서 명시적으로 import 한다.
- 색·간격·모서리는 `src/styles/tokens.css` 의 변수만 쓴다.
- 커밋 메시지는 한국어. 본문 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `src/activities/shared/questions.ts` | 문항 타입과 채점 (river/grading.ts 에서 옮김) |
| `src/activities/shared/QuestionSet.tsx` | 문항 화면 (river/FinalQuiz.tsx 에서 옮김) |
| `src/activities/river/grading.ts` | 빈칸 로직만 남는다 |
| `src/activities/visualizer/data.ts` | `BARS`, `SEARCH_TARGET` |
| `src/activities/visualizer/steps.ts` | `Step` 타입과 세 알고리즘의 스냅샷 생성 |
| `src/activities/visualizer/content.ts` | 마무리 문항 |
| `src/activities/visualizer/Bars.tsx` | `Step` 하나를 막대로 그린다 |
| `src/activities/visualizer/Player.tsx` | 인덱스와 재생 상태만 다룬다 |
| `src/activities/visualizer/VisualizerActivity.tsx` | 셋을 잇고 제출한다 |

---

### Task 1: 문항 화면을 shared 로 옮기기

**Files:**
- Create: `src/activities/shared/questions.ts`
- Test: `src/activities/shared/questions.test.ts`
- Create: `src/activities/shared/QuestionSet.tsx`
- Delete: `src/activities/river/FinalQuiz.tsx`
- Modify: `src/activities/river/grading.ts`, `src/activities/river/grading.test.ts`
- Modify: `src/activities/river/content.ts`, `src/activities/river/RiverActivity.tsx`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type Question = { id: string; kind: 'choice'; prompt: string; choices: string[]; answerIndex: number } | { id: string; kind: 'text'; prompt: string }`
  - `type Answer = { questionId: string; value: string }`
  - `type QuizResult = { answers: Answer[]; score: number; total: number }`
  - `gradeQuestions(questions: Question[], answers: Record<string, string>): QuizResult`
  - `QuestionSet` 기본 export. props `{ questions: Question[]; eyebrow: string; title: string; onSubmit: (result: QuizResult) => void | Promise<void> }`

강 건너기 동작은 하나도 바뀌지 않는다. 기존 테스트가 그대로 통과해야 한다.

- [ ] **Step 1: `src/activities/shared/questions.ts` 작성**

`river/grading.ts` 의 `FinalQuestion`·`gradeFinal` 부분을 옮기고 이름을 일반화한다.

```ts
export type Question =
  | { id: string; kind: 'choice'; prompt: string; choices: string[]; answerIndex: number }
  | { id: string; kind: 'text'; prompt: string }

export type Answer = { questionId: string; value: string }

export type QuizResult = {
  answers: Answer[]
  /** 객관식만 센다. 서술형은 선생님이 읽는다. */
  score: number
  total: number
}

export function gradeQuestions(
  questions: Question[],
  answers: Record<string, string>,
): QuizResult {
  const filled: Answer[] = questions.map((q) => ({
    questionId: q.id,
    value: answers[q.id] ?? '',
  }))

  const choices = questions.filter((q) => q.kind === 'choice')
  const score = choices.filter(
    (q) => Number(answers[q.id]) === q.answerIndex && (answers[q.id] ?? '') !== '',
  ).length

  return { answers: filled, score, total: choices.length }
}
```

- [ ] **Step 2: `src/activities/shared/questions.test.ts` 작성**

```ts
import { describe, it, expect } from 'vitest'
import { gradeQuestions, type Question } from './questions'

const questions: Question[] = [
  { id: 'a', kind: 'choice', prompt: '고르세요', choices: ['가', '나', '다'], answerIndex: 1 },
  { id: 'b', kind: 'choice', prompt: '또 고르세요', choices: ['하나', '둘'], answerIndex: 0 },
  { id: 'c', kind: 'text', prompt: '적어 보세요' },
]

describe('gradeQuestions', () => {
  it('객관식만 채점하고 서술형은 세지 않는다', () => {
    const r = gradeQuestions(questions, { a: '1', b: '0', c: '무언가' })
    expect(r.score).toBe(2)
    expect(r.total).toBe(2)
  })

  it('오답을 세지 않는다', () => {
    const r = gradeQuestions(questions, { a: '0', b: '0', c: '무언가' })
    expect(r.score).toBe(1)
  })

  it('답을 순서대로 담아 돌려준다', () => {
    const r = gradeQuestions(questions, { a: '1', b: '0', c: '이유' })
    expect(r.answers).toEqual([
      { questionId: 'a', value: '1' },
      { questionId: 'b', value: '0' },
      { questionId: 'c', value: '이유' },
    ])
  })

  it('안 쓴 칸은 빈 문자열로 남고 점수에 들지 않는다', () => {
    const r = gradeQuestions(questions, {})
    expect(r.answers.every((a) => a.value === '')).toBe(true)
    expect(r.score).toBe(0)
  })
})
```

- [ ] **Step 3: 테스트 통과 확인**

Run: `npm test -- questions`
Expected: PASS (4개)

- [ ] **Step 4: `src/activities/shared/QuestionSet.tsx` 작성**

`river/FinalQuiz.tsx` 를 옮기고 머리말을 props 로 받게 한다.

```tsx
import { useState } from 'react'
import { gradeQuestions, type Question, type QuizResult } from './questions'

type Props = {
  questions: Question[]
  eyebrow: string
  title: string
  onSubmit: (result: QuizResult) => void | Promise<void>
}

export default function QuestionSet({ questions, eyebrow, title, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  function set(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }))
  }

  // 서술형까지 다 채워야 낼 수 있다. 생각을 적는 것이 목적이다.
  const ready = questions.every((q) => (answers[q.id] ?? '').trim() !== '')

  return (
    <div className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>

      {questions.map((question, i) => (
        <fieldset key={question.id} className="card question">
          <legend className="question__prompt">
            <span className="badge">{i + 1}번</span> {question.prompt}
          </legend>

          {question.kind === 'choice' ? (
            question.choices.map((choice, index) => (
              <label key={choice} className="choice">
                <input
                  type="radio"
                  name={question.id}
                  value={index}
                  checked={answers[question.id] === String(index)}
                  onChange={() => set(question.id, String(index))}
                />
                {choice}
              </label>
            ))
          ) : (
            <textarea
              className="input reflection__input"
              rows={3}
              aria-label={question.prompt}
              value={answers[question.id] ?? ''}
              onChange={(e) => set(question.id, e.target.value)}
            />
          )}
        </fieldset>
      ))}

      <button
        type="button"
        className="btn btn--primary"
        disabled={!ready}
        onClick={() => onSubmit(gradeQuestions(questions, answers))}
      >
        제출하기
      </button>
    </div>
  )
}
```

- [ ] **Step 5: 강 건너기를 새 컴포넌트로 갈아끼우기**

`src/activities/river/FinalQuiz.tsx` 를 지운다.

`src/activities/river/content.ts` 에서 `FinalQuestion` 타입 선언을 지우고 shared 의 것을 쓴다. 파일 위쪽 import 와 상수 선언을 이렇게 바꾼다.

```ts
import type { Question } from '../shared/questions'

/** 3단계 — 다 건넌 뒤 생각을 정리한다. */
export const FINAL_QUESTIONS: Question[] = [
```

(`FinalQuestion` 타입 선언 블록은 통째로 지운다. 나머지 문항 내용은 그대로 둔다.)

`src/activities/river/grading.ts` 에서 `FinalAnswer`·`FinalResult`·`gradeFinal` 과 `FinalQuestion` import 를 지운다. 남는 것은 `normalize`, `splitSentence`, `checkBlank`, `allBlanksCorrect` 와 `Blank` import 뿐이다.

`src/activities/river/RiverActivity.tsx`:

```tsx
import QuestionSet from '../shared/QuestionSet'
import type { QuizResult } from '../shared/questions'
import { FINAL_QUESTIONS } from './content'
```

(`import FinalQuiz from './FinalQuiz'` 와 `import type { FinalResult } from './grading'` 를 지운다.)

그리고 3단계 렌더를 이렇게 바꾼다.

```tsx
      {stage === 'final' && (
        <QuestionSet
          questions={FINAL_QUESTIONS}
          eyebrow="3단계 · 정리하기"
          title="무엇을 알아냈는지 정리해 봅시다."
          onSubmit={(result: QuizResult) =>
            onSubmit(
              buildPayload(startedAt, {
                solved: true,
                attempts: violations + 1,
                result: {
                  rules: { answers: ruleAnswers, attempts: ruleAttempts },
                  moves,
                  violations,
                  quiz: result,
                },
                note: result.answers.find((a) => a.questionId === 'why-goat')?.value ?? '',
              }),
            )
          }
        />
      )}
```

- [ ] **Step 6: 강 건너기 채점 테스트에서 옮긴 부분 지우기**

`src/activities/river/grading.test.ts` 에서 `gradeFinal` 을 다루는 `describe('gradeFinal', ...)` 블록 전체와 import 목록의 `gradeFinal`, `FINAL_QUESTIONS` 를 지운다. 그 내용은 Step 2 에서 이미 shared 쪽으로 옮겼다.

- [ ] **Step 7: 전체 테스트와 빌드 확인**

Run: `npm test && npm run build && npm run lint`
Expected: 전체 PASS. **강 건너기 테스트가 하나도 깨지지 않아야 한다.** 깨졌다면 옮기는 과정에서 동작이 바뀐 것이므로 되돌려 확인한다.

- [ ] **Step 8: 커밋**

```bash
git add -A
git commit -m "문항 화면과 채점을 shared 로 옮겨 활동들이 함께 쓰게 함"
```

---

### Task 2: 스냅샷 생성

**Files:**
- Create: `src/activities/visualizer/data.ts`
- Create: `src/activities/visualizer/steps.ts`
- Test: `src/activities/visualizer/steps.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `BARS: number[]`, `SEARCH_TARGET: number`
  - `type Step = { array: number[]; comparing: number[]; settled: number[]; found: number | null; comparisons: number; swaps: number; caption: string }`
  - `selectionSortSteps(input: number[]): Step[]`
  - `bubbleSortSteps(input: number[]): Step[]`
  - `linearSearchSteps(input: number[], target: number): Step[]`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/visualizer/steps.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { BARS, SEARCH_TARGET } from './data'
import {
  selectionSortSteps, bubbleSortSteps, linearSearchSteps, type Step,
} from './steps'

const last = (steps: Step[]) => steps[steps.length - 1]
const sorted = [...BARS].sort((a, b) => a - b)

describe('데이터', () => {
  it('막대는 여덟 개다', () => {
    expect(BARS).toHaveLength(8)
  })

  it('찾을 값은 배열 안에 있다', () => {
    expect(BARS).toContain(SEARCH_TARGET)
  })
})

describe('selectionSortSteps', () => {
  const steps = selectionSortSteps(BARS)

  it('마지막에 정렬이 끝나 있다', () => {
    expect(last(steps).array).toEqual(sorted)
  })

  it('비교 28번, 교환 5번이다', () => {
    expect(last(steps).comparisons).toBe(28)
    expect(last(steps).swaps).toBe(5)
  })

  it('마지막에는 모든 자리가 정해져 있다', () => {
    expect(last(steps).settled).toHaveLength(BARS.length)
  })

  it('중간에 원소가 사라지거나 생기지 않는다', () => {
    for (const step of steps) {
      expect([...step.array].sort((a, b) => a - b)).toEqual(sorted)
    }
  })

  it('모든 단계에 자막이 있다', () => {
    expect(steps.every((s) => s.caption.trim() !== '')).toBe(true)
  })

  it('원본 배열을 바꾸지 않는다', () => {
    const before = [...BARS]
    selectionSortSteps(BARS)
    expect(BARS).toEqual(before)
  })

  it('비교 횟수가 줄어들지 않는다', () => {
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].comparisons).toBeGreaterThanOrEqual(steps[i - 1].comparisons)
    }
  })
})

describe('bubbleSortSteps', () => {
  const steps = bubbleSortSteps(BARS)

  it('마지막에 정렬이 끝나 있다', () => {
    expect(last(steps).array).toEqual(sorted)
  })

  it('비교 25번, 교환 13번이다', () => {
    expect(last(steps).comparisons).toBe(25)
    expect(last(steps).swaps).toBe(13)
  })

  it('한 바퀴 동안 안 바꾸면 일찍 끝난다고 알린다', () => {
    expect(last(steps).caption).toContain('한 번도 바꾸지 않았')
  })

  it('마지막에는 모든 자리가 정해져 있다', () => {
    expect(last(steps).settled).toHaveLength(BARS.length)
  })

  it('모든 단계에 자막이 있다', () => {
    expect(steps.every((s) => s.caption.trim() !== '')).toBe(true)
  })
})

describe('두 정렬 비교', () => {
  it('선택정렬은 비교를 더 많이 하고 교환은 더 적게 한다', () => {
    const s = last(selectionSortSteps(BARS))
    const b = last(bubbleSortSteps(BARS))
    expect(s.comparisons).toBeGreaterThan(b.comparisons)
    expect(s.swaps).toBeLessThan(b.swaps)
  })
})

describe('linearSearchSteps', () => {
  const steps = linearSearchSteps(BARS, SEARCH_TARGET)

  it('찾은 자리에서 멈춘다', () => {
    expect(last(steps).found).toBe(BARS.indexOf(SEARCH_TARGET))
  })

  it('일곱 번 비교한다', () => {
    expect(last(steps).comparisons).toBe(7)
  })

  it('찾기 전에는 found 가 비어 있다', () => {
    expect(steps.slice(0, -1).every((s) => s.found === null)).toBe(true)
  })

  it('배열을 건드리지 않는다', () => {
    expect(steps.every((s) => s.array.join() === BARS.join())).toBe(true)
  })

  it('없는 값을 찾으면 끝까지 보고 못 찾았다고 알린다', () => {
    const miss = linearSearchSteps(BARS, 99)
    expect(last(miss).found).toBeNull()
    expect(last(miss).comparisons).toBe(BARS.length)
    expect(last(miss).caption).toContain('찾지 못했습니다')
  })

  it('모든 단계에 자막이 있다', () => {
    expect(steps.every((s) => s.caption.trim() !== '')).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- steps`
Expected: FAIL — `./data` 와 `./steps` 모듈이 없다

- [ ] **Step 3: `src/activities/visualizer/data.ts` 작성**

```ts
/** 반 전체가 같은 화면을 본다. 학생이 바꿀 수 없다. */
export const BARS = [5, 2, 8, 1, 9, 3, 7, 4]

/** 인덱스 6. 뒤쪽에 있어 비교 과정이 보인다. */
export const SEARCH_TARGET = 7
```

- [ ] **Step 4: `src/activities/visualizer/steps.ts` 작성**

```ts
export type Step = {
  array: number[]
  comparing: number[]
  settled: number[]
  found: number | null
  comparisons: number
  swaps: number
  caption: string
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: Math.max(0, to - from) }, (_, k) => from + k)

export function selectionSortSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = []
  let comparisons = 0
  let swaps = 0
  let settledCount = 0

  const push = (extra: Partial<Step>) =>
    steps.push({
      array: [...a],
      comparing: [],
      settled: range(0, settledCount),
      found: null,
      comparisons,
      swaps,
      caption: '',
      ...extra,
    })

  push({ caption: '앞에서부터 가장 작은 수를 하나씩 찾아 놓습니다.' })

  for (let i = 0; i < a.length - 1; i++) {
    let min = i
    push({ comparing: [min], caption: `${i + 1}번째 자리에 올 가장 작은 수를 찾습니다.` })

    for (let j = i + 1; j < a.length; j++) {
      comparisons++
      push({ comparing: [min, j], caption: `${a[min]} 과 ${a[j]} 를 비교합니다.` })
      if (a[j] < a[min]) {
        min = j
        push({ comparing: [min], caption: `${a[min]} 이 지금까지 가장 작습니다.` })
      }
    }

    if (min !== i) {
      const moved = a[i]
      const smallest = a[min]
      ;[a[i], a[min]] = [a[min], a[i]]
      swaps++
      push({ comparing: [i, min], caption: `${smallest} 과 ${moved} 의 자리를 바꿉니다.` })
    } else {
      push({ comparing: [i], caption: `${a[i]} 이 이미 제자리에 있습니다.` })
    }

    settledCount = i + 1
    push({ caption: `${i + 1}번째 자리가 정해졌습니다.` })
  }

  settledCount = a.length
  push({ caption: '정렬이 끝났습니다.' })
  return steps
}

export function bubbleSortSteps(input: number[]): Step[] {
  const a = [...input]
  const steps: Step[] = []
  let comparisons = 0
  let swaps = 0
  // 이 인덱스부터 끝까지는 자리가 정해졌다.
  let settledFrom = a.length

  const push = (extra: Partial<Step>) =>
    steps.push({
      array: [...a],
      comparing: [],
      settled: range(settledFrom, a.length),
      found: null,
      comparisons,
      swaps,
      caption: '',
      ...extra,
    })

  push({ caption: '옆자리끼리 비교해 큰 수를 뒤로 보냅니다.' })

  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false

    for (let j = 0; j < a.length - 1 - i; j++) {
      comparisons++
      push({ comparing: [j, j + 1], caption: `${a[j]} 과 ${a[j + 1]} 을 비교합니다.` })
      if (a[j] > a[j + 1]) {
        const left = a[j]
        ;[a[j], a[j + 1]] = [a[j + 1], a[j]]
        swaps++
        swapped = true
        push({ comparing: [j, j + 1], caption: `${left} 이 더 크므로 자리를 바꿉니다.` })
      }
    }

    settledFrom = a.length - 1 - i
    push({ caption: `${a.length - i}번째 자리가 정해졌습니다.` })

    if (!swapped) {
      settledFrom = 0
      push({ caption: '한 번도 바꾸지 않았으므로 정렬이 끝났습니다.' })
      return steps
    }
  }

  settledFrom = 0
  push({ caption: '정렬이 끝났습니다.' })
  return steps
}

export function linearSearchSteps(input: number[], target: number): Step[] {
  const a = [...input]
  const steps: Step[] = []
  let comparisons = 0

  const push = (extra: Partial<Step>) =>
    steps.push({
      array: [...a],
      comparing: [],
      settled: [],
      found: null,
      comparisons,
      swaps: 0,
      caption: '',
      ...extra,
    })

  push({ caption: `${target} 을 찾습니다. 앞에서부터 하나씩 봅니다.` })

  for (let i = 0; i < a.length; i++) {
    comparisons++
    if (a[i] === target) {
      push({
        comparing: [i], found: i,
        caption: `${a[i]} 을 찾았습니다! ${comparisons}번 비교했습니다.`,
      })
      return steps
    }
    push({ comparing: [i], caption: `${a[i]} 은 ${target} 이 아닙니다.` })
  }

  push({ caption: `끝까지 봤지만 ${target} 을 찾지 못했습니다.` })
  return steps
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- steps`
Expected: PASS (21개)

- [ ] **Step 6: 커밋**

```bash
git add src/activities/visualizer
git commit -m "알고리즘 시각화 스냅샷 생성 함수 추가"
```

---

### Task 3: 막대 그래프

**Files:**
- Create: `src/activities/visualizer/Bars.tsx`
- Test: `src/activities/visualizer/Bars.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `Step` (Task 2)
- Produces: `Bars` 기본 export. props `{ step: Step }`

`Bars` 는 알고리즘을 모른다. `Step` 하나를 받아 그리기만 한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/visualizer/Bars.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Bars from './Bars'
import type { Step } from './steps'

function makeStep(extra: Partial<Step> = {}): Step {
  return {
    array: [3, 1, 2], comparing: [], settled: [], found: null,
    comparisons: 0, swaps: 0, caption: '자막', ...extra,
  }
}

describe('Bars', () => {
  it('숫자를 모두 보여준다', () => {
    render(<Bars step={makeStep()} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('비교 중인 자리에 표시를 붙인다', () => {
    render(<Bars step={makeStep({ comparing: [0, 1] })} />)
    expect(screen.getByText('3').closest('li')).toHaveClass('bar--comparing')
    expect(screen.getByText('2').closest('li')).not.toHaveClass('bar--comparing')
  })

  it('자리 잡은 곳에 표시를 붙인다', () => {
    render(<Bars step={makeStep({ settled: [2] })} />)
    expect(screen.getByText('2').closest('li')).toHaveClass('bar--settled')
  })

  it('찾은 자리에 표시를 붙인다', () => {
    render(<Bars step={makeStep({ found: 1 })} />)
    expect(screen.getByText('1').closest('li')).toHaveClass('bar--found')
  })

  it('막대 높이를 값에 비례해 정한다', () => {
    render(<Bars step={makeStep()} />)
    expect(screen.getByText('3').closest('li')).toHaveStyle({ height: '100%' })
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- Bars`
Expected: FAIL — `./Bars` 모듈이 없다

- [ ] **Step 3: `src/activities/visualizer/Bars.tsx` 작성**

```tsx
import type { Step } from './steps'

export default function Bars({ step }: { step: Step }) {
  const max = Math.max(...step.array)

  return (
    <ul className="plain-list bars">
      {step.array.map((value, i) => {
        const classes = ['bar']
        if (step.found === i) classes.push('bar--found')
        else if (step.comparing.includes(i)) classes.push('bar--comparing')
        else if (step.settled.includes(i)) classes.push('bar--settled')
        return (
          <li
            key={i}
            className={classes.join(' ')}
            style={{ height: `${(value / max) * 100}%` }}
          >
            <span className="bar__value">{value}</span>
          </li>
        )
      })}
    </ul>
  )
}
```

찾은 자리를 먼저 보고, 그다음 비교 중, 그다음 자리 잡음 순으로 정한다.
한 막대가 여러 상태에 걸릴 때 무엇을 보여줄지 정해 두지 않으면 색이 들쭉날쭉해진다.

- [ ] **Step 4: 스타일 추가**

`src/index.css` 의 반응형 블록 앞에 넣는다.

```css
/* ── 알고리즘 시각화 ─────────────────────────────────────────────── */

.bars {
  display: flex;
  align-items: flex-end;
  gap: var(--s-xs);
  height: 220px;
}

.bar {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 6px;
  background: var(--ink-faint);
  border-radius: var(--r-sm) var(--r-sm) 0 0;
  transition: height 0.2s ease, background-color 0.2s ease;
}

.bar--comparing { background: var(--accent-orange); }
.bar--settled { background: var(--accent-green); }
.bar--found { background: var(--accent-pink); }

.bar__value {
  font-size: 14px;
  font-weight: 700;
  color: var(--on-primary);
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- Bars`
Expected: PASS (5개)

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "알고리즘 시각화 막대 그래프 추가"
```

---

### Task 4: 재생 조작

**Files:**
- Create: `src/activities/visualizer/Player.tsx`
- Test: `src/activities/visualizer/Player.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: 없음
- Produces: `Player` 기본 export. props `{ total: number; index: number; onChange: (index: number) => void }`

`Player` 는 알고리즘도 막대도 모른다. 인덱스만 다룬다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/activities/visualizer/Player.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Player from './Player'

/*
 * 단계 이동은 타이머와 상관없으므로 진짜 타이머로 둔다.
 * 재생만 가짜 타이머를 쓰고, 그 안에서는 userEvent 대신 fireEvent 를 쓴다.
 * userEvent 는 클릭 사이에 지연을 두는데 가짜 타이머와 함께 쓰면
 * 서로를 기다리다 멈춘다. (advanceTimers 나 delay: null 로도 안 풀렸다.)
 *
 * 재생 describe 안에서만:
 *   beforeEach(() => { vi.useFakeTimers() })
 *   afterEach(() => { vi.useRealTimers() })
 *   const click = (name) => fireEvent.click(screen.getByRole('button', { name }))
 *   const tick = (ms) => act(() => { vi.advanceTimersByTime(ms) })
 */

describe('Player 단계 이동', () => {
  it('앞으로 한 단계 옮긴다', async () => {
    const onChange = vi.fn()
    const user = setup()
    render(<Player total={5} index={1} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('뒤로 한 단계 옮긴다', async () => {
    const onChange = vi.fn()
    const user = setup()
    render(<Player total={5} index={1} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '이전' }))

    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('처음이면 이전 버튼이 잠긴다', () => {
    render(<Player total={5} index={0} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()
  })

  it('마지막이면 다음 버튼이 잠긴다', () => {
    render(<Player total={5} index={4} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('처음으로 되돌린다', async () => {
    const onChange = vi.fn()
    const user = setup()
    render(<Player total={5} index={3} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '처음으로' }))

    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('몇 번째 단계인지 보여준다', () => {
    render(<Player total={5} index={2} onChange={vi.fn()} />)
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })
})

describe('Player 재생', () => {
  it('재생을 누르면 시간이 지날 때마다 다음으로 넘어간다', async () => {
    const onChange = vi.fn()
    const user = setup()
    render(<Player total={5} index={0} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '재생' }))
    act(() => { vi.advanceTimersByTime(500) })

    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('재생 중에는 일시정지 버튼이 된다', async () => {
    const user = setup()
    render(<Player total={5} index={0} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '재생' }))

    expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument()
  })

  it('일시정지하면 더 넘어가지 않는다', async () => {
    const onChange = vi.fn()
    const user = setup()
    render(<Player total={5} index={0} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '재생' }))
    await user.click(screen.getByRole('button', { name: '일시정지' }))
    onChange.mockClear()
    act(() => { vi.advanceTimersByTime(2000) })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('마지막에 닿으면 재생이 멈춘다', async () => {
    const user = setup()
    render(<Player total={5} index={4} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '재생' }))
    act(() => { vi.advanceTimersByTime(2000) })

    expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument()
  })

  it('속도를 바꾸면 그만큼 빨라진다', async () => {
    const onChange = vi.fn()
    const user = setup()
    render(<Player total={5} index={0} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '빠르게' }))
    await user.click(screen.getByRole('button', { name: '재생' }))
    act(() => { vi.advanceTimersByTime(200) })

    expect(onChange).toHaveBeenCalledWith(1)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- Player`
Expected: FAIL — `./Player` 모듈이 없다

- [ ] **Step 3: `src/activities/visualizer/Player.tsx` 작성**

```tsx
import { useEffect, useState } from 'react'

/** 수업에서 보고 조절한다. */
const SPEEDS = [
  { id: 'slow', label: '느리게', ms: 900 },
  { id: 'normal', label: '보통', ms: 500 },
  { id: 'fast', label: '빠르게', ms: 200 },
]

type Props = {
  total: number
  index: number
  onChange: (index: number) => void
}

export default function Player({ total, index, onChange }: Props) {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(SPEEDS[1])

  const atStart = index <= 0
  const atEnd = index >= total - 1

  useEffect(() => {
    if (!playing) return
    if (atEnd) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(() => onChange(index + 1), speed.ms)
    return () => clearTimeout(timer)
  }, [playing, index, atEnd, speed.ms, onChange])

  return (
    <div className="player">
      <div className="chip-row">
        <button type="button" className="btn btn--utility"
          disabled={atStart} onClick={() => onChange(0)}>처음으로</button>
        <button type="button" className="btn btn--utility"
          disabled={atStart} onClick={() => onChange(index - 1)}>이전</button>
        <button type="button" className="btn btn--primary"
          onClick={() => setPlaying(!playing)}>
          {playing ? '일시정지' : '재생'}
        </button>
        <button type="button" className="btn btn--utility"
          disabled={atEnd} onClick={() => onChange(index + 1)}>다음</button>
      </div>

      <div className="chip-row">
        {SPEEDS.map((s) => (
          <button key={s.id} type="button" className="btn btn--utility"
            aria-pressed={speed.id === s.id}
            onClick={() => setSpeed(s)}>{s.label}</button>
        ))}
        <span className="player__count">{index + 1} / {total}</span>
      </div>
    </div>
  )
}
```

`onChange` 를 의존성에 넣었으므로 부모는 이 함수를 매 렌더마다 새로 만들면
안 된다. 부모 쪽에서 `useCallback` 으로 감싼다 (Task 5).

- [ ] **Step 4: 스타일 추가**

```css
.player {
  display: flex;
  flex-direction: column;
  gap: var(--s-xs);
}

.player__count {
  align-self: center;
  font-size: 14px;
  color: var(--ink-muted);
  margin-left: auto;
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- Player`
Expected: PASS (11개)

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "알고리즘 시각화 재생 조작 추가"
```

---

### Task 5: 활동 화면

**Files:**
- Create: `src/activities/visualizer/content.ts`
- Create: `src/activities/visualizer/VisualizerActivity.tsx`
- Test: `src/activities/visualizer/VisualizerActivity.test.tsx`
- Modify: `src/activities/index.ts`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `BARS`·`SEARCH_TARGET` (Task 2), 세 스냅샷 함수 (Task 2), `Bars` (Task 3), `Player` (Task 4), `QuestionSet`·`QuizResult` (Task 1), `buildPayload`, `ActivityProps`
- Produces: `VisualizerActivity` 기본 export. 레지스트리 id `visualizer`, 제목 `알고리즘 시각화`

- [ ] **Step 1: `src/activities/visualizer/content.ts` 작성**

```ts
import type { Question } from '../shared/questions'

export const FINAL_QUESTIONS: Question[] = [
  {
    id: 'more-swaps', kind: 'choice',
    prompt: '선택정렬과 버블정렬 중 자리를 더 많이 바꾼 것은 무엇인가요?',
    choices: ['선택정렬', '버블정렬', '둘이 같다'],
    answerIndex: 1,
  },
  {
    id: 'search-count', kind: 'choice',
    prompt: '순차 탐색이 7을 찾기까지 몇 번 비교했나요?',
    choices: ['5번', '6번', '7번', '8번'],
    answerIndex: 2,
  },
  {
    id: 'difference', kind: 'text',
    prompt: '두 정렬 방법은 어떻게 다른가요? 관찰한 것을 설명해 보세요.',
  },
]
```

- [ ] **Step 2: 실패하는 테스트 작성**

`src/activities/visualizer/VisualizerActivity.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisualizerActivity from './VisualizerActivity'

type User = ReturnType<typeof userEvent.setup>

/**
 * 지금 고른 알고리즘을 끝까지 본다.
 * 버튼을 매번 다시 찾고, 혹시 끝나지 않아도 멈추도록 상한을 둔다.
 * 상한이 없으면 구현이 잘못됐을 때 테스트가 영원히 돈다.
 */
function watchToEnd() {
  // 버튼을 한 번만 찾는다. React 는 다시 그릴 때 같은 DOM 노드를 재사용하므로
  // disabled 값은 계속 최신이다. 반복마다 다시 찾으면 화면 전체를 140번
  // 훑게 되어 테스트가 제한 시간에 걸린다.
  const next = screen.getByRole('button', { name: '다음' }) as HTMLButtonElement
  for (let guard = 0; guard < 500; guard++) {
    if (next.disabled) return
    fireEvent.click(next)
  }
  throw new Error('끝까지 가지 못했습니다. 다음 버튼이 잠기지 않습니다.')
}

function watchAll() {
  for (const name of ['선택정렬', '버블정렬', '순차 탐색']) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
    watchToEnd()
  }
}

// 반복 클릭에는 fireEvent 를 쓴다. 세 알고리즘을 끝까지 보려면 "다음"을
// 140번쯤 눌러야 하는데 userEvent 의 클릭 시뮬레이션은 그만큼 반복하기에
// 느려 제한 시간을 넘긴다. 사람의 입력을 흉내 내야 하는 곳(라디오 고르기,
// 글 쓰기)에서만 userEvent 를 쓴다.

describe('VisualizerActivity', () => {
  it('알고리즘 세 개를 고를 수 있다', () => {
    render(<VisualizerActivity onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /선택정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /버블정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /순차 탐색/ })).toBeInTheDocument()
  })

  it('처음에는 관찰한 것이 없다고 알린다', () => {
    render(<VisualizerActivity onSubmit={vi.fn()} />)
    expect(screen.getByText('3개 중 0개 관찰함')).toBeInTheDocument()
  })

  it('다 보기 전에는 문항이 열리지 않는다', () => {
    render(<VisualizerActivity onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '제출하기' })).not.toBeInTheDocument()
  })

  it('알고리즘을 바꾸면 처음 단계로 돌아간다', async () => {
    const user = userEvent.setup()
    render(<VisualizerActivity onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: /버블정렬/ }))

    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()
  })

  it('하나를 끝까지 보면 관찰 수가 올라간다', async () => {
    const user = userEvent.setup()
    render(<VisualizerActivity onSubmit={vi.fn()} />)

    await watchToEnd(user)

    expect(screen.getByText('3개 중 1개 관찰함')).toBeInTheDocument()
  })

  it('세 개를 다 보면 문항이 열린다', async () => {
    const user = userEvent.setup()
    render(<VisualizerActivity onSubmit={vi.fn()} />)

    await watchAll(user)

    expect(screen.getByText('3개를 모두 관찰했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제출하기' })).toBeInTheDocument()
  })

  it('제출하면 관찰 기록과 답을 담아 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<VisualizerActivity onSubmit={onSubmit} />)

    await watchAll(user)
    await user.click(screen.getByRole('radio', { name: '버블정렬' }))
    await user.click(screen.getByRole('radio', { name: '7번' }))
    await user.type(screen.getByLabelText(/어떻게 다른가요/), '선택정렬이 자리를 덜 바꿔요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    const payload = onSubmit.mock.calls[0][0]
    expect(payload.solved).toBe(true)
    expect(payload.note).toBe('선택정렬이 자리를 덜 바꿔요')
    expect(payload.result.watched).toHaveLength(3)
    expect(payload.result.quiz.score).toBe(2)
    expect(payload.attempts).toBe(3)
  })
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `npm test -- VisualizerActivity`
Expected: FAIL — `./VisualizerActivity` 모듈이 없다

- [ ] **Step 4: `src/activities/visualizer/VisualizerActivity.tsx` 작성**

```tsx
import { useCallback, useMemo, useState } from 'react'
import type { ActivityProps } from '../types'
import { buildPayload } from '../shared/payload'
import QuestionSet from '../shared/QuestionSet'
import type { QuizResult } from '../shared/questions'
import { BARS, SEARCH_TARGET } from './data'
import { bubbleSortSteps, linearSearchSteps, selectionSortSteps } from './steps'
import { FINAL_QUESTIONS } from './content'
import Bars from './Bars'
import Player from './Player'

const ALGORITHMS = [
  { id: 'selection', title: '선택정렬', build: () => selectionSortSteps(BARS) },
  { id: 'bubble', title: '버블정렬', build: () => bubbleSortSteps(BARS) },
  { id: 'search', title: '순차 탐색', build: () => linearSearchSteps(BARS, SEARCH_TARGET) },
]

export default function VisualizerActivity({ onSubmit }: ActivityProps) {
  const [startedAt] = useState(() => Date.now())
  const [pickedId, setPickedId] = useState(ALGORITHMS[0].id)
  const [index, setIndex] = useState(0)
  const [watched, setWatched] = useState<string[]>([])
  const [replays, setReplays] = useState(0)

  const picked = ALGORITHMS.find((a) => a.id === pickedId) ?? ALGORITHMS[0]
  const steps = useMemo(() => picked.build(), [picked])
  const step = steps[Math.min(index, steps.length - 1)]

  // 마지막 단계에 닿으면 그 알고리즘을 본 것으로 친다.
  // 재생으로 갔든 한 단계씩 눌러 갔든 똑같이 친다.
  const handleIndex = useCallback(
    (next: number) => {
      setIndex(next)
      if (next === steps.length - 1) {
        setReplays((n) => n + 1)
        setWatched((prev) => (prev.includes(picked.id) ? prev : [...prev, picked.id]))
      }
    },
    [steps.length, picked.id],
  )

  function pick(id: string) {
    setPickedId(id)
    setIndex(0)
  }

  const allWatched = watched.length === ALGORITHMS.length

  return (
    <section className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">활동</p>
        <h2>알고리즘 시각화</h2>
        <p className="muted">
          같은 숫자를 두고 정렬과 탐색이 어떻게 도는지 지켜보세요.
        </p>
      </div>

      <div className="chip-row">
        {ALGORITHMS.map((a) => (
          <button key={a.id} type="button" className="btn btn--utility"
            aria-pressed={a.id === picked.id} onClick={() => pick(a.id)}>
            {a.title}{watched.includes(a.id) ? ' ✓' : ''}
          </button>
        ))}
        <span className="player__count">
          {allWatched ? '3개를 모두 관찰했습니다' : `3개 중 ${watched.length}개 관찰함`}
        </span>
      </div>

      <div className="game__board stack stack--tight">
        <Bars step={step} />
        <p className="game__status">{step.caption}</p>
        <p className="faint">
          비교 {step.comparisons}번 · 자리 바꿈 {step.swaps}번
        </p>
        <Player total={steps.length} index={index} onChange={handleIndex} />
      </div>

      {allWatched && (
        <QuestionSet
          questions={FINAL_QUESTIONS}
          eyebrow="정리하기"
          title="관찰한 것을 정리해 봅시다."
          onSubmit={(result: QuizResult) =>
            onSubmit(
              buildPayload(startedAt, {
                solved: true,
                attempts: replays,
                result: { watched, replays, quiz: result },
                note: result.answers.find((a) => a.questionId === 'difference')?.value ?? '',
              }),
            )
          }
        />
      )}
    </section>
  )
}
```

- [ ] **Step 5: 레지스트리에 등록**

`src/activities/index.ts` 에 import 를 더하고 배열에 한 줄 추가한다.

```ts
import VisualizerActivity from './visualizer/VisualizerActivity'
```

```ts
  { id: 'visualizer', title: '알고리즘 시각화', Component: VisualizerActivity },
```

강 건너기 다음, 틱택토 앞에 넣는다.

- [ ] **Step 6: 테스트와 빌드 확인**

Run: `npm test && npm run build && npm run lint`
Expected: 전체 PASS, 빌드 성공, 린트 경고 0

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "알고리즘 시각화 활동 추가"
```

---

## 통합 검증

2단계에서 쓴 CDP 스크립트 방식을 그대로 쓴다. 실제 폼을 채우고 버튼을 누른다.

- [ ] **활동 목록에 네 개가 보이는지** — 퀴즈, 강 건너기, 알고리즘 시각화, 틱택토
- [ ] **선택정렬** — 재생을 눌러 끝까지 가고 마지막에 비교 28·교환 5 가 뜨는지
- [ ] **버블정렬** — 마지막에 비교 25·교환 13 과 "한 번도 바꾸지 않았으므로" 자막
- [ ] **순차 탐색** — 7을 찾은 자리가 분홍으로 바뀌고 비교 7번
- [ ] **되감기** — 이전 버튼으로 돌아가면 숫자와 색이 함께 되돌아가는지
- [ ] **속도** — 빠르게로 바꾸면 눈에 띄게 빨라지는지
- [ ] **문항 잠금** — 두 개만 봤을 때 제출 폼이 없고, 세 개를 다 보면 나타나는지
- [ ] **제출** — 제출 후 활동 목록에 도장이 찍히는지
- [ ] **화면 캡처** — 세 알고리즘 재생 중 화면과 문항 화면
- [ ] **강 건너기 회귀 확인** — Task 1 에서 문항 화면을 옮겼으므로, 강 건너기
      3단계가 그대로 도는지 실제로 한 번 밟는다

## 남는 일

- 속도 3단계(900/500/200ms)는 근거 있는 값이 아니다. `Player.tsx` 의 `SPEEDS`
  상수 하나다. 수업에서 보고 조절한다.
- 데이터를 바꾸려면 `data.ts` 와 `steps.test.ts` 의 기대 횟수, `content.ts` 의
  2번 문항 정답을 함께 고쳐야 한다. 세 곳이 물려 있다.
- 활동 카드 색 띠는 네 가지가 돌아가며 쓰인다. 활동이 다섯 번째가 되면 색이
  반복된다.
