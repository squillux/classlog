import type { ReactNode } from 'react'
import { Link } from 'react-router'

type Props = {
  children: ReactNode
  /** 입력 위주 화면은 좁은 단으로 둔다. */
  narrow?: boolean
}

export default function Layout({ children, narrow = false }: Props) {
  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="wordmark">알고리즘 교실</Link>
          <nav className="app-header__nav">
            <Link to="/" className="btn btn--utility">학생 화면</Link>
            <Link to="/teacher" className="btn btn--utility">교사 화면</Link>
          </nav>
        </div>
      </header>

      <main className={narrow ? 'app-main app-main--narrow' : 'app-main'}>
        {children}
      </main>
    </>
  )
}
