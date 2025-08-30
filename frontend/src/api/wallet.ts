import { apiClient } from './client'

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
}

export interface QuoteResponse {
  path: Array<{
    asset_code: string
    asset_issuer?: string
  }>
  source_amount: string
  destination_amount: string
  price: string
  fee: string
}

export interface TransactionResult {
  hash: string
  status: 'pending' | 'success' | 'failed'
  ledger?: number
}

export const walletApi = {
  async getBalances(): Promise<Balance[]> {
    try {
      const response = await apiClient.get<BalancesResponse>('/wallet/balances')
      return response.data.balances
    } catch (error) {
      throw new Error('Failed to fetch wallet balances from backend')
    }
  },

  async payment(request: PaymentRequest): Promise<TransactionResult> {
    try {
      const response = await apiClient.post<PaymentResponse>('/wallet/payment', request)
      return {
        hash: response.data.tx_id,
        status: response.data.ok ? 'success' : 'failed',
      }
    } catch (error) {
      throw new Error('Payment failed. Please try again.')
    }
  },

  async swap(request: { selling_asset_code: string; buying_asset_code: string; amount: string }): Promise<TransactionResult> {
    try {
      const swapRequest: SwapRequest = {
        sell_asset: request.selling_asset_code,
        buy_asset: request.buying_asset_code,
        amount: request.amount,
      }

      const response = await apiClient.post<SwapResponse>('/wallet/swap', swapRequest)
      return {
        hash: 'swap-' + Date.now(), // Backend doesn't return tx hash for swaps
        status: response.data.ok ? 'success' : 'failed',
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
      // Try to get real quote from backend
      const response = await apiClient.get<QuoteResponse>(`/wallet/quote?from=${fromAsset}&to=${toAsset}&amount=${amount}`)
      return response.data
    } catch (error) {
      // If backend doesn't have quote endpoint, throw error instead of mock data
      throw new Error('Quote service unavailable. Please try again later.')
    }
  },
}
