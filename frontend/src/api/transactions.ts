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
      // Get wallet from auth store
      const authData = localStorage.getItem('unity-wallet-auth')
      if (!authData) {
        throw new Error('No wallet found. Please login first.')
      }
      
      const wallet = JSON.parse(authData)
      if (!wallet.state?.wallet?.public_key) {
        throw new Error('No wallet public key found')
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
        wallet.state.wallet.public_key,
        limit,
        cursor,
        params?.tx_type?.toLowerCase() || 'all'
      )
      
      // Convert chain transactions to our format
      const transactions: Transaction[] = chainResponse.transactions.map((tx, index) => ({
        id: tx.id,
        user_id: wallet.state.wallet.public_key,
        tx_type: tx.tx_type,
        asset_code: tx.asset_code,
        amount: tx.amount,
        status: tx.status.toUpperCase() as 'PENDING' | 'SUCCESS' | 'FAILED',
        stellar_tx_hash: tx.hash,
        destination: tx.destination,
        source: tx.source,
        memo: tx.memo,
        sell_asset: tx.source_asset_code,
        buy_asset: tx.asset_code,
        rate: tx.source_amount && tx.amount ? (parseFloat(tx.amount) / parseFloat(tx.source_amount)).toString() : undefined,
        direction: tx.direction,
        created_at: tx.created_at
      }))
      
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
      console.error('Transaction fetch error:', error)
      throw new Error('Failed to fetch transactions from chain service')
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
      const authData = localStorage.getItem('unity-wallet-auth')
      if (!authData) {
        throw new Error('No wallet found')
      }
      
      const wallet = JSON.parse(authData)
      if (!wallet.state?.wallet?.public_key) {
        throw new Error('No wallet public key found')
      }
      
      const history = await chainApi.getTransactionHistory(wallet.state.wallet.public_key, 100)
      const transaction = history.transactions.find(tx => tx.id === transactionId || tx.hash === transactionId)
      
      if (!transaction) {
        throw new Error('Transaction not found')
      }
      
      return {
        id: transaction.id,
        user_id: wallet.state.wallet.public_key,
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
      console.error('Transaction lookup error:', error)
      throw new Error('Failed to fetch transaction')
    }
  },

  async getTransactionSummary(): Promise<TransactionSummary> {
    try {
      // Get wallet from auth store
      const authData = localStorage.getItem('unity-wallet-auth')
      if (!authData) {
        throw new Error('No wallet found')
      }
      
      const wallet = JSON.parse(authData)
      if (!wallet.state?.wallet?.public_key) {
        throw new Error('No wallet public key found')
      }
      
      // Get transaction history to calculate summary
      const history = await chainApi.getTransactionHistory(wallet.state.wallet.public_key, 100)
      
      const transactions = history.transactions
      const totalTransactions = transactions.length
      const successfulTransactions = transactions.filter(tx => tx.status === 'success').length
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0
      
      // Calculate total amount (only for sent transactions)
      const totalAmount = transactions
        .filter(tx => tx.direction === 'sent')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
      
      // Group by type
      const byType: Record<string, number> = {}
      transactions.forEach(tx => {
        byType[tx.tx_type] = (byType[tx.tx_type] || 0) + 1
      })
      
      // Group by asset
      const byAsset: Record<string, number> = {}
      transactions.forEach(tx => {
        byAsset[tx.asset_code] = (byAsset[tx.asset_code] || 0) + 1
      })
      
      return {
        total_transactions: totalTransactions,
        total_amount: totalAmount,
        success_rate: successRate,
        by_type: byType,
        by_asset: byAsset
      }
    } catch (error) {
      console.error('Transaction summary error:', error)
      throw new Error('Failed to fetch transaction summary')
    }
  }
}
