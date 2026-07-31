export type Question =
  | { id: string; kind: 'choice'; prompt: string; choices: string[]; answerIndex: number }
  | { id: string; kind: 'text'; prompt: string }

export type Answer = { questionId: string; value: string }

export type QuizResult = {
  answers: Answer[]
  /** 객관식만 센다. 서술형은 선생님이 읽는다. */
  score: number
  total: number
}

export function gradeQuestions(
  questions: Question[],
  answers: Record<string, string>,
): QuizResult {
  const filled: Answer[] = questions.map((q) => ({
    questionId: q.id,
    value: answers[q.id] ?? '',
  }))

  const choices = questions.filter((q) => q.kind === 'choice')
  const score = choices.filter(
    (q) => Number(answers[q.id]) === q.answerIndex && (answers[q.id] ?? '') !== '',
  ).length

  return { answers: filled, score, total: choices.length }
}
