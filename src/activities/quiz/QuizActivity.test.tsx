import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuizActivity from './QuizActivity'

describe('QuizActivity', () => {
  it('모든 문항을 보여준다', () => {
    render(<QuizActivity onSubmit={vi.fn()} />)
    expect(screen.getByText(/조건을 판단할 때 쓰는 도형/)).toBeInTheDocument()
    expect(screen.getByText(/작은 문제로 나누어/)).toBeInTheDocument()
    expect(screen.getByText(/되풀이하는 제어 구조/)).toBeInTheDocument()
  })

  it('제출하면 채점 결과를 onSubmit 으로 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<QuizActivity onSubmit={onSubmit} />)

    await user.click(screen.getByRole('radio', { name: '마름모' }))
    await user.click(screen.getByRole('radio', { name: '문제 분해' }))
    await user.type(screen.getByLabelText(/되풀이하는 제어 구조/), '반복')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const payload = onSubmit.mock.calls[0][0]
    expect(payload.score).toBe(3)
    expect(payload.total).toBe(3)
    expect(payload.answers).toHaveLength(3)
  })

  it('제출 후 점수를 화면에 보여준다', async () => {
    const user = userEvent.setup()
    render(<QuizActivity onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('radio', { name: '마름모' }))
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(await screen.findByText('3문항 중 1문항 맞았습니다.')).toBeInTheDocument()
  })

  it('제출 전에는 점수를 보여주지 않는다', () => {
    render(<QuizActivity onSubmit={vi.fn()} />)
    expect(screen.queryByText(/맞았습니다/)).not.toBeInTheDocument()
  })
})
