import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Plus, Zap } from 'lucide-react'
import { walletApi } from '@/api/wallet'
import { useAuthStore } from '@/store/session'
import { formatBalance } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function Home() {
  const [showBalances, setShowBalances] = useState(true)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: balances, isLoading, error } = useQuery({
    queryKey: ['balances'],
    queryFn: walletApi.getBalances,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  useEffect(() => {
    if (error) {
      toast.error('Failed to load balances')
    }
  }, [error])

  const quickActions = [
    {
      icon: ArrowUpRight,
      label: 'Send',
      description: 'Transfer assets',
      color: 'bg-primary',
      path: '/pay',
    },
    {
      icon: Plus,
      label: 'Receive',
      description: 'Get QR code',
      color: 'bg-success',
      path: '/pay?tab=receive',
    },
    {
      icon: ArrowDownLeft,
      label: 'Swap',
      description: 'Exchange assets',
      color: 'bg-accent',
      path: '/swap',
    },
    {
      icon: Zap,
      label: 'Insights',
      description: 'View analytics',
      color: 'bg-blue-500',
      path: '/insights',
    },
  ]

  const getBalanceInUSD = (balance: string, assetCode: string) => {
    const amount = parseFloat(balance)
    // Mock conversion rates
    const rates: Record<string, number> = {
      XLM: 0.12,
      USDC: 1.0,
      SYP: 0.001, // 1000 SYP = $1
    }
    return (amount * (rates[assetCode] || 0)).toFixed(2)
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy-900 mb-1">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-navy-600">Manage your digital assets</p>
      </div>

      {/* Balance Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-900">Your Balances</h2>
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="p-2 hover:bg-navy-100 rounded-lg transition-colors"
          >
            {showBalances ? (
              <EyeOff className="w-5 h-5 text-navy-600" />
            ) : (
              <Eye className="w-5 h-5 text-navy-600" />
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-navy-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {balances?.map((balance, index) => (
              <div
                key={`${balance.asset_code}-${index}`}
                className="bg-white rounded-xl p-4 border border-navy-200 card-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {balance.asset_code}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy-900">
                        {balance.asset_code}
                      </h3>
                      <p className="text-sm text-navy-600">
                        {balance.asset_code === 'XLM' ? 'Stellar Lumens' :
                         balance.asset_code === 'USDC' ? 'USD Coin' :
                         balance.asset_code === 'SYP' ? 'SkyPoints' : 'Digital Asset'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-navy-900">
                      {showBalances 
                        ? formatBalance(balance.balance, balance.asset_code === 'SYP' ? 0 : 4)
                        : '****'
                      }
                    </p>
                    <p className="text-sm text-navy-600">
                      {showBalances 
                        ? `≈ $${getBalanceInUSD(balance.balance, balance.asset_code)}`
                        : '****'
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-navy-900">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="bg-white rounded-xl p-4 border border-navy-200 hover:border-primary/30 transition-all duration-200 hover:shadow-lg group"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-navy-900">{action.label}</h3>
                  <p className="text-sm text-navy-600">{action.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-navy-900">Recent Activity</h2>
        <div className="bg-white rounded-xl p-6 border border-navy-200">
          <div className="text-center text-navy-500">
            <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ArrowUpRight className="w-8 h-8 text-navy-400" />
            </div>
            <p className="font-medium">No recent transactions</p>
            <p className="text-sm">Your transaction history will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
