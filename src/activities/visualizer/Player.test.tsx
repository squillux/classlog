import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Player from './Player'

/*
 * 단계 이동은 타이머와 상관없으므로 진짜 타이머로 둔다.
 * 재생만 가짜 타이머를 쓰고, 그 안에서는 userEvent 대신 fireEvent 를 쓴다.
 * userEvent 는 클릭 사이에 지연을 두는데 가짜 타이머와 함께 쓰면
 * 서로를 기다리다 멈춘다.
 */

describe('Player 단계 이동', () => {
  it('앞으로 한 단계 옮긴다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Player total={5} index={1} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '다음' }))

    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('뒤로 한 단계 옮긴다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Player total={5} index={1} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '이전' }))

    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('처음이면 이전 버튼이 잠긴다', () => {
    render(<Player total={5} index={0} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()
  })

  it('마지막이면 다음 버튼이 잠긴다', () => {
    render(<Player total={5} index={4} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: '다음' })).toBeDisabled()
  })

  it('처음으로 되돌린다', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Player total={5} index={3} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: '처음으로' }))

    expect(onChange).toHaveBeenCalledWith(0)
  })

  it('몇 번째 단계인지 보여준다', () => {
    render(<Player total={5} index={2} onChange={vi.fn()} />)
    expect(screen.getByText('3 / 5')).toBeInTheDocument()
  })
})

describe('Player 재생', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  const click = (name: string) =>
    fireEvent.click(screen.getByRole('button', { name }))

  const tick = (ms: number) => act(() => { vi.advanceTimersByTime(ms) })

  it('재생을 누르면 시간이 지날 때마다 다음으로 넘어간다', () => {
    const onChange = vi.fn()
    render(<Player total={5} index={0} onChange={onChange} />)

    click('재생')
    tick(500)

    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('재생 중에는 일시정지 버튼이 된다', () => {
    render(<Player total={5} index={0} onChange={vi.fn()} />)

    click('재생')

    expect(screen.getByRole('button', { name: '일시정지' })).toBeInTheDocument()
  })

  it('일시정지하면 더 넘어가지 않는다', () => {
    const onChange = vi.fn()
    render(<Player total={5} index={0} onChange={onChange} />)

    click('재생')
    click('일시정지')
    onChange.mockClear()
    tick(2000)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('마지막에 닿으면 재생이 멈춘다', () => {
    render(<Player total={5} index={4} onChange={vi.fn()} />)

    click('재생')
    tick(2000)

    expect(screen.getByRole('button', { name: '재생' })).toBeInTheDocument()
  })

  it('속도를 바꾸면 그만큼 빨라진다', () => {
    const onChange = vi.fn()
    render(<Player total={5} index={0} onChange={onChange} />)

    click('빠르게')
    click('재생')
    tick(200)

    expect(onChange).toHaveBeenCalledWith(1)
  })
})
