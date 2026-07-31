import { describe, it, expect } from 'vitest'
import { checkBlank, allBlanksCorrect, splitSentence } from './grading'
import { RULE_BLANKS } from './content'

describe('splitSentence', () => {
  it('{} 앞뒤로 문장을 가른다', () => {
    expect(splitSentence('배에는 {} 개만 태운다.')).toEqual(['배에는 ', ' 개만 태운다.'])
  })

  it('{} 가 없으면 뒤쪽은 빈 문자열', () => {
    expect(splitSentence('빈칸 없음')).toEqual(['빈칸 없음', ''])
  })
})

describe('checkBlank', () => {
  const capacity = RULE_BLANKS[0]

  it('허용 답 중 하나면 맞다', () => {
    expect(checkBlank(capacity, '1')).toBe(true)
    expect(checkBlank(capacity, '하나')).toBe(true)
  })

  it('앞뒤 공백을 무시한다', () => {
    expect(checkBlank(capacity, '  하나  ')).toBe(true)
  })

  it('사이 공백을 무시한다', () => {
    expect(checkBlank(RULE_BLANKS[3], '양 배 추')).toBe(true)
  })

  it('다른 답은 틀리다', () => {
    expect(checkBlank(capacity, '2')).toBe(false)
  })

  it('빈 답은 틀리다', () => {
    expect(checkBlank(capacity, '   ')).toBe(false)
  })
})

describe('allBlanksCorrect', () => {
  it('전부 맞아야 통과다', () => {
    const right = { capacity: '1', farmer: '농부', 'wolf-eats': '염소', 'goat-eats': '양배추' }
    expect(allBlanksCorrect(RULE_BLANKS, right)).toBe(true)
  })

  it('하나라도 틀리면 통과가 아니다', () => {
    const wrong = { capacity: '1', farmer: '농부', 'wolf-eats': '늑대', 'goat-eats': '양배추' }
    expect(allBlanksCorrect(RULE_BLANKS, wrong)).toBe(false)
  })

  it('안 쓴 칸이 있으면 통과가 아니다', () => {
    expect(allBlanksCorrect(RULE_BLANKS, { capacity: '1' })).toBe(false)
  })
})
