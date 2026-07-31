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
    <form onSubmit={handleSubmit}>
      <h1>너희 반 앱</h1>

      <label htmlFor="code">학급 코드</label>
      <input id="code" value={code} onChange={(e) => setCode(e.target.value)} required />

      <label htmlFor="number">번호</label>
      <input
        id="number" type="number" min="1" max="100" value={number}
        onChange={(e) => setNumber(e.target.value)} required
      />

      <label htmlFor="name">이름</label>
      <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={busy}>{busy ? '들어가는 중…' : '들어가기'}</button>
    </form>
  )
}
