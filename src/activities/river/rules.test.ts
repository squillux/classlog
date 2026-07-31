import { describe, it, expect } from 'vitest'
import {
  INITIAL, move, violation, violationMessage, isSolved, canCarry, moveLabel, SOLUTION,
  type RiverState,
} from './rules'

describe('move', () => {
  it('농부를 반대편으로 옮긴다', () => {
    expect(move(INITIAL, null).farmer).toBe('right')
  })

  it('태운 물건도 함께 옮긴다', () => {
    const next = move(INITIAL, 'goat')
    expect(next.positions.goat).toBe('right')
    expect(next.positions.wolf).toBe('left')
  })

  it('원본 상태를 바꾸지 않는다', () => {
    move(INITIAL, 'goat')
    expect(INITIAL.farmer).toBe('left')
    expect(INITIAL.positions.goat).toBe('left')
  })
})

describe('canCarry', () => {
  it('농부와 같은 편에 있어야 태울 수 있다', () => {
    expect(canCarry(INITIAL, 'goat')).toBe(true)
  })

  it('농부와 다른 편이면 태울 수 없다', () => {
    const after = move(INITIAL, 'goat')
    expect(canCarry(after, 'wolf')).toBe(false)
  })
})

describe('violation', () => {
  it('농부가 없는 쪽에 늑대와 양이 있으면 양이 잡아먹힌다', () => {
    // 농부가 양배추만 데리고 건너가 늑대와 양을 남긴다.
    const state = move(INITIAL, 'cabbage')
    expect(violation(state)).toBe('goat')
  })

  it('농부가 없는 쪽에 양과 양배추가 있으면 양배추가 먹힌다', () => {
    const state = move(INITIAL, 'wolf')
    expect(violation(state)).toBe('cabbage')
  })

  it('늑대와 양배추만 남는 것은 괜찮다', () => {
    const state = move(INITIAL, 'goat')
    expect(violation(state)).toBeNull()
  })

  it('농부가 같이 있으면 아무 일도 없다', () => {
    expect(violation(INITIAL)).toBeNull()
  })
})

describe('violationMessage', () => {
  it('무엇이 왜 사라지는지 알려준다', () => {
    expect(violationMessage('goat')).toContain('늑대')
    expect(violationMessage('cabbage')).toContain('양')
  })
})

describe('isSolved', () => {
  it('처음에는 아니다', () => {
    expect(isSolved(INITIAL)).toBe(false)
  })

  it('농부와 셋이 모두 건너편에 있으면 끝이다', () => {
    const done: RiverState = {
      farmer: 'right',
      positions: { wolf: 'right', goat: 'right', cabbage: 'right' },
    }
    expect(isSolved(done)).toBe(true)
  })
})

describe('moveLabel', () => {
  it('태운 것과 방향을 적는다', () => {
    expect(moveLabel('goat', 'left')).toBe('양:건너감')
    expect(moveLabel('goat', 'right')).toBe('양:돌아옴')
  })

  it('아무것도 안 태우면 혼자라고 적는다', () => {
    expect(moveLabel(null, 'right')).toBe('혼자:돌아옴')
  })
})

describe('SOLUTION', () => {
  it('7수다', () => {
    expect(SOLUTION).toHaveLength(7)
  })

  it('규칙을 한 번도 어기지 않고 문제를 푼다', () => {
    let state = INITIAL
    for (const carried of SOLUTION) {
      state = move(state, carried)
      expect(violation(state)).toBeNull()
    }
    expect(isSolved(state)).toBe(true)
  })

  it('정답 경로를 라벨로 적으면 설계 문서와 같다', () => {
    let state = INITIAL
    const labels: string[] = []
    for (const carried of SOLUTION) {
      labels.push(moveLabel(carried, state.farmer))
      state = move(state, carried)
    }
    expect(labels).toEqual([
      '양:건너감', '혼자:돌아옴', '늑대:건너감', '양:돌아옴',
      '양배추:건너감', '혼자:돌아옴', '양:건너감',
    ])
  })
})
