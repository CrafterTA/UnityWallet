import { chainApiClient } from './client'

// Chain API base URL - should be different from main backend
const CHAIN_API_BASE_URL = import.meta.env.VITE_CHAIN_API_BASE_URL || 'http://localhost:8000'

class ChainApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T }> {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { data }
    } catch (error) {
      console.error('Chain API request failed:', error)
      throw error
    }
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    })
  }

  async get<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint, { method: 'GET' })
  }
}

// Using imported chainApiClient from client.ts

// Chain API interfaces
export interface DexQuoteRequest {
  side: 'sell' | 'buy'
  from_code: string
  to_code: string
  amount: string
  account?: string
  slippage_bps?: number
}

export interface DexQuoteResponse {
  found: boolean
  side: 'sell' | 'buy'
  from: string
  to: string
  amount_in: string
  amount_out: string
  price: string
  price_inverse: string
  slippage_bps: number
  min_received?: string
  max_sold?: string
  network_fee_xlm: string
  route: string[]
  execute_suggest: {
    mode: 'send' | 'receive'
    source_amount?: string
    dest_min?: string
    dest_amount?: string
    source_max?: string
    path: any[]
  }
  raw: any
}

export interface DexExecuteRequest {
  side: 'sell' | 'buy'
  secret: string
  from_code: string
  to_code: string
  amount: string
  destination?: string
  slippage_bps?: number
}

export interface DexExecuteResponse {
  success: boolean
  tx_hash?: string
  error?: string
  result?: any
}

// Wallet API Types
export interface CreateWalletRequest {
  fund?: boolean
  use_mnemonic?: boolean
  words?: 12 | 24
  account_index?: number
  passphrase?: string
}

export interface CreateWalletResponse {
  mode: 'mnemonic' | 'random'
  mnemonic?: string
  passphrase_used: boolean
  account_index?: number
  public_key: string
  secret: string
  account_exists: boolean
  funded_or_existing: boolean
  fund_error?: string
  balances: Record<string, string>
}

export interface ImportWalletRequest {
  secret: string
  fund?: boolean
}

export interface ImportWalletResponse {
  public_key: string
  account_exists: boolean
  funded_now: boolean
  fund_error?: string
  balances: Record<string, string>
}

export interface ImportMnemonicRequest {
  mnemonic: string
  passphrase?: string
  account_index?: number
  fund?: boolean
}

export interface ImportMnemonicResponse {
  public_key: string
  secret: string
  account_exists: boolean
  funded_now: boolean
  fund_error?: string
  balances: Record<string, string>
}

export interface WalletBalancesResponse {
  public_key: string
  balances: Record<string, string>
}

// Send API Types
export interface SendEstimateRequest {
  source: { code: string; issuer?: string }
  amount: string
  destination: string
}

export interface SendEstimateResponse {
  estimated_base_fee_stroops: number
  note: string
}

export interface SendBeginRequest {
  source_public: string
  destination: string
  asset: { code: string; issuer?: string }
  amount: string
}

export interface SendBeginResponse {
  xdr: string
  network_passphrase: string
  estimated_base_fee: number
  op_count: number
}

export interface SendCompleteRequest {
  public_key?: string
  signed_xdr: string
}

export interface SendCompleteResponse {
  hash: string
  envelope_xdr?: string
  result_xdr?: string
  balances: Record<string, string>
}

export interface SendExecRequest {
  secret: string
  destination: string
  source: { code: string; issuer?: string }
  amount: string
}

export interface SendExecResponse {
  hash: string
  fee_charged?: string
  envelope_xdr?: string
  result_xdr?: string
  balances: Record<string, string>
}

// Swap API Types
export interface SwapQuoteRequest {
  mode: 'send' | 'receive'
  source_asset: { code: string; issuer?: string }
  dest_asset: { code: string; issuer?: string }
  source_amount?: string
  dest_amount?: string
  source_account?: string
  max_paths?: number
  slippage_bps?: number
}

export interface SwapQuoteResponse {
  mode: 'send' | 'receive'
  source_asset: string
  dest_asset: string
  source_amount: string
  dest_amount: string
  price: string
  path: any[]
  raw: any
  // Additional fields from chain service
  dest_min_suggest?: string
  destination_amount?: string
  implied_price?: string
  implied_price_inverse?: string
  network_fee_xlm?: string
  network_fee_stroops?: string
  op_count_estimate?: number
  path_assets?: string[]
  execute_suggest?: any
}

export interface SwapBeginRequest {
  mode: 'send' | 'receive'
  source_public: string
  destination?: string
  source_asset: { code: string; issuer?: string }
  dest_asset: { code: string; issuer?: string }
  source_amount?: string
  dest_min?: string
  dest_amount?: string
  source_max?: string
  path?: any[]
}

export interface SwapBeginResponse {
  xdr: string
  network_passphrase: string
  estimated_base_fee: number
  op_count: number
}

export interface SwapCompleteRequest {
  public_key?: string
  signed_xdr: string
}

export interface SwapCompleteResponse {
  hash: string
  envelope_xdr?: string
  result_xdr?: string
  balances: Record<string, string>
}

export interface SwapExecRequest {
  mode: 'send' | 'receive'
  secret: string
  destination?: string
  source_asset: { code: string; issuer?: string }
  dest_asset: { code: string; issuer?: string }
  source_amount?: string
  dest_min?: string
  dest_amount?: string
  source_max?: string
  path?: any[]
}

export interface SwapExecResponse {
  hash: string
  fee_charged?: string
  envelope_xdr?: string
  result_xdr?: string
  balances: Record<string, string>
}

// Transaction API Types
export interface TransactionLookupResponse {
  hash: string
  successful: boolean
  ledger: number
  created_at: string
  fee_charged: string
  operation_count: number
  envelope_xdr: string
  result_xdr: string
  horizon_link: string
}

export interface ChainTransaction {
  id: string
  hash: string
  tx_type: 'PAYMENT' | 'SWAP'
  direction: 'sent' | 'received'
  asset_code: string
  asset_issuer?: string
  amount: string
  source: string
  destination: string
  source_asset_code?: string
  source_amount?: string
  memo?: string
  status: 'success' | 'failed'
  created_at: string
  ledger?: number
  fee_charged?: string
}

export interface TransactionHistoryResponse {
  transactions: ChainTransaction[]
  next_cursor?: string
}

// Onboard API Types
export interface OnboardBeginRequest {
  public_key: string
}

export interface OnboardBeginResponse {
  status: 'ready_to_sign' | 'skip_sign'
  user_public_key: string
  xdr?: string
  note: string
  steps: Record<string, any>
}

export interface OnboardCompleteRequest {
  public_key: string
  signed_xdr: string
}

export interface OnboardCompleteResponse {
  status: 'success'
  user_public_key: string
  airdrop_amount: number
  steps: Record<string, any>
  balances: Record<string, string>
  env_snapshot: Record<string, boolean>
}

// Chain API functions
export const chainApi = {
  // Wallet functions
  async createWallet(request: CreateWalletRequest): Promise<CreateWalletResponse> {
    const response = await chainApiClient.post<CreateWalletResponse>('/wallet/create', request)
    return response.data
  },

  async importWallet(request: ImportWalletRequest): Promise<ImportWalletResponse> {
    const response = await chainApiClient.post<ImportWalletResponse>('/wallet/import', request)
    return response.data
  },

  async importMnemonic(request: ImportMnemonicRequest): Promise<ImportMnemonicResponse> {
    const response = await chainApiClient.post<ImportMnemonicResponse>('/wallet/import-mnemonic', request)
    return response.data
  },

  async getBalances(publicKey: string): Promise<WalletBalancesResponse> {
    const response = await chainApiClient.get<WalletBalancesResponse>(`/wallet/balances?public_key=${publicKey}`)
    return response.data
  },

  // Send functions
  async estimateSendFee(request: SendEstimateRequest): Promise<SendEstimateResponse> {
    const response = await chainApiClient.post<SendEstimateResponse>('/send/estimate', request)
    return response.data
  },

  async beginSend(request: SendBeginRequest): Promise<SendBeginResponse> {
    const response = await chainApiClient.post<SendBeginResponse>('/send/begin', request)
    return response.data
  },

  async completeSend(request: SendCompleteRequest): Promise<SendCompleteResponse> {
    const response = await chainApiClient.post<SendCompleteResponse>('/send/complete', request)
    return response.data
  },

  async executeSend(request: SendExecRequest): Promise<SendExecResponse> {
    const response = await chainApiClient.post<SendExecResponse>('/send/execute', request)
    return response.data
  },

  // Swap functions
  async getSwapQuote(request: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    const response = await chainApiClient.post<SwapQuoteResponse>('/swap/quote', request)
    return response.data
  },

  async beginSwap(request: SwapBeginRequest): Promise<SwapBeginResponse> {
    const response = await chainApiClient.post<SwapBeginResponse>('/swap/begin', request)
    return response.data
  },

  async completeSwap(request: SwapCompleteRequest): Promise<SwapCompleteResponse> {
    const response = await chainApiClient.post<SwapCompleteResponse>('/swap/complete', request)
    return response.data
  },

  async executeSwap(request: SwapExecRequest): Promise<SwapExecResponse> {
    const response = await chainApiClient.post<SwapExecResponse>('/swap/execute', request)
    return response.data
  },

  // Transaction functions
  async lookupTransaction(hash: string): Promise<TransactionLookupResponse> {
    const response = await chainApiClient.get<TransactionLookupResponse>(`/tx/lookup?hash=${hash}`)
    return response.data
  },

  async getTransactionHistory(publicKey: string, limit: number = 10, cursor?: string, type: string = 'all'): Promise<TransactionHistoryResponse> {
    const params = new URLSearchParams({
      public_key: publicKey,
      limit: limit.toString(),
      type
    })
    if (cursor) params.append('cursor', cursor)
    
    const response = await chainApiClient.get<TransactionHistoryResponse>(`/tx/history?${params.toString()}`)
    return response.data
  },

  // Onboard functions
  async beginOnboard(request: OnboardBeginRequest): Promise<OnboardBeginResponse> {
    const response = await chainApiClient.post<OnboardBeginResponse>('/onboard/begin', request)
    return response.data
  },

  async completeOnboard(request: OnboardCompleteRequest): Promise<OnboardCompleteResponse> {
    const response = await chainApiClient.post<OnboardCompleteResponse>('/onboard/complete', request)
    return response.data
  }
}

export default chainApi
