import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/session'
import { useSessionInit } from '@/hooks/useSessionInit'
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
import Sovico from '@/pages/Sovico'

function App() {
  const { isAuthenticated, isLocked, wallet } = useAuthStore()
  const { isInitializing, initError } = useSessionInit()

  // Show loading screen while initializing session
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing wallet...</p>
          {initError && (
            <p className="text-red-500 text-sm mt-2">Error: {initError}</p>
          )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !wallet) {
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
        <Route path="/sovico" element={<Sovico />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
