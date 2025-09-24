import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/session'
// Use alias path to avoid any moduleResolution quirks with relative specifier
import Layout from '@/app/Layout'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import Wallet from '@/pages/Wallet'
import Pay from '@/pages/Pay'
import Swap from '@/pages/Swap'
import Activity from '@/pages/Activity'
import Insights from '@/pages/Insights'
import Assistant from '@/pages/Assistant'
import Settings from '@/pages/Settings'
import Sovico2 from '@/pages/Sovico2'

function App() {
  const { isAuthenticated, isLocked } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/pay" element={<Pay />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/sovico" element={<Sovico2 />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
