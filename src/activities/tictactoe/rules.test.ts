import { describe, it, expect } from 'vitest'
import {
  EMPTY_BOARD, LINES, winner, isFull, winningMove, chooseComputerMove, type Board,
} from './rules'

/** '.' 은 빈 칸. 'OX.......' 처럼 아홉 글자로 판을 적는다. */
function board(text: string): Board {
  return [...text].map((c) => (c === '.' ? null : (c as 'O' | 'X')))
}

/** 정해진 값을 순서대로 돌려주는 난수원. 다 쓰면 마지막 값을 반복한다. */
function fakeRng(...values: number[]) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

describe('LINES', () => {
  it('이길 수 있는 줄이 8개다', () => {
    expect(LINES).toHaveLength(8)
  })
})

describe('winner', () => {
  it('빈 판에는 승자가 없다', () => {
    expect(winner(EMPTY_BOARD)).toBeNull()
  })

  it('가로줄을 잡아낸다', () => {
    expect(winner(board('OOO..X.X.'))).toBe('O')
  })

  it('세로줄을 잡아낸다', () => {
    expect(winner(board('X.OX.OX..'))).toBe('X')
  })

  it('대각선을 잡아낸다', () => {
    expect(winner(board('O..XO..XO'))).toBe('O')
    expect(winner(board('..X.X.X..'))).toBe('X')
  })

  it('여덟 줄을 모두 알아본다', () => {
    for (const line of LINES) {
      const b: Board = Array(9).fill(null)
      for (const i of line) b[i] = 'O'
      expect(winner(b)).toBe('O')
    }
  })
})

describe('isFull', () => {
  it('빈 칸이 남아 있으면 아니다', () => {
    expect(isFull(board('OXOXOXOX.'))).toBe(false)
  })

  it('아홉 칸이 다 차면 맞다', () => {
    expect(isFull(board('OXOXOXOXO'))).toBe(true)
  })
})

describe('winningMove', () => {
  it('한 수로 이길 자리를 찾는다', () => {
    expect(winningMove(board('XX.......'), 'X')).toBe(2)
  })

  it('막을 자리도 같은 함수로 찾는다', () => {
    expect(winningMove(board('OO.......'), 'O')).toBe(2)
  })

  it('그런 자리가 없으면 null', () => {
    expect(winningMove(board('X.O......'), 'X')).toBeNull()
  })

  it('이미 찬 칸은 고르지 않는다', () => {
    expect(winningMove(board('XXO......'), 'X')).toBeNull()
  })
})

describe('chooseComputerMove', () => {
  it('실수하지 않을 때는 이길 자리를 고른다', () => {
    // 첫 난수는 실수 판정용. 0.9 는 실수 확률(0.35)보다 크므로 실수하지 않는다.
    expect(chooseComputerMove(board('XX.OO....'), fakeRng(0.9))).toBe(2)
  })

  it('이길 수 없으면 학생이 이길 자리를 막는다', () => {
    expect(chooseComputerMove(board('OO.X.....'), fakeRng(0.9))).toBe(2)
  })

  it('이길 자리를 막을 자리보다 먼저 고른다', () => {
    // X 는 0,1 로 2에서 이길 수 있고 O 는 3,4 로 5에서 이길 수 있다.
    expect(chooseComputerMove(board('XX.OO....'), fakeRng(0.9))).toBe(2)
  })

  it('실수할 때는 막지 않고 아무 데나 둔다', () => {
    // 첫 난수 0.1 < 0.35 이므로 실수한다. 두 번째 난수로 빈 칸을 고른다.
    // 빈 칸은 [2,4,5,6,7,8]. 0.99 를 주면 마지막인 8 을 고르므로 2 를 막지 않는다.
    const move = chooseComputerMove(board('OO.X.....'), fakeRng(0.1, 0.99))
    expect(move).not.toBe(2)
  })

  it('언제나 빈 칸을 고른다', () => {
    const b = board('OXOXOX...')
    for (const r of [0, 0.2, 0.5, 0.99]) {
      expect(b[chooseComputerMove(b, fakeRng(r, r))]).toBeNull()
    }
  })

  it('둘 곳이 없으면 -1 을 준다', () => {
    expect(chooseComputerMove(board('OXOXOXOXO'), fakeRng(0.9))).toBe(-1)
  })
})
