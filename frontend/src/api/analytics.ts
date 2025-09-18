import { chainApi } from './chain'

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
    try {
      // Get transactions from chain service to calculate analytics
      const publicKey = localStorage.getItem('stellar_public_key')
      if (!publicKey) {
        throw new Error('No wallet connected')
      }

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
        insights.push(`You've spent ${analytics.total_spent.toFixed(2)} XLM in recent transactions`)
        
        const topCategory = analytics.top_categories[0]
        if (topCategory) {
          insights.push(`Your highest spending category is ${topCategory.category} (${topCategory.percentage.toFixed(1)}%)`)
        }

        if (analytics.monthly_trends.length > 1) {
          const lastMonth = analytics.monthly_trends[analytics.monthly_trends.length - 1]
          const prevMonth = analytics.monthly_trends[analytics.monthly_trends.length - 2]
          const change = lastMonth.amount - prevMonth.amount
          if (change > 0) {
            insights.push(`Your spending increased by ${change.toFixed(2)} XLM last month`)
            recommendations.push('Consider setting a monthly spending limit')
          } else {
            insights.push(`Your spending decreased by ${Math.abs(change).toFixed(2)} XLM last month`)
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