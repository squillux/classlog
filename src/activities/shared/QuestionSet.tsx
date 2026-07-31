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
