import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { findActivity } from '../activities'
import { loadSession } from '../lib/session'
import { saveSubmission } from '../lib/submission'

export default function ActivityPage() {
  const { activityId = '' } = useParams()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const session = loadSession()
  if (!session) return <p>먼저 학급 코드로 들어와 주세요.</p>

  const activity = findActivity(activityId)
  if (!activity) return <p>활동을 찾을 수 없습니다.</p>

  async function handleSubmit(payload: unknown) {
    setError(null)
    try {
      await saveSubmission(session!.studentId, activityId, payload)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '제출하지 못했습니다.')
    }
  }

  const { Component } = activity
  return (
    <section>
      <Link to="/activities">← 활동 목록</Link>
      <Component onSubmit={handleSubmit} />
      {saved && <p role="status">제출했습니다.</p>}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
