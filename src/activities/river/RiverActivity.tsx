import { useState } from 'react'
import type { ActivityProps } from '../types'
import { buildPayload } from '../shared/payload'
import RuleBlanks from './RuleBlanks'
import Crossing from './Crossing'
import FinalQuiz from './FinalQuiz'
import type { FinalResult } from './grading'

type Stage = 'rules' | 'crossing' | 'final'

const STEPS: { stage: Stage; label: string }[] = [
  { stage: 'rules', label: '규칙 찾기' },
  { stage: 'crossing', label: '강 건너기' },
  { stage: 'final', label: '정리하기' },
]

export default function RiverActivity({ onSubmit }: ActivityProps) {
  const [startedAt] = useState(() => Date.now())
  const [stage, setStage] = useState<Stage>('rules')

  // 앞 단계의 결과를 모아 뒀다가 마지막에 한 번에 낸다.
  const [ruleAnswers, setRuleAnswers] = useState<Record<string, string>>({})
  const [ruleAttempts, setRuleAttempts] = useState(0)
  const [moves, setMoves] = useState<string[]>([])
  const [violations, setViolations] = useState(0)

  const current = STEPS.findIndex((s) => s.stage === stage)

  return (
    <section className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">활동</p>
        <h2>강 건너기</h2>
        <p className="muted">
          농부가 늑대·염소·양배추를 건너편으로 옮깁니다.
        </p>
      </div>

      <ol className="steps plain-list">
        {STEPS.map((step, i) => (
          <li
            key={step.stage}
            className={
              i === current ? 'steps__item steps__item--now'
                : i < current ? 'steps__item steps__item--done' : 'steps__item'
            }
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="steps__num">{i + 1}</span> {step.label}
          </li>
        ))}
      </ol>

      {stage === 'rules' && (
        <RuleBlanks
          onDone={(answers, attempts) => {
            setRuleAnswers(answers)
            setRuleAttempts(attempts)
            setStage('crossing')
          }}
        />
      )}

      {stage === 'crossing' && (
        <>
          <Crossing
            onDone={(doneMoves, doneViolations) => {
              setMoves(doneMoves)
              setViolations(doneViolations)
            }}
          />
          {moves.length > 0 && (
            <button type="button" className="btn btn--primary" onClick={() => setStage('final')}>
              정리하러 가기
            </button>
          )}
        </>
      )}

      {stage === 'final' && (
        <FinalQuiz
          onSubmit={(result: FinalResult) =>
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
                // 서술형 답을 교사 화면에서 바로 읽을 수 있게 note 로 올린다.
                note: result.answers.find((a) => a.questionId === 'why-goat')?.value ?? '',
              }),
            )
          }
        />
      )}
    </section>
  )
}
