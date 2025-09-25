import { chainApi } from './chain'

export interface Transaction {
  id: string
  user_id?: string
  tx_type: 'PAYMENT' | 'SWAP' | 'EARN' | 'BURN' | 'P2P_TRANSFER'
  asset_code?: string  // Keep for backward compatibility
  symbol?: string      // New Solana field
  amount: string
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'completed' | 'failed'
  signature?: string
  destination?: string
  source?: string
  memo?: string
  description?: string
  sell_asset?: string
  buy_asset?: string
  rate?: string
  direction: string
  created_at: string | number  // Can be string or timestamp
  // Swap specific fields
  source_asset_code?: string
  source_amount?: string
  // Solana specific fields
  slot?: number
  block_time?: number
  fee?: number
  logs?: string[]
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
      // Get wallet from localStorage
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      const publicKey = wallet.state?.wallet?.public_key || '8DqLVPaoyEEcWYCGe2DL6LhYoikEPt59cK3L5FQdCxdZ'
      
      if (!publicKey) {
        throw new Error('No wallet found. Please login first.')
      }
      
      const limit = params?.per_page || 10
      const page = params?.page || 1
      
      // Calculate before for pagination (simplified)
      let before: string | undefined
      if (page > 1) {
        // For simplicity, we'll use page-based before simulation
        before = `page_${page - 1}`
      }
      
      // Get transaction history from chain service
      const chainResponse = await chainApi.getTransactionHistory(
        publicKey,
        limit,
        before,
        params?.tx_type?.toLowerCase() || 'all'
      )
      
      // Convert chain transactions to our format
      if (!chainResponse || !chainResponse.transactions) {
        return {
          transactions: [],
          pagination: {
            page: 1,
            per_page: limit,
            total_count: 0,
            total_pages: 0
          }
        }
      }
      
      const transactions: Transaction[] = chainResponse.transactions.map((tx, index) => {
        try {
          return {
            id: tx.signature || `tx_${index}`,
            user_id: publicKey,
            tx_type: 'PAYMENT', // Default type for Solana transactions
            asset_code: 'SOL', // Default to SOL for Solana
            amount: tx.amount || '0', // Use parsed amount from backend
            status: tx.success ? 'SUCCESS' : 'FAILED',
            signature: tx.signature,
            direction: tx.direction || 'sent', // Use parsed direction
            created_at: new Date(tx.block_time * 1000).toISOString(),
            // Solana specific fields
            slot: tx.slot,
            block_time: tx.block_time,
            fee: tx.fee,
            logs: tx.logs,
            // Additional fields for frontend
            destination: tx.destination,
            source: tx.source,
            symbol: tx.symbol || 'SOL'
          }
            } catch (error) {
              return {
            id: `tx_${index}`,
            user_id: publicKey,
            tx_type: 'PAYMENT',
            asset_code: 'SOL',
            amount: '0',
            status: 'FAILED' as 'PENDING' | 'SUCCESS' | 'FAILED',
            signature: '',
            direction: 'sent',
            created_at: new Date().toISOString()
          }
        }
      })
      
      // Calculate pagination info
      const totalPages = Math.ceil(transactions.length / limit)
      
      return {
        transactions,
        pagination: {
          page: page,
          per_page: limit,
          total_count: transactions.length,
          total_pages: totalPages
        }
      }
    } catch (error) {
      // Return empty data instead of throwing error to prevent UI crash
      return {
        transactions: [],
        pagination: {
          page: 1,
          per_page: params?.per_page || 10,
          total_count: 0,
          total_pages: 0
        }
      }
    }
  },

  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      // If transactionId looks like a signature, look it up directly
      if (transactionId.length >= 80) { // Solana signatures are typically 88 characters
        const response = await chainApi.lookupTransaction(transactionId)
        
        // Convert to our Transaction format
        return {
          id: response.signature,
          user_id: 'unknown',
          tx_type: 'PAYMENT',
          asset_code: 'SOL',
          amount: '0',
          status: response.success ? 'SUCCESS' : 'FAILED',
          signature: response.signature,
          direction: 'sent',
          created_at: new Date(response.block_time * 1000).toISOString(),
          slot: response.slot,
          block_time: response.block_time,
          fee: response.fee,
          logs: response.logs
        }
      }
      
      // Otherwise try to get from transaction history
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      const publicKey = wallet.state?.wallet?.public_key || '8DqLVPaoyEEcWYCGe2DL6LhYoikEPt59cK3L5FQdCxdZ'
      
      if (!publicKey) {
        throw new Error('No wallet found')
      }
      
      const history = await chainApi.getTransactionHistory(publicKey, 100)
      const transaction = history.transactions.find(tx => tx.signature === transactionId)
      
      if (!transaction) {
        throw new Error('Transaction not found')
      }
      
        return {
          id: transaction.signature,
          user_id: publicKey,
          tx_type: 'PAYMENT',
          asset_code: 'SOL',
          amount: transaction.amount || '0',
          status: transaction.success ? 'SUCCESS' : 'FAILED',
          signature: transaction.signature,
          direction: transaction.direction || 'sent',
          created_at: new Date(transaction.block_time * 1000).toISOString(),
          slot: transaction.slot,
          block_time: transaction.block_time,
          fee: transaction.fee,
          logs: transaction.logs,
          destination: transaction.destination,
          source: transaction.source,
          symbol: transaction.symbol || 'SOL'
        }
    } catch (error) {
      throw new Error('Failed to fetch transaction')
    }
  },

  async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      // Get wallet from localStorage
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      const publicKey = wallet.state?.wallet?.public_key || '8DqLVPaoyEEcWYCGe2DL6LhYoikEPt59cK3L5FQdCxdZ'
      
      if (!publicKey) {
        throw new Error('No wallet found')
      }
      
      // Get transaction history to calculate summary
      const history = await chainApi.getTransactionHistory(publicKey, 100)
      
      if (!history || !history.transactions) {
        return {
          total_transactions: 0,
          total_amount: 0,
          success_rate: 0,
          by_type: {},
          by_asset: {}
        }
      }
      
      const transactions = history.transactions
      const totalTransactions = transactions.length
      const successfulTransactions = transactions.filter(tx => {
            try {
              return tx.success === true
            } catch (error) {
              return false
            }
      }).length
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0
      
      // Calculate total amount (simplified for Solana)
      const totalAmount = 0 // Amount parsing would need to be implemented based on transaction logs
      
      // Group by type (simplified for Solana)
      const byType: Record<string, number> = { 'PAYMENT': totalTransactions }
      
      // Group by asset (simplified for Solana)
      const byAsset: Record<string, number> = { 'SOL': totalTransactions }
      
      return {
        total_transactions: totalTransactions,
        total_amount: totalAmount,
        success_rate: successRate,
        by_type: byType,
        by_asset: byAsset
      }
    } catch (error) {
      // Return empty summary instead of throwing error
      return {
        total_transactions: 0,
        total_amount: 0,
        success_rate: 0,
        by_type: {},
        by_asset: {}
      }
    }
  }
}
