import type { QuizQuestion } from '../../content/quiz'

export type QuizAnswer = { questionId: string; value: string }

export type GradedQuestion = {
  questionId: string
  correct: boolean
  given: string
  expected: string
}

export type QuizResult = {
  graded: GradedQuestion[]
  score: number
  total: number
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function expectedOf(question: QuizQuestion): string {
  return question.kind === 'choice' ? question.choices[question.answerIndex] : question.answer
}

function givenOf(question: QuizQuestion, raw: string): string {
  if (question.kind !== 'choice') return raw
  const index = Number(raw)
  return question.choices[index] ?? ''
}

export function gradeQuiz(questions: QuizQuestion[], answers: QuizAnswer[]): QuizResult {
  const byId = new Map(answers.map((a) => [a.questionId, a.value]))

  const graded = questions.map((question) => {
    const raw = byId.get(question.id) ?? ''
    const expected = expectedOf(question)
    const given = raw === '' ? '' : givenOf(question, raw)
    const correct =
      question.kind === 'choice'
        ? Number(raw) === question.answerIndex && raw !== ''
        : normalizeText(raw) !== '' && normalizeText(raw) === normalizeText(question.answer)
    return { questionId: question.id, correct, given, expected }
  })

  return {
    graded,
    score: graded.filter((g) => g.correct).length,
    total: questions.length,
  }
}
