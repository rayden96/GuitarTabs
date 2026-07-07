import { Routes, Route } from 'react-router-dom'
import Library from './pages/Library'
import SongEdit from './pages/SongEdit'
import SongPlay from './pages/SongPlay'
import Login from './pages/Login'

export default function App() {
  return (
    <div className="mx-auto min-h-dvh max-w-3xl">
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/song/:id/edit" element={<SongEdit />} />
        <Route path="/song/:id/play" element={<SongPlay />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  )
}
