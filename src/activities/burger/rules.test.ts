import { describe, it, expect } from 'vitest'
import { INGREDIENTS, CORRECT_ORDER, isComplete, isCorrect, shuffle } from './rules'

describe('재료 목록', () => {
  it('재료가 7개다', () => {
    expect(INGREDIENTS).toHaveLength(7)
  })

  it('id 가 겹치지 않는다', () => {
    expect(new Set(INGREDIENTS.map((i) => i.id)).size).toBe(7)
  })

  it('CORRECT_ORDER 는 INGREDIENTS 의 id 순서와 같다', () => {
    expect(CORRECT_ORDER).toEqual(INGREDIENTS.map((i) => i.id))
  })

  it('맨 아래는 아래빵, 맨 위는 위빵이다', () => {
    expect(CORRECT_ORDER[0]).toBe('bottom-bun')
    expect(CORRECT_ORDER[6]).toBe('top-bun')
  })
})

describe('isComplete', () => {
  it('7개를 다 쌓아야 완성이다', () => {
    expect(isComplete(CORRECT_ORDER)).toBe(true)
    expect(isComplete(CORRECT_ORDER.slice(0, 6))).toBe(false)
  })
})

describe('isCorrect', () => {
  it('정답 순서와 같으면 맞다', () => {
    expect(isCorrect(CORRECT_ORDER)).toBe(true)
  })

  it('순서가 하나라도 다르면 틀리다', () => {
    const swapped = [...CORRECT_ORDER]
    ;[swapped[1], swapped[2]] = [swapped[2], swapped[1]]
    expect(isCorrect(swapped)).toBe(false)
  })

  it('덜 쌓았으면 틀리다', () => {
    expect(isCorrect(CORRECT_ORDER.slice(0, 6))).toBe(false)
  })
})

describe('shuffle', () => {
  it('재료를 하나도 잃지 않는다', () => {
    const out = shuffle(INGREDIENTS, () => 0.5)
    expect(out.map((i) => i.id).sort()).toEqual([...CORRECT_ORDER].sort())
  })

  it('원본을 바꾸지 않는다', () => {
    const before = INGREDIENTS.map((i) => i.id)
    shuffle(INGREDIENTS, () => 0.9)
    expect(INGREDIENTS.map((i) => i.id)).toEqual(before)
  })

  it('rng 가 0 이면 순서가 뒤집힌다', () => {
    // Fisher-Yates 에서 rng()=0 이면 매번 0번 자리와 바꾼다.
    const out = shuffle(INGREDIENTS, () => 0)
    expect(out.map((i) => i.id)).not.toEqual(CORRECT_ORDER)
  })
})
