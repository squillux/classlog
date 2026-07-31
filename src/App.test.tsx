import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'

vi.mock('./lib/session', () => ({
  enterClass: vi.fn(),
  loadSession: () => null,
}))

describe('App 라우팅', () => {
  it('루트 경로에서 학급 코드 입장 화면을 보여준다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: '수업 들어가기' })).toBeInTheDocument()
  })

  it('모든 화면에 앱 이름이 걸려 있다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: '알고리즘 교실' })).toBeInTheDocument()
  })

  it('알 수 없는 경로에서는 안내 문구를 보여준다', () => {
    render(
      <MemoryRouter initialEntries={['/없는길']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('페이지를 찾을 수 없습니다.')).toBeInTheDocument()
  })
})
