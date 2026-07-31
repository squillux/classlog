import { describe, it, expect } from 'vitest'
import { gradeQuestions, type Question } from './questions'

const questions: Question[] = [
  { id: 'a', kind: 'choice', prompt: '고르세요', choices: ['가', '나', '다'], answerIndex: 1 },
  { id: 'b', kind: 'choice', prompt: '또 고르세요', choices: ['하나', '둘'], answerIndex: 0 },
  { id: 'c', kind: 'text', prompt: '적어 보세요' },
]

describe('gradeQuestions', () => {
  it('객관식만 채점하고 서술형은 세지 않는다', () => {
    const r = gradeQuestions(questions, { a: '1', b: '0', c: '무언가' })
    expect(r.score).toBe(2)
    expect(r.total).toBe(2)
  })

  it('오답을 세지 않는다', () => {
    const r = gradeQuestions(questions, { a: '0', b: '0', c: '무언가' })
    expect(r.score).toBe(1)
  })

  it('답을 순서대로 담아 돌려준다', () => {
    const r = gradeQuestions(questions, { a: '1', b: '0', c: '이유' })
    expect(r.answers).toEqual([
      { questionId: 'a', value: '1' },
      { questionId: 'b', value: '0' },
      { questionId: 'c', value: '이유' },
    ])
  })

  it('안 쓴 칸은 빈 문자열로 남고 점수에 들지 않는다', () => {
    const r = gradeQuestions(questions, {})
    expect(r.answers.every((a) => a.value === '')).toBe(true)
    expect(r.score).toBe(0)
  })
})
