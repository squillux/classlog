import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const listClasses = vi.fn()
const createClass = vi.fn()
const listSubmissions = vi.fn()

vi.mock('../lib/teacher', () => ({
  listClasses: () => listClasses(),
  createClass: (n: string) => createClass(n),
}))
vi.mock('../lib/submission', () => ({ listSubmissions: (id: string) => listSubmissions(id) }))

const TeacherDashboard = (await import('./TeacherDashboard')).default

beforeEach(() => {
  listClasses.mockReset(); createClass.mockReset(); listSubmissions.mockReset()
  listClasses.mockResolvedValue([{ id: 'c1', code: 'AB23CD', name: '1학년 3반' }])
  listSubmissions.mockResolvedValue([])
})

describe('TeacherDashboard', () => {
  it('학급과 학급 코드를 보여준다', async () => {
    render(<TeacherDashboard />)
    expect(await screen.findByText('1학년 3반')).toBeInTheDocument()
    expect(screen.getByText('AB23CD')).toBeInTheDocument()
  })

  it('첫 학급의 제출물을 불러와 보여준다', async () => {
    listSubmissions.mockResolvedValue([
      {
        id: 'sub1', activityId: 'quiz', payload: { score: 2, total: 3 },
        createdAt: '2026-07-31T01:00:00Z', studentName: '김하늘', studentNumber: 7,
      },
    ])
    render(<TeacherDashboard />)

    expect(await screen.findByText('7번 김하늘')).toBeInTheDocument()
    expect(screen.getByText('quiz')).toBeInTheDocument()
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('제출물이 없으면 안내를 보여준다', async () => {
    render(<TeacherDashboard />)
    expect(await screen.findByText('아직 제출된 것이 없습니다.')).toBeInTheDocument()
  })

  it('학급을 새로 만들면 목록에 더한다', async () => {
    createClass.mockResolvedValue({ id: 'c2', code: 'XY45ZW', name: '1학년 4반' })
    const user = userEvent.setup()
    render(<TeacherDashboard />)
    await screen.findByText('1학년 3반')

    await user.type(screen.getByLabelText('새 학급 이름'), '1학년 4반')
    await user.click(screen.getByRole('button', { name: '학급 만들기' }))

    expect(await screen.findByText('1학년 4반')).toBeInTheDocument()
    expect(screen.getByText('XY45ZW')).toBeInTheDocument()
  })

  it('학급이 하나도 없으면 안내를 보여준다', async () => {
    listClasses.mockResolvedValue([])
    render(<TeacherDashboard />)
    expect(await screen.findByText('학급을 먼저 만들어 주세요.')).toBeInTheDocument()
  })
})
