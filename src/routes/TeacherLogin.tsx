import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { signInTeacher } from '../lib/teacher'

export default function TeacherLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await signInTeacher(email, password)
      navigate('/teacher/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인하지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="stack stack--tight">
        <h1>교사 로그인</h1>
        <p className="muted">학급을 만들고 학생 제출물을 봅니다.</p>
      </div>

      <form className="card card--raised form-stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">이메일</label>
          <input id="email" className="input" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input id="password" className="input" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} required />
        </div>

        {error && <p className="notice notice--error" role="alert">{error}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  )
}
