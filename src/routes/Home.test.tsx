import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'

const enterClass = vi.fn()
const navigate = vi.fn()

vi.mock('../lib/session', () => ({
  enterClass: (...args: unknown[]) => enterClass(...args),
  loadSession: () => null,
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router')
  return { ...actual, useNavigate: () => navigate }
})

const Home = (await import('./Home')).default

beforeEach(() => {
  enterClass.mockReset()
  navigate.mockReset()
})

function renderHome() {
  return render(<MemoryRouter><Home /></MemoryRouter>)
}

describe('Home', () => {
  it('입력값을 모아 enterClass 를 부르고 활동 목록으로 보낸다', async () => {
    enterClass.mockResolvedValue({ studentId: 's1' })
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByLabelText('학급 코드'), 'ab12cd')
    await user.type(screen.getByLabelText('번호'), '7')
    await user.type(screen.getByLabelText('이름'), '김하늘')
    await user.click(screen.getByRole('button', { name: '들어가기' }))

    expect(enterClass).toHaveBeenCalledWith('ab12cd', 7, '김하늘')
    expect(navigate).toHaveBeenCalledWith('/activities')
  })

  it('실패하면 이유를 화면에 보여주고 이동하지 않는다', async () => {
    enterClass.mockRejectedValue(new Error('학급 코드를 찾을 수 없습니다'))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByLabelText('학급 코드'), 'ZZ99ZZ')
    await user.type(screen.getByLabelText('번호'), '7')
    await user.type(screen.getByLabelText('이름'), '김하늘')
    await user.click(screen.getByRole('button', { name: '들어가기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('학급 코드를 찾을 수 없습니다')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('보내는 동안 버튼을 잠가 두 번 눌리지 않게 한다', async () => {
    let release: (v: unknown) => void = () => {}
    enterClass.mockReturnValue(new Promise((r) => { release = r }))
    const user = userEvent.setup()
    renderHome()

    await user.type(screen.getByLabelText('학급 코드'), 'AB12CD')
    await user.type(screen.getByLabelText('번호'), '7')
    await user.type(screen.getByLabelText('이름'), '김하늘')
    await user.click(screen.getByRole('button', { name: '들어가기' }))

    expect(screen.getByRole('button', { name: '들어가는 중…' })).toBeDisabled()
    release({ studentId: 's1' })
  })
})
