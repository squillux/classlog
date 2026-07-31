import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RiverActivity from './RiverActivity'

type User = ReturnType<typeof userEvent.setup>

async function cross(user: User, label: string | null) {
  if (label) await user.click(screen.getByRole('button', { name: label }))
  await user.click(screen.getByRole('button', { name: '건너가기' }))
}

/** 7수 정답을 그대로 밟는다. */
async function solve(user: User) {
  for (const label of ['양', null, '늑대', '양', '양배추', null, '양']) {
    await cross(user, label)
  }
}

describe('RiverActivity', () => {
  it('처음에는 셋 다 이쪽 편에 있다', () => {
    render(<RiverActivity onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: '늑대' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '양' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '양배추' })).toBeEnabled()
  })

  it('규칙을 어기면 되돌리고 이유를 알려준다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)

    // 양배추를 데려가면 늑대와 양이 남는다.
    await cross(user, '양배추')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '농부가 없으면 늑대가 양을 잡아먹습니다.',
    )
    // 되돌아왔으므로 양배추를 다시 고를 수 있다.
    expect(screen.getByRole('button', { name: '양배추' })).toBeEnabled()
  })

  it('풀기 전에는 설명 폼이 없다', () => {
    render(<RiverActivity onSubmit={vi.fn()} />)
    expect(screen.queryByRole('button', { name: '제출하기' })).not.toBeInTheDocument()
  })

  it('다 건너면 성공을 알리고 설명 폼이 나온다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)

    await solve(user)

    expect(await screen.findByText('모두 무사히 건넜습니다!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제출하기' })).toBeInTheDocument()
  })

  it('제출하면 이동 기록과 어긴 횟수를 담아 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={onSubmit} />)

    await cross(user, '양배추') // 일부러 한 번 어긴다
    await solve(user)
    await user.type(screen.getByLabelText(/꼭 기억해야 하는 규칙/), '양을 혼자 두면 안 돼요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    const payload = onSubmit.mock.calls[0][0]
    expect(payload.solved).toBe(true)
    expect(payload.result.violations).toBe(1)
    expect(payload.result.moves).toEqual([
      '양:건너감', '혼자:돌아옴', '늑대:건너감', '양:돌아옴',
      '양배추:건너감', '혼자:돌아옴', '양:건너감',
    ])
  })

  it('처음부터 다시 하면 기록이 지워진다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)

    await cross(user, '양')
    await user.click(screen.getByRole('button', { name: '처음부터' }))

    expect(screen.getByRole('button', { name: '양' })).toBeEnabled()
    expect(screen.getByText('아직 아무도 건너지 않았어요.')).toBeInTheDocument()
  })
})
