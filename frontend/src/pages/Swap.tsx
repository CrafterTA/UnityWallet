import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/session'
import { walletApi } from '@/api/wallet'
import { formatBalance, formatBalanceWithAsset } from '@/lib/utils'
import { formatAssetAmountWithPrecision } from '@/lib/currency'
import UnlockModal from '@/components/UnlockModal'
import toast from 'react-hot-toast'

function Swap() {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const { isLocked, lockWallet } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [fromAsset, setFromAsset] = useState('SOL')
  const [toAsset, setToAsset] = useState('USDT')
  const [fromAmount, setFromAmount] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)
  const [fromAssetOpen, setFromAssetOpen] = useState(false)
  const [toAssetOpen, setToAssetOpen] = useState(false)
  const fromAssetRef = useRef<HTMLDivElement>(null)
  const toAssetRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromAssetRef.current && !fromAssetRef.current.contains(event.target as Node)) {
        setFromAssetOpen(false)
      }
      if (toAssetRef.current && !toAssetRef.current.contains(event.target as Node)) {
        setToAssetOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Mock data for swap - completely fake data
  const mockBalances = [
    {
      symbol: 'SOL',
      balance_ui: '4.759',
      balance: '4759000000',
      asset_type: 'native'
    },
    {
      symbol: 'USDT',
      balance_ui: '0.000000',
      balance: '0',
      asset_type: 'token'
    }
  ]

  // Mock swap state management
  const [mockBalancesState, setMockBalancesState] = useState(mockBalances)

  // Use mock data instead of real API
  const balances = mockBalances
  const balancesLoading = false
  const balancesError = null

  // Auto-select first available asset when balances load
  useEffect(() => {
    if (mockBalancesState && mockBalancesState.length > 0) {
      const availableAssets = mockBalancesState.map(b => b.symbol)
      if (!availableAssets.includes(fromAsset)) {
        setFromAsset(availableAssets[0])
      }
      if (!availableAssets.includes(toAsset)) {
        // Set toAsset to a different asset than fromAsset
        const otherAssets = availableAssets.filter(asset => asset !== fromAsset)
        setToAsset(otherAssets.length > 0 ? otherAssets[0] : availableAssets[0])
      }
    }
  }, [mockBalancesState, fromAsset, toAsset])

  // Mock quote data - fake exchange rates
  const getMockQuote = (fromAsset: string, toAsset: string, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return null
    
    const amountNum = parseFloat(amount)
    let exchangeRate = 1
    let toAmount = amountNum
    
    // Mock exchange rates - realistic rates with decimals
    if (fromAsset === 'SOL' && toAsset === 'USDT') {
      exchangeRate = 195.3673 // 1 SOL = 195.3673 USDT
      toAmount = amountNum * exchangeRate
    } else if (fromAsset === 'USDT' && toAsset === 'SOL') {
      exchangeRate = 1 / 195.3673 // 1 USDT = 0.005119 SOL
      toAmount = amountNum * exchangeRate
    }
    
    return {
      to_amount: toAmount.toFixed(6),
      exchange_rate: exchangeRate.toFixed(6),
      fee_amount: '0.000005'
    }
  }

  const quote = fromAmount && parseFloat(fromAmount) > 0 ? getMockQuote(fromAsset, toAsset, fromAmount) : null
  const quoteLoading = false
  const quoteError = null
  const displayQuote = quote

  const handleSwapAssets = () => {
    if (fromAsset !== toAsset) {
      setFromAsset(toAsset)
      setToAsset(fromAsset)
      setFromAmount('')
    }
  }

  const handleSwap = async () => {
    if (!fromAsset || !toAsset || !fromAmount) {
      toast.error(t('swap.fillAllFields', 'Please fill in all fields'))
      return
    }

    if (fromAsset === toAsset) {
      toast.error(t('swap.sameAsset', 'Cannot swap the same asset'))
      return
    }

    const amountNum = parseFloat(fromAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t('swap.invalidAmount', 'Please enter a valid amount'))
      return
    }

    const availableBalance = getAssetBalance(fromAsset)
    
    if (amountNum > availableBalance) {
      toast.error(t('swap.insufficientBalance', 'Insufficient balance'))
      return
    }

    setIsSwapping(true)
    toast.loading(t('swap.processingSwap', 'Processing swap...'), { id: 'swap' })

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock swap logic
      const quote = getMockQuote(fromAsset, toAsset, fromAmount)
      if (!quote) {
        throw new Error('Unable to get quote')
      }

      // Update mock balances
      const newBalances = mockBalancesState.map(balance => {
        if (balance.symbol === fromAsset) {
          const newAmount = parseFloat(balance.balance_ui) - amountNum
          return {
            ...balance,
            balance_ui: newAmount.toFixed(6),
            balance: (newAmount * 1000000000).toString()
          }
        } else if (balance.symbol === toAsset) {
          const newAmount = parseFloat(balance.balance_ui) + parseFloat(quote.to_amount)
          return {
            ...balance,
            balance_ui: newAmount.toFixed(6),
            balance: (newAmount * 1000000000).toString()
          }
        }
        return balance
      })

      setMockBalancesState(newBalances)
      
      toast.success(t('swap.swapSuccessful', 'Swap completed successfully!'), { id: 'swap' })
      setFromAmount('')
      
      // Add mock transaction to localStorage for activity page
      const mockTransaction = {
        id: Date.now().toString(),
        type: 'swap',
        fromAsset,
        toAsset,
        fromAmount: amountNum.toString(),
        toAmount: quote.to_amount,
        fee: quote.fee_amount,
        timestamp: new Date().toISOString(),
        status: 'success',
        // Add detailed transaction information
        signature: `${Date.now().toString(36)}${Math.random().toString(36).substr(2, 9)}`,
        slot: Math.floor(Math.random() * 200000000) + 100000000,
        block_time: Math.floor(Date.now() / 1000),
        logs: [],
        source_amount: amountNum.toString(),
        source_asset_code: fromAsset,
        asset_code: toAsset,
        destination: 'Swap Pool',
        created_at: new Date().toISOString(),
        tx_type: 'SWAP',
        direction: 'swapped',
        memo: `Swap transaction - ${fromAsset} to ${toAsset}`,
        description: `Swap ${amountNum} ${fromAsset} to ${quote.to_amount} ${toAsset}`
      }
      
      const existingTransactions = JSON.parse(localStorage.getItem('mockTransactions') || '[]')
      existingTransactions.unshift(mockTransaction)
      localStorage.setItem('mockTransactions', JSON.stringify(existingTransactions))

    } catch (error) {
      console.error('Swap error:', error)
      toast.error('Swap failed. Please try again.', { id: 'swap' })
    } finally {
      setIsSwapping(false)
    }
  }

  const getAssetBalance = (assetCode: string) => {
    if (!mockBalancesState || !Array.isArray(mockBalancesState)) return 0
    
    const balance = mockBalancesState.find(b => {
      // For Solana, check symbol
      return b.symbol === assetCode
    })
    
    if (!balance) return 0
    
    // For Solana balance format, use balance_ui
    const amount = balance.balance_ui || '0'
    const parsed = parseFloat(amount)
    return isNaN(parsed) ? 0 : parsed
  }

  const isValidAmount = fromAmount && parseFloat(fromAmount) > 0 && parseFloat(fromAmount) <= getAssetBalance(fromAsset) && fromAsset !== toAsset

  return (
    <div className={`min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowUpDown className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('swap.title', 'Swap Assets')}</h1>
          <p className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('swap.subtitle', 'Exchange your digital assets instantly')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-6">

      {/* Error States */}
      {balancesError && (
        <div className={`${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} backdrop-blur-sm rounded-2xl p-6 border text-center`}>
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>{t('common.errorLoading', 'Error Loading Data')}</h3>
          <p className={`${isDark ? 'text-red-300' : 'text-red-600'}`}>
            {t('swap.errorMessage', 'Unable to load wallet balances. Please refresh and try again.')}
          </p>
        </div>
      )}

      {/* Loading State */}
      {balancesLoading && (
        <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl`}>
          <div className="flex items-center justify-center space-x-3">
            <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>{t('common.loadingWallet', 'Loading wallet data...')}</span>
          </div>
        </div>
      )}

      {/* Swap Interface */}
      {!balancesError && !balancesLoading && (
        <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl space-y-6`}>
          {/* From Asset */}
          <div className="space-y-3">
                       <div className="flex items-center justify-between">
               <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{t('swap.from', 'From')}</label>
               <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                 {t('swap.balance', 'Balance')}: {formatBalanceWithAsset(getAssetBalance(fromAsset).toString(), fromAsset, 6)}
               </span>
             </div>
            
            <div className="flex space-x-3">
                                       <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                max={getAssetBalance(fromAsset)}
                className={classNames(
                  'flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 border backdrop-blur-sm',
                  parseFloat(fromAmount) > getAssetBalance(fromAsset) && fromAmount ? 'border-red-500' : '',
                  isDark 
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                    : 'bg-slate-100/80 border-slate-300 text-slate-900 placeholder-slate-500'
                )}
                placeholder={t('swap.enterAmount', '0.01')}
                min="0"
                step="0.001"
              />
              
              <div className="relative min-w-[120px]" ref={fromAssetRef}>
                <button
                  onClick={() => setFromAssetOpen(!fromAssetOpen)}
                  disabled={!mockBalancesState?.length}
                  className={classNames(
                    'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm flex items-center justify-between disabled:opacity-50',
                    isDark 
                      ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' 
                      : 'bg-slate-100/80 border border-slate-300 text-slate-900 hover:bg-slate-200/80'
                  )}
                >
                  <span className="font-medium">{fromAsset}</span>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${fromAssetOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {fromAssetOpen && mockBalancesState && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border backdrop-blur-sm z-50 ${
                    isDark 
                      ? 'bg-slate-800/95 border-slate-600 shadow-2xl' 
                      : 'bg-white border-slate-200 shadow-2xl'
                  }`}>
                    {mockBalancesState
                      .filter(balance => {
                        const symbol = balance.symbol || balance.symbol
                        return symbol !== toAsset
                      })
                      .map((balance) => {
                        const symbol = balance.symbol || balance.symbol
                        const amount = balance.balance_ui || '0'
                        return (
                          <button
                            key={symbol}
                            onClick={() => {
                              setFromAsset(symbol)
                              setFromAssetOpen(false)
                            }}
                            className={`w-full px-4 py-3 text-left transition-colors ${
                              symbol === fromAsset
                                ? (isDark ? 'bg-slate-700 text-white' : 'bg-yellow-100 text-slate-900')
                                : (isDark ? 'text-white/80 hover:bg-slate-700/50 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                            } ${symbol === fromAsset ? 'font-semibold' : ''}`}
                          >
                            {symbol} ({formatAssetAmountWithPrecision(amount, symbol, 6)})
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>
            
                       {fromAmount && parseFloat(fromAmount) > getAssetBalance(fromAsset) && (
               <p className="text-sm text-red-500">{t('swap.insufficientBalance', 'Insufficient balance')}</p>
             )}
          </div>

                   {/* Swap Button */}
           <div className="flex justify-center">
             <button
               onClick={handleSwapAssets}
               className={`p-2 rounded-full transition-colors backdrop-blur-sm border ${
                 isDark 
                   ? 'bg-white/10 hover:bg-white/20 border-white/20' 
                   : 'bg-slate-200 hover:bg-slate-300 border-slate-300'
               }`}
             >
               <ArrowUpDown className={`w-5 h-5 ${isDark ? 'text-white' : 'text-slate-700'}`} />
             </button>
           </div>

                                     {/* To Asset */}
            <div className="space-y-3">
              <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{t('swap.to', 'To')}</label>
             
             <div className="flex space-x-3">
                 <input
                type="text"
                value={
                  quoteLoading && fromAmount && parseFloat(fromAmount) > 0 
                    ? 'Calculating...'
                    : displayQuote?.to_amount || ''
                }
                placeholder={fromAmount ? 'Estimated output' : 'Enter amount above'}
                readOnly
                className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 border backdrop-blur-sm ${
                  isDark 
                    ? 'bg-white/10 border-white/20 text-white/70 placeholder-white/40' 
                    : 'bg-slate-100/80 border-slate-300 text-slate-600 placeholder-slate-400'
                }`}
              />
               
               <div className="relative min-w-[120px]" ref={toAssetRef}>
                 <button
                   onClick={() => setToAssetOpen(!toAssetOpen)}
                   disabled={!mockBalancesState?.length}
                   className={classNames(
                     'w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm flex items-center justify-between disabled:opacity-50',
                     isDark 
                       ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' 
                       : 'bg-slate-100/80 border border-slate-300 text-slate-900 hover:bg-slate-200/80'
                   )}
                 >
                   <span className="font-medium">{toAsset}</span>
                   <svg className={`w-4 h-4 transition-transform duration-200 ${toAssetOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                   </svg>
                 </button>
                 
                 {toAssetOpen && mockBalancesState && (
                   <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border backdrop-blur-sm z-50 ${
                     isDark 
                       ? 'bg-slate-800/95 border-slate-600 shadow-2xl' 
                       : 'bg-white border-slate-200 shadow-2xl'
                   }`}>
                     {mockBalancesState
                       .filter(balance => {
                         const symbol = balance.symbol || balance.symbol
                         return symbol !== fromAsset
                       })
                       .map((balance) => {
                         const symbol = balance.symbol || balance.symbol
                         const amount = balance.balance_ui || '0'
                         return (
                           <button
                             key={symbol}
                             onClick={() => {
                               setToAsset(symbol)
                               setToAssetOpen(false)
                             }}
                             className={`w-full px-4 py-3 text-left transition-colors ${
                               symbol === toAsset
                                 ? (isDark ? 'bg-slate-700 text-white' : 'bg-yellow-100 text-slate-900')
                                 : (isDark ? 'text-white/80 hover:bg-slate-700/50 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900')
                             } ${symbol === toAsset ? 'font-semibold' : ''}`}
                           >
                             {symbol} ({formatAssetAmountWithPrecision(amount, symbol, 6)})
                           </button>
                         )
                       })}
                   </div>
                 )}
               </div>
             </div>
           </div>

                                     {/* Quote Details */}
            {displayQuote && (
              <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100/80 border-slate-200'} backdrop-blur-sm rounded-xl p-4 space-y-2 border`}>
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('swap.swapRate', 'Exchange Rate')}:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    1 {fromAsset} = {displayQuote.exchange_rate} {toAsset}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('swap.networkFee', 'Network Fee')}:</span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{displayQuote.fee_amount} SOL</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('swap.estimatedOutput', 'You will receive')}:</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {displayQuote.to_amount} {toAsset}
                  </span>
                </div>
                
              </div>
            )}

            {/* Quote Error */}
            {quoteError && fromAmount && parseFloat(fromAmount) > 0 && (
              <div className={`${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} backdrop-blur-sm rounded-xl p-4 border`}>
                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  {t('swap.quoteError', 'Unable to get quote. Please try again.')}
                </p>
              </div>
            )}

                   {/* Swap Button */}
                     <button
              onClick={handleSwap}
              disabled={!isValidAmount || quoteLoading || isSwapping || !!quoteError}
              className={classNames(
                'w-full font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-red-500/20',
                isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900'
              )}
            >
             {isSwapping ? (
               <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
             ) : quoteLoading ? (
               <>
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                 <span>{t('swap.gettingQuote', 'Getting Quote...')}</span>
               </>
             ) : (
               <>
                 <Zap className="w-5 h-5" />
                 <span>{t('swap.swapButton', 'Swap Now')}</span>
               </>
             )}
           </button>
        </div>
      )}

               {/* Market Info */}
         <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl`}>
           <div className="flex items-center space-x-2 mb-4">
             <TrendingUp className="w-5 h-5 text-green-400" />
             <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('swap.marketInfo', 'Market Information')}</h3>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div className="text-center">
               <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{t('swap.volume24h', '24h Volume')}</p>
               <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                 {balancesError ? 'N/A' : '$1.2M'}
               </p>
             </div>
             
             <div className="text-center">
               <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{t('swap.liquidity', 'Liquidity')}</p>
               <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                 {balancesError ? 'N/A' : '$850K'}
               </p>
             </div>
           </div>
           
           <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl backdrop-blur-sm">
             <p className="text-sm text-yellow-400 font-medium">💡 {t('swap.proTip', 'Pro Tip')}</p>
             <p className={`text-sm mt-1 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
               {t('swap.tip', 'Convert SOL to USDT for easier spending, or swap between different tokens on Solana.')}
             </p>
           </div>
         </div>
      </div>
      
      {/* Unlock Modal */}
      <UnlockModal isOpen={isLocked} onClose={() => {}} />
    </div>
  )
}

// Helper function to handle classNames
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default Swap
