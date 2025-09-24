import { apiClient } from './client'

export interface Brand {
  brand_id: string
  name: string
  category: string
  logo_url: string
  primary_color: string
  status: string
}

export interface UserPoints {
  brand_id: string
  brand_name: string
  points: number
  category: string
}

export interface PointsResponse {
  stellar_public_key: string
  brands: UserPoints[]
  total_points: number
  updated_at?: string
}

export interface Campaign {
  campaign_id: string
  brand_id: string
  brand_name: string
  title: string
  description: string
  bonus_multiplier: number
  valid_from: string
  valid_to: string
  terms: string[]
}

export interface Transaction {
  transaction_id: string
  brand_id: string
  brand_name: string
  amount_vnd: number
  points: number
  type: 'earn' | 'redeem'
  description: string
  timestamp: string
}

export interface SovicoTransactionResponse {
  transaction_id: string
  stellar_public_key: string
  brand_id: string
  points_earned: number
  total_points: number
  amount_vnd: number
  description: string
  timestamp: number
  transaction_hash: string
  type: 'earn' | 'redeem'
}

export interface EarnPointsRequest {
  stellar_public_key: string
  brand_id: string
  amount_vnd: number
  description?: string
  transaction_hash?: string  // For real wallet transactions
  stellar_amount?: string    // Actual Stellar amount used
  stellar_asset?: string     // Actual Stellar asset used
}

export interface RedeemPointsRequest {
  stellar_public_key: string
  brand_id: string
  points: number
  description?: string
  wallet_address?: string    // For voucher delivery
}

export interface WalletTransaction {
  amount: number
  destination: string
  memo?: string
}

export interface AnalyticsSummary {
  total_brands: number
  active_campaigns: number
  categories: Record<string, number>
  mock_stats: {
    total_users: number
    monthly_transactions: number
    total_points_issued: number
    total_points_redeemed: number
  }
}

export const sovicoApi = {
  // Get all brands
  async getBrands(): Promise<Brand[]> {
    const response = await apiClient.get('/sovico/brands')
    return (response.data as any).data
  },

  // Get brands by category
  async getBrandsByCategory(): Promise<Record<string, Brand[]>> {
    const response = await apiClient.get('/sovico/brands/categories')
    return (response.data as any).data
  },

  // Get wallet points using Stellar public key
  async getUserPoints(stellarPublicKey: string, brandId?: string): Promise<number> {
    try {
      const response = await apiClient.get(`/sovico/points/${stellarPublicKey}`)
      
      // Backend returns { success: true, points: number }
      const responseData = (response.data as any)
      return responseData.points || 0
    } catch (error) {
      console.warn('Failed to fetch user points:', error)
      return 0
    }
  },

  // Earn points
  async earnPoints(request: EarnPointsRequest) {
    const response = await apiClient.post('/sovico/points/earn', request)
    return (response.data as any).data
  },

  // Redeem points
  async redeemPoints(request: RedeemPointsRequest) {
    const response = await apiClient.post('/sovico/points/redeem', request)
    return (response.data as any).data
  },

  // Get campaigns
  async getCampaigns(brandId?: string): Promise<Campaign[]> {
    const params = brandId ? `?brand_id=${brandId}` : ''
    const response = await apiClient.get(`/sovico/campaigns${params}`)
    return (response.data as any).data
  },

  // Get transaction history using Stellar public key
  async getTransactionHistory(
    stellarPublicKey: string, 
    brandId?: string, 
    limit: number = 50
  ): Promise<Transaction[]> {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (brandId) {
      params.append('brand_id', brandId)
    }
    
    const response = await apiClient.get(`/sovico/wallets/${stellarPublicKey}/transactions?${params}`)
    return (response.data as any).data
  },

  // Get Sovico transaction history (new simplified endpoint)
  async getSovicoTransactions(stellarPublicKey: string, limit: number = 10): Promise<SovicoTransactionResponse[]> {
    try {
      const response = await apiClient.get(`/sovico/transactions/${stellarPublicKey}?limit=${limit}`)
      return (response.data as any).data || []
    } catch (error) {
      console.warn('Failed to fetch Sovico transactions:', error)
      return []
    }
  },

  // Get analytics summary
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const response = await apiClient.get('/sovico/analytics/summary')
    return (response.data as any).data
  },

  // Generate demo data for testing using Stellar public key
  async generateDemoData(stellarPublicKey: string) {
    const response = await apiClient.post(`/sovico/demo/generate-data?stellar_public_key=${stellarPublicKey}`)
    return response.data as any
  }
}

// Helper functions for UI
export const formatPoints = (points: number): string => {
  return new Intl.NumberFormat('vi-VN').format(points)
}

export const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

export const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    coffee: '☕',
    retail: '🛒',
    ecommerce: '📱',
    airline: '✈️',
    hospitality: '🏨',
    fuel: '⛽',
    food_delivery: '🍕'
  }
  return icons[category] || '🏪'
}

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    coffee: '#8B4513',
    retail: '#E31E24',
    ecommerce: '#FF6600',
    airline: '#B41E3C',
    hospitality: '#DAA520',
    fuel: '#00A651',
    food_delivery: '#00B14F'
  }
  return colors[category] || '#6B7280'
}
