import { describe, it, expect } from 'vitest'
import { gradeQuiz } from './grade'
import type { QuizQuestion } from '../../content/quiz'

const questions: QuizQuestion[] = [
  { id: 'q1', kind: 'choice', prompt: '순서도에서 판단을 나타내는 도형은?',
    choices: ['타원', '마름모', '직사각형'], answerIndex: 1 },
  { id: 'q2', kind: 'blank', prompt: '같은 일을 여러 번 하는 제어 구조를 □□ 구조라 한다.',
    answer: '반복' },
]

describe('gradeQuiz', () => {
  it('객관식은 선택지 번호로 채점한다', () => {
    const result = gradeQuiz(questions, [{ questionId: 'q1', value: '1' }])
    expect(result.graded[0].correct).toBe(true)
  })

  it('객관식 오답을 잡아낸다', () => {
    const result = gradeQuiz(questions, [{ questionId: 'q1', value: '0' }])
    expect(result.graded[0].correct).toBe(false)
    expect(result.graded[0].expected).toBe('마름모')
  })

  it('빈칸은 앞뒤 공백과 사이 공백을 무시한다', () => {
    const result = gradeQuiz(questions, [{ questionId: 'q2', value: '  반 복  ' }])
    expect(result.graded[1].correct).toBe(true)
  })

  it('빈칸은 대소문자를 무시한다', () => {
    const withEnglish: QuizQuestion[] = [
      { id: 'q3', kind: 'blank', prompt: '반복 구조의 영어 표현은?', answer: 'loop' },
    ]
    const result = gradeQuiz(withEnglish, [{ questionId: 'q3', value: 'LOOP' }])
    expect(result.graded[0].correct).toBe(true)
  })

  it('답을 안 낸 문항은 오답으로 두고 빈 문자열을 기록한다', () => {
    const result = gradeQuiz(questions, [])
    expect(result.graded.map((g) => g.correct)).toEqual([false, false])
    expect(result.graded[0].given).toBe('')
  })

  it('점수와 총점을 센다', () => {
    const result = gradeQuiz(questions, [
      { questionId: 'q1', value: '1' },
      { questionId: 'q2', value: '반복' },
    ])
    expect(result.score).toBe(2)
    expect(result.total).toBe(2)
  })

  it('문항 순서대로 결과를 돌려준다', () => {
    const result = gradeQuiz(questions, [{ questionId: 'q2', value: '반복' }])
    expect(result.graded.map((g) => g.questionId)).toEqual(['q1', 'q2'])
  })
})
