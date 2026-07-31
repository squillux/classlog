import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BurgerActivity from './BurgerActivity'
import { INGREDIENTS } from './rules'

/** 정답 순서대로 재료를 클릭한다. */
async function stackCorrectly(user: ReturnType<typeof userEvent.setup>) {
  for (const ing of INGREDIENTS) {
    await user.click(screen.getByRole('button', { name: ing.label }))
  }
}

describe('BurgerActivity', () => {
  it('재료 7개를 모두 보여준다', () => {
    render(<BurgerActivity onSubmit={vi.fn()} />)
    for (const ing of INGREDIENTS) {
      expect(screen.getByRole('button', { name: ing.label })).toBeInTheDocument()
    }
  })

  it('쌓기 전에는 설명 폼이 없다', () => {
    render(<BurgerActivity onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '제출하기' })).not.toBeInTheDocument()
  })

  it('정답 순서로 쌓으면 성공을 알리고 설명 폼이 나온다', async () => {
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={vi.fn()} />)

    await stackCorrectly(user)

    expect(await screen.findByText('순서가 맞습니다!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제출하기' })).toBeInTheDocument()
  })

  it('순서가 틀리면 알리고 다시 쌓게 한다', async () => {
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={vi.fn()} />)

    // 위빵부터 거꾸로 쌓는다.
    for (const ing of [...INGREDIENTS].reverse()) {
      await user.click(screen.getByRole('button', { name: ing.label }))
    }

    expect(await screen.findByText('순서가 다릅니다. 다시 해 보세요.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '제출하기' })).not.toBeInTheDocument()
  })

  it('틀렸을 때 다시 쌓기로 한 번에 비운다', async () => {
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={vi.fn()} />)

    for (const ing of [...INGREDIENTS].reverse()) {
      await user.click(screen.getByRole('button', { name: ing.label }))
    }
    await user.click(screen.getByRole('button', { name: '다시 쌓기' }))

    expect(screen.getByText('아직 아무것도 쌓지 않았어요.')).toBeInTheDocument()
    for (const ing of INGREDIENTS) {
      expect(screen.getByRole('button', { name: ing.label })).toBeEnabled()
    }
  })

  it('맨 위 재료를 빼낼 수 있다', async () => {
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '아래빵' }))
    expect(screen.getByRole('button', { name: '아래빵' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '맨 위 빼기' }))
    expect(screen.getByRole('button', { name: '아래빵' })).toBeEnabled()
  })

  it('제출하면 쌓은 순서와 설명을 담아 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<BurgerActivity onSubmit={onSubmit} />)

    await stackCorrectly(user)
    await user.type(screen.getByLabelText(/왜 이 순서여야/), '빵이 먼저예요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const payload = onSubmit.mock.calls[0][0]
    expect(payload.solved).toBe(true)
    expect(payload.note).toBe('빵이 먼저예요')
    expect(payload.result.order).toEqual(INGREDIENTS.map((i) => i.id))
    expect(payload.attempts).toBe(1)
  })
})
