import { describe, it, expect } from 'vitest'
import { BARS, SEARCH_TARGET } from './data'
import {
  selectionSortSteps, bubbleSortSteps, linearSearchSteps, type Step,
} from './steps'

const last = (steps: Step[]) => steps[steps.length - 1]
const sorted = [...BARS].sort((a, b) => a - b)

describe('데이터', () => {
  it('막대는 여덟 개다', () => {
    expect(BARS).toHaveLength(8)
  })

  it('찾을 값은 배열 안에 있다', () => {
    expect(BARS).toContain(SEARCH_TARGET)
  })
})

describe('selectionSortSteps', () => {
  const steps = selectionSortSteps(BARS)

  it('마지막에 정렬이 끝나 있다', () => {
    expect(last(steps).array).toEqual(sorted)
  })

  it('비교 28번, 교환 5번이다', () => {
    expect(last(steps).comparisons).toBe(28)
    expect(last(steps).swaps).toBe(5)
  })

  it('마지막에는 모든 자리가 정해져 있다', () => {
    expect(last(steps).settled).toHaveLength(BARS.length)
  })

  it('중간에 원소가 사라지거나 생기지 않는다', () => {
    for (const step of steps) {
      expect([...step.array].sort((a, b) => a - b)).toEqual(sorted)
    }
  })

  it('모든 단계에 자막이 있다', () => {
    expect(steps.every((s) => s.caption.trim() !== '')).toBe(true)
  })

  it('원본 배열을 바꾸지 않는다', () => {
    const before = [...BARS]
    selectionSortSteps(BARS)
    expect(BARS).toEqual(before)
  })

  it('비교 횟수가 줄어들지 않는다', () => {
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].comparisons).toBeGreaterThanOrEqual(steps[i - 1].comparisons)
    }
  })
})

describe('bubbleSortSteps', () => {
  const steps = bubbleSortSteps(BARS)

  it('마지막에 정렬이 끝나 있다', () => {
    expect(last(steps).array).toEqual(sorted)
  })

  it('비교 25번, 교환 13번이다', () => {
    expect(last(steps).comparisons).toBe(25)
    expect(last(steps).swaps).toBe(13)
  })

  it('한 바퀴 동안 안 바꾸면 일찍 끝난다고 알린다', () => {
    expect(last(steps).caption).toContain('한 번도 바꾸지 않았')
  })

  it('마지막에는 모든 자리가 정해져 있다', () => {
    expect(last(steps).settled).toHaveLength(BARS.length)
  })

  it('모든 단계에 자막이 있다', () => {
    expect(steps.every((s) => s.caption.trim() !== '')).toBe(true)
  })
})

describe('두 정렬 비교', () => {
  it('선택정렬은 비교를 더 많이 하고 교환은 더 적게 한다', () => {
    const s = last(selectionSortSteps(BARS))
    const b = last(bubbleSortSteps(BARS))
    expect(s.comparisons).toBeGreaterThan(b.comparisons)
    expect(s.swaps).toBeLessThan(b.swaps)
  })
})

describe('linearSearchSteps', () => {
  const steps = linearSearchSteps(BARS, SEARCH_TARGET)

  it('찾은 자리에서 멈춘다', () => {
    expect(last(steps).found).toBe(BARS.indexOf(SEARCH_TARGET))
  })

  it('일곱 번 비교한다', () => {
    expect(last(steps).comparisons).toBe(7)
  })

  it('찾기 전에는 found 가 비어 있다', () => {
    expect(steps.slice(0, -1).every((s) => s.found === null)).toBe(true)
  })

  it('배열을 건드리지 않는다', () => {
    expect(steps.every((s) => s.array.join() === BARS.join())).toBe(true)
  })

  it('없는 값을 찾으면 끝까지 보고 못 찾았다고 알린다', () => {
    const miss = linearSearchSteps(BARS, 99)
    expect(last(miss).found).toBeNull()
    expect(last(miss).comparisons).toBe(BARS.length)
    expect(last(miss).caption).toContain('찾지 못했습니다')
  })

  it('모든 단계에 자막이 있다', () => {
    expect(steps.every((s) => s.caption.trim() !== '')).toBe(true)
  })
})
