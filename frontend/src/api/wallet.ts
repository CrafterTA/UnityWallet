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
      if (!wallet.wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }
      
      const response = await chainApi.getBalances(wallet.wallet.public_key)
      
      // Convert chain service response to our format
      const balances: Balance[] = Object.entries(response.balances).map(([asset, amount]) => ({
        asset_code: asset,
        amount: amount.toString()
      }))
      
      return balances
    } catch (error) {
      throw new Error('Failed to fetch wallet balances from chain service')
    }
  },

  async getAddress(): Promise<string> {
    try {
      // Get wallet from store
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }
      
      return wallet.wallet.public_key
    } catch (error) {
      throw new Error('Failed to get wallet address')
    }
  },

  async payment(request: PaymentRequest): Promise<TransactionResult> {
    try {
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }

      // Begin send transaction
      const beginResponse = await chainApi.beginSend({
        source_public: wallet.wallet.public_key,
        destination: request.destination,
        asset: { code: request.asset_code },
        amount: request.amount
      })

      // TODO: Sign transaction on frontend using Stellar SDK
      // For now, we'll return a placeholder
      return {
        hash: 'placeholder_hash',
        status: 'pending' as const
      }
    } catch (error) {
      throw new Error('Payment failed. Please try again.')
    }
  },

  async swap(request: { selling_asset_code: string; buying_asset_code: string; amount: string }): Promise<TransactionResult> {
    try {
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }

      // Get swap quote first
      const quoteResponse = await chainApi.getSwapQuote({
        mode: 'send',
        source_asset: { code: request.selling_asset_code },
        dest_asset: { code: request.buying_asset_code },
        source_amount: request.amount,
        source_account: wallet.wallet.public_key
      })

      // Begin swap transaction
      const beginResponse = await chainApi.beginSwap({
        mode: 'send',
        source_public: wallet.wallet.public_key,
        source_asset: { code: request.selling_asset_code },
        dest_asset: { code: request.buying_asset_code },
        source_amount: request.amount,
        dest_min: quoteResponse.dest_amount,
        path: quoteResponse.path
      })

      // TODO: Sign transaction on frontend using Stellar SDK
      // For now, we'll return a placeholder
      return {
        hash: 'placeholder_hash',
        status: 'pending' as const
      }
    } catch (error) {
      throw new Error('Swap failed. Please try again.')
    }
  },

  async getQuote(
    fromAsset: string,
    toAsset: string,
    amount: string
  ): Promise<QuoteResponse> {
    try {
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }

      const response = await chainApi.getSwapQuote({
        mode: 'send',
        source_asset: { code: fromAsset },
        dest_asset: { code: toAsset },
        source_amount: amount,
        source_account: wallet.wallet.public_key
      })

      return {
        quote_id: `quote-${Date.now()}`,
        from_asset: response.source_asset,
        to_asset: response.dest_asset,
        from_amount: response.source_amount,
        to_amount: response.dest_amount,
        exchange_rate: response.price,
        fee_amount: '0.00001', // Placeholder fee
        fee_percentage: '0.1',
        expires_at: new Date(Date.now() + 30000).toISOString(),
        created_at: new Date().toISOString(),
        provider: 'chain-api'
      }
    } catch (error) {
      console.error('Quote error:', error)
      throw new Error('Quote service unavailable. Please try again later.')
    }
  },
}
