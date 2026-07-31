import { useState } from 'react'
import { RULE_BLANKS } from './content'
import { allBlanksCorrect, checkBlank, splitSentence } from './grading'

type Props = {
  onDone: (answers: Record<string, string>, attempts: number) => void
}

export default function RuleBlanks({ onDone }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [attempts, setAttempts] = useState(0)
  const [showMarks, setShowMarks] = useState(false)

  function check() {
    const tried = attempts + 1
    setAttempts(tried)
    setShowMarks(true)
    if (allBlanksCorrect(RULE_BLANKS, answers)) onDone(answers, tried)
  }

  return (
    <div className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">1단계 · 규칙 찾기</p>
        <h3>이 문제에는 어떤 규칙이 숨어 있을까요?</h3>
        <p className="muted">빈칸을 채워 규칙을 완성해 보세요.</p>
      </div>

      <div className="game__board stack stack--tight">
        {RULE_BLANKS.map((blank) => {
          const [before, after] = splitSentence(blank.sentence)
          const given = answers[blank.id] ?? ''
          const right = checkBlank(blank, given)
          return (
            <p key={blank.id} className="blank-line">
              <span>{before}</span>
              <input
                className="input blank-line__input"
                aria-label={blank.sentence.replace('{}', '빈칸')}
                value={given}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [blank.id]: e.target.value }))
                }
              />
              <span>{after}</span>
              {showMarks && (
                <span className={right ? 'mark mark--ok' : 'mark mark--no'}>
                  {right ? '맞음' : '다시'}
                </span>
              )}
            </p>
          )
        })}
      </div>

      {showMarks && !allBlanksCorrect(RULE_BLANKS, answers) && (
        <p className="notice notice--error" role="alert">
          아직 맞지 않은 칸이 있어요. 다시 생각해 보세요.
        </p>
      )}

      <button type="button" className="btn btn--primary" onClick={check}>
        확인하기
      </button>
    </div>
  )
}
