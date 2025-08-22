import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, Filter, Search, ArrowUpRight, ArrowDownLeft, RefreshCw, Download, Calendar, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ActivityPage() {
  const { t } = useTranslation()
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'received' | 'swapped'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const filters = [
    { id: 'all', label: t('activity.all', 'All'), icon: Activity },
    { id: 'sent', label: t('activity.sent', 'Sent'), icon: ArrowUpRight },
    { id: 'received', label: t('activity.received', 'Received'), icon: ArrowDownLeft },
    { id: 'swapped', label: t('activity.swapped', 'Swapped'), icon: RefreshCw },
  ]

  const transactions = [
    {
      id: '1',
      type: 'sent',
      amount: '150.00',
      currency: 'USD',
      to: 'Alice Johnson',
      address: 'GBRP...HNKZ',
      date: '2025-08-19T10:30:00Z',
      status: 'completed',
      fee: '0.50'
    },
    {
      id: '2',
      type: 'received',
      amount: '500.00',
      currency: 'USD',
      from: 'Bob Smith',
      address: 'GCXM...PLKJ',
      date: '2025-08-18T15:45:00Z',
      status: 'completed',
      fee: '0.00'
    },
    {
      id: '3',
      type: 'swapped',
      amount: '0.025',
      currency: 'BTC',
      toAmount: '1000.00',
      toCurrency: 'USD',
      date: '2025-08-17T09:15:00Z',
      status: 'completed',
      fee: '5.00'
    }
  ]

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <ArrowUpRight className="w-5 h-5 text-red-400" />
      case 'received':
        return <ArrowDownLeft className="w-5 h-5 text-green-400" />
      case 'swapped':
        return <RefreshCw className="w-5 h-5 text-blue-400" />
      default:
        return <Activity className="w-5 h-5 text-gray-400" />
    }
  }

  const getTransactionBgColor = (type: string) => {
    switch (type) {
      case 'sent':
        return 'bg-red-500/10 border-red-500/20'
      case 'received':
        return 'bg-green-500/10 border-green-500/20'
      case 'swapped':
        return 'bg-blue-500/10 border-blue-500/20'
      default:
        return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter !== 'all' && tx.type !== activeFilter) return false
    if (searchQuery) {
      const searchText = (tx.address || tx.id).toLowerCase()
      if (!searchText.includes(searchQuery.toLowerCase())) return false
    }
    return true
  })

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('activity.title', 'Activity')}</h1>
          <p className="text-white/70">{t('activity.subtitle', 'Track your transaction history')}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('common.search', 'Search by address or transaction ID...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-white/60" />
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/10 p-1.5 rounded-2xl flex overflow-x-auto border border-white/20 backdrop-blur-sm">
          {filters.map((filter) => {
            const Icon = filter.icon
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 whitespace-nowrap ${
                  activeFilter === filter.id
                    ? 'bg-white/20 text-white shadow-md backdrop-blur-sm border border-white/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{filter.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length > 0 ? (
          <>
            {/* Export Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">
                {t('activity.recentActivity', 'Recent Transactions')} ({filteredTransactions.length})
              </h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl transition-colors border border-white/20 backdrop-blur-sm">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">{t('common.export', 'Export')}</span>
              </button>
            </div>

            {/* Transaction Cards */}
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className={`bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:border-white/30 transition-all duration-200 hover:shadow-lg cursor-pointer ${getTransactionBgColor(transaction.type)}`}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Icon and Details */}
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-white capitalize">
                            {transaction.type}
                          </h3>
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                            {transaction.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-3 h-3 text-white/50" />
                          <p className="text-sm text-white/70">
                            {formatDate(transaction.date)}
                          </p>
                        </div>
                        
                        {transaction.type !== 'swapped' && (
                          <p className="text-xs text-white/50 font-mono mt-1">
                            {transaction.type === 'sent' ? transaction.address : 
                             transaction.type === 'received' ? transaction.address : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="text-right">
                      <p className={`font-bold text-lg ${
                        transaction.type === 'sent' ? 'text-red-400' : 
                        transaction.type === 'received' ? 'text-green-400' : 
                        'text-blue-400'
                      }`}>
                        {transaction.type === 'sent' ? '-' : transaction.type === 'received' ? '+' : ''}
                        {transaction.amount} {transaction.currency}
                      </p>
                      
                      {transaction.type === 'swapped' && (
                        <p className="text-sm text-white/70">
                          → {transaction.toAmount} {transaction.toCurrency}
                        </p>
                      )}
                      
                      <p className="text-xs text-white/50 mt-1">
                        Fee: {transaction.fee} USD
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Empty State
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 border border-white/20 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Activity className="w-8 h-8 text-white/60" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No transactions found</h3>
            <p className="text-white/70 mb-6">
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : activeFilter !== 'all' 
                  ? `No ${activeFilter} transactions yet`
                  : 'Start making transactions to see your activity here'
              }
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-red-600 to-yellow-500 text-white font-semibold rounded-xl hover:from-red-700 hover:to-yellow-600 transition-all">
              Make your first transaction
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mt-6">
        <h3 className="font-bold text-white mb-4">This Month Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <ArrowUpRight className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-white/70">Total Sent</p>
            <p className="text-xl font-bold text-red-400">$1,250.00</p>
          </div>
          
          <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <ArrowDownLeft className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-white/70">Total Received</p>
            <p className="text-xl font-bold text-green-400">$2,100.00</p>
          </div>
          
          <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <RefreshCw className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm text-white/70">Total Swapped</p>
            <p className="text-xl font-bold text-blue-400">$800.00</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityPage
