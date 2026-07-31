import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VisualizerActivity from './VisualizerActivity'

/*
 * 세 알고리즘을 끝까지 보려면 "다음"을 140번쯤 눌러야 한다.
 * userEvent 의 클릭 시뮬레이션은 그만큼 반복하기에는 느려서 5초를 넘긴다.
 * 반복 클릭에는 fireEvent 를 쓰고, 사람의 입력을 흉내 내야 하는 곳
 * (라디오 고르기, 글 쓰기)에서만 userEvent 를 쓴다.
 */

/**
 * 지금 고른 알고리즘을 끝까지 본다.
 * 버튼을 매번 다시 찾고, 혹시 끝나지 않아도 멈추도록 상한을 둔다.
 * 상한이 없으면 구현이 잘못됐을 때 테스트가 영원히 돈다.
 */
function watchToEnd() {
  // 버튼을 한 번만 찾는다. React 는 다시 그릴 때 같은 DOM 노드를 재사용하므로
  // disabled 값은 계속 최신이다. 반복마다 다시 찾으면 화면 전체를 140번
  // 훑게 되어 테스트가 제한 시간에 걸린다.
  const next = screen.getByRole('button', { name: '다음' }) as HTMLButtonElement
  for (let guard = 0; guard < 500; guard++) {
    if (next.disabled) return
    fireEvent.click(next)
  }
  throw new Error('끝까지 가지 못했습니다. 다음 버튼이 잠기지 않습니다.')
}

function watchAll() {
  for (const name of ['선택정렬', '버블정렬', '순차 탐색']) {
    fireEvent.click(screen.getByRole('button', { name: new RegExp(name) }))
    watchToEnd()
  }
}

describe('VisualizerActivity', () => {
  it('알고리즘 세 개를 고를 수 있다', () => {
    render(<VisualizerActivity onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /선택정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /버블정렬/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /순차 탐색/ })).toBeInTheDocument()
  })

  it('처음에는 관찰한 것이 없다고 알린다', () => {
    render(<VisualizerActivity onSubmit={vi.fn()} />)
    expect(screen.getByText('3개 중 0개 관찰함')).toBeInTheDocument()
  })

  it('다 보기 전에는 문항이 열리지 않는다', () => {
    render(<VisualizerActivity onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '제출하기' })).not.toBeInTheDocument()
  })

  it('알고리즘을 바꾸면 처음 단계로 돌아간다', async () => {
    const user = userEvent.setup()
    render(<VisualizerActivity onSubmit={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '다음' }))
    await user.click(screen.getByRole('button', { name: /버블정렬/ }))

    expect(screen.getByRole('button', { name: '이전' })).toBeDisabled()
  })

  it('하나를 끝까지 보면 관찰 수가 올라간다', () => {
    render(<VisualizerActivity onSubmit={vi.fn()} />)

    watchToEnd()

    expect(screen.getByText('3개 중 1개 관찰함')).toBeInTheDocument()
  })

  it('세 개를 다 보면 문항이 열린다', () => {
    render(<VisualizerActivity onSubmit={vi.fn()} />)

    watchAll()

    expect(screen.getByText('3개를 모두 관찰했습니다')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제출하기' })).toBeInTheDocument()
  })

  it('제출하면 관찰 기록과 답을 담아 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<VisualizerActivity onSubmit={onSubmit} />)

    watchAll()
    await user.click(screen.getByRole('radio', { name: '버블정렬' }))
    await user.click(screen.getByRole('radio', { name: '7번' }))
    await user.type(screen.getByLabelText(/어떻게 다른가요/), '선택정렬이 자리를 덜 바꿔요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    const payload = onSubmit.mock.calls[0][0]
    expect(payload.solved).toBe(true)
    expect(payload.note).toBe('선택정렬이 자리를 덜 바꿔요')
    expect(payload.result.watched).toHaveLength(3)
    expect(payload.result.quiz.score).toBe(2)
    expect(payload.attempts).toBe(3)
  })
})
