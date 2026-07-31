import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import Home from './routes/Home'
import ActivityList from './routes/ActivityList'
import ActivityPage from './routes/ActivityPage'
import TeacherLogin from './routes/TeacherLogin'
import TeacherDashboard from './routes/TeacherDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout narrow><Home /></Layout>} />
      <Route path="/activities" element={<Layout><ActivityList /></Layout>} />
      <Route path="/activities/:activityId" element={<Layout><ActivityPage /></Layout>} />
      <Route path="/teacher" element={<Layout narrow><TeacherLogin /></Layout>} />
      <Route path="/teacher/dashboard" element={<Layout><TeacherDashboard /></Layout>} />
      <Route path="*" element={<Layout narrow><p>페이지를 찾을 수 없습니다.</p></Layout>} />
    </Routes>
  )
}

export default App
