import { apiClient } from './client'

export interface SpendingCategory {
  name: string
  amount: number
  percentage: number
}

export interface MonthlySpending {
  month: string
  amount: number
}

export interface SpendingSummary {
  total_spent: number
  categories: SpendingCategory[]
  monthly_trend: MonthlySpending[]
}

export interface Recommendation {
  title: string
  description: string
  savings?: number
  type: 'travel' | 'general' | 'loyalty'
}

export interface Insights {
  potential_savings: number
  recommendations: Recommendation[]
}

export interface CreditScore {
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  status: string
  factors: string[]
}

export const analyticsApi = {
  async getSpendingSummary(): Promise<SpendingSummary> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return {
        total_spent: 2750,
        categories: [
          { name: 'Travel', amount: 1200, percentage: 43.6 },
          { name: 'F&B', amount: 680, percentage: 24.7 },
          { name: 'Accommodation', amount: 520, percentage: 18.9 },
          { name: 'Banking', amount: 230, percentage: 8.4 },
          { name: 'Others', amount: 120, percentage: 4.4 },
        ],
        monthly_trend: [
          { month: 'Jan', amount: 2100 },
          { month: 'Feb', amount: 2450 },
          { month: 'Mar', amount: 2750 },
          { month: 'Apr', amount: 2200 },
          { month: 'May', amount: 2600 },
          { month: 'Jun', amount: 2750 },
        ],
      }
    }

    const response = await apiClient.get<SpendingSummary>('/analytics/spend')
    return response.data
  },

  async getInsights(): Promise<Insights> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return {
        potential_savings: 412,
        recommendations: [
          {
            title: 'Travel Bundle Opportunity',
            description: 'You spend 43% on travel. Bundle flights + hotels to save ~15%.',
            savings: 180,
            type: 'travel',
          },
          {
            title: 'Optimize Food Spending',
            description: 'Try cooking more meals at home to reduce F&B expenses.',
            savings: 120,
            type: 'general',
          },
          {
            title: 'Earn More SkyPoints',
            description: 'Use your travel card for everyday purchases to earn 2x points.',
            savings: 112,
            type: 'loyalty',
          },
        ],
      }
    }

    const response = await apiClient.get<Insights>('/analytics/insights')
    return response.data
  },

  async getCreditScore(): Promise<CreditScore> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return {
        score: 785,
        grade: 'A',
        status: 'Excellent',
        factors: [
          'Consistent payment history',
          'Low credit utilization',
          'Stable income patterns',
        ],
      }
    }

    const response = await apiClient.get<CreditScore>('/analytics/credit-score')
    return response.data
  },

  async getAlerts(): Promise<any[]> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      return [
        {
          id: 1,
          type: 'spending_alert',
          title: 'High Travel Spending',
          message: 'You spent 20% more on travel this month compared to average.',
          severity: 'medium',
          timestamp: new Date().toISOString(),
        },
      ]
    }

    const response = await apiClient.get<any[]>('/analytics/alerts')
    return response.data
  },

  async askAssistant(question: string): Promise<{ answer: string }> {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      const responses: Record<string, string> = {
        'travel spending': 'This month you spent $1,200 on travel (43% of total spending). Consider bundling flights and hotels for 15% savings.',
        'save money': 'Based on your spending patterns, you could save $412/month by: 1) Bundling travel bookings (save $180), 2) Cooking more at home (save $120), 3) Using rewards cards (save $112).',
        'credit score': 'Your credit score is 785 (Grade A). This is excellent! Key factors: consistent payments, low utilization (12%), stable income.',
        default: 'I can help you with questions about your spending, savings opportunities, and credit score. Try asking about your travel spending or how to save money.',
      }

      const key = Object.keys(responses).find(k => 
        question.toLowerCase().includes(k)
      ) || 'default'

      return { answer: responses[key] }
    }

    const response = await apiClient.post<{ answer: string }>('/analytics/ask', { question })
    return response.data
  },
}
