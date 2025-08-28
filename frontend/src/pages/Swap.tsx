import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpDown, Zap, TrendingUp } from 'lucide-react'
import { useThemeStore } from '@/store/theme'
import { walletApi } from '@/api/wallet'
import { formatBalance } from '@/lib/utils'
import toast from 'react-hot-toast'

function Swap() {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const [fromAsset, setFromAsset] = useState('SYP')
  const [toAsset, setToAsset] = useState('USDC')
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

  const { data: balances } = useQuery({
    queryKey: ['balances'],
    queryFn: walletApi.getBalances,
  })

  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', fromAsset, toAsset, fromAmount],
    queryFn: () => walletApi.getQuote(fromAsset, toAsset, fromAmount),
    enabled: !!fromAmount && parseFloat(fromAmount) > 0,
    refetchInterval: 10000, // Update quote every 10 seconds
  })

  const handleSwapAssets = () => {
    setFromAsset(toAsset)
    setToAsset(fromAsset)
    setFromAmount('')
  }

  const handleSwap = async () => {
    if (!fromAmount || !quote) return

    setIsSwapping(true)
    try {
      const result = await walletApi.swap({
        selling_asset_code: fromAsset,
        buying_asset_code: toAsset,
        amount: fromAmount,
      })

      toast.success(`Swap successful! TX: ${result.hash.slice(0, 8)}...`)
      setFromAmount('')
    } catch (error) {
      toast.error('Swap failed. Please try again.')
    } finally {
      setIsSwapping(false)
    }
  }

  const getAssetBalance = (assetCode: string) => {
    const balance = balances?.find(b => b.asset_code === assetCode)
    return balance ? parseFloat(balance.balance) : 0
  }

  const isValidAmount = fromAmount && parseFloat(fromAmount) > 0 && parseFloat(fromAmount) <= getAssetBalance(fromAsset)

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

      {/* Swap Interface */}
      <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl space-y-6`}>
        {/* From Asset */}
        <div className="space-y-3">
                     <div className="flex items-center justify-between">
             <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{t('swap.from', 'From')}</label>
             <span className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
               {t('swap.balance', 'Balance')}: {formatBalance(getAssetBalance(fromAsset).toString(), 2)}
             </span>
           </div>
          
          <div className="flex space-x-3">
                         <input
               type="number"
               value={fromAmount}
               onChange={(e) => setFromAmount(e.target.value)}
               className={`flex-1 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm ${
                 isDark 
                   ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                   : 'bg-slate-100/80 border-slate-300 text-slate-900 placeholder-slate-500'
               }`}
               placeholder={t('swap.enterAmount', '0.00')}
               min="0"
               step="0.01"
             />
            
            <div className="relative min-w-[120px]" ref={fromAssetRef}>
              <button
                onClick={() => setFromAssetOpen(!fromAssetOpen)}
                className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm flex items-center justify-between ${
                  isDark 
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' 
                    : 'bg-slate-100/80 border border-slate-300 text-slate-900 hover:bg-slate-200/80'
                }`}
              >
                <span className="font-medium">{fromAsset}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${fromAssetOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {fromAssetOpen && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border backdrop-blur-sm z-10 ${
                  isDark 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white border-slate-200 shadow-lg'
                }`}>
                  {balances?.map((balance) => (
                    <button
                      key={balance.asset_code}
                      onClick={() => {
                        setFromAsset(balance.asset_code)
                        setFromAssetOpen(false)
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                        balance.asset_code === fromAsset
                          ? (isDark ? 'bg-white/20 text-white' : 'bg-yellow-100 text-slate-900')
                          : (isDark ? 'text-white/80 hover:text-white' : 'text-slate-700 hover:text-slate-900')
                      } ${balance.asset_code === fromAsset ? 'font-semibold' : ''}`}
                    >
                      {balance.asset_code}
                    </button>
                  ))}
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
                value={quote?.destination_amount || ''}
                readOnly
                className={`flex-1 px-4 py-3 rounded-xl backdrop-blur-sm ${
                  isDark 
                    ? 'bg-white/10 border-white/20 text-white/70' 
                    : 'bg-slate-100/80 border-slate-300 text-slate-600'
                }`}
                placeholder={t('swap.enterAmount', '0.00')}
              />
             
             <div className="relative min-w-[120px]" ref={toAssetRef}>
               <button
                 onClick={() => setToAssetOpen(!toAssetOpen)}
                 className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm flex items-center justify-between ${
                   isDark 
                     ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20' 
                     : 'bg-slate-100/80 border border-slate-300 text-slate-900 hover:bg-slate-200/80'
                 }`}
               >
                 <span className="font-medium">{toAsset}</span>
                 <svg className={`w-4 h-4 transition-transform duration-200 ${toAssetOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </button>
               
               {toAssetOpen && (
                 <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border backdrop-blur-sm z-10 ${
                   isDark 
                     ? 'bg-white/10 border-white/20' 
                     : 'bg-white border-slate-200 shadow-lg'
                 }`}>
                   {balances?.map((balance) => (
                     <button
                       key={balance.asset_code}
                       onClick={() => {
                         setToAsset(balance.asset_code)
                         setToAssetOpen(false)
                       }}
                       className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                         balance.asset_code === toAsset
                           ? (isDark ? 'bg-white/20 text-white' : 'bg-yellow-100 text-slate-900')
                           : (isDark ? 'text-white/80 hover:text-white' : 'text-slate-700 hover:text-slate-900')
                       } ${balance.asset_code === toAsset ? 'font-semibold' : 'text-slate-700'}`}
                     >
                       {balance.asset_code}
                     </button>
                   ))}
                 </div>
               )}
             </div>
           </div>
         </div>

                                   {/* Quote Details */}
          {quote && (
            <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100/80 border-slate-200'} backdrop-blur-sm rounded-xl p-4 space-y-2 border`}>
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('swap.swapRate', 'Exchange Rate')}:</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  1 {fromAsset} = {quote.price} {toAsset}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('swap.networkFee', 'Network Fee')}:</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{quote.fee} {fromAsset}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('swap.estimatedOutput', 'You will receive')}:</span>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {quote.destination_amount} {toAsset}
                </span>
              </div>
            </div>
          )}

                 {/* Swap Button */}
                   <button
            onClick={handleSwap}
            disabled={!isValidAmount || quoteLoading || isSwapping}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-red-500/20"
          >
           {isSwapping ? (
             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
           ) : (
             <>
               <Zap className="w-5 h-5" />
               <span>{t('swap.swapButton', 'Swap Now')}</span>
             </>
           )}
         </button>
      </div>

             {/* Market Info */}
       <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl`}>
         <div className="flex items-center space-x-2 mb-4">
           <TrendingUp className="w-5 h-5 text-green-400" />
           <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Market Information</h3>
         </div>
         
         <div className="grid grid-cols-2 gap-4">
           <div className="text-center">
             <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>24h Volume</p>
             <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>$1.2M</p>
           </div>
           
           <div className="text-center">
             <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Liquidity</p>
             <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>$850K</p>
           </div>
         </div>
         
         <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl backdrop-blur-sm">
           <p className="text-sm text-yellow-400 font-medium">💡 Pro Tip</p>
           <p className={`text-sm mt-1 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
             Convert SkyPoints to USDC for easier spending, or to XLM for lower transaction fees.
           </p>
         </div>
       </div>
      </div>
    </div>
  )
}

export default Swap
