import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { enterClass } from '../lib/session'

export default function Home() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await enterClass(code, Number(number), name)
      navigate('/activities')
    } catch (err) {
      setError(err instanceof Error ? err.message : '들어가지 못했습니다.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <div className="stack stack--tight">
        <h1>수업 들어가기</h1>
        <p className="muted">선생님이 알려준 학급 코드를 넣으세요.</p>
      </div>

      <form className="card card--raised form-stack" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="code">학급 코드</label>
          <input id="code" className="input" value={code} autoComplete="off"
            onChange={(e) => setCode(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="number">번호</label>
          <input id="number" className="input" type="number" min="1" max="100"
            value={number} onChange={(e) => setNumber(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="name">이름</label>
          <input id="name" className="input" value={name} autoComplete="off"
            onChange={(e) => setName(e.target.value)} required />
        </div>

        {error && <p className="notice notice--error" role="alert">{error}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
          {busy ? '들어가는 중…' : '들어가기'}
        </button>
      </form>
    </div>
  )
}
