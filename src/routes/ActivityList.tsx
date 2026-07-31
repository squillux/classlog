import { Link } from 'react-router'
import { activities } from '../activities'
import { loadSession } from '../lib/session'

export default function ActivityList() {
  const session = loadSession()
  if (!session) return <p>먼저 학급 코드로 들어와 주세요.</p>

  return (
    <section>
      <h1>{session.className} · {session.number}번 {session.displayName}</h1>
      <ul>
        {activities.map((activity) => (
          <li key={activity.id}>
            <Link to={`/activities/${activity.id}`}>{activity.title}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
