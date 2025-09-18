import { apiClient } from './client'

export interface Transaction {
  id: string
  user_id: string
  tx_type: 'PAYMENT' | 'SWAP' | 'EARN' | 'BURN' | 'P2P_TRANSFER'
  asset_code: string
  amount: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  stellar_tx_hash?: string
  destination?: string
  source?: string
  memo?: string
  sell_asset?: string
  buy_asset?: string
  rate?: string
  direction: string  // 👈 Thêm field mới
  created_at: string
}

export interface TransactionListResponse {
  transactions: Transaction[]
  pagination: {
    page: number
    per_page: number
    total_count: number
    total_pages: number
  }
}

export interface TransactionSummary {
  total_transactions: number
  total_amount: number
  success_rate: number
  by_type: Record<string, number>
  by_asset: Record<string, number>
}

export const transactionsApi = {
  async getTransactions(params?: {
    page?: number
    per_page?: number
    tx_type?: string
    status?: string
    asset_code?: string
    from_date?: string
    to_date?: string
    min_amount?: number
    max_amount?: number
    search_query?: string
    sort_by?: string
    sort_order?: string
  }): Promise<TransactionListResponse> {
    try {
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString())
          }
        })
      }
      
      const response = await apiClient.get<TransactionListResponse>(`/transactions?${queryParams.toString()}`)
      return response.data
    } catch (error) {
      throw new Error('Failed to fetch transactions')
    }
  },

  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      const response = await apiClient.get<Transaction>(`/transactions/${transactionId}`)
      return response.data
    } catch (error) {
      throw new Error('Failed to fetch transaction')
    }
  },

  async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      const response = await apiClient.get<TransactionSummary>('/transactions/summary')
      return response.data
    } catch (error) {
      throw new Error('Failed to fetch transaction summary')
    }
  }
}
