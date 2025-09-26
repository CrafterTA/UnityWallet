import { ArrowUpRight, ArrowDownLeft, Plus, Minus } from 'lucide-react'
import { formatBalance } from '@/lib/utils'

interface Transaction {
  id: string
  type: 'send' | 'receive' | 'swap'
  asset: string
  amount: string
  counterparty: string
  timestamp: string
  status: 'confirmed' | 'pending' | 'failed'
  txHash?: string
  fee?: string
}

interface RecentActivityProps {
  transactions?: Transaction[]
  limit?: number
  showViewAll?: boolean
}

function RecentActivity({ transactions = [], limit = 5, showViewAll = true }: RecentActivityProps) {
  // Mock transactions for demo
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'send',
      asset: 'SOL',
      amount: '-2500',
      counterparty: 'GBRP...HNKZ',
      timestamp: '2h ago',
      status: 'confirmed',
      fee: '0.00001'
    },
    {
      id: '2',
      type: 'receive',
      asset: 'USDT',
      amount: '+100',
      counterparty: 'you@anchor.com',
      timestamp: 'Yesterday',
      status: 'confirmed'
    },
    {
      id: '3',
      type: 'swap',
      asset: 'SOL→USDT',
      amount: '-50',
      counterparty: 'DEX',
      timestamp: '2 days ago',
      status: 'confirmed',
      fee: '0.1'
    }
  ]

  const displayTransactions = transactions.length > 0 ? transactions : mockTransactions
  const limitedTransactions = displayTransactions.slice(0, limit)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-4 h-4" />
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4" />
      case 'swap':
        return <Plus className="w-4 h-4" />
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send':
        return 'text-red-600 bg-red-50'
      case 'receive':
        return 'text-green-600 bg-green-50'
      case 'swap':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-navy-600 bg-navy-50'
    }
  }

  const getAmountColor = (amount: string) => {
    if (amount.startsWith('+')) return 'text-green-600'
    if (amount.startsWith('-')) return 'text-red-600'
    return 'text-navy-900'
  }

  if (limitedTransactions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-navy-200">
        <div className="text-center text-navy-500">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <ArrowUpRight className="w-8 h-8 text-navy-400" />
          </div>
          <p className="font-medium">No recent transactions</p>
          <p className="text-sm">Your transaction history will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-navy-200">
      <div className="p-6 border-b border-navy-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-navy-900">Recent Activity</h3>
        {showViewAll && (
          <button className="text-accent hover:text-accent/80 font-medium text-sm">
            View all
          </button>
        )}
      </div>
      
      <div className="divide-y divide-navy-100">
        {limitedTransactions.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-navy-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(transaction.type)}`}>
                  {getTransactionIcon(transaction.type)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-navy-900 capitalize">
                      {transaction.type} {transaction.asset}
                    </span>
                    {transaction.status === 'pending' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-navy-600">{transaction.counterparty}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${getAmountColor(transaction.amount)}`}>
                  {transaction.amount.startsWith('+') || transaction.amount.startsWith('-')
                    ? transaction.amount
                    : formatBalance(transaction.amount)
                  }
                </p>
                <p className="text-sm text-navy-500">{transaction.timestamp}</p>
              </div>
            </div>
            
            {transaction.fee && (
              <div className="mt-2 ml-13">
                <p className="text-xs text-navy-500">Fee: {transaction.fee} SOL</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentActivity
