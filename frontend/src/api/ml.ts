/**
 * ML Service API Client
 * Comprehensive TypeScript API wrapper for UnityWallet ML Service
 */

import { mlApiClient } from './client'

// ====== Type Definitions ======

export interface AssetInfo {
  code: string
  issuer?: string
}

export interface TransactionRecord {
  hash: string
  account: string
  transaction_type: 'payment' | 'swap' | 'onboard' | 'create_account' | 'change_trust'
  amount?: number
  asset?: AssetInfo
  destination?: string
  source?: string
  fee: number
  timestamp: string
  success: boolean
  memo?: string
}

export interface WalletBalance {
  account: string
  asset: AssetInfo
  balance: number
  timestamp: string
}

export interface FeatureEngineering {
  account: string
  period_start: string
  period_end: string
  
  // Transaction counts
  total_transactions: number
  transactions_per_month: number
  payment_count: number
  swap_count: number
  
  // Balance metrics
  balance_volatility: Record<string, number>
  max_balance: Record<string, number>
  min_balance: Record<string, number>
  avg_balance: Record<string, number>
  
  // Financial ratios
  debt_to_asset_ratio?: number
  
  // Refund patterns
  refund_frequency: number
  refund_amount_ratio: number
  
  // Behavioral patterns
  peak_transaction_hours: number[]
  frequent_destinations: string[]
  
  // Risk metrics
  large_transaction_count: number
  large_transaction_threshold: number
}

export interface AnomalyDetection {
  account: string
  timestamp: string
  anomaly_type: string
  confidence_score: number
  description: string
  transaction_hash?: string
  recommended_action: string
}

export interface AnalyticsResponse {
  account: string
  features: FeatureEngineering
  anomalies: AnomalyDetection[]
  balance_history: Record<string, TimeSeriesData>
  transaction_summary: TransactionSummary
}

export interface TimeSeriesData {
  timestamps: string[]
  values: number[]
  label: string
}

export interface TransactionSummary {
  asset_distribution: Record<string, number>
  hourly_distribution: Record<string, number>
  type_distribution: Record<string, number>
  peak_activity_hours: number[]
  most_frequent_destinations: string[]
}

export interface WalletSummary {
  account: string
  period_days: number
  transaction_counts: {
    total: number
    payments: number
    swaps: number
    other: number
  }
  amounts: {
    total_sent: number
    total_received: number
    net_flow: number
  }
  current_balances: Record<string, number>
  activity_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
}

export interface AnomalyCheckResponse {
  account: string
  status: 'safe' | 'low_risk' | 'medium_risk' | 'high_risk' | 'no_data'
  message: string
  risk_score: number
  anomaly_count: number
  anomalies: AnomalyDetection[]
  checked_at: string
  period_checked: string
}

export interface MonitorResponse {
  account: string
  monitoring_period: string
  new_transactions: number
  recent_anomalies: number
  alerts: Array<{
    type: string
    severity: string
    description: string
    detected_at: string
    confidence: number
    action: string
  }>
  status: 'active' | 'no_activity'
  last_checked: string
}

export interface AnomalyTypesResponse {
  anomaly_types: Record<string, {
    name: string
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
}

export interface AnomalyHistoryResponse {
  account: string
  period: string
  filters: {
    anomaly_type?: string
    min_confidence: number
  }
  anomalies: AnomalyDetection[]
  summary: {
    total: number
    by_type: Record<string, number>
    by_day: Record<string, number>
    average_confidence: number
    highest_confidence: number
    latest_anomaly: string
  }
}

export interface ChatbotRequest {
  public_key: string
  message: string
  context?: Record<string, any>
}

export interface ChatbotResponse {
  response: string
  suggestions?: string[]
  data?: Record<string, any>
}

export interface ChatSuggestionsResponse {
  public_key: string
  suggestions: string[]
  context: {
    has_transactions: boolean
    total_transactions: number
    suggested_queries: string[]
  }
}

export interface QuickStatsResponse {
  status: 'success' | 'no_data'
  public_key: string
  stats: {
    total_transactions: number
    payment_transactions: number
    swap_transactions: number
    outgoing_count: number
    incoming_count: number
    total_sent: number
    total_received: number
    current_balances: Record<string, number>
    most_recent_transaction?: string
    account_age_days: number
  }
  summary: string
}

export interface ConversationHistoryResponse {
  public_key: string
  conversation_history: Array<{
    timestamp: string
    user_message: string
    bot_response: string
    context: Record<string, any>
  }>
  total_conversations: number
}

// ====== API Client ======

export const mlApi = {
  // ====== Analytics Endpoints ======
  
  /**
   * Get comprehensive wallet analytics with feature engineering and anomaly detection
   */
  async getWalletAnalytics(publicKey: string, daysBack: number = 90, includeBalanceHistory: boolean = true): Promise<AnalyticsResponse> {
    try {
      const response = await mlApiClient.get<AnalyticsResponse>(
        `/analytics/wallet/${publicKey}?days_back=${daysBack}&include_balance_history=${includeBalanceHistory}`
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch wallet analytics:', error)
      throw new Error('Unable to fetch wallet analytics from ML service')
    }
  },

  /**
   * Get only feature engineering data (faster endpoint)
   */
  async getWalletFeatures(publicKey: string, daysBack: number = 90): Promise<FeatureEngineering> {
    try {
      const response = await mlApiClient.get<FeatureEngineering>(
        `/analytics/features/${publicKey}?days_back=${daysBack}`
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch wallet features:', error)
      throw new Error('Unable to fetch wallet features from ML service')
    }
  },

  /**
   * Get wallet summary (quick overview)
   */
  async getWalletSummary(publicKey: string, daysBack: number = 30): Promise<WalletSummary> {
    try {
      const response = await mlApiClient.get<WalletSummary>(
        `/analytics/summary/${publicKey}?days_back=${daysBack}`
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch wallet summary:', error)
      throw new Error('Unable to fetch wallet summary from ML service')
    }
  },

  /**
   * Get balance history time series data
   */
  async getBalanceHistory(publicKey: string, daysBack: number = 30, asset?: string): Promise<Record<string, TimeSeriesData>> {
    try {
      const params = new URLSearchParams({ days_back: daysBack.toString() })
      if (asset) params.append('asset', asset)
      
      const response = await mlApiClient.get<Record<string, TimeSeriesData>>(
        `/analytics/balance-history/${publicKey}?${params.toString()}`
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch balance history:', error)
      throw new Error('Unable to fetch balance history from ML service')
    }
  },

  // ====== Anomaly Detection Endpoints ======

  /**
   * Check for anomalies in recent transactions
   */
  async checkAnomalies(publicKey: string, daysBack: number = 7, threshold?: number): Promise<AnomalyCheckResponse> {
    try {
      const params = new URLSearchParams({ days_back: daysBack.toString() })
      if (threshold !== undefined) params.append('threshold', threshold.toString())
      
      const response = await mlApiClient.get<AnomalyCheckResponse>(
        `/anomaly/check/${publicKey}?${params.toString()}`
      )
      return response.data
    } catch (error) {
      console.error('Failed to check anomalies:', error)
      throw new Error('Unable to check anomalies from ML service')
    }
  },

  /**
   * Monitor account for real-time anomalies
   */
  async monitorAccount(publicKey: string, hoursBack: number = 24): Promise<MonitorResponse> {
    try {
      const response = await mlApiClient.get<MonitorResponse>(
        `/anomaly/monitor/${publicKey}?hours_back=${hoursBack}`
      )
      return response.data
    } catch (error) {
      console.error('Failed to monitor account:', error)
      throw new Error('Unable to monitor account from ML service')
    }
  },

  /**
   * Get supported anomaly types and descriptions
   */
  async getAnomalyTypes(): Promise<AnomalyTypesResponse> {
    try {
      const response = await mlApiClient.get<AnomalyTypesResponse>('/anomaly/types')
      return response.data
    } catch (error) {
      console.error('Failed to fetch anomaly types:', error)
      throw new Error('Unable to fetch anomaly types from ML service')
    }
  },

  /**
   * Configure anomaly alerts for a wallet
   */
  async configureAlerts(publicKey: string, config: {
    enabled?: boolean
    threshold?: number
    anomaly_types?: string[]
    notification_methods?: string[]
    check_frequency_hours?: number
  }): Promise<{ status: string; message: string; config: any }> {
    try {
      const response = await mlApiClient.post<{ status: string; message: string; config: any }>(`/anomaly/configure-alerts/${publicKey}`, config)
      return response.data
    } catch (error) {
      console.error('Failed to configure alerts:', error)
      throw new Error('Unable to configure alerts from ML service')
    }
  },

  /**
   * Get historical anomalies
   */
  async getAnomalyHistory(
    publicKey: string, 
    daysBack: number = 30, 
    anomalyType?: string, 
    minConfidence: number = 0.5
  ): Promise<AnomalyHistoryResponse> {
    try {
      const params = new URLSearchParams({ 
        days_back: daysBack.toString(),
        min_confidence: minConfidence.toString()
      })
      if (anomalyType) params.append('anomaly_type', anomalyType)
      
      const response = await mlApiClient.get<AnomalyHistoryResponse>(
        `/anomaly/history/${publicKey}?${params.toString()}`
      )
      return response.data
    } catch (error) {
      console.warn('ML anomaly history unavailable, creating fallback from current analysis:', error)
      
      // Fallback: Get current anomalies and create mock history
      try {
        const currentAnomalies = await this.checkAnomalies(publicKey, daysBack)
        return {
          account: publicKey,
          period: `${daysBack} days`,
          filters: { anomaly_type: anomalyType, min_confidence: minConfidence },
          anomalies: currentAnomalies.anomalies.filter(a => a.confidence_score >= minConfidence),
          summary: {
            total: currentAnomalies.anomaly_count,
            by_type: currentAnomalies.anomalies.reduce((acc: any, a) => {
              acc[a.anomaly_type] = (acc[a.anomaly_type] || 0) + 1
              return acc
            }, {}),
            by_day: {},
            average_confidence: currentAnomalies.anomalies.length > 0 
              ? currentAnomalies.anomalies.reduce((sum, a) => sum + a.confidence_score, 0) / currentAnomalies.anomalies.length
              : 0,
            highest_confidence: currentAnomalies.anomalies.length > 0
              ? Math.max(...currentAnomalies.anomalies.map(a => a.confidence_score))
              : 0,
            latest_anomaly: currentAnomalies.anomalies.length > 0
              ? currentAnomalies.anomalies[0].timestamp
              : new Date().toISOString()
          }
        }
      } catch (fallbackError) {
        throw new Error('Unable to fetch anomaly history from ML service and fallback failed')
      }
    }
  },

  // ====== Chatbot Endpoints ======

  /**
   * Chat with AI assistant about transactions and analysis
   */
  async askChatbot(request: ChatbotRequest): Promise<ChatbotResponse> {
    try {
      const response = await mlApiClient.post<ChatbotResponse>('/chatbot/ask', request)
      return response.data
    } catch (error) {
      console.error('Failed to ask chatbot:', error)
      throw new Error('Unable to ask chatbot from ML service')
    }
  },

  /**
   * Get contextual chat suggestions based on wallet activity
   */
  async getChatSuggestions(publicKey: string): Promise<ChatSuggestionsResponse> {
    try {
      const response = await mlApiClient.get<ChatSuggestionsResponse>(`/chatbot/suggestions/${publicKey}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch chat suggestions:', error)
      throw new Error('Unable to fetch chat suggestions from ML service')
    }
  },

  /**
   * Get quick stats for chatbot context
   */
  async getQuickStats(publicKey: string): Promise<QuickStatsResponse> {
    try {
      const response = await mlApiClient.post<QuickStatsResponse>('/chatbot/quick-stats', {
        public_key: publicKey
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch quick stats:', error)
      throw new Error('Unable to fetch quick stats from ML service')
    }
  },

  /**
   * Get conversation history (mock endpoint)
   */
  async getConversationHistory(publicKey: string, limit: number = 10): Promise<ConversationHistoryResponse> {
    try {
      const response = await mlApiClient.get<ConversationHistoryResponse>(
        `/chatbot/conversation-history/${publicKey}?limit=${limit}`
      )
      return response.data
    } catch (error) {
      console.error('Failed to fetch conversation history:', error)
      throw new Error('Unable to fetch conversation history from ML service')
    }
  },

  // ====== Health & Utility Endpoints ======

  /**
   * Check ML service health
   */
  async getHealth(): Promise<{ status: string; service: string; version?: string }> {
    try {
      const response = await mlApiClient.get<{ status: string; service: string; version?: string }>('/health')
      return response.data
    } catch (error) {
      console.error('Failed to check ML service health:', error)
      throw new Error('ML service is not available')
    }
  }
}

export default mlApi