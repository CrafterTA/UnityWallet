import { chainApi } from './chain'

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
  direction: string
  created_at: string
  // Swap specific fields
  source_asset_code?: string
  source_amount?: string
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
      // Get wallet from auth store
      const { useAuthStore } = await import('@/store/session')
      const { wallet } = useAuthStore.getState()
      
      if (!wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }
      
      const limit = params?.per_page || 10
      const page = params?.page || 1
      
      // Calculate cursor for pagination (simplified)
      let cursor: string | undefined
      if (page > 1) {
        // For simplicity, we'll use page-based cursor simulation
        cursor = `page_${page - 1}`
      }
      
      // Get transaction history from chain service
      const chainResponse = await chainApi.getTransactionHistory(
        wallet.public_key,
        limit,
        cursor,
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
            id: tx.id || `tx_${index}`,
            user_id: wallet.public_key,
            tx_type: tx.tx_type || 'PAYMENT',
            asset_code: tx.asset_code || 'XLM',
            amount: tx.amount || '0',
            status: (tx.status || 'success').toUpperCase() as 'PENDING' | 'SUCCESS' | 'FAILED',
            stellar_tx_hash: tx.hash,
            destination: tx.destination,
            source: tx.source,
            memo: tx.memo,
            sell_asset: tx.source_asset_code,
            buy_asset: tx.asset_code,
            rate: tx.source_amount && tx.amount ? (parseFloat(tx.amount) / parseFloat(tx.source_amount)).toString() : undefined,
            direction: tx.direction || 'sent',
            created_at: tx.created_at || new Date().toISOString(),
            // Swap specific fields
            source_asset_code: tx.source_asset_code,
            source_amount: tx.source_amount
          }
            } catch (error) {
              return {
            id: `tx_${index}`,
            user_id: wallet.public_key,
            tx_type: 'PAYMENT',
            asset_code: 'XLM',
            amount: '0',
            status: 'FAILED' as 'PENDING' | 'SUCCESS' | 'FAILED',
            stellar_tx_hash: '',
            destination: '',
            source: '',
            memo: '',
            sell_asset: '',
            buy_asset: '',
            rate: undefined,
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
      // If transactionId looks like a hash, look it up directly
      if (transactionId.length === 64) {
        const response = await chainApi.lookupTransaction(transactionId)
        
        // Convert to our Transaction format
        return {
          id: response.hash,
          user_id: 'unknown',
          tx_type: 'PAYMENT',
          asset_code: 'XLM',
          amount: '0',
          status: response.successful ? 'SUCCESS' : 'FAILED',
          stellar_tx_hash: response.hash,
          direction: 'sent',
          created_at: response.created_at
        }
      }
      
      // Otherwise try to get from transaction history
      const { useAuthStore } = await import('@/store/session')
      const { wallet } = useAuthStore.getState()
      
      if (!wallet?.public_key) {
        throw new Error('No wallet found')
      }
      
      const history = await chainApi.getTransactionHistory(wallet.public_key, 100)
      const transaction = history.transactions.find(tx => tx.id === transactionId || tx.hash === transactionId)
      
      if (!transaction) {
        throw new Error('Transaction not found')
      }
      
      return {
        id: transaction.id,
        user_id: wallet.public_key,
        tx_type: transaction.tx_type,
        asset_code: transaction.asset_code,
        amount: transaction.amount,
        status: transaction.status.toUpperCase() as 'PENDING' | 'SUCCESS' | 'FAILED',
        stellar_tx_hash: transaction.hash,
        destination: transaction.destination,
        source: transaction.source,
        memo: transaction.memo,
        direction: transaction.direction,
        created_at: transaction.created_at
      }
    } catch (error) {
      throw new Error('Failed to fetch transaction')
    }
  },

  async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      // Get wallet from auth store
      const { useAuthStore } = await import('@/store/session')
      const { wallet } = useAuthStore.getState()
      
      if (!wallet?.public_key) {
        throw new Error('No wallet found')
      }
      
      // Get transaction history to calculate summary
      const history = await chainApi.getTransactionHistory(wallet.public_key, 100)
      
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
              return (tx.status || 'success') === 'success'
            } catch (error) {
              return false
            }
      }).length
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0
      
      // Calculate total amount (only for sent transactions)
      const totalAmount = transactions
        .filter(tx => {
            try {
              return (tx.direction || 'sent') === 'sent'
            } catch (error) {
              return false
            }
        })
        .reduce((sum, tx) => {
          try {
            return sum + parseFloat(tx.amount || '0')
          } catch (error) {
            return sum
          }
        }, 0)
      
      // Group by type
      const byType: Record<string, number> = {}
      transactions.forEach(tx => {
        try {
          const txType = tx.tx_type || 'PAYMENT'
          byType[txType] = (byType[txType] || 0) + 1
        } catch (error) {
          byType['PAYMENT'] = (byType['PAYMENT'] || 0) + 1
        }
      })
      
      // Group by asset
      const byAsset: Record<string, number> = {}
      transactions.forEach(tx => {
        try {
          const assetCode = tx.asset_code || 'XLM'
          byAsset[assetCode] = (byAsset[assetCode] || 0) + 1
        } catch (error) {
          byAsset['XLM'] = (byAsset['XLM'] || 0) + 1
        }
      })
      
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
