import { describe, it, expect } from 'vitest'
import { buildPayload } from './payload'

describe('buildPayload', () => {
  it('시작 시각과 지금 시각의 차이를 elapsedMs 로 넣는다', () => {
    const p = buildPayload(
      1000,
      { solved: true, attempts: 2, result: { a: 1 }, note: '설명' },
      () => 4500,
    )
    expect(p.elapsedMs).toBe(3500)
  })

  it('나머지 값을 그대로 담는다', () => {
    const p = buildPayload(
      0,
      { solved: false, attempts: 5, result: ['x'], note: '  적어봤어요  ' },
      () => 0,
    )
    expect(p.solved).toBe(false)
    expect(p.attempts).toBe(5)
    expect(p.result).toEqual(['x'])
  })

  it('설명의 앞뒤 공백을 정리한다', () => {
    const p = buildPayload(0, { solved: true, attempts: 1, result: null, note: '  답  ' }, () => 0)
    expect(p.note).toBe('답')
  })

  it('시계가 거꾸로 가도 elapsedMs 가 음수가 되지 않는다', () => {
    const p = buildPayload(5000, { solved: true, attempts: 1, result: null, note: 'a' }, () => 1000)
    expect(p.elapsedMs).toBe(0)
  })
})
