import { apiClient } from './client'

export interface Balance {
  asset_code: string
  asset_issuer?: string
  balance: string
  asset_type: 'native' | 'credit_alphanum4' | 'credit_alphanum12'
  is_authorized?: boolean
}

export interface PaymentRequest {
  destination: string
  asset_code: string
  asset_issuer?: string
  amount: string
  memo?: string
}

export interface SwapRequest {
  selling_asset_code: string
  selling_asset_issuer?: string
  buying_asset_code: string
  buying_asset_issuer?: string
  amount: string
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
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return [
        {
          asset_code: 'XLM',
          balance: '1000.0000000',
          asset_type: 'native',
        },
        {
          asset_code: 'USDC',
          asset_issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
          balance: '500.0000000',
          asset_type: 'credit_alphanum4',
          is_authorized: true,
        },
        {
          asset_code: 'SYP',
          asset_issuer: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP',
          balance: '15000.0000000',
          asset_type: 'credit_alphanum4',
          is_authorized: true,
        },
      ]
    }

    const response = await apiClient.get<Balance[]>('/wallet/balances')
    return response.data
  },

  async payment(request: PaymentRequest): Promise<TransactionResult> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return {
        hash: 'mock-tx-hash-' + Date.now(),
        status: 'success',
        ledger: Math.floor(Math.random() * 1000000),
      }
    }

    const response = await apiClient.post<TransactionResult>('/wallet/payment', request)
    return response.data
  },

  async swap(request: SwapRequest): Promise<TransactionResult> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return {
        hash: 'mock-swap-hash-' + Date.now(),
        status: 'success',
        ledger: Math.floor(Math.random() * 1000000),
      }
    }

    const response = await apiClient.post<TransactionResult>('/wallet/swap', request)
    return response.data
  },

  async getQuote(
    fromAsset: string,
    toAsset: string,
    amount: string
  ): Promise<QuoteResponse> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const rate = 0.95 + Math.random() * 0.1 // Random rate between 0.95-1.05
      return {
        path: [
          { asset_code: fromAsset },
          { asset_code: toAsset },
        ],
        source_amount: amount,
        destination_amount: (parseFloat(amount) * rate).toFixed(7),
        price: rate.toFixed(7),
        fee: (parseFloat(amount) * 0.01).toFixed(7),
      }
    }

    const response = await apiClient.get<QuoteResponse>(
      `/wallet/quote?from=${fromAsset}&to=${toAsset}&amount=${amount}`
    )
    return response.data
  },
}
