import { useState } from 'react'
import {
  BOAT_EMOJI, FARMER_EMOJI, INITIAL, ITEM_EMOJI, ITEM_LABEL, canCarry, isSolved,
  move, moveLabel, violation, violationMessage, type Item, type RiverState,
} from './rules'

const ITEMS: Item[] = ['wolf', 'goat', 'cabbage']

type Props = {
  onDone: (moves: string[], violations: number) => void
}

export default function Crossing({ onDone }: Props) {
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
    const nextMoves = [...moves, moveLabel(carried, state.farmer)]
    setMoves(nextMoves)
    setState(next)
    setCarried(null)
    setMessage(null)
    if (isSolved(next)) onDone(nextMoves, violations)
  }

  function reset() {
    setState(INITIAL)
    setCarried(null)
    setMoves([])
    setMessage(null)
  }

  return (
    <div className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">2단계 · 강 건너기</p>
        <h3>규칙을 지키며 모두 건너편으로 옮겨 보세요.</h3>
        <p className="muted">태울 것을 고르고 건너가기를 누르세요. 배에는 하나만 탑니다.</p>
      </div>

      <div className="game__board river">
        {(['left', 'right'] as const).map((side) => (
          <div key={side} className="river__bank">
            <p className="eyebrow">{side === 'left' ? '이쪽 편' : '건너편'}</p>
            <div className="chip-row">
              {state.farmer === side && (
                <span className="chip chip--static">
                  <span className="chip__emoji" aria-hidden="true">{FARMER_EMOJI}</span>
                  농부
                </span>
              )}
              {ITEMS.filter((item) => state.positions[item] === side).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chip"
                  aria-pressed={carried === item}
                  disabled={!canCarry(state, item) || solved}
                  onClick={() => setCarried(carried === item ? null : item)}
                >
                  <span className="chip__emoji" aria-hidden="true">{ITEM_EMOJI[item]}</span>
                  {ITEM_LABEL[item]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="boat" aria-live="polite">
        <span className="boat__emoji" aria-hidden="true">{BOAT_EMOJI}</span>
        <span className="boat__label">
          {carried ? (
            <>
              배에 <strong>{ITEM_EMOJI[carried]} {ITEM_LABEL[carried]}</strong> 를 태웠습니다
            </>
          ) : (
            '배가 비어 있습니다 · 농부 혼자 건널 수 있어요'
          )}
        </span>
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
    </div>
  )
}
