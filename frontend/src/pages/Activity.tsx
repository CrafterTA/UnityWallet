import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  Activity, 
  Filter, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Download, 
  Calendar, 
  ArrowLeft,
  CreditCard,
  ShoppingCart,
  Building2,
  Zap,
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
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
  const queryClient = useQueryClient()
  const [activeFilter, setActiveFilter] = useState<'all' | 'sent' | 'received' | 'swapped' | 'sovico' | 'payments' | 'rewards'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const navigate = useNavigate()

  const filters = [
    { id: 'all', label: t('activity.all', 'Tất cả'), icon: Activity, color: 'gray' },
    { id: 'sent', label: t('activity.sent', 'Gửi'), icon: ArrowUpRight, color: 'red' },
    { id: 'received', label: t('activity.received', 'Nhận'), icon: ArrowDownLeft, color: 'green' },
    { id: 'swapped', label: t('activity.swapped', 'Hoán đổi'), icon: RefreshCw, color: 'blue' },
    { id: 'sovico', label: t('activity.sovico', 'Sovico'), icon: Building2, color: 'purple' },
    { id: 'payments', label: t('activity.payments', 'Thanh toán'), icon: CreditCard, color: 'yellow' },
    { id: 'rewards', label: t('activity.rewards', 'Thưởng'), icon: Star, color: 'pink' },
  ]

  // Enhanced transaction categorization
  const categorizeTransaction = (tx: Transaction) => {
    const memo = tx.memo?.toLowerCase() || ''
    const description = tx.description?.toLowerCase() || ''
    
    // Check transaction type FIRST (highest priority)
    if (tx.tx_type === 'SWAP') return 'swapped'
    
    // Sovico ecosystem transactions
    if (memo.includes('sovico') || memo.includes('hdbank') || memo.includes('vietjet') || 
        memo.includes('dragon') || memo.includes('energy') || description.includes('sovico')) {
      return 'sovico'
    }
    
    // Payment transactions
    if (memo.includes('payment') || memo.includes('thanh toan') || 
        memo.includes('service') || memo.includes('dich vu')) {
      return 'payments'
    }
    
    // Reward transactions
    if (memo.includes('reward') || memo.includes('bonus') || memo.includes('thuong') ||
        memo.includes('cashback') || memo.includes('loyalty')) {
      return 'rewards'
    }
    
    // Default categorization based on direction (lowest priority)
    if (tx.direction === 'sent') return 'sent'
    if (tx.direction === 'received') return 'received'
    
    return 'all'
  }

  const getTransactionIcon = (tx: Transaction) => {
    const category = categorizeTransaction(tx)
    
    switch (category) {
      case 'sovico':
        return <Building2 className="w-5 h-5 text-purple-500" />
      case 'payments':
        return <CreditCard className="w-5 h-5 text-yellow-500" />
      case 'rewards':
        return <Star className="w-5 h-5 text-pink-500" />
      case 'sent':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />
      case 'received':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />
      case 'swapped':
        return <RefreshCw className="w-5 h-5 text-blue-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const getTransactionStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  // Fetch real transaction summary data
  const { data: transactionSummary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['activity-summary'],
    queryFn: transactionsApi.getTransactionSummary,
    retry: 1,
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchInterval: 500, // Auto-refresh every 0.5 seconds
    staleTime: 0, // Data is always considered stale, will refetch
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
  const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError, refetch: refetchTransactions } = useQuery({
    queryKey: ['activity-transactions'],
    queryFn: () => transactionsApi.getTransactions({ page: 1, per_page: 50 }),
    retry: 1,
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchInterval: 500, // Auto-refresh every 0.5 seconds
    staleTime: 0, // Data is always considered stale, will refetch
  })

  // Process real transaction data - sử dụng tx_type từ API
  const transactions = transactionsData?.transactions?.map((tx) => {
    // Map tx_type từ backend thành type cho UI
    let type = 'sent' // default fallback
    
    if (tx.tx_type === 'SWAP') {
      type = 'swapped'
    } else if (tx.tx_type === 'PAYMENT') {
      // Sử dụng direction để phân biệt sent/received cho payment
      type = tx.direction === 'received' ? 'received' : 'sent'
    }
    
    return {
      id: tx.id,
      type: type,
      amount: tx.tx_type === 'SWAP' ? tx.source_amount : tx.amount,
      currency: tx.tx_type === 'SWAP' ? tx.source_asset_code : tx.asset_code,
      address: tx.destination || 'Unknown',
      date: tx.created_at,
      status: tx.status.toLowerCase(),
      fee: '0.01', // Default fee
      toAmount: tx.tx_type === 'SWAP' ? tx.amount : (tx.buy_asset ? tx.amount : undefined),
      toCurrency: tx.tx_type === 'SWAP' ? tx.asset_code : tx.buy_asset,
      memo: tx.memo,
      description: tx.description
    }
  }) || []

  // Recalculate stats from actual transactions
  const actualStats = {
    totalSent: transactions.filter(tx => tx.type === 'sent').length,
    totalReceived: transactions.filter(tx => tx.type === 'received').length,
    totalSwapped: transactions.filter(tx => tx.type === 'swapped').length,
    totalTransactions: transactions.length,
    averageAmount: transactions.length > 0 ? parseFloat((transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0) / transactions.length).toFixed(3)) : 0,
  }


  // Check for errors
  const hasError = summaryError || transactionsError;


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
    // Enhanced filtering with categorization
    if (activeFilter !== 'all') {
      // Find original transaction for categorization
      const originalTx = transactionsData?.transactions?.find(origTx => origTx.id === tx.id)
      if (originalTx) {
        const category = categorizeTransaction(originalTx)
        if (category !== activeFilter) return false
      }
    }
    
    if (searchQuery) {
      const searchText = (tx.address || tx.id || tx.memo || '').toLowerCase()
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
            const isActive = activeFilter === filter.id
            
            const getColorClasses = (color: string) => {
              const colorMap = {
                gray: isActive 
                  ? 'bg-gray-500 text-white border-gray-500' 
                  : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100',
                red: isActive 
                  ? 'bg-red-500 text-white border-red-500' 
                  : 'text-red-500 hover:text-red-600 hover:bg-red-100',
                green: isActive 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'text-green-500 hover:text-green-600 hover:bg-green-100',
                blue: isActive 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'text-blue-500 hover:text-blue-600 hover:bg-blue-100',
                purple: isActive 
                  ? 'bg-purple-500 text-white border-purple-500' 
                  : 'text-purple-500 hover:text-purple-600 hover:bg-purple-100',
                yellow: isActive 
                  ? 'bg-yellow-500 text-white border-yellow-500' 
                  : 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100',
                pink: isActive 
                  ? 'bg-pink-500 text-white border-pink-500' 
                  : 'text-pink-500 hover:text-pink-600 hover:bg-pink-100',
              }
              return colorMap[color as keyof typeof colorMap] || colorMap.gray
            }
            
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 whitespace-nowrap border ${
                  isActive
                    ? `${getColorClasses(filter.color)} shadow-md backdrop-blur-sm`
                    : `${isDark ? 'text-white/70 hover:text-white hover:bg-white/10 border-transparent' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 border-transparent'}`
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
                      const originalTx = transactionsData?.transactions?.find(tx => tx.id === transaction.id)
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
                          {(() => {
                            const originalTx = transactionsData?.transactions?.find(origTx => origTx.id === transaction.id)
                            return originalTx ? getTransactionIcon(originalTx) : <Activity className="w-5 h-5 text-gray-500" />
                          })()}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {transaction.type}
                            </h3>
                            <div className="flex items-center space-x-1">
                              {getTransactionStatusIcon(transaction.status)}
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                                {transaction.status}
                              </span>
                            </div>
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
                        {transaction.type === 'swapped' ? (
                          <div>
                            <p className={`font-bold text-lg text-blue-400`}>
                              {parseFloat(transaction.amount || '0').toFixed(3)} {transaction.currency || 'XLM'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                              → {transaction.toAmount ? parseFloat(transaction.toAmount).toFixed(3) : '0.000'} {transaction.toCurrency || 'XLM'}
                            </p>
                          </div>
                        ) : (
                          <p className={`font-bold text-lg ${
                            transaction.type === 'sent' ? 'text-red-400' : 
                            transaction.type === 'received' ? 'text-green-400' : 
                            'text-blue-400'
                          }`}>
                            {transaction.type === 'sent' ? '-' : transaction.type === 'received' ? '+' : ''}
                            {parseFloat(transaction.amount || '0').toFixed(3)} {transaction.currency || 'XLM'}
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
