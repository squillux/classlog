import { Route, Routes } from 'react-router'
import Home from './routes/Home'
import ActivityList from './routes/ActivityList'
import ActivityPage from './routes/ActivityPage'
import TeacherLogin from './routes/TeacherLogin'
import TeacherDashboard from './routes/TeacherDashboard'

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/activities" element={<ActivityList />} />
        <Route path="/activities/:activityId" element={<ActivityPage />} />
        <Route path="/teacher" element={<TeacherLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="*" element={<p>페이지를 찾을 수 없습니다.</p>} />
      </Routes>
    </main>
  )
}

export default App
