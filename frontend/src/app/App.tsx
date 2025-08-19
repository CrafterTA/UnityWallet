import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/session'
// Use alias path to avoid any moduleResolution quirks with relative specifier
import Layout from '@/app/Layout'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import Pay from '@/pages/Pay'
import Swap from '@/pages/Swap'
import Insights from '@/pages/Insights'
import Assistant from '@/pages/Assistant'
import Settings from '@/pages/Settings'

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
