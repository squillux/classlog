import { Link } from 'react-router'
import { activities } from '../activities'
import { loadSession } from '../lib/session'

/* 활동 카드 위 색 띠. 장식일 뿐이라 순서대로 돌려 쓴다. */
const BANDS = ['', 'tile__band--purple', 'tile__band--teal', 'tile__band--pink']

export default function ActivityList() {
  const session = loadSession()
  if (!session) return <p className="muted">먼저 학급 코드로 들어와 주세요.</p>

  return (
    <div className="stack">
      <div className="stack stack--tight">
        <p className="eyebrow">{session.className}</p>
        <h1>오늘의 활동</h1>
        <p className="muted">{session.number}번 {session.displayName}</p>
      </div>

      <ul className="plain-list tile-grid">
        {activities.map((activity, i) => (
          <li key={activity.id}>
            <Link to={`/activities/${activity.id}`} className="tile">
              <div className={`tile__band ${BANDS[i % BANDS.length]}`} />
              <div className="tile__body">
                <h3>{activity.title}</h3>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
