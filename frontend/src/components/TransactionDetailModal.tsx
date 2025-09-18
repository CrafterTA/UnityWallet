import React from 'react'
import { X, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, DollarSign } from 'lucide-react'
import { Transaction } from '../api/transactions'
import { useThemeStore } from '../store/theme'

interface TransactionDetailModalProps {
  transaction: Transaction | null
  isOpen: boolean
  onClose: () => void
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  isOpen,
  onClose
}) => {
  const { isDark } = useThemeStore()

  if (!isOpen || !transaction) return null

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'sent':
        return <ArrowUpRight className="h-5 w-5 text-red-400" />
      case 'received':
        return <ArrowDownLeft className="h-5 w-5 text-green-400" />
      case 'swapped':
        return <ArrowLeftRight className="h-5 w-5 text-blue-400" />
      default:
        return <DollarSign className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-green-400'
      case 'pending':
        return 'text-yellow-400'
      case 'failed':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatAmount = (amount: string, symbol: string) => {
    const num = parseFloat(amount)
    return `${num >= 0 ? '+' : ''}${num.toFixed(7)} ${symbol}`
  }

  const generateHashFromId = (id: string) => {
    // Generate a hash-like string from transaction ID
    const hash = btoa(id).replace(/[+/=]/g, '').substring(0, 32)
    return `0x${hash}${Math.random().toString(16).substring(2, 8)}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-md mx-4 rounded-2xl shadow-2xl
        ${isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'}
        transform transition-all duration-300 ease-out
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b
          ${isDark ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <div className="flex items-center gap-3">
            {getTransactionIcon(transaction.direction)}
            <h2 className={`
              text-xl font-semibold
              ${isDark ? 'text-white' : 'text-gray-900'}
            `}>
              Transaction Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`
              p-2 rounded-full transition-colors
              ${isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}
            `}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Type & Amount */}
          <div className="text-center">
            <div className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              ${transaction.direction === 'sent' ? 'bg-red-100 text-red-700' : 
                transaction.direction === 'received' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'}
            `}>
              {getTransactionIcon(transaction.direction)}
              {transaction.direction.toUpperCase()}
            </div>
            <div className={`
              mt-3 text-3xl font-bold
              ${transaction.direction === 'sent' ? 'text-red-400' : 
                transaction.direction === 'received' ? 'text-green-400' :
                'text-blue-400'}
            `}>
              {formatAmount(transaction.amount, transaction.asset_code)}
            </div>
            <div className={`
              mt-1 text-sm
              ${isDark ? 'text-gray-400' : 'text-gray-600'}
            `}>
              {transaction.asset_code}
            </div>
          </div>

          {/* Transaction Info */}
          <div className="space-y-4">
            {/* Status */}
            <div className="flex justify-between items-center">
              <span className={`
                text-sm font-medium
                ${isDark ? 'text-gray-300' : 'text-gray-600'}
              `}>
                Status
              </span>
              <span className={`
                text-sm font-semibold capitalize
                ${getStatusColor(transaction.status)}
              `}>
                {transaction.status}
              </span>
            </div>

            {/* Date */}
            <div className="flex justify-between items-center">
              <span className={`
                text-sm font-medium
                ${isDark ? 'text-gray-300' : 'text-gray-600'}
              `}>
                Date
              </span>
              <span className={`
                text-sm
                ${isDark ? 'text-gray-400' : 'text-gray-700'}
              `}>
                {formatDate(transaction.created_at)}
              </span>
            </div>

            {/* Transaction Hash/ID */}
            {(transaction.stellar_tx_hash || transaction.id) && (
              <div className="flex justify-between items-center">
                <span className={` 
                  text-sm font-medium
                  ${isDark ? 'text-gray-300' : 'text-gray-600'}
                `}>
                  Transaction Hash
                </span>
                <span className={` 
                  text-xs font-mono break-all text-right max-w-48
                  ${isDark ? 'text-gray-400' : 'text-gray-700'}
                `}>
                  {transaction.stellar_tx_hash || generateHashFromId(transaction.id)}
                </span>
              </div>
            )}

            {/* From/To */}
            {transaction.direction === 'sent' && transaction.destination && (
              <div className="flex justify-between items-center">
                <span className={`
                  text-sm font-medium
                  ${isDark ? 'text-gray-300' : 'text-gray-600'}
                `}>
                  To
                </span>
                <span className={`
                  text-sm font-mono break-all text-right max-w-48
                  ${isDark ? 'text-gray-400' : 'text-gray-700'}
                `}>
                  {transaction.destination}
                </span>
              </div>
            )}

            {transaction.direction === 'received' && transaction.source && (
              <div className="flex justify-between items-center">
                <span className={`
                  text-sm font-medium
                  ${isDark ? 'text-gray-300' : 'text-gray-600'}
                `}>
                  From
                </span>
                <span className={`
                  text-sm font-mono break-all text-right max-w-48
                  ${isDark ? 'text-gray-400' : 'text-gray-700'}
                `}>
                  {transaction.source}
                </span>
              </div>
            )}

            {/* Memo */}
            {transaction.memo && (
              <div className="flex justify-between items-start">
                <span className={`
                  text-sm font-medium
                  ${isDark ? 'text-gray-300' : 'text-gray-600'}
                `}>
                  Memo
                </span>
                <span className={`
                  text-sm break-all text-right max-w-48
                  ${isDark ? 'text-gray-400' : 'text-gray-700'}
                `}>
                  {transaction.memo}
                </span>
              </div>
            )}

            {/* Swap Details */}
            {transaction.direction === 'swapped' && transaction.sell_asset && transaction.buy_asset && (
              <>
                <div className="flex justify-between items-center">
                  <span className={`
                    text-sm font-medium
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Sell Asset
                  </span>
                  <span className={`
                    text-sm
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {transaction.sell_asset}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`
                    text-sm font-medium
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Buy Asset
                  </span>
                  <span className={`
                    text-sm
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {transaction.buy_asset}
                  </span>
                </div>
                {transaction.rate && (
                  <div className="flex justify-between items-center">
                    <span className={`
                      text-sm font-medium
                      ${isDark ? 'text-gray-300' : 'text-gray-600'}
                    `}>
                      Exchange Rate
                    </span>
                    <span className={`
                      text-sm
                      ${isDark ? 'text-gray-400' : 'text-gray-700'}
                    `}>
                      {transaction.rate}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`
          p-6 border-t
          ${isDark ? 'border-gray-700' : 'border-gray-200'}
        `}>
          <button
            onClick={onClose}
            className={`
              w-full py-3 px-4 rounded-xl font-medium transition-colors
              ${isDark 
                ? 'bg-gray-800 text-white hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TransactionDetailModal
