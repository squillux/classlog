import type { Blank, FinalQuestion } from './content'

/** 학생이 손으로 치는 값이라 공백과 대소문자를 무시하고 비교한다. */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

/** 문장을 {} 앞뒤로 가른다. 화면에서 빈칸 자리에 입력창을 끼우려고 쓴다. */
export function splitSentence(sentence: string): [string, string] {
  const at = sentence.indexOf('{}')
  if (at < 0) return [sentence, '']
  return [sentence.slice(0, at), sentence.slice(at + 2)]
}

export function checkBlank(blank: Blank, given: string): boolean {
  const value = normalize(given)
  if (value === '') return false
  return blank.accepts.some((accept) => normalize(accept) === value)
}

export function allBlanksCorrect(
  blanks: Blank[],
  answers: Record<string, string>,
): boolean {
  return blanks.every((blank) => checkBlank(blank, answers[blank.id] ?? ''))
}

export type FinalAnswer = { questionId: string; value: string }

export type FinalResult = {
  answers: FinalAnswer[]
  /** 객관식만 센다. 서술형은 선생님이 읽는다. */
  score: number
  total: number
}

export function gradeFinal(
  questions: FinalQuestion[],
  answers: Record<string, string>,
): FinalResult {
  const filled: FinalAnswer[] = questions.map((q) => ({
    questionId: q.id,
    value: answers[q.id] ?? '',
  }))

  const choices = questions.filter((q) => q.kind === 'choice')
  const score = choices.filter(
    (q) => Number(answers[q.id]) === q.answerIndex && (answers[q.id] ?? '') !== '',
  ).length

  return { answers: filled, score, total: choices.length }
}
