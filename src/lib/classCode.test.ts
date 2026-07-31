import { describe, it, expect } from 'vitest'
import { normalizeClassCode, isValidClassCode, generateClassCode } from './classCode'

describe('normalizeClassCode', () => {
  it('소문자를 대문자로 바꾼다', () => {
    expect(normalizeClassCode('ab12cd')).toBe('AB12CD')
  })

  it('공백과 하이픈을 없앤다', () => {
    expect(normalizeClassCode(' ab1 -2cd ')).toBe('AB12CD')
  })

  it('빈 문자열은 빈 문자열로 둔다', () => {
    expect(normalizeClassCode('   ')).toBe('')
  })
})

describe('isValidClassCode', () => {
  it('영숫자 6자리를 통과시킨다', () => {
    expect(isValidClassCode('AB12CD')).toBe(true)
  })

  it('길이가 다르면 거부한다', () => {
    expect(isValidClassCode('AB12C')).toBe(false)
    expect(isValidClassCode('AB12CDE')).toBe(false)
  })

  it('영숫자가 아닌 글자를 거부한다', () => {
    expect(isValidClassCode('AB12C!')).toBe(false)
    expect(isValidClassCode('한글코드다')).toBe(false)
  })
})

describe('generateClassCode', () => {
  it('유효한 코드를 만든다', () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidClassCode(generateClassCode())).toBe(true)
    }
  })

  it('헷갈리는 글자(0, O, 1, I)를 쓰지 않는다', () => {
    const codes = Array.from({ length: 200 }, generateClassCode).join('')
    expect(codes).not.toMatch(/[01OI]/)
  })
})
