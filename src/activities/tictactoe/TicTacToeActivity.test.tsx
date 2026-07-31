import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TicTacToeActivity from './TicTacToeActivity'

describe('TicTacToeActivity', () => {
  it('빈 칸 9개를 보여준다', () => {
    render(<TicTacToeActivity onSubmit={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: '빈 칸' })).toHaveLength(9)
  })

  it('칸을 누르면 O 가 놓이고 컴퓨터도 한 수 둔다', async () => {
    const user = userEvent.setup()
    render(<TicTacToeActivity onSubmit={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: '빈 칸' })[0])

    expect(screen.getAllByRole('button', { name: 'O' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'X' })).toHaveLength(1)
  })

  it('이미 놓인 칸은 다시 누를 수 없다', async () => {
    const user = userEvent.setup()
    render(<TicTacToeActivity onSubmit={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: '빈 칸' })[0])

    expect(screen.getByRole('button', { name: 'O' })).toBeDisabled()
  })

  it('전적을 처음에 0으로 보여준다', () => {
    render(<TicTacToeActivity onSubmit={vi.fn()} />)
    expect(screen.getByText('0승 0무 0패')).toBeInTheDocument()
  })

  it('설명을 쓰면 언제든 제출할 수 있다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<TicTacToeActivity onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText(/이기는 방법/), '가운데를 먼저 잡아요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    const payload = onSubmit.mock.calls[0][0]
    expect(payload.note).toBe('가운데를 먼저 잡아요')
    expect(payload.result.wins).toBe(0)
    expect(payload.solved).toBe(false)
  })

  it('다시 하기를 누르면 판이 비워진다', async () => {
    const user = userEvent.setup()
    render(<TicTacToeActivity onSubmit={vi.fn()} />)

    await user.click(screen.getAllByRole('button', { name: '빈 칸' })[0])
    await user.click(screen.getByRole('button', { name: '다시 하기' }))

    expect(screen.getAllByRole('button', { name: '빈 칸' })).toHaveLength(9)
  })
})
