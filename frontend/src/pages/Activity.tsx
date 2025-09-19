import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Activity, Filter, Search, ArrowUpRight, ArrowDownLeft, RefreshCw, Download, Calendar, ArrowLeft } from 'lucide-react'
import { useThemeStore } from '@/store/theme'
import { useNavigate } from 'react-router-dom'
import { analyticsApi } from '@/api/analytics'
import { transactionsApi, Transaction } from '@/api/transactions'
import { useAuthStore } from '@/store/session'
import TransactionDetailModal from '@/components/TransactionDetailModal'

function ActivityPage() {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const { isAuthenticated } = useAuthStore()
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'received' | 'swapped'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  const filters = [
    { id: 'all', label: t('activity.all', 'All'), icon: Activity },
    { id: 'sent', label: t('activity.sent', 'Sent'), icon: ArrowUpRight },
    { id: 'received', label: t('activity.received', 'Received'), icon: ArrowDownLeft },
    { id: 'swapped', label: t('activity.swapped', 'Swapped'), icon: RefreshCw },
  ]

  // Fetch real transaction summary data
  const { data: transactionSummary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['activity-summary'],
    queryFn: transactionsApi.getTransactionSummary,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Calculate transaction stats from real data (fallback)
  const transactionStats = transactionSummary ? {
    totalSent: (transactionSummary.by_type['PAYMENT'] || 0) + (transactionSummary.by_type['P2P_TRANSFER'] || 0),
    totalReceived: transactionSummary.by_type['EARN'] || 0,
    totalTransactions: transactionSummary.total_transactions,
    totalSwapped: transactionSummary.by_type['SWAP'] || 0,
    averageAmount: transactionSummary.total_transactions > 0 ? Math.round(transactionSummary.total_amount / transactionSummary.total_transactions) : 0,
  } : {
    totalSent: 0,
    totalReceived: 0,
    totalTransactions: 0,
    totalSwapped: 0,
    averageAmount: 0,
  }

  // Fetch real transaction data from backend
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['activity-transactions'],
    queryFn: () => transactionsApi.getTransactions({ page: 1, per_page: 50 }),
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Process real transaction data - sử dụng direction từ API
  const transactions = transactionsData?.transactions.map((tx) => {
    // Sử dụng direction từ API thay vì tự phân loại
    const type = tx.direction || 'sent' // fallback nếu không có direction
    
    return {
      id: tx.id,
      type: type,
      amount: tx.amount,
      currency: tx.asset_code,
      address: tx.destination || 'Unknown',
      date: tx.created_at,
      status: tx.status.toLowerCase(),
      fee: '0.01', // Default fee
      toAmount: tx.buy_asset ? tx.amount : undefined,
      toCurrency: tx.buy_asset
    }
  }) || []

  // Recalculate stats from actual transactions
  const actualStats = {
    totalSent: transactions.filter(tx => tx.type === 'sent').length,
    totalReceived: transactions.filter(tx => tx.type === 'received').length,
    totalSwapped: transactions.filter(tx => tx.type === 'swapped').length,
    totalTransactions: transactions.length,
    averageAmount: transactions.length > 0 ? parseFloat((transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) / transactions.length).toFixed(3)) : 0,
  }

  // Check for errors
  const hasError = summaryError || transactionsLoading;

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
    <div className={`min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('activity.title', 'Activity')}</h1>
          <p className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('activity.subtitle', 'Track your transaction history')}</p>
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
            className={`w-full pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm border-2 ${
              isDark 
                ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 hover:border-slate-400 focus:border-red-500'
            }`}
          />
          <Search className={`absolute left-3 top-3.5 w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
        </div>

        {/* Filter Tabs */}
        <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100/80 border-slate-200'} p-1.5 rounded-2xl flex overflow-x-auto border backdrop-blur-sm`}>
          {filters.map((filter) => {
            const Icon = filter.icon
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 whitespace-nowrap ${
                  activeFilter === filter.id
                    ? `${isDark ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200 text-slate-900 border-slate-300'} shadow-md backdrop-blur-sm border`
                    : `${isDark ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{filter.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <div className={`${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} backdrop-blur-sm rounded-2xl p-6 border text-center mb-6`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-100 border-red-200'}`}>
            <Activity className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{t('common.errorLoading', 'Error Loading Data')}</h3>
          <p className={`mb-6 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
            {t('activity.errorMessage', 'Unable to load transaction data. Please try again later.')}
          </p>
        </div>
      )}

      {/* Loading State */}
      {(summaryLoading || transactionsLoading) && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-24 backdrop-blur-sm rounded-2xl border animate-pulse ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'
            }`} />
          ))}
        </div>
      )}

      {/* Transactions List */}
      {!(summaryLoading || transactionsLoading) && !hasError && (
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            <>
              {/* Export Button */}
              <div className="flex justify-between items-center">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('activity.recentActivity', 'Recent Transactions')} ({filteredTransactions.length})
                </h2>
                <button className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors border backdrop-blur-sm ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 text-white/80 border-white/20' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                }`}>
                  <Download className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('common.export', 'Export')}</span>
                </button>
              </div>

              {/* Transaction Cards */}
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    onClick={() => {
                      // Tìm transaction gốc từ API data
                      const originalTx = transactionsData?.transactions.find(tx => tx.id === transaction.id)
                      if (originalTx) {
                        setSelectedTransaction(originalTx)
                        setIsModalOpen(true)
                      }
                    }}
                    className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border hover:border-white/30 transition-all duration-200 hover:shadow-lg cursor-pointer ${getTransactionBgColor(transaction.type)}`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left: Icon and Details */}
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border ${isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100/80 border-slate-200'}`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {transaction.type}
                            </h3>
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                              {transaction.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className={`w-3 h-3 ${isDark ? 'text-white/50' : 'text-slate-500'}`} />
                            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                          
                          {transaction.type !== 'swapped' && (
                            <p className={`text-xs font-mono mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
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
                          {parseFloat(transaction.amount).toFixed(3)} {transaction.currency}
                        </p>
                        
                        {transaction.type === 'swapped' && (
                          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                            → {transaction.toAmount ? parseFloat(transaction.toAmount).toFixed(3) : '0.000'} {transaction.toCurrency}
                          </p>
                        )}
                        
                        <p className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                          Fee: {parseFloat(transaction.fee).toFixed(3)} USD
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Empty State
            <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-12 border text-center`}>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100/80 border-slate-200'}`}>
                <Activity className={`w-8 h-8 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('activity.noTransactions', 'No transactions found')}
              </h3>
              <p className={`mb-6 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {searchQuery 
                  ? t('activity.adjustSearch', 'Try adjusting your search criteria')
                  : activeFilter !== 'all' 
                    ? t('activity.noFilteredTransactions', `No ${activeFilter} transactions yet`)
                    : t('activity.startTransacting', 'Start making transactions to see your activity here')
                }
              </p>
              <button 
                onClick={() => navigate('/pay')}
                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all"
              >
                {t('activity.makeFirstTransaction', 'Make your first transaction')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary Stats */}
      {!(summaryLoading || transactionsLoading) && !hasError && (
        <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border mt-6`}>
          <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('activity.monthSummary', 'This Month Summary')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <ArrowUpRight className="w-6 h-6 text-red-400 mx-auto mb-2" />
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {t('activity.totalSent', 'Total Sent')}
              </p>
              <p className="text-xl font-bold text-red-400">${actualStats.totalSent.toLocaleString()}</p>
            </div>
            
            <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <ArrowDownLeft className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {t('activity.totalReceived', 'Total Received')}
              </p>
              <p className="text-xl font-bold text-green-400">${actualStats.totalReceived.toLocaleString()}</p>
            </div>
            
            <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <RefreshCw className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {t('activity.totalSwapped', 'Total Swapped')}
              </p>
              <p className="text-xl font-bold text-blue-400">${actualStats.totalSwapped.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTransaction(null)
        }}
      />
    </div>
  )
}

export default ActivityPage
