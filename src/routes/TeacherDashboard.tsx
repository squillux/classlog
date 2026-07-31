import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { createClass, deleteClass, listClasses, type ClassRow } from '../lib/teacher'
import { listSubmissions, type SubmissionRow } from '../lib/submission'
import { findActivity } from '../activities'
import { summarize, noteOf, detailsOf } from './submissionSummary'

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  /* 삭제를 확인받는 중인 학급. 한 번 눌러서는 지우지 않는다. */
  const [confirming, setConfirming] = useState<string | null>(null)
  /* 속을 펼쳐 본 제출물. 한 번에 하나만 펼친다. */
  const [opened, setOpened] = useState<string | null>(null)

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

  async function handleDelete(id: string) {
    setError(null)
    try {
      await deleteClass(id)
      const left = classes.filter((row) => row.id !== id)
      setClasses(left)
      setConfirming(null)
      if (selected === id) {
        setSelected(left[0]?.id ?? null)
        setSubmissions([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '학급을 지우지 못했습니다.')
      setConfirming(null)
    }
  }

  return (
    <div className="stack">
      <h1>교사 화면</h1>

      {error && <p className="notice notice--error" role="alert">{error}</p>}

      <section className="card stack">
        <h2>학급</h2>

        {classes.length === 0 ? (
          <p className="muted">학급을 먼저 만들어 주세요.</p>
        ) : (
          <ul className="plain-list stack stack--tight">
            {classes.map((row) => (
              <li key={row.id}>
                <div className="class-row">
                  <button type="button" className="btn btn--utility"
                    aria-pressed={selected === row.id}
                    onClick={() => setSelected(row.id)}>
                    {row.name}
                  </button>
                  <code className="code-chip">{row.code}</code>
                  <button type="button" className="btn btn--quiet class-row__delete"
                    onClick={() => setConfirming(row.id)}>
                    삭제
                  </button>
                </div>

                {confirming === row.id && (
                  <div className="confirm">
                    <p>
                      <strong>{row.name}</strong> 을 지우면 그 반의
                      학생과 제출물까지 함께 지워집니다. 되돌릴 수 없습니다.
                    </p>
                    <div className="confirm__actions">
                      <button type="button" className="btn btn--utility"
                        onClick={() => handleDelete(row.id)}>
                        지웁니다
                      </button>
                      <button type="button" className="btn btn--quiet"
                        onClick={() => setConfirming(null)}>
                        그대로 둡니다
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <form className="class-form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="newClass">새 학급 이름</label>
            <input id="newClass" className="input" value={newName}
              onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn--primary">학급 만들기</button>
        </form>
      </section>

      <section className="card stack">
        <h2>제출물</h2>

        {submissions.length === 0 ? (
          <p className="card--soft muted">아직 제출된 것이 없습니다.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>학생</th><th>활동</th><th>점수</th><th>제출 시각</th></tr>
              </thead>
              <tbody>
                {submissions.map((row) => {
                  const note = noteOf(row.payload)
                  const details = detailsOf(row.payload)
                  const isOpen = opened === row.id
                  return (
                    <Fragment key={row.id}>
                      <tr>
                        <td>
                          <button type="button" className="btn btn--quiet"
                            aria-expanded={isOpen}
                            onClick={() => setOpened(isOpen ? null : row.id)}>
                            {row.studentNumber}번 {row.studentName}
                          </button>
                        </td>
                        <td>{findActivity(row.activityId)?.title ?? row.activityId}</td>
                        <td>{summarize(row.payload)}</td>
                        <td className="faint">
                          {new Date(row.createdAt).toLocaleString('ko-KR')}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={4} className="submission-detail">
                            {note ? <p>{note}</p> : <p className="faint">쓴 설명이 없습니다.</p>}
                            {details && <p className="faint">{details}</p>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
