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

  // Fetch detailed transaction info from Solana
  useEffect(() => {
    if (isOpen && transaction?.signature) {
      setLoading(true)
      // For now, we'll use the transaction data we already have
      // In the future, we could fetch more details from Solana RPC
      setTxDetails({
        signature: transaction.signature,
        slot: transaction.slot,
        blockTime: transaction.block_time,
        fee: transaction.fee,
        success: transaction.status === 'SUCCESS',
        logs: transaction.logs
      })
      setLoading(false)
    }
  }, [isOpen, transaction?.signature])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const openInSolanaExplorer = (signature: string) => {
    window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank')
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

  const formatSolanaSignature = (signature: string) => {
    if (!signature) return 'N/A'
    return `${signature.substring(0, 8)}...${signature.substring(signature.length - 8)}`
  }

  const formatSolanaAddress = (address: string) => {
    if (!address) return 'N/A'
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
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
                  +{formatAmount(transaction.amount, transaction.asset_code || 'SOL')}
                </div>
              </div>
            ) : (
              <div className={`
                mt-3 text-3xl font-bold
                ${transaction.direction === 'sent' ? 'text-red-400' : 
                  transaction.direction === 'received' ? 'text-green-400' :
                  'text-blue-400'}
              `}>
                {formatAmount(transaction.amount, transaction.asset_code || 'SOL')}
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
                {formatDate(transaction.created_at.toString())}
              </span>
            </div>

            {/* Transaction Signature */}
            {transaction.signature && (
              <div className="flex justify-between items-center">
                <span className={` 
                  text-sm font-medium
                  ${isDark ? 'text-gray-300' : 'text-gray-600'}
                `}>
                  Transaction Signature
                </span>
                <div className="flex items-center gap-2">
                  <span className={` 
                    text-xs font-mono
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {formatSolanaSignature(transaction.signature)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(transaction.signature!, 'signature')}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {copied === 'signature' ? (
                      <Check className="h-3 w-3 text-green-400" />
                    ) : (
                      <Copy className="h-3 w-3 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openInSolanaExplorer(transaction.signature!)}
                    className={`p-1 rounded transition-colors ${
                      isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <ExternalLink className="h-3 w-3 text-blue-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Solana Details */}
            {txDetails && (
              <>
                <div className="flex justify-between items-center">
                  <span className={` 
                    text-sm font-medium
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Slot
                  </span>
                  <span className={` 
                    text-sm font-mono
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    #{txDetails.slot}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={` 
                    text-sm font-medium
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Transaction Fee
                  </span>
                  <span className={` 
                    text-sm font-mono
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {txDetails.fee} SOL
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className={` 
                    text-sm font-medium
                    ${isDark ? 'text-gray-300' : 'text-gray-600'}
                  `}>
                    Block Time
                  </span>
                  <span className={` 
                    text-sm
                    ${isDark ? 'text-gray-400' : 'text-gray-700'}
                  `}>
                    {txDetails.blockTime ? new Date(txDetails.blockTime * 1000).toLocaleString() : 'N/A'}
                  </span>
                </div>

                {txDetails.logs && txDetails.logs.length > 0 && (
                  <div className="flex justify-between items-start">
                    <span className={` 
                      text-sm font-medium
                      ${isDark ? 'text-gray-300' : 'text-gray-600'}
                    `}>
                      Logs
                    </span>
                    <div className={` 
                      text-xs font-mono max-w-48 text-right
                      ${isDark ? 'text-gray-400' : 'text-gray-700'}
                    `}>
                      {txDetails.logs.slice(0, 3).map((log: string, index: number) => (
                        <div key={index} className="truncate">
                          {log}
                        </div>
                      ))}
                      {txDetails.logs.length > 3 && (
                        <div className="text-gray-500">
                          +{txDetails.logs.length - 3} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                  Loading Solana details...
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
                    {formatSolanaAddress(transaction.destination)}
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
                    {formatSolanaAddress(transaction.source)}
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

            {/* Transaction Type */}
            <div className="flex justify-between items-center">
              <span className={`
                text-sm font-medium
                ${isDark ? 'text-gray-300' : 'text-gray-600'}
              `}>
                Type
              </span>
              <span className={`
                text-sm font-semibold
                ${isDark ? 'text-gray-400' : 'text-gray-700'}
              `}>
                {transaction.tx_type || 'PAYMENT'}
              </span>
            </div>

            {/* Symbol */}
            <div className="flex justify-between items-center">
              <span className={`
                text-sm font-medium
                ${isDark ? 'text-gray-300' : 'text-gray-600'}
              `}>
                Token
              </span>
              <span className={`
                text-sm font-semibold
                ${isDark ? 'text-gray-400' : 'text-gray-700'}
              `}>
                {transaction.symbol || transaction.asset_code || 'SOL'}
              </span>
            </div>

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
          <div className="flex gap-2">
            {transaction.signature && (
              <button
                onClick={() => openInSolanaExplorer(transaction.signature!)}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${isDark 
                    ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 border border-blue-500/30' 
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                  }
                `}
              >
                <ExternalLink className="h-3 w-3" />
                View on Solana Explorer
              </button>
            )}
            <button
              onClick={onClose}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors
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
