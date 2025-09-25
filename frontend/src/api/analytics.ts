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
  },

  // ====== Gemini AI Assistant ======
  async askAssistant(message: string): Promise<{ answer: string }> {
    try {
      // Get wallet context
      const authData = localStorage.getItem('unity-wallet-auth')
      if (!authData) {
        throw new Error('No wallet connected')
      }
      
      const wallet = JSON.parse(authData)
      const publicKey = wallet.state?.wallet?.public_key
      if (!publicKey) {
        throw new Error('No wallet public key found')
      }

      // Get recent transaction context
      const transactions = await chainApi.getTransactionHistory(publicKey, 10)
      const balances = await chainApi.getBalances(publicKey)
      
      // Prepare context for Gemini
      const context = {
        wallet: {
          publicKey,
          balances: balances?.balances || []
        },
        transactions: transactions?.transactions?.slice(0, 5) || [],
        message
      }

      // Call Gemini API directly from frontend
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY
      const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'
      
      if (!apiKey) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.')
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a friendly AI assistant for SoviPay - a Solana blockchain wallet. 

WALLET CONTEXT (use when user asks about wallet/transactions):
- Public Key: ${context.wallet.publicKey}
- Balances: ${JSON.stringify(context.wallet.balances, null, 2)}
- Recent Transactions: ${JSON.stringify(context.transactions, null, 2)}

USER QUESTION: ${context.message}

INSTRUCTIONS:
1. If user asks about wallet, transactions, balances, or financial data → Use the wallet context above
2. If user asks general questions (greetings, weather, general knowledge) → Answer normally without wallet context
3. If user asks about crypto/blockchain in general → Provide helpful information
4. Always be friendly, helpful, and concise (under 200 words)
5. For wallet questions, explain in simple terms
6. For Vietnamese questions, respond in Vietnamese
7. For English questions, respond in English
8. IMPORTANT: Format your response with proper line breaks:
   - Use bullet points (•) for lists
   - Each main point on a new line
   - Use **bold** for important terms
   - Keep paragraphs short and readable

FORMATTING EXAMPLES:
- "Chào bạn" → "Xin chào! Tôi là trợ lý AI của SoviPay.\n\nTôi có thể giúp bạn:\n• Kiểm tra số dư\n• Xem giao dịch\n• Giải thích về crypto\n\nBạn cần giúp gì?"
- "How much XLM do I have?" → "**Số dư XLM của bạn:**\n\n• XLM: [amount] XLM\n• Giá trị: $[usd_value]\n\nBạn có thể gửi, nhận hoặc swap XLM này."
- "What is blockchain?" → "**Blockchain là gì?**\n\nBlockchain là một công nghệ lưu trữ dữ liệu:\n• **Phi tập trung:** Không có cơ quan trung ương\n• **Bảo mật:** Dữ liệu được mã hóa\n• **Minh bạch:** Mọi giao dịch đều công khai\n• **Bất biến:** Không thể thay đổi dữ liệu cũ"`
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error('Gemini API request failed')
      }

      const data = await response.json()
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request at the moment.'

      return { answer }
    } catch (error) {
      console.error('Gemini API error:', error)
      // Fallback response
      return { 
        answer: 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again later or contact support if the issue persists.' 
      }
    }
  }
}