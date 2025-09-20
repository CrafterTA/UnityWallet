import { apiClient } from './client'
import { chainApi } from './chain'

export interface Balance {
  asset_code: string
  amount: string
}

export interface BalancesResponse {
  balances: Balance[]
}

export interface PaymentRequest {
  destination: string
  asset_code: string
  amount: string
  memo?: string
}

export interface PaymentResponse {
  ok: boolean
  tx_id: string
  stellar: any
}

export interface SwapRequest {
  sell_asset: string
  buy_asset: string
  amount: string
}

export interface SwapResponse {
  ok: boolean
  swapped: string
  rate: string
  tx_id: string
}

export interface QuoteResponse {
  quote_id: string
  from_asset: string
  to_asset: string
  from_amount: string
  to_amount: string
  exchange_rate: string
  fee_amount: string
  fee_percentage: string
  expires_at: string
  created_at: string
  provider: string
}

export interface TransactionResult {
  hash: string
  status: 'pending' | 'success' | 'failed'
  ledger?: number
}

export const walletApi = {
  async getBalances(): Promise<Balance[]> {
    try {
      // Get wallet from store
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.state?.wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }
      
      const response = await chainApi.getBalances(wallet.state.wallet.public_key)
      
      // Convert chain service response to our format
      const balances: Balance[] = Object.entries(response.balances).map(([asset, amount]) => ({
        asset_code: asset === 'XLM' ? 'XLM' : asset.includes(':') ? asset.split(':')[0] : asset,
        amount: amount.toString()
      }))
      
      return balances
    } catch (error) {
      console.error('Wallet balance error:', error)
      throw new Error('Failed to fetch wallet balances from chain service')
    }
  },

  async getAddress(): Promise<string> {
    try {
      // Get wallet from store
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.state?.wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }
      
      return wallet.state.wallet.public_key
    } catch (error) {
      throw new Error('Failed to get wallet address')
    }
  },

  async payment(request: PaymentRequest): Promise<TransactionResult> {
    try {
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.state?.wallet?.public_key || !wallet.state?.wallet?.secret) {
        throw new Error('No wallet found. Please login first.')
      }

      // Use the old execute endpoint for now (requires secret key)
      const response = await chainApi.executeSend({
        secret: wallet.state.wallet.secret,
        destination: request.destination,
        source: { code: request.asset_code },
        amount: request.amount
      })

      return {
        hash: response.hash,
        status: 'success' as const,
        ledger: response.envelope_xdr ? 1 : undefined
      }
    } catch (error) {
      console.error('Payment error:', error)
      throw new Error('Payment failed. Please try again.')
    }
  },

  async swap(request: { selling_asset_code: string; buying_asset_code: string; amount: string }): Promise<TransactionResult> {
    try {
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.state?.wallet?.public_key || !wallet.state?.wallet?.secret) {
        throw new Error('No wallet found. Please login first.')
      }


      // Get swap quote first
      const quoteResponse = await chainApi.getSwapQuote({
        mode: 'send',
        source_asset: { code: request.selling_asset_code },
        dest_asset: { code: request.buying_asset_code },
        source_amount: request.amount,
        source_account: wallet.state.wallet.public_key,
        max_paths: 5,
        slippage_bps: 200
      })
      

      const destMin = quoteResponse.dest_min_suggest || quoteResponse.dest_amount || '0'

      // Parse asset formats from quote response
      const parseAsset = (assetStr: string) => {
        if (assetStr === 'XLM' || !assetStr.includes(':')) {
          return { code: assetStr }
        }
        const [code, issuer] = assetStr.split(':')
        return { code, issuer }
      }

      const sourceAsset = parseAsset(quoteResponse.source_asset || `${request.selling_asset_code}`)
      const destAsset = parseAsset(quoteResponse.dest_asset || `${request.buying_asset_code}`)

      // Use path from quote response
      const swapPath = quoteResponse.raw?.path || quoteResponse.path || []

      // Execute swap using the old execute endpoint
      const swapResponse = await chainApi.executeSwap({
        mode: 'send',
        secret: wallet.state.wallet.secret,
        destination: wallet.state.wallet.public_key,
        source_asset: sourceAsset,
        dest_asset: destAsset,
        source_amount: request.amount,
        dest_min: destMin,
        path: swapPath
      })

      return {
        hash: swapResponse.hash,
        status: 'success' as const
      }
    } catch (error) {
      console.error('Swap error:', error)
      throw new Error('Swap failed. Please try again.')
    }
  },

  async getQuote(
    fromAsset: string,
    toAsset: string,
    amount: string
  ): Promise<QuoteResponse> {
    try {
      // Try different wallet storage keys
      let publicKey = localStorage.getItem('stellar_public_key')
      
      if (!publicKey) {
        const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
        publicKey = wallet.state?.wallet?.public_key
      }

      if (!publicKey) {
        throw new Error('No wallet found. Please login first.')
      }

      const response = await chainApi.getSwapQuote({
        mode: 'send',
        source_asset: { code: fromAsset },
        dest_asset: { code: toAsset },
        source_amount: amount,
        source_account: publicKey,
        max_paths: 5,
        slippage_bps: 200
      })

      // Map from chain service response structure
      return {
        quote_id: `quote-${Date.now()}`,
        from_asset: fromAsset,
        to_asset: toAsset,
        from_amount: amount,
        to_amount: response.destination_amount || response.dest_min_suggest || '0',
        exchange_rate: response.implied_price || response.price || '1',
        fee_amount: response.network_fee_xlm || '0.00001',
        fee_percentage: '0.1',
        expires_at: new Date(Date.now() + 30000).toISOString(),
        created_at: new Date().toISOString(),
        provider: 'chain-api'
      }
    } catch (error) {
      console.error('Quote error:', error)
      throw new Error('Quote service unavailable. Please ensure chain service is running.')
    }
  },
}
