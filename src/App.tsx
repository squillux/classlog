import { Route, Routes } from 'react-router'

function Placeholder({ title }: { title: string }) {
  return <h1>{title}</h1>
}

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Placeholder title="너희 반 앱" />} />
        <Route path="/activities" element={<Placeholder title="활동 목록" />} />
        <Route path="/activities/:activityId" element={<Placeholder title="활동" />} />
        <Route path="/teacher" element={<Placeholder title="교사 로그인" />} />
        <Route path="/teacher/dashboard" element={<Placeholder title="교사 화면" />} />
        <Route path="*" element={<p>페이지를 찾을 수 없습니다.</p>} />
      </Routes>
    </main>
  )
}

export default App
