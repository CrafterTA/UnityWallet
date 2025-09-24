import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/session'
import { 
  SovicoService, 
  SovicoSolution, 
  SovicoCompany, 
  SovicoPromotion,
  SovicoStory,
  SovicoAnalytics,
  SovicoFilter,
  SovicoSearchParams,
  SovicoCheckoutState,
  SovicoPaymentResult,
  SovicoLoyaltyPoints,
  SovicoExchangeRates
} from '@/types/sovico'

// Mock data - sẽ thay thế bằng API calls
const mockServices: SovicoService[] = [
  {
    id: '1',
    name: 'HDBank Premium Account',
    description: 'Tài khoản premium với nhiều ưu đãi và dịch vụ cao cấp',
    category: 'banking',
    subcategory: 'premium',
    company: 'HDBank',
    price: 5000000,
    currency: 'VND',
    priceInSYP: 1000,
    priceInXLM: 50,
    priceInUSDC: 200,
    paymentAddress: 'GABC123...',
    memo: 'HDBANK-PREMIUM-001',
    acceptedAssets: ['SYP', 'XLM', 'USDC'],
    addonOptions: [
      {
        id: 'addon-1',
        name: 'Bảo hiểm cao cấp',
        description: 'Bảo hiểm toàn diện cho tài khoản premium',
        price: 500000,
        currency: 'VND',
        isRequired: false,
        isSelected: false
      }
    ],
    rating: 4.8,
    reviewCount: 1250,
    imageUrl: '/images/hdbank-premium.jpg',
    requiresKYC: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    features: ['Miễn phí chuyển khoản', 'Ưu đãi lãi suất cao', 'Dịch vụ 24/7'],
    benefits: ['Tài khoản không phí duy trì', 'Ưu đãi đặc biệt', 'Hỗ trợ chuyên nghiệp'],
    terms: ['Cần KYC', 'Cam kết sử dụng 12 tháng'],
    tags: ['banking', 'premium', 'hdbank']
  }
]

const mockSolutions: SovicoSolution[] = [
  {
    id: '1',
    name: 'Doanh nhân bay',
    description: 'Gói giải pháp toàn diện cho doanh nhân: HDBank Premium + Vietjet Business + Dragon Village Suite',
    shortDescription: 'Tài khoản ngân hàng premium + vé máy bay hạng thương gia + nghỉ dưỡng cao cấp',
    category: 'business',
    services: ['1', '2', '3'],
    price: 15000000,
    currency: 'VND',
    priceInSYP: 3000,
    originalPrice: 20000000,
    discount: 25,
    benefits: [
      'Tiết kiệm 25% so với mua riêng lẻ',
      'Ưu đãi đặc biệt cho doanh nhân',
      'Hỗ trợ 24/7',
      'Tích hợp thanh toán SYP'
    ],
    timeline: 'Triển khai trong 7 ngày',
    implementationSteps: [
      'Đăng ký tài khoản HDBank Premium',
      'Kích hoạt thẻ Vietjet Business',
      'Đặt phòng Dragon Village Suite',
      'Tích hợp thanh toán SYP'
    ],
    targetAudience: ['Doanh nhân', 'Giám đốc', 'CEO'],
    imageUrl: '/images/business-package.jpg',
    isPopular: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: ['business', 'premium', 'combo']
  }
]

const mockCompanies: SovicoCompany[] = [
  {
    id: '1',
    name: 'HDBank',
    description: 'Ngân hàng TMCP Phát triển TP.HCM - Một trong những ngân hàng thương mại cổ phần hàng đầu Việt Nam',
    shortDescription: 'Ngân hàng hàng đầu Việt Nam',
    category: 'banking',
    website: 'https://hdbank.com.vn',
    logoUrl: '/images/hdbank-logo.png',
    establishedYear: 1990,
    headquarters: 'TP.HCM, Việt Nam',
    employees: 15000,
    revenue: 15000000000000,
    currency: 'VND',
    marketShare: 'Top 10 VN',
    kpis: [
      {
        name: 'Khách hàng',
        value: '2.5M+',
        unit: 'người',
        trend: 'up',
        changePercent: 15,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Doanh thu',
        value: '15,000',
        unit: 'tỷ VND',
        trend: 'up',
        changePercent: 12,
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    ],
    services: ['Tài khoản cá nhân', 'Tài khoản doanh nghiệp', 'Thẻ tín dụng', 'Vay vốn'],
    achievements: [
      'Ngân hàng tốt nhất Việt Nam 2023',
      'Chứng nhận ISO 27001',
      'Giải thưởng Fintech Innovation'
    ],
    partnerships: ['Vietjet Air', 'Dragon Village', 'Sovico Group'],
    socialMedia: {
      facebook: 'https://facebook.com/hdbank',
      linkedin: 'https://linkedin.com/company/hdbank'
    },
    contact: {
      phone: '1900 5555 88',
      email: 'info@hdbank.com.vn',
      address: '25Bis Nguyễn Thị Minh Khai, Q1, TP.HCM'
    },
    isVerified: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Vietjet Air',
    description: 'Hãng hàng không giá rẻ hàng đầu Việt Nam - Mang đến trải nghiệm bay tiện lợi và tiết kiệm',
    shortDescription: 'Hãng hàng không giá rẻ',
    category: 'aviation',
    website: 'https://vietjetair.com',
    logoUrl: '/images/vietjet-logo.png',
    establishedYear: 2007,
    headquarters: 'Hà Nội, Việt Nam',
    employees: 5000,
    revenue: 5000000000000,
    currency: 'VND',
    marketShare: 'Top 3 VN',
    kpis: [
      {
        name: 'Khách hàng',
        value: '50M+',
        unit: 'người',
        trend: 'up',
        changePercent: 25,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Chuyến bay',
        value: '100K+',
        unit: 'chuyến/năm',
        trend: 'up',
        changePercent: 18,
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    ],
    services: ['Vé máy bay', 'Dịch vụ hành lý', 'Bảo hiểm du lịch', 'Thuê xe'],
    achievements: [
      'Hãng hàng không giá rẻ tốt nhất châu Á 2023',
      'Chứng nhận IATA Operational Safety Audit',
      'Giải thưởng Best Low-Cost Airline'
    ],
    partnerships: ['HDBank', 'Dragon Village', 'Sovico Group'],
    socialMedia: {
      facebook: 'https://facebook.com/vietjetair',
      linkedin: 'https://linkedin.com/company/vietjet-air'
    },
    contact: {
      phone: '1900 1886',
      email: 'info@vietjetair.com',
      address: 'Tòa nhà Vietjet, Sân bay Nội Bài, Hà Nội'
    },
    isVerified: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
]

export const useSovicoExperience = () => {
  const { wallet } = useAuthStore()
  const queryClient = useQueryClient()
  
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedService, setSelectedService] = useState<SovicoService | null>(null)
  const [selectedSolution, setSelectedSolution] = useState<SovicoSolution | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showCompanyProfile, setShowCompanyProfile] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<SovicoCompany | null>(null)
  const [filters, setFilters] = useState<SovicoFilter>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'name' | 'createdAt' | 'popularity'>('popularity')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [checkoutState, setCheckoutState] = useState<SovicoCheckoutState>({
    addons: [],
    selectedAsset: 'SYP',
    totalAmount: 0,
    totalInSYP: 0,
    totalInXLM: 0,
    totalInUSDC: 0,
    paymentAddress: '',
    isProcessing: false
  })

  // Queries
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['sovico', 'services', filters, searchQuery, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      // Mock implementation - sẽ thay thế bằng API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockServices
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const { data: solutions = [], isLoading: solutionsLoading } = useQuery({
    queryKey: ['sovico', 'solutions', filters, searchQuery, sortBy, sortOrder, currentPage],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockSolutions
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: companies = [], isLoading: companiesLoading } = useQuery({
    queryKey: ['sovico', 'companies'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return mockCompanies
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  const { data: promotions = [], isLoading: promotionsLoading } = useQuery({
    queryKey: ['sovico', 'promotions'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return []
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: stories = [], isLoading: storiesLoading } = useQuery({
    queryKey: ['sovico', 'stories'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return [
        {
          id: '2',
          title: 'Vietjet Air: Thanh toán không tiền mặt với SYP',
          content: 'Vietjet Air đã tích hợp thành công thanh toán SYP, mang lại trải nghiệm mới cho khách hàng.',
          excerpt: 'Vietjet Air là hãng hàng không đầu tiên tại Việt Nam áp dụng thanh toán crypto...',
          author: 'Trần Thị B',
          authorRole: 'Trưởng phòng Marketing',
          authorAvatar: '',
          company: 'Vietjet Air',
          category: 'case-study' as const,
          mediaType: 'video' as const,
          mediaUrl: 'https://www.youtube.com/embed/1qiSxA96TZU?autoplay=0&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0&disablekb=0&enablejsapi=1',
          thumbnailUrl: 'https://img.youtube.com/vi/1qiSxA96TZU/maxresdefault.jpg',
          duration: undefined,
          tags: ['aviation', 'crypto-payment', 'customer-experience'],
          isFeatured: true,
          isActive: true,
          publishedAt: '2024-01-14T14:30:00Z',
          createdAt: '2024-01-14T14:30:00Z',
          updatedAt: '2024-01-14T14:30:00Z',
          viewCount: 890,
          likeCount: 67,
          shareCount: 15
        },
        {
          id: '1',
          title: 'HDBank: Chuyển đổi số thành công với Sovico',
          content: 'HDBank đã thành công trong việc chuyển đổi số với hệ sinh thái Sovico, tăng hiệu quả hoạt động lên 40%.',
          excerpt: 'Câu chuyện thành công của HDBank trong việc áp dụng công nghệ blockchain...',
          author: 'Nguyễn Văn A',
          authorRole: 'Giám đốc Công nghệ',
          authorAvatar: '',
          company: 'HDBank',
          category: 'success' as const,
          mediaType: 'video' as const,
          mediaUrl: 'https://www.youtube.com/embed/HKqb3mJk_e0?autoplay=0&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0&disablekb=0&enablejsapi=1',
          thumbnailUrl: 'https://img.youtube.com/vi/HKqb3mJk_e0/maxresdefault.jpg',
          duration: 300,
          tags: ['blockchain', 'banking', 'digital-transformation'],
          isFeatured: true,
          isActive: true,
          publishedAt: '2024-01-15T10:00:00Z',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          viewCount: 1250,
          likeCount: 89,
          shareCount: 23
        },
        {
          id: '3',
          title: 'Dragon Village: Du lịch thông minh với blockchain',
          content: 'Dragon Village đã tạo ra một hệ sinh thái du lịch thông minh với công nghệ blockchain.',
          excerpt: 'Dragon Village Resort & Spa đã áp dụng công nghệ blockchain để tạo ra trải nghiệm du lịch độc đáo...',
          author: 'Lê Văn C',
          authorRole: 'Giám đốc Điều hành',
          authorAvatar: '',
          company: 'Dragon Village',
          category: 'testimonial' as const,
          mediaType: 'video' as const,
          mediaUrl: 'https://www.youtube.com/embed/z4DLo5uUp6s?autoplay=0&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0&disablekb=0&enablejsapi=1',
          thumbnailUrl: 'https://img.youtube.com/vi/z4DLo5uUp6s/maxresdefault.jpg',
          duration: 420,
          tags: ['tourism', 'blockchain', 'smart-resort'],
          isFeatured: false,
          isActive: true,
          publishedAt: '2024-01-13T09:15:00Z',
          createdAt: '2024-01-13T09:15:00Z',
          updatedAt: '2024-01-13T09:15:00Z',
          viewCount: 650,
          likeCount: 45,
          shareCount: 12
        },
        {
          id: '4',
          title: 'Renewable Energy: Tương lai xanh với Sovico',
          content: 'Renewable Energy đã hợp tác với Sovico để tạo ra các giải pháp năng lượng xanh.',
          excerpt: 'Công ty Năng lượng Tái tạo đã hợp tác với Sovico để phát triển các dự án năng lượng xanh...',
          author: 'Phạm Thị D',
          authorRole: 'Giám đốc Phát triển Bền vững',
          authorAvatar: '',
          company: 'Renewable Energy',
          category: 'news' as const,
          mediaType: 'image' as const,
          mediaUrl: '',
          thumbnailUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop&crop=center',
          duration: undefined,
          tags: ['renewable-energy', 'sustainability', 'green-tech'],
          isFeatured: false,
          isActive: true,
          publishedAt: '2024-01-12T16:45:00Z',
          createdAt: '2024-01-12T16:45:00Z',
          updatedAt: '2024-01-12T16:45:00Z',
          viewCount: 420,
          likeCount: 32,
          shareCount: 8
        },
        {
          id: '5',
          title: 'Hệ sinh thái Sovico: Tương lai của thanh toán số',
          content: 'Hệ sinh thái Sovico đang định hình tương lai của thanh toán số tại Việt Nam với công nghệ blockchain tiên tiến.',
          excerpt: 'Khám phá cách Hệ sinh thái Sovico đang cách mạng hóa ngành thanh toán số...',
          author: 'Sovico Team',
          authorRole: 'Đội ngũ Phát triển',
          authorAvatar: '',
          company: 'Sovico',
          category: 'news' as const,
          mediaType: 'video' as const,
          mediaUrl: 'https://www.youtube.com/embed/DC5yqO8EMcQ?autoplay=0&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0&disablekb=0&enablejsapi=1',
          thumbnailUrl: 'https://img.youtube.com/vi/DC5yqO8EMcQ/maxresdefault.jpg',
          duration: 180,
          tags: ['blockchain', 'digital-payment', 'ecosystem'],
          isFeatured: true,
          isActive: true,
          publishedAt: '2024-01-16T08:00:00Z',
          createdAt: '2024-01-16T08:00:00Z',
          updatedAt: '2024-01-16T08:00:00Z',
          viewCount: 2100,
          likeCount: 156,
          shareCount: 45
        },
        {
          id: '6',
          title: 'Blockchain trong Du lịch: Cơ hội và Thách thức',
          content: 'Ứng dụng blockchain trong ngành du lịch đang mở ra những cơ hội mới cho các doanh nghiệp.',
          excerpt: 'Tìm hiểu về tiềm năng của blockchain trong ngành du lịch...',
          author: 'Nguyễn Thị E',
          authorRole: 'Chuyên gia Du lịch',
          authorAvatar: '',
          company: 'Dragon Village',
          category: 'case-study' as const,
          mediaType: 'video' as const,
          mediaUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw?autoplay=0&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3',
          thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
          duration: 240,
          tags: ['tourism', 'blockchain', 'innovation'],
          isFeatured: false,
          isActive: true,
          publishedAt: '2024-01-11T11:30:00Z',
          createdAt: '2024-01-11T11:30:00Z',
          updatedAt: '2024-01-11T11:30:00Z',
          viewCount: 780,
          likeCount: 54,
          shareCount: 18
        }
      ]
    },
    staleTime: 10 * 60 * 1000,
  })

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['sovico', 'analytics'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        sypMarketCap: {
          value: 1000000000,
          change: 5.2,
          trend: 'up' as const
        },
        activeUsers: {
          value: 12500,
          change: 12.5,
          trend: 'up' as const
        },
        transactionVolume: {
          value: 50000000,
          change: 8.3,
          trend: 'up' as const
        },
        revenue: {
          value: 2500000,
          change: 15.7,
          trend: 'up' as const
        },
        exchangeRates: [
          {
            from: 'SYP',
            to: 'VND',
            rate: 25000,
            change: 2.1,
            lastUpdated: '2024-01-15 10:30:00'
          },
          {
            from: 'SYP',
            to: 'XLM',
            rate: 0.5,
            change: -1.2,
            lastUpdated: '2024-01-15 10:30:00'
          },
          {
            from: 'SYP',
            to: 'USDC',
            rate: 1.0,
            change: 0.5,
            lastUpdated: '2024-01-15 10:30:00'
          }
        ],
        marketInsights: [
          {
            type: 'positive' as const,
            title: 'SYP Adoption Growing',
            description: 'Increased adoption in Vietnamese market'
          },
          {
            type: 'neutral' as const,
            title: 'Market Volatility',
            description: 'Normal market fluctuations observed'
          }
        ],
        userMetrics: {
          totalUsers: 50000,
          newUsers: 1200,
          retentionRate: 85.5
        },
        transactionMetrics: {
          totalTransactions: 150000,
          successRate: 99.2,
          avgProcessingTime: 250
        },
        peakHours: [
          { time: '09:00-10:00', percentage: 85 },
          { time: '14:00-15:00', percentage: 92 },
          { time: '19:00-20:00', percentage: 78 }
        ],
        riskScore: 25,
        anomalies: [
          {
            type: 'Unusual Transaction Pattern',
            description: 'Detected unusual spending pattern in user account',
            severity: 'low' as const,
            timestamp: '2024-01-15 09:15:00'
          }
        ]
      } as SovicoAnalytics
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: exchangeRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['sovico', 'exchange-rates'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      return {
        SYP: { VND: 5000, XLM: 0.5, USDC: 0.2 },
        XLM: { VND: 10000, SYP: 2, USDC: 0.4 },
        USDC: { VND: 25000, SYP: 5, XLM: 2.5 },
        lastUpdated: new Date().toISOString()
      } as SovicoExchangeRates
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  // Mutations
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: SovicoCheckoutState): Promise<SovicoPaymentResult> => {
      // Mock implementation - sẽ thay thế bằng API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (Math.random() > 0.1) { // 90% success rate for demo
        return {
          success: true,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
          ledger: Math.floor(Math.random() * 1000000) + 50000000,
          amount: paymentData.totalAmount,
          asset: paymentData.selectedAsset,
          recipient: paymentData.paymentAddress,
          memo: paymentData.memo,
          timestamp: new Date().toISOString(),
          invoiceUrl: '/invoices/' + Date.now() + '.pdf',
          horizonUrl: 'https://horizon.stellar.org/transactions/' + Math.random().toString(16).substr(2, 64)
        }
      } else {
        throw new Error('Payment failed. Please try again.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balances'] })
      queryClient.invalidateQueries({ queryKey: ['sovico', 'analytics'] })
    }
  })

  // Helper functions
  const updateFilters = useCallback((newFilters: Partial<SovicoFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setCurrentPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
    setCurrentPage(1)
  }, [])

  const selectService = useCallback((service: SovicoService) => {
    setSelectedService(service)
    setShowServiceModal(true)
  }, [])

  const selectSolution = useCallback((solution: SovicoSolution) => {
    setSelectedSolution(solution)
    setShowServiceModal(true)
  }, [])

  const selectCompany = useCallback((company: SovicoCompany) => {
    setSelectedCompany(company)
    setShowCompanyProfile(true)
  }, [])

  const startCheckout = useCallback((service?: SovicoService, solution?: SovicoSolution) => {
    if (!wallet) {
      throw new Error('Wallet not connected')
    }

    const checkoutData: SovicoCheckoutState = {
      service,
      solution,
      addons: [],
      selectedAsset: 'SYP',
      totalAmount: service?.price || solution?.price || 0,
      totalInSYP: service?.priceInSYP || solution?.priceInSYP || 0,
      totalInXLM: service?.priceInXLM || solution?.priceInXLM || 0,
      totalInUSDC: service?.priceInUSDC || solution?.priceInUSDC || 0,
      paymentAddress: service?.paymentAddress || solution?.services?.[0] || '',
      memo: service?.memo || solution?.id,
      isProcessing: false
    }

    setCheckoutState(checkoutData)
    setShowPaymentModal(true)
  }, [wallet])

  const processPayment = useCallback(async () => {
    if (!checkoutState.service && !checkoutState.solution) {
      throw new Error('No service or solution selected')
    }

    setCheckoutState(prev => ({ ...prev, isProcessing: true, error: undefined }))

    try {
      const result = await paymentMutation.mutateAsync(checkoutState)
      setShowPaymentModal(false)
      return result
    } catch (error) {
      setCheckoutState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: error instanceof Error ? error.message : 'Payment failed' 
      }))
      throw error
    }
  }, [checkoutState, paymentMutation])

  const suggestSwap = useCallback((fromAsset: string, toAsset: string, amount: number) => {
    // Navigate to swap page with pre-filled data
    window.location.href = `/swap?from=${fromAsset}&to=${toAsset}&amount=${amount}`
  }, [])

  return {
    // State
    activeTab,
    setActiveTab,
    selectedService,
    selectedSolution,
    showPaymentModal,
    setShowPaymentModal,
    showServiceModal,
    setShowServiceModal,
    showCompanyProfile,
    setShowCompanyProfile,
    selectedCompany,
    filters,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    currentPage,
    setCurrentPage,
    checkoutState,
    setCheckoutState,

    // Data
    services,
    solutions,
    companies,
    promotions,
    stories,
    analytics,
    exchangeRates,

    // Loading states
    servicesLoading,
    solutionsLoading,
    companiesLoading,
    promotionsLoading,
    storiesLoading,
    analyticsLoading,
    ratesLoading,
    isPaymentProcessing: paymentMutation.isPending,

    // Actions
    updateFilters,
    resetFilters,
    selectService,
    selectSolution,
    selectCompany,
    setSelectedCompany,
    startCheckout,
    processPayment,
    suggestSwap,

    // Payment mutation
    paymentError: paymentMutation.error,
    paymentResult: paymentMutation.data
  }
}
