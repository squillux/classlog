import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RiverActivity from './RiverActivity'

type User = ReturnType<typeof userEvent.setup>

/** 1단계 규칙 빈칸을 정답으로 채우고 넘어간다. */
async function passRules(user: User) {
  const values = ['1', '농부', '염소', '양배추']
  const inputs = screen.getAllByRole('textbox')
  for (let i = 0; i < values.length; i++) {
    await user.type(inputs[i], values[i])
  }
  await user.click(screen.getByRole('button', { name: '확인하기' }))
}

async function cross(user: User, label: string | null) {
  if (label) await user.click(screen.getByRole('button', { name: new RegExp(label) }))
  await user.click(screen.getByRole('button', { name: '건너가기' }))
}

/** 7수 정답을 그대로 밟는다. */
async function solve(user: User) {
  for (const label of ['염소', null, '늑대', '염소', '양배추', null, '염소']) {
    await cross(user, label)
  }
}

describe('RiverActivity 단계 진행', () => {
  it('규칙 빈칸부터 보여준다', () => {
    render(<RiverActivity onSubmit={vi.fn()} />)
    expect(screen.getByText('이 문제에는 어떤 규칙이 숨어 있을까요?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '건너가기' })).not.toBeInTheDocument()
  })

  it('규칙이 틀리면 넘어가지 않는다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)

    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], '3')
    await user.click(screen.getByRole('button', { name: '확인하기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('아직 맞지 않은 칸이 있어요')
    expect(screen.queryByRole('button', { name: '건너가기' })).not.toBeInTheDocument()
  })

  it('규칙을 다 맞히면 강 건너기로 넘어간다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)

    await passRules(user)

    expect(await screen.findByRole('button', { name: '건너가기' })).toBeInTheDocument()
  })
})

describe('RiverActivity 강 건너기', () => {
  it('배에 무엇을 태웠는지 보여준다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)
    await passRules(user)

    expect(screen.getByText(/배가 비어 있습니다/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /염소/ }))

    // 배 안내줄에 태운 것이 이모지와 함께 나타난다.
    expect(screen.getByText('🐐 염소')).toBeInTheDocument()
    expect(screen.queryByText(/배가 비어 있습니다/)).not.toBeInTheDocument()
  })

  it('규칙을 어기면 되돌리고 이유를 알려준다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)
    await passRules(user)

    await cross(user, '양배추')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '농부가 없으면 늑대가 염소를 잡아먹습니다.',
    )
  })

  it('다 건너면 정리 단계로 갈 수 있다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)
    await passRules(user)

    await solve(user)

    expect(await screen.findByText('모두 무사히 건넜습니다!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '정리하러 가기' })).toBeInTheDocument()
  })
})

describe('RiverActivity 정리하기', () => {
  async function reachFinal(user: User) {
    await passRules(user)
    await solve(user)
    await user.click(screen.getByRole('button', { name: '정리하러 가기' }))
  }

  it('마지막 퀴즈를 보여준다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)
    await reachFinal(user)

    expect(screen.getByText(/최소 몇 번 움직여야/)).toBeInTheDocument()
    expect(screen.getByText(/가장 먼저 태워야 하는 것은/)).toBeInTheDocument()
    expect(screen.getByText(/이유를 적어/)).toBeInTheDocument()
  })

  it('다 채우기 전에는 제출할 수 없다', async () => {
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={vi.fn()} />)
    await reachFinal(user)

    expect(screen.getByRole('button', { name: '제출하기' })).toBeDisabled()
  })

  it('제출하면 세 단계 결과를 모두 담아 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<RiverActivity onSubmit={onSubmit} />)
    await reachFinal(user)

    await user.click(screen.getByRole('radio', { name: '7번' }))
    await user.click(screen.getByRole('radio', { name: '염소' }))
    await user.type(screen.getByLabelText(/이유를 적어/), '염소가 둘 다와 못 있어서요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    const payload = onSubmit.mock.calls[0][0]
    expect(payload.solved).toBe(true)
    expect(payload.note).toBe('염소가 둘 다와 못 있어서요')
    expect(payload.result.moves).toEqual([
      '염소:건너감', '혼자:돌아옴', '늑대:건너감', '염소:돌아옴',
      '양배추:건너감', '혼자:돌아옴', '염소:건너감',
    ])
    expect(payload.result.violations).toBe(0)
    expect(payload.result.quiz.score).toBe(2)
    expect(payload.result.rules.attempts).toBe(1)
  })
})
