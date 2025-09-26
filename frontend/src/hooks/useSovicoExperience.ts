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
    priceInSOL: 0.93,
    priceInUSDT: 200,
    paymentAddress: '2G4rAznTKBFbTK7ofGBEkdLAKs7idYKAH5iMwqSbLJxr',
    memo: 'HDBANK-PREMIUM-001',
    acceptedAssets: ['SOL', 'USDT'],
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
  },
  {
    id: '2',
    name: 'Vietjet Business Class',
    description: 'Vé máy bay hạng thương gia với nhiều ưu đãi và dịch vụ cao cấp',
    category: 'aviation',
    subcategory: 'business',
    company: 'Vietjet Air',
    price: 3000000,
    currency: 'VND',
    priceInSOL: 0.56,
    priceInUSDT: 120,
    paymentAddress: '2G4rAznTKBFbTK7ofGBEkdLAKs7idYKAH5iMwqSbLJxr',
    memo: 'VJ-BUSINESS-001',
    acceptedAssets: ['SOL', 'USDT'],
    addonOptions: [
      {
        id: 'addon-2',
        name: 'Bảo hiểm du lịch',
        description: 'Bảo hiểm toàn diện cho chuyến bay',
        price: 200000,
        currency: 'VND',
        isRequired: false,
        isSelected: false
      }
    ],
    rating: 4.6,
    reviewCount: 890,
    imageUrl: '/images/vietjet-business.jpg',
    requiresKYC: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    features: ['Ghế rộng rãi', 'Bữa ăn cao cấp', 'Ưu tiên check-in'],
    benefits: ['Tích lũy điểm thưởng', 'Ưu đãi đặc biệt', 'Hỗ trợ 24/7'],
    terms: ['Có thể hủy trước 24h', 'Không hoàn tiền'],
    tags: ['aviation', 'business', 'vietjet']
  },
  {
    id: '3',
    name: 'Dragon Village Resort Suite',
    description: 'Phòng suite cao cấp tại resort Dragon Village với view biển tuyệt đẹp',
    category: 'hospitality',
    subcategory: 'resort',
    company: 'Dragon Village',
    price: 2500000,
    currency: 'VND',
    priceInSOL: 0.47,
    priceInUSDT: 100,
    paymentAddress: '2G4rAznTKBFbTK7ofGBEkdLAKs7idYKAH5iMwqSbLJxr',
    memo: 'DV-RESORT-001',
    acceptedAssets: ['SOL', 'USDT'],
    addonOptions: [
      {
        id: 'addon-3',
        name: 'Spa package',
        description: 'Gói spa thư giãn cao cấp',
        price: 800000,
        currency: 'VND',
        isRequired: false,
        isSelected: false
      }
    ],
    rating: 4.9,
    reviewCount: 650,
    imageUrl: '/images/dragon-village-resort.jpg',
    requiresKYC: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    features: ['View biển 360 độ', 'Bể bơi riêng', 'Dịch vụ butler'],
    benefits: ['Bữa sáng miễn phí', 'WiFi tốc độ cao', 'Dịch vụ 24/7'],
    terms: ['Check-in 14:00', 'Check-out 12:00', 'Có thể hủy miễn phí'],
    tags: ['hospitality', 'resort', 'dragon-village']
  },
  {
    id: '4',
    name: 'Sovico Energy Solar Panel',
    description: 'Hệ thống pin mặt trời cao cấp cho gia đình với công nghệ tiên tiến',
    category: 'energy',
    subcategory: 'solar',
    company: 'Sovico Energy',
    price: 15000000,
    currency: 'VND',
    priceInSOL: 2.81,
    priceInUSDT: 600,
    paymentAddress: '2G4rAznTKBFbTK7ofGBEkdLAKs7idYKAH5iMwqSbLJxr',
    memo: 'SE-SOLAR-001',
    acceptedAssets: ['SOL', 'USDT'],
    addonOptions: [
      {
        id: 'addon-4',
        name: 'Bảo trì 5 năm',
        description: 'Dịch vụ bảo trì và bảo hành 5 năm',
        price: 2000000,
        currency: 'VND',
        isRequired: false,
        isSelected: false
      }
    ],
    rating: 4.7,
    reviewCount: 320,
    imageUrl: '/images/sovico-solar.jpg',
    requiresKYC: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    features: ['Công suất 5kW', 'Tuổi thọ 25 năm', 'Tiết kiệm 80% điện'],
    benefits: ['Bảo hành 10 năm', 'Lắp đặt miễn phí', 'Hỗ trợ kỹ thuật'],
    terms: ['Cần khảo sát trước', 'Bảo hành 10 năm', 'Hỗ trợ vay vốn'],
    tags: ['energy', 'solar', 'sovico-energy']
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
    priceInSOL: 1.96,
    originalPrice: 20000000,
    discount: 25,
    benefits: [
      'Tiết kiệm 25% so với mua riêng lẻ',
      'Ưu đãi đặc biệt cho doanh nhân',
      'Hỗ trợ 24/7',
      'Tích hợp thanh toán SOL/USDT'
    ],
    timeline: 'Triển khai trong 7 ngày',
    implementationSteps: [
      'Đăng ký tài khoản HDBank Premium',
      'Kích hoạt thẻ Vietjet Business',
      'Đặt phòng Dragon Village Suite',
      'Tích hợp thanh toán SOL/USDT'
    ],
    targetAudience: ['Doanh nhân', 'Giám đốc', 'CEO'],
    imageUrl: '/images/business-package.jpg',
    isPopular: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: ['business', 'premium', 'combo']
  },
  {
    id: '2',
    name: 'Gia đình hạnh phúc',
    description: 'Gói dịch vụ dành cho gia đình: Tài khoản tiết kiệm + Vé máy bay gia đình + Nghỉ dưỡng cuối tuần',
    shortDescription: 'Tài khoản tiết kiệm + vé máy bay gia đình + nghỉ dưỡng cuối tuần',
    category: 'family',
    services: ['1', '2', '3'],
    price: 8000000,
    currency: 'VND',
    priceInSOL: 1.04,
    originalPrice: 12000000,
    discount: 33,
    benefits: [
      'Tiết kiệm 33% so với mua riêng lẻ',
      'Ưu đãi đặc biệt cho gia đình',
      'Hỗ trợ 24/7',
      'Tích hợp thanh toán SOL/USDT'
    ],
    timeline: 'Triển khai trong 5 ngày',
    implementationSteps: [
      'Mở tài khoản tiết kiệm gia đình',
      'Đăng ký chương trình khách hàng thân thiết Vietjet',
      'Đặt phòng Dragon Village cho gia đình',
      'Tích hợp thanh toán SOL/USDT'
    ],
    targetAudience: ['Gia đình', 'Cặp đôi', 'Phụ huynh'],
    imageUrl: '/images/family-package.jpg',
    isPopular: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: ['family', 'savings', 'travel']
  },
  {
    id: '3',
    name: 'Startup thông minh',
    description: 'Gói hỗ trợ startup: Tài khoản doanh nghiệp + Dịch vụ vận chuyển + Văn phòng ảo',
    shortDescription: 'Tài khoản doanh nghiệp + dịch vụ vận chuyển + văn phòng ảo',
    category: 'startup',
    services: ['1', '2', '3'],
    price: 5000000,
    currency: 'VND',
    priceInSOL: 0.65,
    originalPrice: 8000000,
    discount: 37,
    benefits: [
      'Tiết kiệm 37% so với mua riêng lẻ',
      'Hỗ trợ đặc biệt cho startup',
      'Tư vấn miễn phí',
      'Tích hợp thanh toán SOL/USDT'
    ],
    timeline: 'Triển khai trong 3 ngày',
    implementationSteps: [
      'Mở tài khoản doanh nghiệp HDBank',
      'Đăng ký dịch vụ vận chuyển Vietjet',
      'Thuê văn phòng ảo Dragon Village',
      'Tích hợp thanh toán SOL/USDT'
    ],
    targetAudience: ['Startup', 'Doanh nghiệp nhỏ', 'Freelancer'],
    imageUrl: '/images/startup-package.jpg',
    isPopular: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: ['startup', 'business', 'innovation']
  },
  {
    id: '4',
    name: 'Du lịch cao cấp',
    description: 'Gói du lịch cao cấp: Tài khoản du lịch + Vé máy bay hạng nhất + Resort 5 sao',
    shortDescription: 'Tài khoản du lịch + vé máy bay hạng nhất + resort 5 sao',
    category: 'luxury',
    services: ['1', '2', '3'],
    price: 25000000,
    currency: 'VND',
    priceInSOL: 3.26,
    originalPrice: 35000000,
    discount: 28,
    benefits: [
      'Tiết kiệm 28% so với mua riêng lẻ',
      'Dịch vụ cao cấp nhất',
      'Hỗ trợ 24/7',
      'Tích hợp thanh toán SOL/USDT'
    ],
    timeline: 'Triển khai trong 10 ngày',
    implementationSteps: [
      'Mở tài khoản du lịch cao cấp HDBank',
      'Đặt vé máy bay hạng nhất Vietjet',
      'Đặt phòng resort 5 sao Dragon Village',
      'Tích hợp thanh toán SOL/USDT'
    ],
    targetAudience: ['Du lịch cao cấp', 'VIP', 'Celebrity'],
    imageUrl: '/images/luxury-package.jpg',
    isPopular: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    tags: ['luxury', 'travel', 'premium']
  }
]

const mockCompanies: SovicoCompany[] = [
  {
    id: '1',
    name: 'HDBank',
    description: 'Ngân hàng TMCP Phát triển TP.HCM - Một trong những ngân hàng thương mại cổ phần hàng đầu Việt Nam với hơn 30 năm kinh nghiệm',
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
    icon: 'CreditCard',
    color: 'blue',
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
      },
      {
        name: 'Chi nhánh',
        value: '300+',
        unit: 'chi nhánh',
        trend: 'up',
        changePercent: 8,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Tài sản',
        value: '500,000',
        unit: 'tỷ VND',
        trend: 'up',
        changePercent: 18,
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    ],
    services: [
      'Tài khoản cá nhân & doanh nghiệp',
      'Thẻ tín dụng & ghi nợ',
      'Vay vốn & tín dụng',
      'Đầu tư & bảo hiểm',
      'Dịch vụ ngân hàng số',
      'Chuyển tiền quốc tế',
      'Dịch vụ ngoại hối',
      'Tư vấn tài chính'
    ],
    achievements: [
      'Ngân hàng tốt nhất Việt Nam 2023',
      'Chứng nhận ISO 27001 về bảo mật',
      'Giải thưởng Fintech Innovation',
      'Xếp hạng A+ từ Moody\'s',
      'Giải thưởng Digital Banking Excellence',
      'Chứng nhận PCI DSS Level 1'
    ],
    partnerships: ['Vietjet Air', 'Dragon Village', 'Sovico Group', 'Visa', 'Mastercard'],
    socialMedia: {
      facebook: 'https://facebook.com/hdbank',
      linkedin: 'https://linkedin.com/company/hdbank',
      twitter: 'https://twitter.com/hdbank',
      youtube: 'https://youtube.com/hdbank'
    },
    contact: {
      phone: '1900 5555 88',
      email: 'info@hdbank.com.vn',
      address: '25Bis Nguyễn Thị Minh Khai, Q1, TP.HCM',
      hotline: '028 3822 0888'
    },
    isVerified: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Vietjet Air',
    description: 'Hãng hàng không giá rẻ hàng đầu Việt Nam - Mang đến trải nghiệm bay tiện lợi và tiết kiệm với mạng lưới bay rộng khắp châu Á',
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
    icon: 'Plane',
    color: 'red',
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
      },
      {
        name: 'Tuyến bay',
        value: '80+',
        unit: 'tuyến',
        trend: 'up',
        changePercent: 12,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Máy bay',
        value: '100+',
        unit: 'chiếc',
        trend: 'up',
        changePercent: 20,
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    ],
    services: [
      'Vé máy bay nội địa & quốc tế',
      'Dịch vụ hành lý & ăn uống',
      'Chương trình khách hàng thân thiết',
      'Dịch vụ thuê máy bay',
      'Bảo hiểm du lịch',
      'Dịch vụ thuê xe',
      'Dịch vụ khách sạn',
      'Dịch vụ visa'
    ],
    achievements: [
      'Hãng hàng không giá rẻ tốt nhất châu Á 2023',
      'Chứng nhận IATA Operational Safety Audit',
      'Giải thưởng Best Low-Cost Airline',
      'Hãng bay có tốc độ tăng trưởng nhanh nhất thế giới',
      'Chứng nhận IOSA (IATA Operational Safety Audit)',
      'Giải thưởng Airline of the Year 2023'
    ],
    partnerships: ['HDBank', 'Dragon Village', 'Sovico Group', 'Airbus', 'Boeing'],
    socialMedia: {
      facebook: 'https://facebook.com/vietjetair',
      linkedin: 'https://linkedin.com/company/vietjet-air',
      twitter: 'https://twitter.com/vietjetair',
      instagram: 'https://instagram.com/vietjetair'
    },
    contact: {
      phone: '1900 1886',
      email: 'info@vietjetair.com',
      address: 'Tòa nhà Vietjet, Sân bay Nội Bài, Hà Nội',
      hotline: '028 7300 1886'
    },
    isVerified: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'Dragon Village',
    description: 'Khu đô thị cao cấp với các dự án bất động sản quy mô lớn và dịch vụ du lịch thông minh, tích hợp công nghệ blockchain',
    shortDescription: 'Khu đô thị cao cấp',
    category: 'realestate',
    website: 'https://dragonvillage.vn',
    logoUrl: '/images/dragon-village-logo.png',
    establishedYear: 2010,
    headquarters: 'TP.HCM, Việt Nam',
    employees: 3000,
    revenue: 100000000000000,
    currency: 'VND',
    marketShare: 'Top 5 VN',
    icon: 'Home',
    color: 'green',
    kpis: [
      {
        name: 'Cư dân',
        value: '50K+',
        unit: 'người',
        trend: 'up',
        changePercent: 20,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Dự án',
        value: '25+',
        unit: 'dự án',
        trend: 'up',
        changePercent: 15,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Diện tích',
        value: '500',
        unit: 'ha',
        trend: 'up',
        changePercent: 10,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Khách sạn',
        value: '15+',
        unit: 'khách sạn',
        trend: 'up',
        changePercent: 25,
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    ],
    services: [
      'Biệt thự cao cấp & căn hộ thông minh',
      'Resort 5 sao & khách sạn',
      'Dịch vụ du lịch & nghỉ dưỡng',
      'Trung tâm thương mại & giải trí',
      'Dịch vụ quản lý tài sản',
      'Dịch vụ bảo trì & vận hành',
      'Dịch vụ an ninh 24/7',
      'Dịch vụ tiện ích thông minh'
    ],
    achievements: [
      'Dự án đô thị thông minh đầu tiên tại Việt Nam',
      'Giải thưởng Bất động sản tốt nhất 2023',
      'Chứng nhận LEED Platinum',
      'Khu đô thị xanh nhất Việt Nam',
      'Giải thưởng Smart City Innovation',
      'Chứng nhận ISO 14001 về môi trường'
    ],
    partnerships: ['HDBank', 'Vietjet Air', 'Sovico Group', 'Marriott', 'Hilton'],
    socialMedia: {
      facebook: 'https://facebook.com/dragonvillage',
      linkedin: 'https://linkedin.com/company/dragon-village',
      instagram: 'https://instagram.com/dragonvillage',
      youtube: 'https://youtube.com/dragonvillage'
    },
    contact: {
      phone: '1900 9999 88',
      email: 'info@dragonvillage.vn',
      address: 'Khu đô thị Dragon Village, Q7, TP.HCM',
      hotline: '028 7300 9999'
    },
    isVerified: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: 'Sovico Energy',
    description: 'Công ty năng lượng tái tạo hàng đầu với các dự án xanh và giải pháp năng lượng bền vững, góp phần xây dựng tương lai xanh',
    shortDescription: 'Năng lượng tái tạo',
    category: 'energy',
    website: 'https://sovicoenergy.vn',
    logoUrl: '/images/sovico-energy-logo.png',
    establishedYear: 2015,
    headquarters: 'Hà Nội, Việt Nam',
    employees: 2000,
    revenue: 5000000000000,
    currency: 'VND',
    marketShare: '15% VN',
    icon: 'Zap',
    color: 'yellow',
    kpis: [
      {
        name: 'Công suất',
        value: '500MW',
        unit: 'MW',
        trend: 'up',
        changePercent: 30,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Dự án',
        value: '50+',
        unit: 'dự án',
        trend: 'up',
        changePercent: 25,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Tiết kiệm CO2',
        value: '100K+',
        unit: 'tấn/năm',
        trend: 'up',
        changePercent: 40,
        lastUpdated: '2024-01-01T00:00:00Z'
      },
      {
        name: 'Tỷ lệ tái tạo',
        value: '85%',
        unit: '%',
        trend: 'up',
        changePercent: 15,
        lastUpdated: '2024-01-01T00:00:00Z'
      }
    ],
    services: [
      'Điện mặt trời & điện gió',
      'Hệ thống lưu trữ năng lượng',
      'Tư vấn năng lượng xanh',
      'Dịch vụ bảo trì & vận hành',
      'Giải pháp năng lượng thông minh',
      'Dịch vụ đo đạc & kiểm định',
      'Tư vấn chính sách năng lượng',
      'Dịch vụ tài chính xanh'
    ],
    achievements: [
      'Nhà sản xuất năng lượng mặt trời lớn nhất Việt Nam',
      'Giải thưởng Doanh nghiệp xanh 2023',
      'Chứng nhận ISO 14001',
      'Giải thưởng Renewable Energy Excellence',
      'Chứng nhận Carbon Trust Standard',
      'Giải thưởng Green Innovation Award'
    ],
    partnerships: ['HDBank', 'Vietjet Air', 'Dragon Village', 'Siemens', 'GE'],
    socialMedia: {
      facebook: 'https://facebook.com/sovicoenergy',
      linkedin: 'https://linkedin.com/company/sovico-energy',
      twitter: 'https://twitter.com/sovicoenergy',
      youtube: 'https://youtube.com/sovicoenergy'
    },
    contact: {
      phone: '1900 7777 88',
      email: 'info@sovicoenergy.vn',
      address: 'Tòa nhà Sovico Energy, Cầu Giấy, Hà Nội',
      hotline: '028 7300 7777'
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
    selectedAsset: 'SOL',
    totalAmount: 0,
    totalInSOL: 0,
    totalInUSDT: 0,
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
          title: 'Vietjet Air: Thanh toán không tiền mặt với SOL/USDT',
          content: 'Vietjet Air đã tích hợp thành công thanh toán SOL/USDT, mang lại trải nghiệm mới cho khách hàng.',
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
          mediaUrl: 'https://www.youtube.com/embed/Vsq1_kewchQ?autoplay=0&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0&disablekb=0&enablejsapi=1',
          thumbnailUrl: 'https://img.youtube.com/vi/Vsq1_kewchQ/maxresdefault.jpg',
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
            from: 'SOL',
            to: 'VND',
            rate: 10000,
            change: 2.1,
            lastUpdated: '2024-01-15 10:30:00'
          },
          {
            from: 'SOL',
            to: 'USDT',
            rate: 0.4,
            change: -1.2,
            lastUpdated: '2024-01-15 10:30:00'
          },
          {
            from: 'USDT',
            to: 'VND',
            rate: 25000,
            change: 0.5,
            lastUpdated: '2024-01-15 10:30:00'
          }
        ],
        marketInsights: [
          {
            type: 'positive' as const,
            title: 'SOL/USDT Adoption Growing',
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
        SOL: { VND: 5346308, USDT: 0.4 },
        USDT: { VND: 25000, SOL: 2.5 },
        lastUpdated: new Date().toISOString()
      } as SovicoExchangeRates
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  // Mutations
  const paymentMutation = useMutation({
    mutationFn: async (paymentData: SovicoCheckoutState): Promise<SovicoPaymentResult> => {
      if (!wallet) {
        throw new Error('Wallet not connected')
      }

      // Check if wallet is locked (no secret key available)
      if (!wallet.secret) {
        throw new Error('WALLET_LOCKED')
      }

      try {
        const apiUrl = '/api'

        // Use proxy to avoid CORS issues
        const requestBody = {
          secret: wallet.secret,
          destination: paymentData.paymentAddress,
          source: {
            mint: paymentData.selectedAsset === 'SOL' ? 'So11111111111111111111111111111111111111112' : 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            symbol: paymentData.selectedAsset,
            decimals: paymentData.selectedAsset === 'SOL' ? 9 : 6
          },
          amount: paymentData.selectedAsset === 'SOL' 
            ? paymentData.totalInSOL.toString()
            : paymentData.totalInUSDT.toString()
        }
        
        console.log('Payment request body:', requestBody)
        
        const response = await fetch('/api/send/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          let errorMessage = 'Payment failed'
          
          // Handle specific HTTP status codes
          if (response.status === 422) {
            errorMessage = 'Dữ liệu thanh toán không hợp lệ. Vui lòng kiểm tra lại thông tin.'
          } else if (response.status === 400) {
            errorMessage = 'Yêu cầu không hợp lệ. Vui lòng thử lại.'
          } else if (response.status === 500) {
            errorMessage = 'Lỗi server. Vui lòng thử lại sau.'
          } else {
            try {
              const errorData = await response.json()
              errorMessage = errorData.detail || errorData.message || `HTTP ${response.status}: ${response.statusText}`
            } catch (e) {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`
            }
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()
        
        return {
          success: true,
          transactionHash: result.signature || result.hash || `mock_${Date.now()}`,
          signature: result.signature || result.hash || `mock_${Date.now()}`,
          ledger: Math.floor(Math.random() * 1000000) + 50000000,
          amount: paymentData.selectedAsset === 'SOL' 
            ? paymentData.totalInSOL 
            : paymentData.totalInUSDT,
          asset: paymentData.selectedAsset,
          recipient: paymentData.paymentAddress,
          memo: paymentData.memo,
          timestamp: new Date().toISOString(),
          invoiceUrl: '/invoices/' + Date.now() + '.pdf',
          horizonUrl: 'https://explorer.solana.com/tx/' + (result.signature || result.hash || 'unknown') + '?cluster=devnet'
        }
      } catch (error) {
        console.error('Payment API error:', error)
        
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.')
        }
        
        // Extract meaningful error message
        let errorMessage = 'Payment failed. Please try again.'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null) {
          if ('message' in error) {
            errorMessage = String(error.message)
          } else if ('error' in error) {
            errorMessage = String(error.error)
          } else if ('detail' in error) {
            errorMessage = String(error.detail)
          }
        } else if (typeof error === 'string') {
          errorMessage = error
        }
        throw new Error(errorMessage)
      }
    },
    onSuccess: (result, paymentData) => {
      // Calculate loyalty points (1 point per 100,000 VND)
      const totalVND = paymentData.selectedAsset === 'SOL' 
        ? paymentData.totalInSOL * (exchangeRates?.SOL?.VND || 5346308)
        : paymentData.totalInUSDT * (exchangeRates?.USDT?.VND || 25000)
      const earnedPoints = Math.floor(totalVND / 100000) // 1 point per 100k VND
      
      // Update loyalty points in localStorage
      const currentPoints = JSON.parse(localStorage.getItem('loyaltyPoints') || '{"total": 12500, "available": 8500, "used": 4000}')
      const newPoints = {
        ...currentPoints,
        total: currentPoints.total + earnedPoints,
        available: currentPoints.available + earnedPoints
      }
      localStorage.setItem('loyaltyPoints', JSON.stringify(newPoints))

      // Show points earned notification
      if (earnedPoints > 0) {
        setTimeout(() => {
          alert(`🎉 Chúc mừng! Bạn đã nhận được ${earnedPoints} điểm thưởng!`)
        }, 1000)
      }

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
      selectedAsset: 'SOL',
      totalAmount: service?.price || solution?.price || 0,
      totalInSOL: service?.priceInSOL || solution?.priceInSOL || 0,
      totalInUSDT: service?.priceInUSDT || solution?.priceInUSDT || 0,
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
      // Don't close modal immediately - let user see the result
      // setShowPaymentModal(false)
      return result
    } catch (error) {
      setCheckoutState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Payment failed') 
      }))
      throw error
    }
  }, [checkoutState, paymentMutation])

  const suggestSwap = useCallback((fromAsset: string, toAsset: string, amount: number) => {
    // Navigate to swap page with pre-filled data
    window.location.href = `/swap?from=${fromAsset}&to=${toAsset}&amount=${amount}`
  }, [])

  const buyService = useCallback((service: SovicoService) => {
    setSelectedService(service)
    startCheckout(service)
  }, [startCheckout])

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
    buyService,
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
