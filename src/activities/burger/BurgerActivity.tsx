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
