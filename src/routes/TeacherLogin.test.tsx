import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

const signInTeacher = vi.fn()
const navigate = vi.fn()

vi.mock('../lib/teacher', () => ({ signInTeacher: (...a: unknown[]) => signInTeacher(...a) }))
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

const TeacherLogin = (await import('./TeacherLogin')).default

beforeEach(() => { signInTeacher.mockReset(); navigate.mockReset() })

describe('TeacherLogin', () => {
  it('로그인에 성공하면 대시보드로 보낸다', async () => {
    signInTeacher.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<MemoryRouter><TeacherLogin /></MemoryRouter>)

    await user.type(screen.getByLabelText('이메일'), 'a@b.c')
    await user.type(screen.getByLabelText('비밀번호'), 'pw')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(signInTeacher).toHaveBeenCalledWith('a@b.c', 'pw')
    expect(navigate).toHaveBeenCalledWith('/teacher/dashboard')
  })

  it('실패하면 이유를 보여준다', async () => {
    signInTeacher.mockRejectedValue(new Error('자격 증명이 올바르지 않습니다'))
    const user = userEvent.setup()
    render(<MemoryRouter><TeacherLogin /></MemoryRouter>)

    await user.type(screen.getByLabelText('이메일'), 'a@b.c')
    await user.type(screen.getByLabelText('비밀번호'), 'x')
    await user.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('자격 증명이 올바르지 않습니다')
    expect(navigate).not.toHaveBeenCalled()
  })
})
