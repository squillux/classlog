import { useState } from 'react'
import type { ActivityProps } from '../types'
import { buildPayload } from '../shared/payload'
import ReflectionForm from '../shared/ReflectionForm'
import { EMPTY_BOARD, chooseComputerMove, isFull, winner, type Board } from './rules'

const QUESTION = '이기는 방법을 찾았나요? 규칙으로 말해 보세요.'

type Tally = { wins: number; draws: number; losses: number }

export default function TicTacToeActivity({ onSubmit }: ActivityProps) {
  const [startedAt] = useState(() => Date.now())
  const [board, setBoard] = useState<Board>(EMPTY_BOARD)
  const [tally, setTally] = useState<Tally>({ wins: 0, draws: 0, losses: 0 })

  const won = winner(board)
  const over = won !== null || isFull(board)

  /**
   * 판이 끝나는 그 수에서만 불린다. play() 가 이미 끝난 판에서는 곧장
   * 돌아가므로 한 판이 두 번 세어지지 않는다.
   */
  function record(next: Board) {
    const w = winner(next)
    if (w === 'O') setTally((t) => ({ ...t, wins: t.wins + 1 }))
    else if (w === 'X') setTally((t) => ({ ...t, losses: t.losses + 1 }))
    else if (isFull(next)) setTally((t) => ({ ...t, draws: t.draws + 1 }))
  }

  function play(index: number) {
    if (board[index] || over) return

    const afterStudent = [...board]
    afterStudent[index] = 'O'
    if (winner(afterStudent) || isFull(afterStudent)) {
      setBoard(afterStudent)
      record(afterStudent)
      return
    }

    const reply = chooseComputerMove(afterStudent, Math.random)
    const afterComputer = [...afterStudent]
    if (reply >= 0) afterComputer[reply] = 'X'
    setBoard(afterComputer)
    record(afterComputer)
  }

  function again() {
    setBoard(EMPTY_BOARD)
  }

  const games = tally.wins + tally.draws + tally.losses

  return (
    <section className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">활동</p>
        <h2>틱택토</h2>
        <p className="muted">
          O 로 먼저 두세요. 여러 판 두면서 이기는 규칙을 찾아보세요.
        </p>
      </div>

      <div className="game__board stack stack--tight">
        <p className="game__status">
          {tally.wins}승 {tally.draws}무 {tally.losses}패
        </p>

        <div className="ttt">
          {board.map((cell, i) => (
            <button
              key={i}
              type="button"
              className="ttt__cell"
              aria-label={cell ?? '빈 칸'}
              disabled={cell !== null || over}
              onClick={() => play(i)}
            >
              {cell}
            </button>
          ))}
        </div>

        {over && (
          <p className="game__status">
            {won === 'O' ? '이겼습니다!' : won === 'X' ? '졌습니다.' : '비겼습니다.'}
          </p>
        )}

        <button type="button" className="btn btn--utility" onClick={again}>
          다시 하기
        </button>
      </div>

      <ReflectionForm
        question={QUESTION}
        hint="아직 못 이겼어도 괜찮아요. 무엇을 알아냈는지 적어 보세요."
        onSubmit={(note) =>
          onSubmit(
            buildPayload(startedAt, {
              solved: tally.wins > 0,
              attempts: games,
              result: { ...tally, lastBoard: board },
              note,
            }),
          )
        }
      />
    </section>
  )
}
