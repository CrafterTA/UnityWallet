import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpDown, Zap, TrendingUp } from 'lucide-react'
import { walletApi } from '@/api/wallet'
import { formatBalance } from '@/lib/utils'
import toast from 'react-hot-toast'

function Swap() {
  const [fromAsset, setFromAsset] = useState('SYP')
  const [toAsset, setToAsset] = useState('USDC')
  const [fromAmount, setFromAmount] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy-900 mb-2">Swap Assets</h1>
        <p className="text-navy-600">Exchange your digital assets instantly</p>
      </div>

      {/* Swap Interface */}
      <div className="bg-white rounded-xl p-6 border border-navy-200 space-y-6">
        {/* From Asset */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-navy-700">From</label>
            <span className="text-sm text-navy-600">
              Balance: {formatBalance(getAssetBalance(fromAsset).toString(), 2)}
            </span>
          </div>
          
          <div className="flex space-x-3">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="flex-1 px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            
            <select
              value={fromAsset}
              onChange={(e) => setFromAsset(e.target.value)}
              className="px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white min-w-[100px]"
            >
              {balances?.map((balance) => (
                <option key={balance.asset_code} value={balance.asset_code}>
                  {balance.asset_code}
                </option>
              ))}
            </select>
          </div>
          
          {fromAmount && parseFloat(fromAmount) > getAssetBalance(fromAsset) && (
            <p className="text-sm text-red-500">Insufficient balance</p>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapAssets}
            className="p-2 bg-navy-100 hover:bg-navy-200 rounded-full transition-colors"
          >
            <ArrowUpDown className="w-5 h-5 text-navy-600" />
          </button>
        </div>

        {/* To Asset */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-navy-700">To</label>
          
          <div className="flex space-x-3">
            <input
              type="text"
              value={quote?.destination_amount || ''}
              readOnly
              className="flex-1 px-4 py-3 border border-navy-300 rounded-lg bg-navy-50 text-navy-700"
              placeholder="0.00"
            />
            
            <select
              value={toAsset}
              onChange={(e) => setToAsset(e.target.value)}
              className="px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white min-w-[100px]"
            >
              {balances?.map((balance) => (
                <option key={balance.asset_code} value={balance.asset_code}>
                  {balance.asset_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="bg-navy-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-navy-600">Exchange Rate:</span>
              <span className="font-medium text-navy-900">
                1 {fromAsset} = {quote.price} {toAsset}
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-navy-600">Network Fee:</span>
              <span className="font-medium text-navy-900">{quote.fee} {fromAsset}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-navy-600">You will receive:</span>
              <span className="font-semibold text-navy-900">
                {quote.destination_amount} {toAsset}
              </span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!isValidAmount || quoteLoading || isSwapping}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSwapping ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5" />
              <span>Swap Now</span>
            </>
          )}
        </button>
      </div>

      {/* Market Info */}
      <div className="bg-white rounded-xl p-6 border border-navy-200">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-success" />
          <h3 className="font-semibold text-navy-900">Market Information</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-navy-600">24h Volume</p>
            <p className="font-semibold text-navy-900">$1.2M</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-navy-600">Liquidity</p>
            <p className="font-semibold text-navy-900">$850K</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
          <p className="text-sm text-accent font-medium">💡 Pro Tip</p>
          <p className="text-sm text-navy-700 mt-1">
            Convert SkyPoints to USDC for easier spending, or to XLM for lower transaction fees.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Swap
