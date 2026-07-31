import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { activities } from '../activities'
import { loadSession } from '../lib/session'
import { listSubmittedActivityIds } from '../lib/submission'

/* 활동 카드 위 색 띠. 장식일 뿐이라 순서대로 돌려 쓴다. */
const BANDS = ['', 'tile__band--purple', 'tile__band--teal', 'tile__band--pink']

export default function ActivityList() {
  const session = loadSession()
  const studentId = session?.studentId
  const [done, setDone] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!studentId) return
    listSubmittedActivityIds(studentId)
      .then((ids) => setDone(new Set(ids)))
      // 제출 목록을 못 받아도 활동은 보여준다. 표시가 빠질 뿐이다.
      .catch(() => setDone(new Set()))
  }, [studentId])

  if (!session) return <p className="muted">먼저 학급 코드로 들어와 주세요.</p>

  // 낸 것은 뒤로 민다. 각 묶음 안에서는 원래 순서를 지킨다.
  const ordered = [
    ...activities.filter((a) => !done.has(a.id)),
    ...activities.filter((a) => done.has(a.id)),
  ]
  const left = activities.length - done.size

  return (
    <div className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">{session.className}</p>
        <h1>오늘의 활동</h1>
        <p className="muted">
          {session.number}번 {session.displayName}
          {left > 0 ? ` · 남은 활동 ${left}개` : ' · 모두 끝냈습니다'}
        </p>
      </div>

      <ul className="plain-list tile-grid">
        {ordered.map((activity) => {
          const submitted = done.has(activity.id)
          const band = BANDS[activities.indexOf(activity) % BANDS.length]
          return (
            <li key={activity.id}>
              <Link
                to={`/activities/${activity.id}`}
                className={submitted ? 'tile tile--done' : 'tile'}
              >
                <div className={`tile__band ${band}`} />
                <div className="tile__body">
                  <h3>{activity.title}</h3>
                  {submitted && <span className="stamp">제출 완료</span>}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
