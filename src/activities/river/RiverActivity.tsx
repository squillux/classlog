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
