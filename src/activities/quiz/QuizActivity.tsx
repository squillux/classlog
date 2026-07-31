import { useState } from 'react'
import { quizQuestions } from '../../content/quiz'
import { gradeQuiz, type QuizResult } from './grade'
import type { ActivityProps } from '../types'

export default function QuizActivity({ onSubmit }: ActivityProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<QuizResult | null>(null)

  function set(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }))
  }

  async function handleSubmit() {
    const answers = quizQuestions.map((q) => ({
      questionId: q.id,
      value: values[q.id] ?? '',
    }))
    const graded = gradeQuiz(quizQuestions, answers)
    setResult(graded)
    await onSubmit({ answers, ...graded })
  }

  return (
    <section className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">활동</p>
        <h2>퀴즈 · 빈칸 채우기</h2>
      </div>

      {quizQuestions.map((question, i) => (
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
                  checked={values[question.id] === String(index)}
                  onChange={() => set(question.id, String(index))}
                />
                {choice}
              </label>
            ))
          ) : (
            <input
              className="input"
              aria-label={question.prompt}
              value={values[question.id] ?? ''}
              onChange={(e) => set(question.id, e.target.value)}
            />
          )}
        </fieldset>
      ))}

      <button type="button" className="btn btn--primary" onClick={handleSubmit}>
        제출하기
      </button>

      {result && (
        <p className="notice notice--ok">
          {result.total}문항 중 {result.score}문항 맞았습니다.
        </p>
      )}
    </section>
  )
}
