import { useEffect, useState, type FormEvent } from 'react'
import { createClass, listClasses, type ClassRow } from '../lib/teacher'
import { listSubmissions, type SubmissionRow } from '../lib/submission'

function scoreOf(payload: unknown): string {
  const p = payload as { score?: number; total?: number } | null
  return p && typeof p.score === 'number' && typeof p.total === 'number'
    ? `${p.score} / ${p.total}`
    : '—'
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listClasses()
      .then((rows) => {
        setClasses(rows)
        setSelected(rows[0]?.id ?? null)
      })
      .catch((err: Error) => setError(err.message))
  }, [])

  useEffect(() => {
    if (!selected) return
    listSubmissions(selected)
      .then(setSubmissions)
      .catch((err: Error) => setError(err.message))
  }, [selected])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      const created = await createClass(newName)
      setClasses((prev) => [created, ...prev])
      setSelected(created.id)
      setNewName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '학급을 만들지 못했습니다.')
    }
  }

  return (
    <section>
      <h1>교사 화면</h1>

      <form onSubmit={handleCreate}>
        <label htmlFor="newClass">새 학급 이름</label>
        <input id="newClass" value={newName}
          onChange={(e) => setNewName(e.target.value)} required />
        <button type="submit">학급 만들기</button>
      </form>

      {error && <p role="alert">{error}</p>}

      {classes.length === 0 ? (
        <p>학급을 먼저 만들어 주세요.</p>
      ) : (
        <ul>
          {classes.map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => setSelected(row.id)}>{row.name}</button>
              <code>{row.code}</code>
            </li>
          ))}
        </ul>
      )}

      <h2>제출물</h2>
      {submissions.length === 0 ? (
        <p>아직 제출된 것이 없습니다.</p>
      ) : (
        <table>
          <thead>
            <tr><th>학생</th><th>활동</th><th>점수</th><th>제출 시각</th></tr>
          </thead>
          <tbody>
            {submissions.map((row) => (
              <tr key={row.id}>
                <td>{row.studentNumber}번 {row.studentName}</td>
                <td>{row.activityId}</td>
                <td>{scoreOf(row.payload)}</td>
                <td>{new Date(row.createdAt).toLocaleString('ko-KR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
