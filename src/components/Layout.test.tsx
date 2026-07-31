import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import Layout from './Layout'

function renderLayout() {
  return render(
    <MemoryRouter>
      <Layout><p>내용</p></Layout>
    </MemoryRouter>,
  )
}

describe('Layout', () => {
  it('학생 화면과 교사 화면으로 가는 길을 둘 다 보여준다', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: '학생 화면' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: '교사 화면' })).toHaveAttribute('href', '/teacher')
  })

  it('앱 이름을 보여준다', () => {
    renderLayout()
    expect(screen.getByRole('link', { name: '알고리즘 교실' })).toBeInTheDocument()
  })

  it('내용을 그대로 담는다', () => {
    renderLayout()
    expect(screen.getByText('내용')).toBeInTheDocument()
  })
})
