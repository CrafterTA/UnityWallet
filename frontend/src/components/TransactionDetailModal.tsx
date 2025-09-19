import React, { useState, useEffect } from 'react'
import { X, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, DollarSign, ExternalLink, Copy, Check } from 'lucide-react'
import { Transaction } from '../api/transactions'
import { useThemeStore } from '../store/theme'
import { chainApi } from '../api/chain'

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
  const [txDetails, setTxDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Fetch detailed transaction info from Stellar
  useEffect(() => {
    if (isOpen && transaction?.stellar_tx_hash) {
      setLoading(true)
      chainApi.lookupTransaction(transaction.stellar_tx_hash)
        .then(details => {
          setTxDetails(details)
        })
        .catch(error => {
          console.error('Failed to fetch transaction details:', error)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [isOpen, transaction?.stellar_tx_hash])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const openInStellarExpert = (hash: string) => {
    window.open(`https://stellar.expert/explorer/testnet/tx/${hash}`, '_blank')
  }

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
    return `${num.toFixed(7)} ${symbol}`
  }

  const formatStellarHash = (hash: string) => {
    if (!hash) return 'N/A'
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
  }

  const formatStellarAddress = (address: string) => {
    if (!address) return 'N/A'
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
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
        relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl
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
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Transaction Type & Amount */}
          <div className="text-center">
            <div className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
              ${transaction.tx_type === 'SWAP' ? 'bg-blue-100 text-blue-700' :
                transaction.direction === 'sent' ? 'bg-red-100 text-red-700' : 
                transaction.direction === 'received' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'}
            `}>
              {getTransactionIcon(transaction.tx_type === 'SWAP' ? 'swapped' : transaction.direction)}
              {transaction.tx_type === 'SWAP' ? 'SWAPPED' : transaction.direction.toUpperCase()}
            </div>
            {transaction.tx_type === 'SWAP' ? (
              <div className="mt-3 space-y-2">
                <div className={`
                  text-2xl font-bold text-red-400
                `}>
                  -{formatAmount(transaction.source_amount || '0', transaction.source_asset_code || 'XLM')}
                </div>
                <div className="text-gray-400">→</div>
                <div className={`
                  text-2xl font-bold text-green-400
                `}>
                  +{formatAmount(transaction.amount, transaction.asset_code)}
                </div>
              </div>
            ) : (
              <div className={`
                mt-3 text-3xl font-bold
                ${transaction.direction === 'sent' ? 'text-red-400' : 
                  transaction.direction === 'received' ? 'text-green-400' :
                  'text-blue-400'}
              `}>
                {formatAmount(transaction.amount, transaction.asset_code)}
              </div>
            )}
            <div className={`
              mt-1 text-sm
              ${isDark ? 'text-gray-400' : 'text-gray-600'}
            `}>
              {transaction.tx_type === 'SWAP' ? 
                `${transaction.source_asset_code || 'XLM'} → ${transaction.asset_code}` : 
                transaction.asset_code}
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

            {/* Transaction Hash */}
            {transaction.stellar_tx_hash && (
              <div className="flex justify-between items-center">
                <span className={` 
                  text-sm font-medium
                  ${isDark ? 'text-gray-300' : 'text-gray-600'}
                `}>
                  Transaction Hash
                </span>
                <div className="flex items-center gap-2">
                  <span className={` 
                    text-xs font-mono
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {formatStellarHash(transaction.stellar_tx_hash)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.stellar_tx_hash!, 'hash')}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {copied === 'hash' ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openInStellarExpert(transaction.stellar_tx_hash!)}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ExternalLink className="h-3 w-3 text-blue-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Stellar Details */}
            {txDetails && (
              <>
                <div className="flex justify-between items-center">
                  <span className={` 
                    text-sm font-medium
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Ledger
                  </span>
                  <span className={` 
                    text-sm font-mono
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    #{txDetails.ledger}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={` 
                    text-sm font-medium
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Fee Charged
                  </span>
                  <span className={` 
                    text-sm font-mono
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {txDetails.fee_charged} stroops
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={` 
                    text-sm font-medium
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Operations
                  </span>
                  <span className={` 
                    text-sm
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {txDetails.operation_count}
                  </span>
                </div>
              </>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex justify-center items-center py-4">
                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
                  isDark ? 'border-white' : 'border-gray-900'
                }`} />
                <span className={`ml-2 text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Loading Stellar details...
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
                <div className="flex items-center gap-2">
                  <span className={`
                    text-sm font-mono
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {formatStellarAddress(transaction.destination)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.destination!, 'destination')}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {copied === 'destination' ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                </div>
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
                <div className="flex items-center gap-2">
                  <span className={`
                    text-sm font-mono
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {formatStellarAddress(transaction.source)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.source!, 'source')}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {copied === 'source' ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                </div>
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
          <div className="flex gap-3">
            {transaction.stellar_tx_hash && (
              <button
                onClick={() => openInStellarExpert(transaction.stellar_tx_hash!)}
                className={`
                  flex-1 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2
                  ${isDark 
                    ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 border border-blue-500/30' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                  }
                `}
              >
                <ExternalLink className="h-4 w-4" />
                View on Stellar Expert
              </button>
            )}
            <button
              onClick={onClose}
              className={`
                flex-1 py-3 px-4 rounded-xl font-medium transition-colors
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
    </div>
  )
}

export default TransactionDetailModal
