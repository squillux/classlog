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
    <section>
      <h2>퀴즈</h2>

      {quizQuestions.map((question) => (
        <fieldset key={question.id}>
          <legend>{question.prompt}</legend>

          {question.kind === 'choice' ? (
            question.choices.map((choice, index) => (
              <label key={choice}>
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
              aria-label={question.prompt}
              value={values[question.id] ?? ''}
              onChange={(e) => set(question.id, e.target.value)}
            />
          )}
        </fieldset>
      ))}

      <button type="button" onClick={handleSubmit}>제출하기</button>

      {result && (
        <p>{result.total}문항 중 {result.score}문항 맞았습니다.</p>
      )}
    </section>
  )
}
