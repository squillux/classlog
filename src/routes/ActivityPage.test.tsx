import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'

const saveSubmission = vi.fn()
const loadSession = vi.fn()

vi.mock('../lib/submission', () => ({ saveSubmission: (...a: unknown[]) => saveSubmission(...a) }))
vi.mock('../lib/session', () => ({ loadSession: () => loadSession() }))
vi.mock('../activities', () => ({
  findActivity: (id: string) =>
    id === 'demo'
      ? {
          id: 'demo', title: '데모',
          Component: ({ onSubmit }: { onSubmit: (p: unknown) => void }) => (
            <button type="button" onClick={() => onSubmit({ ok: true })}>보내기</button>
          ),
        }
      : undefined,
}))

const ActivityPage = (await import('./ActivityPage')).default

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes><Route path="/activities/:activityId" element={<ActivityPage />} /></Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  saveSubmission.mockReset()
  loadSession.mockReset()
  loadSession.mockReturnValue({ studentId: 's1', className: '1학년 3반' })
})

describe('ActivityPage', () => {
  it('활동이 낸 제출물을 저장한다', async () => {
    saveSubmission.mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAt('/activities/demo')

    await user.click(screen.getByRole('button', { name: '보내기' }))

    expect(saveSubmission).toHaveBeenCalledWith('s1', 'demo', { ok: true })
    expect(await screen.findByRole('status')).toHaveTextContent('제출했습니다')
  })

  it('저장에 실패하면 알린다', async () => {
    saveSubmission.mockRejectedValue(new Error('권한이 없습니다'))
    const user = userEvent.setup()
    renderAt('/activities/demo')

    await user.click(screen.getByRole('button', { name: '보내기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('권한이 없습니다')
  })

  it('세션이 없으면 입장 안내를 보여준다', () => {
    loadSession.mockReturnValue(null)
    renderAt('/activities/demo')
    expect(screen.getByText('먼저 학급 코드로 들어와 주세요.')).toBeInTheDocument()
  })

  it('없는 활동이면 안내를 보여준다', () => {
    renderAt('/activities/없는활동')
    expect(screen.getByText('활동을 찾을 수 없습니다.')).toBeInTheDocument()
  })
})
