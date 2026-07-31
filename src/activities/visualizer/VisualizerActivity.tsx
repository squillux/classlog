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
