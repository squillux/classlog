import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReflectionForm from './ReflectionForm'

describe('ReflectionForm', () => {
  it('질문을 보여준다', () => {
    render(<ReflectionForm question="왜 그럴까요?" onSubmit={vi.fn()} />)
    expect(screen.getByText('왜 그럴까요?')).toBeInTheDocument()
  })

  it('설명이 비어 있으면 제출 버튼이 잠긴다', () => {
    render(<ReflectionForm question="Q" onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: '제출하기' })).toBeDisabled()
  })

  it('공백만 쓰면 여전히 잠겨 있다', async () => {
    const user = userEvent.setup()
    render(<ReflectionForm question="왜 그럴까요?" onSubmit={vi.fn()} />)
    await user.type(screen.getByLabelText('왜 그럴까요?'), '   ')
    expect(screen.getByRole('button', { name: '제출하기' })).toBeDisabled()
  })

  it('설명을 쓰면 제출할 수 있고 내용을 넘긴다', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()
    render(<ReflectionForm question="왜 그럴까요?" onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('왜 그럴까요?'), '빵이 먼저여야 해요')
    await user.click(screen.getByRole('button', { name: '제출하기' }))

    expect(onSubmit).toHaveBeenCalledWith('빵이 먼저여야 해요')
  })

  it('힌트를 주면 보여준다', () => {
    render(<ReflectionForm question="Q" hint="한 문장이면 충분해요" onSubmit={vi.fn()} />)
    expect(screen.getByText('한 문장이면 충분해요')).toBeInTheDocument()
  })
})
