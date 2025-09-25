import { chainApiClient } from './client'

// Chain API base URL - should be different from main backend
const CHAIN_API_BASE_URL = '/api'

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

// Solana Chain API interfaces
export interface TokenRef {
  mint: string
  symbol?: string
  decimals?: number
}

export interface DexQuoteRequest {
  mode: 'send' | 'receive'
  source_token: TokenRef
  dest_token: TokenRef
  source_amount?: string
  dest_amount?: string
  source_account?: string
  slippage_bps?: number
}

export interface DexQuoteResponse {
  found: boolean
  mode: 'send' | 'receive'
  source_token: string
  destination_token: string
  source_amount: string
  destination_amount: string
  implied_price: string
  implied_price_inverse: string
  slippage_bps: number
  dest_min_suggest?: string
  source_max_suggest?: string
  route_tokens: string[]
  network_fee_lamports: string
  network_fee_sol: string
  estimated_base_fee: string
  execute_suggest: {
    mode: 'send' | 'receive'
    source_amount?: string
    dest_min?: string
    dest_amount?: string
    source_max?: string
    route: any[]
  }
  raw: any
}

export interface DexExecuteRequest {
  mode: 'send' | 'receive'
  secret: string
  source_token: TokenRef
  dest_token: TokenRef
  source_amount?: string
  dest_min?: string
  dest_amount?: string
  source_max?: string
  destination?: string
  route?: any[]
}

export interface DexExecuteResponse {
  signature: string
  transaction: string
  balances: Record<string, any>
  explorer_link?: string
  solscan_link?: string
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
  balances: Record<string, any>
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
  balances: Record<string, any>
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
  balances: Record<string, any>
}

export interface WalletBalancesResponse {
  public_key: string
  balances: Record<string, {
    balance: string
    balance_ui: string
    mint: string
    decimals: number
    symbol: string
  }>
}

// Send API Types
export interface SendEstimateRequest {
  source: TokenRef
  amount: string
  destination: string
}

export interface SendEstimateResponse {
  estimated_base_fee_lamports: number
  estimated_base_fee_sol: string
  note: string
}

export interface SendBeginRequest {
  source_public: string
  destination: string
  token: TokenRef
  amount: string
}

export interface SendBeginResponse {
  transaction: string
  network: string
  estimated_base_fee: number
  estimated_base_fee_sol: string
  current_balances: Record<string, any>
  transfer_info: {
    source: string
    destination: string
    token: TokenRef
    amount: string
  }
  note: string
  status: string
}

export interface SendCompleteRequest {
  public_key?: string
  signed_transaction: string
}

export interface SendCompleteResponse {
  success: boolean
  signature: string
  transaction: string
  balances: Record<string, any>
  balance_changes: Record<string, any>
  explorer_link?: string
  solscan_link?: string
  network: string
  note: string
  status: string
}

export interface SendExecRequest {
  secret: string
  destination: string
  source: TokenRef
  amount: string
}

export interface SendExecResponse {
  signature: string
  transaction: string
  balances: Record<string, any>
  explorer_link?: string
  solscan_link?: string
}

// Swap API Types
export interface SwapQuoteRequest {
  mode: 'send' | 'receive'
  source_token: TokenRef
  dest_token: TokenRef
  source_amount?: string
  dest_amount?: string
  source_account?: string
  slippage_bps?: number
}

export interface SwapQuoteResponse {
  found: boolean
  mode: 'send' | 'receive'
  source_token: string
  destination_token: string
  source_amount: string
  destination_amount: string
  implied_price: string
  implied_price_inverse: string
  slippage_bps: number
  dest_min_suggest?: string
  source_max_suggest?: string
  route_tokens: string[]
  network_fee_lamports: string
  network_fee_sol: string
  estimated_base_fee: string
  execute_suggest: {
    mode: 'send' | 'receive'
    source_amount?: string
    dest_min?: string
    dest_amount?: string
    source_max?: string
    route: any[]
  }
  raw: any
}

export interface SwapBeginRequest {
  mode: 'send' | 'receive'
  source_public: string
  destination?: string
  source_token: TokenRef
  dest_token: TokenRef
  source_amount?: string
  dest_min?: string
  dest_amount?: string
  source_max?: string
  route?: any[]
}

export interface SwapBeginResponse {
  transaction: string
  network: string
  estimated_base_fee: number
  note: string
}

export interface SwapCompleteRequest {
  public_key?: string
  signed_transaction: string
}

export interface SwapCompleteResponse {
  signature: string
  transaction: string
  balances: Record<string, any>
  explorer_link?: string
  solscan_link?: string
  note: string
}

export interface SwapExecRequest {
  mode: 'send' | 'receive'
  secret: string
  destination?: string
  source_token: TokenRef
  dest_token: TokenRef
  source_amount?: string
  dest_min?: string
  dest_amount?: string
  source_max?: string
  route?: any[]
}

export interface SwapExecResponse {
  signature: string
  transaction: string
  balances: Record<string, any>
  balance_changes?: Record<string, any>
  swap_info?: any
  explorer_link?: string
  solscan_link?: string
}

// Transaction API Types
export interface TransactionLookupResponse {
  signature: string
  success: boolean
  slot: number
  block_time: number
  fee: number
  logs: string[]
  explorer_link: string
  solscan_link: string
}

export interface ChainTransaction {
  signature: string
  slot: number
  block_time: number
  fee: number
  success: boolean
  logs: string[]
  // Additional fields from backend parsing
  amount?: string
  destination?: string
  source?: string
  symbol?: string
  direction?: string
}

export interface TransactionHistoryResponse {
  transactions: ChainTransaction[]
  next_before?: string
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

  async validateSend(request: SendBeginRequest): Promise<any> {
    const response = await chainApiClient.post<any>('/send/validate', request)
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

  async validateSwap(request: SwapQuoteRequest): Promise<any> {
    const response = await chainApiClient.post<any>('/swap/validate', request)
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
  async lookupTransaction(signature: string): Promise<TransactionLookupResponse> {
    const response = await chainApiClient.get<TransactionLookupResponse>(`/tx/lookup?signature=${signature}`)
    return response.data
  },

  async viewTransaction(signature: string): Promise<any> {
    const response = await chainApiClient.get<any>(`/tx/view/${signature}`)
    return response.data
  },

  async getTransactionHistory(publicKey: string, limit: number = 10, before?: string, type: string = 'all'): Promise<TransactionHistoryResponse> {
    const params = new URLSearchParams({
      public_key: publicKey,
      limit: limit.toString(),
      type
    })
    if (before) params.append('before', before)
    
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
