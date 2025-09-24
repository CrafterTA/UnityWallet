// Hệ sinh thái Sovico Types and Interfaces

export interface SovicoService {
  id: string
  name: string
  description: string
  category: string
  subcategory?: string
  company: string
  price: number
  currency: 'VND' | 'SYP' | 'XLM' | 'USDC'
  priceInSYP?: number
  priceInXLM?: number
  priceInUSDC?: number
  paymentAddress: string
  memo?: string
  acceptedAssets: string[]
  addonOptions?: SovicoAddon[]
  rating: number
  reviewCount: number
  imageUrl?: string
  videoUrl?: string
  requiresKYC: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  features: string[]
  benefits: string[]
  terms: string[]
  tags: string[]
}

export interface SovicoAddon {
  id: string
  name: string
  description: string
  price: number
  currency: 'VND' | 'SYP' | 'XLM' | 'USDC'
  isRequired: boolean
  isSelected: boolean
}

export interface SovicoSolution {
  id: string
  name: string
  description: string
  shortDescription: string
  category: string
  services: string[] // Service IDs
  price: number
  currency: 'VND' | 'SYP' | 'XLM' | 'USDC'
  priceInSYP?: number
  priceInXLM?: number
  priceInUSDC?: number
  originalPrice?: number
  discount?: number
  benefits: string[]
  timeline: string
  implementationSteps: string[]
  targetAudience: string[]
  imageUrl?: string
  videoUrl?: string
  isPopular: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
}

export interface SovicoCompany {
  id: string
  name: string
  description: string
  shortDescription: string
  category: string
  website: string
  logoUrl?: string
  coverImageUrl?: string
  establishedYear: number
  headquarters: string
  employees: number
  revenue: number
  currency: 'VND' | 'USD'
  marketShare: string
  icon?: string
  color?: string
  kpis: SovicoKPI[]
  services: string[]
  achievements: string[]
  partnerships: string[]
  socialMedia: {
    facebook?: string
    linkedin?: string
    twitter?: string
    youtube?: string
    instagram?: string
  }
  contact: {
    phone: string
    email: string
    address: string
    mapUrl?: string
    hotline?: string
  }
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SovicoKPI {
  name: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent?: number
  lastUpdated: string
}

export interface SovicoPromotion {
  id: string
  title: string
  description: string
  type: 'discount' | 'cashback' | 'points' | 'gift'
  value: number
  currency?: 'VND' | 'SYP' | 'XLM' | 'USDC'
  minSpend?: number
  maxDiscount?: number
  applicableServices: string[]
  applicableSolutions: string[]
  startDate: string
  endDate: string
  isActive: boolean
  usageLimit?: number
  usedCount: number
  terms: string[]
  imageUrl?: string
  bannerColor?: string
}

export interface SovicoStory {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  authorRole: string
  authorAvatar?: string
  company: string
  category: 'success' | 'case-study' | 'testimonial' | 'news'
  mediaType: 'text' | 'video' | 'podcast' | 'image' | 'audio' | 'timeline'
  mediaUrl?: string
  thumbnailUrl?: string
  duration?: number // in minutes
  tags: string[]
  isFeatured: boolean
  isActive: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
  viewCount: number
  likeCount: number
  shareCount: number
}

export interface SovicoAnalytics {
  sypMarketCap: {
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
  }
  activeUsers: {
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
  }
  transactionVolume: {
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
  }
  revenue: {
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
  }
  exchangeRates: {
    from: string
    to: string
    rate: number
    change: number
    lastUpdated: string
  }[]
  marketInsights: {
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
  }[]
  userMetrics: {
    totalUsers: number
    newUsers: number
    retentionRate: number
  }
  transactionMetrics: {
    totalTransactions: number
    successRate: number
    avgProcessingTime: number
  }
  peakHours: {
    time: string
    percentage: number
  }[]
  riskScore: number
  anomalies: {
    type: string
    description: string
    severity: 'low' | 'medium' | 'high'
    timestamp: string
  }[]
}

export interface SovicoFilter {
  category?: string
  subcategory?: string
  company?: string
  priceRange?: {
    min: number
    max: number
  }
  currency?: string
  rating?: number
  features?: string[]
  tags?: string[]
  isActive?: boolean
  requiresKYC?: boolean
}

export interface SovicoSearchParams {
  query?: string
  filters: SovicoFilter
  sortBy?: 'price' | 'rating' | 'name' | 'createdAt' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  page: number
  limit: number
}

export interface SovicoCheckoutState {
  service?: SovicoService
  solution?: SovicoSolution
  addons: SovicoAddon[]
  selectedAsset: string
  totalAmount: number
  totalInSYP: number
  totalInXLM: number
  totalInUSDC: number
  paymentAddress: string
  memo?: string
  isProcessing: boolean
  error?: string
}

export interface SovicoPaymentResult {
  success: boolean
  transactionHash?: string
  ledger?: number
  amount: number
  asset: string
  recipient: string
  memo?: string
  timestamp: string
  invoiceUrl?: string
  horizonUrl?: string
  error?: string
}

export interface SovicoLoyaltyPoints {
  total: number
  available: number
  used: number
  expired: number
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  nextLevelPoints: number
  benefits: string[]
}

export interface SovicoBooking {
  id: string
  serviceId: string
  userId: string
  date: string
  time: string
  duration: number
  location?: string
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface SovicoApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SovicoExchangeRates {
  SYP: {
    VND: number
    XLM: number
    USDC: number
  }
  XLM: {
    VND: number
    SYP: number
    USDC: number
  }
  USDC: {
    VND: number
    SYP: number
    XLM: number
  }
  lastUpdated: string
}
