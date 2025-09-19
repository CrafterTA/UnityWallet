import { mlApiClient } from './client'

export interface MLSpendingAnalytics {
  total_spent: number
  by_category: Record<string, number>
  by_merchant: Record<string, number>
  monthly_trends: Array<{
    month: string
    amount: number
  }>
  top_categories: Array<{
    category: string
    amount: number
    percentage: number
  }>
}

export interface MLInsights {
  spending_insights: string[]
  recommendations: string[]
  anomalies: Array<{
    type: string
    description: string
    amount: number
    date: string
  }>
  credit_score: {
    score: number
    grade: string
    factors: Record<string, any>
  }
}

export interface WalletAnalytics {
  public_key: string
  features: {
    total_balance: number
    transaction_count: number
    avg_transaction_amount: number
    balance_volatility: number
    transaction_frequency: number
    unique_counterparties: number
    avg_time_between_transactions: number
  }
  insights: string[]
  risk_score: number
  spending_patterns: Record<string, number>
}

export const mlApi = {
  async getWalletAnalytics(publicKey: string, daysBack: number = 90): Promise<WalletAnalytics> {
    try {
      const response = await mlApiClient.get<WalletAnalytics>(`/analytics/wallet/${publicKey}?days_back=${daysBack}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch wallet analytics:', error)
      throw new Error('Unable to fetch wallet analytics from ML service')
    }
  },

  async getWalletFeatures(publicKey: string): Promise<any> {
    try {
      const response = await mlApiClient.get(`/analytics/features/${publicKey}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch wallet features:', error)
      throw new Error('Unable to fetch wallet features from ML service')
    }
  },

  async getWalletSummary(publicKey: string): Promise<any> {
    try {
      const response = await mlApiClient.get(`/analytics/summary/${publicKey}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch wallet summary:', error)
      throw new Error('Unable to fetch wallet summary from ML service')
    }
  },

  async getBalanceHistory(publicKey: string): Promise<any> {
    try {
      const response = await mlApiClient.get(`/analytics/balance-history/${publicKey}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch balance history:', error)
      throw new Error('Unable to fetch balance history from ML service')
    }
  },

  async checkAnomalies(publicKey: string, daysBack: number = 30) {
    try {
      const response = await mlApiClient.get(`/anomaly/check/${publicKey}?days_back=${daysBack}`)
      return response.data
    } catch (error) {
      console.error('Failed to check anomalies:', error)
      throw new Error('Unable to check anomalies from ML service')
    }
  },

  async getAnomalyHistory(publicKey: string) {
    try {
      const response = await mlApiClient.get(`/anomaly/history/${publicKey}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch anomaly history:', error)
      throw new Error('Unable to fetch anomaly history from ML service')
    }
  },

  async getChatSuggestions(publicKey: string) {
    try {
      const response = await mlApiClient.get(`/chat/suggestions/${publicKey}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch chat suggestions:', error)
      throw new Error('Unable to fetch chat suggestions from ML service')
    }
  },

  async askChatbot(publicKey: string, message: string) {
    try {
      const response = await mlApiClient.post(`/chat/ask`, {
        public_key: publicKey,
        message: message
      })
      return response.data
    } catch (error) {
      console.error('Failed to ask chatbot:', error)
      throw new Error('Unable to ask chatbot from ML service')
    }
  },

  async getQuickStats(publicKey: string) {
    try {
      const response = await mlApiClient.post(`/chat/quick-stats`, {
        public_key: publicKey
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch quick stats:', error)
      throw new Error('Unable to fetch quick stats from ML service')
    }
  }
}