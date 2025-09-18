import { apiClient } from './client'

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
      const response = await apiClient.get<any>('/analytics/spend')
      // Transform backend response to frontend format
      return {
        total_spent: parseFloat(response.data.last_30d_spend),
        by_category: response.data.category_breakdown.reduce((acc: any, item: any) => {
          acc[item.category] = item.amount
          return acc
        }, {}),
        by_merchant: {}, // Not available in backend
        monthly_trends: response.data.trend_analysis.map((item: any) => ({
          month: item.period,
          amount: item.amount
        })),
        top_categories: response.data.category_breakdown.map((item: any) => ({
          category: item.category,
          amount: item.amount,
          percentage: item.percentage
        }))
      }
    } catch (error) {
      throw new Error('Failed to fetch spending analytics')
    }
  },

  async getInsights(): Promise<Insights> {
    try {
      const response = await apiClient.get<any>('/analytics/insights')
      // Transform backend response to frontend format
      return {
        spending_insights: response.data.insights.map((item: any) => item.title),
        recommendations: response.data.insights.map((item: any) => item.title),
        anomalies: [], // Not available in backend
        credit_score: {
          score: 680, // Default from seed data
          grade: 'Good',
          factors: {}
        }
      }
    } catch (error) {
      throw new Error('Failed to fetch insights')
    }
  }
}