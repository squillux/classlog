import { describe, it, expect } from 'vitest'
import { summarize, noteOf, detailsOf } from './submissionSummary'

describe('summarize', () => {
  it('퀴즈는 점수로 보여준다', () => {
    expect(summarize({ score: 2, total: 3 })).toBe('2 / 3')
  })

  it('미니게임은 성공 여부로 보여준다', () => {
    expect(summarize({ solved: true, attempts: 1 })).toBe('성공')
    expect(summarize({ solved: false, attempts: 4 })).toBe('미완')
  })

  it('점수가 있으면 점수를 먼저 쓴다', () => {
    expect(summarize({ score: 1, total: 3, solved: false })).toBe('1 / 3')
  })

  it('알 수 없는 모양은 줄표', () => {
    expect(summarize(null)).toBe('—')
    expect(summarize({})).toBe('—')
    expect(summarize('이상한 값')).toBe('—')
  })
})

describe('noteOf', () => {
  it('학생이 쓴 설명을 꺼낸다', () => {
    expect(noteOf({ note: '빵이 먼저예요' })).toBe('빵이 먼저예요')
  })

  it('설명이 없으면 null', () => {
    expect(noteOf({ score: 1 })).toBeNull()
    expect(noteOf({ note: '   ' })).toBeNull()
    expect(noteOf(null)).toBeNull()
  })
})

describe('detailsOf', () => {
  it('시도 횟수와 걸린 시간을 문장으로 만든다', () => {
    expect(detailsOf({ attempts: 3, elapsedMs: 90_000 })).toBe('3번 시도 · 1분 30초')
  })

  it('1분이 안 되면 초만 쓴다', () => {
    expect(detailsOf({ attempts: 1, elapsedMs: 45_000 })).toBe('1번 시도 · 45초')
  })

  it('미니게임이 아니면 null', () => {
    expect(detailsOf({ score: 2, total: 3 })).toBeNull()
    expect(detailsOf(null)).toBeNull()
  })
})
