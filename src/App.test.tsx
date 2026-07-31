import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'

describe('App 라우팅', () => {
  it('루트 경로에서 학급 코드 입장 화면을 보여준다', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: '너희 반 앱' })).toBeInTheDocument()
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
