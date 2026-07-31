export type Mark = 'O' | 'X'
export type Cell = Mark | null
export type Board = Cell[]

export const EMPTY_BOARD: Board = Array(9).fill(null)

export const LINES: number[][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

/**
 * 컴퓨터가 최선을 놓칠 확률. 완벽한 틱택토는 절대 지지 않아
 * 학생이 이길 기회가 없다. 수업 반응을 보고 조절한다.
 */
export const BLUNDER_CHANCE = 0.35

export function winner(board: Board): Mark | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a]
    }
  }
  return null
}

export function isFull(board: Board): boolean {
  return board.every((cell) => cell !== null)
}

/** mark 가 한 수로 이길 수 있는 자리. 없으면 null. */
export function winningMove(board: Board, mark: Mark): number | null {
  for (let i = 0; i < board.length; i++) {
    if (board[i]) continue
    const trial = [...board]
    trial[i] = mark
    if (winner(trial) === mark) return i
  }
  return null
}

/** 컴퓨터(X)의 다음 수. 둘 곳이 없으면 -1. */
export function chooseComputerMove(board: Board, rng: () => number): number {
  const empties = board
    .map((cell, i) => (cell === null ? i : -1))
    .filter((i) => i >= 0)
  if (empties.length === 0) return -1

  // 일부러 최선을 놓치는 경우. 이것이 학생이 이길 수 있는 빈틈이다.
  if (rng() >= BLUNDER_CHANCE) {
    const win = winningMove(board, 'X')
    if (win !== null) return win
    const block = winningMove(board, 'O')
    if (block !== null) return block
  }

  return empties[Math.min(empties.length - 1, Math.floor(rng() * empties.length))]
}
