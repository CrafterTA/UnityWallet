import { chainApi } from './chain'
import { mlApi } from './ml'

export interface SpendingAnalytics {
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

export interface Insights {
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

export const analyticsApi = {
  async getSpendingAnalytics(): Promise<SpendingAnalytics> {
    // Get wallet public key
    const authData = localStorage.getItem('unity-wallet-auth')
    if (!authData) {
      throw new Error('No wallet connected')
    }
    
    const wallet = JSON.parse(authData)
    const publicKey = wallet.state?.wallet?.public_key
    if (!publicKey) {
      throw new Error('No wallet public key found')
    }

    // Try ML service first, fallback to chain service calculation
    try {
      const walletAnalytics = await mlApi.getWalletAnalytics(publicKey, 90)
      // Convert ML analytics to SpendingAnalytics format
      // Use transaction_summary for spending patterns
      const assetDistribution = walletAnalytics.transaction_summary?.asset_distribution || {}
      const totalSpent = Object.values(assetDistribution).reduce((sum, amount) => sum + amount, 0)
      
      return {
        total_spent: totalSpent,
        by_category: assetDistribution,
        by_merchant: {},
        monthly_trends: [],
        top_categories: Object.entries(assetDistribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([category, amount]) => ({ 
            category, 
            amount, 
            percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0 
          }))
      }
    } catch (mlError) {
      console.warn('ML service unavailable, using chain service fallback:', mlError)
      // Fallback to chain service calculation
      return this.getSpendingAnalyticsFromChain(publicKey)
    }
  },

  async getSpendingAnalyticsFromChain(publicKey: string): Promise<SpendingAnalytics> {
    try {

      const transactionHistory = await chainApi.getTransactionHistory(publicKey, 100)
      const transactions = transactionHistory.transactions || []

      // Calculate total spent (outgoing transactions only)
      const outgoingTransactions = transactions.filter((tx: any) => 
        (tx.type === 'payment' && tx.from === publicKey) ||
        (tx.type === 'path_payment_strict_receive' && tx.from === publicKey)
      )

      const totalSpent = outgoingTransactions.reduce((sum: number, tx: any) => {
        return sum + parseFloat(tx.amount || '0')
      }, 0)

      // Group by category (simplified - could be enhanced with ML)
      const byCategory: Record<string, number> = {}
      const categoryMapping: Record<string, string> = {
        'payment': 'Transfer',
        'path_payment_strict_receive': 'Exchange',
        'create_account': 'Account Setup',
        'manage_offer': 'Trading',
        'change_trust': 'Trust Setup'
      }

      outgoingTransactions.forEach((tx: any) => {
        const category = categoryMapping[tx.type] || 'Other'
        byCategory[category] = (byCategory[category] || 0) + parseFloat(tx.amount || '0')
      })

      // Generate monthly trends (last 12 months)
      const monthlyTrends = []
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = date.toISOString().slice(0, 7)
        const monthTransactions = outgoingTransactions.filter((tx: any) => 
          tx.created_at.startsWith(monthKey)
        )
        const monthAmount = monthTransactions.reduce((sum: number, tx: any) => 
          sum + parseFloat(tx.amount || '0'), 0
        )
        monthlyTrends.push({
          month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          amount: monthAmount
        })
      }

      // Top categories with percentages
      const topCategories = Object.entries(byCategory)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

      return {
        total_spent: totalSpent,
        by_category: byCategory,
        by_merchant: {}, // Not available from blockchain data
        monthly_trends: monthlyTrends,
        top_categories: topCategories
      }
    } catch (error) {
      console.error('Failed to fetch spending analytics:', error)
      throw new Error('Unable to fetch spending analytics. Please ensure you have a wallet connected and chain service is running.')
    }
  },

  async getInsights(): Promise<Insights> {
    // Get wallet public key
    const authData = localStorage.getItem('unity-wallet-auth')
    if (!authData) {
      throw new Error('No wallet connected')
    }
    
    const wallet = JSON.parse(authData)
    const publicKey = wallet.state?.wallet?.public_key
    if (!publicKey) {
      throw new Error('No wallet public key found')
    }

    // Try ML service first, fallback to chain service calculation
    try {
      const walletAnalytics = await mlApi.getWalletAnalytics(publicKey, 90)
      // Convert ML analytics to Insights format
      // Calculate risk score from anomalies
      const riskScore = walletAnalytics.anomalies.length > 0 
        ? walletAnalytics.anomalies.reduce((sum, a) => sum + a.confidence_score, 0) / walletAnalytics.anomalies.length 
        : 0
      
      return {
        spending_insights: [
          `You have ${walletAnalytics.features.total_transactions} transactions in total`,
          `Your monthly transaction average is ${walletAnalytics.features.transactions_per_month.toFixed(1)}`,
          `Peak activity hours: ${walletAnalytics.features.peak_transaction_hours.join(', ')}`
        ],
        recommendations: [
          'Consider diversifying your transaction patterns',
          'Monitor your transaction frequency',
          'Review large transactions regularly'
        ],
        anomalies: walletAnalytics.anomalies.map(a => ({
          type: a.anomaly_type,
          description: a.description,
          amount: 0, // Default amount since ML doesn't provide this
          date: a.timestamp
        })),
        credit_score: {
          score: Math.max(0, (1 - riskScore) * 100), // Convert risk to credit score
          grade: riskScore < 0.3 ? 'Excellent' : riskScore < 0.7 ? 'Good' : 'Fair',
          factors: {
            transaction_count: walletAnalytics.features.total_transactions,
            monthly_average: walletAnalytics.features.transactions_per_month,
            large_transactions: walletAnalytics.features.large_transaction_count
          }
        }
      }
    } catch (mlError) {
      console.warn('ML service unavailable, using chain service fallback:', mlError)
      // Fallback to chain service calculation
      return this.getInsightsFromChain()
    }
  },

  async getInsightsFromChain(): Promise<Insights> {
    try {
      // Get spending analytics to generate insights
      const analytics = await this.getSpendingAnalytics().catch(() => ({
        total_spent: 0,
        by_category: {},
        by_merchant: {},
        monthly_trends: [],
        top_categories: []
      }))
      
      const insights: string[] = []
      const recommendations: string[] = []

      // Generate insights based on spending data
      if (analytics.total_spent > 0) {
        insights.push(`You've spent ${analytics.total_spent.toFixed(3)} XLM in recent transactions`)
        
        const topCategory = analytics.top_categories[0]
        if (topCategory) {
          insights.push(`Your highest spending category is ${topCategory.category} (${topCategory.percentage.toFixed(1)}%)`)
        }

        if (analytics.monthly_trends.length > 1) {
          const lastMonth = analytics.monthly_trends[analytics.monthly_trends.length - 1]
          const prevMonth = analytics.monthly_trends[analytics.monthly_trends.length - 2]
          const change = lastMonth.amount - prevMonth.amount
          if (change > 0) {
            insights.push(`Your spending increased by ${change.toFixed(3)} XLM last month`)
            recommendations.push('Consider setting a monthly spending limit')
          } else {
            insights.push(`Your spending decreased by ${Math.abs(change).toFixed(3)} XLM last month`)
            recommendations.push('Great job managing your expenses!')
          }
        }
      } else {
        insights.push('No spending data available yet')
        recommendations.push('Start making transactions to see your spending patterns')
      }

      return {
        spending_insights: insights,
        recommendations: recommendations,
        anomalies: [], // Could be enhanced with ML service
        credit_score: {
          score: 750, // Base score - could be calculated from transaction history
          grade: 'Excellent',
          factors: {}
        }
      }
    } catch (error) {
      console.error('Failed to fetch insights:', error)
      throw new Error('Unable to load insights. Please ensure you have a wallet connected and chain service is running.')
    }
  }
}