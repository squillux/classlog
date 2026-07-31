import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

const loadSession = vi.fn()
const listSubmittedActivityIds = vi.fn()

vi.mock('../lib/session', () => ({ loadSession: () => loadSession() }))
vi.mock('../lib/submission', () => ({
  listSubmittedActivityIds: (id: string) => listSubmittedActivityIds(id),
}))
vi.mock('../activities', () => ({
  activities: [
    { id: 'quiz', title: '퀴즈', Component: () => null },
    { id: 'burger', title: '햄버거 만들기', Component: () => null },
    { id: 'river', title: '강 건너기', Component: () => null },
  ],
}))

const ActivityList = (await import('./ActivityList')).default

beforeEach(() => {
  loadSession.mockReset()
  listSubmittedActivityIds.mockReset()
  loadSession.mockReturnValue({
    studentId: 's1', classId: 'c1', className: '1학년 3반',
    number: 7, displayName: '김하늘',
  })
  listSubmittedActivityIds.mockResolvedValue([])
})

function renderList() {
  return render(<MemoryRouter><ActivityList /></MemoryRouter>)
}

describe('ActivityList', () => {
  it('세션이 없으면 입장 안내를 보여준다', () => {
    loadSession.mockReturnValue(null)
    renderList()
    expect(screen.getByText('먼저 학급 코드로 들어와 주세요.')).toBeInTheDocument()
  })

  it('활동을 모두 보여준다', async () => {
    renderList()
    expect(await screen.findByText('퀴즈')).toBeInTheDocument()
    expect(screen.getByText('햄버거 만들기')).toBeInTheDocument()
    expect(screen.getByText('강 건너기')).toBeInTheDocument()
  })

  it('제출하지 않았으면 제출완료 표시가 없다', async () => {
    renderList()
    await screen.findByText('퀴즈')
    expect(screen.queryByText('제출 완료')).not.toBeInTheDocument()
  })

  it('제출한 활동에 제출완료 표시를 붙인다', async () => {
    listSubmittedActivityIds.mockResolvedValue(['quiz'])
    renderList()
    expect(await screen.findByText('제출 완료')).toBeInTheDocument()
  })

  it('제출한 활동을 목록 맨 뒤로 보낸다', async () => {
    listSubmittedActivityIds.mockResolvedValue(['quiz'])
    renderList()
    await screen.findByText('제출 완료')

    const titles = screen.getAllByRole('link').map((a) => a.textContent)
    expect(titles).toEqual(['햄버거 만들기', '강 건너기', '퀴즈제출 완료'])
  })

  it('제출한 활동은 남은 것들 사이의 순서를 유지한다', async () => {
    listSubmittedActivityIds.mockResolvedValue(['quiz', 'burger'])
    renderList()
    await screen.findAllByText('제출 완료')

    const titles = screen.getAllByRole('link').map((a) => a.textContent)
    expect(titles).toEqual(['강 건너기', '퀴즈제출 완료', '햄버거 만들기제출 완료'])
  })

  it('제출 목록을 못 불러와도 활동은 보여준다', async () => {
    listSubmittedActivityIds.mockRejectedValue(new Error('네트워크 오류'))
    renderList()
    expect(await screen.findByText('퀴즈')).toBeInTheDocument()
  })
})
