import { Route, Routes } from 'react-router'
import Home from './routes/Home'
import ActivityList from './routes/ActivityList'
import ActivityPage from './routes/ActivityPage'
import TeacherLogin from './routes/TeacherLogin'

function Placeholder({ title }: { title: string }) {
  return <h1>{title}</h1>
}

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activities" element={<ActivityList />} />
        <Route path="/activities/:activityId" element={<ActivityPage />} />
        <Route path="/teacher" element={<TeacherLogin />} />
        <Route path="/teacher/dashboard" element={<Placeholder title="교사 화면" />} />
        <Route path="*" element={<p>페이지를 찾을 수 없습니다.</p>} />
      </Routes>
    </main>
  )
}

export default App
