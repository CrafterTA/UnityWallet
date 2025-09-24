import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Building2, 
  Plane, 
  Home, 
  Zap, 
  CreditCard, 
  ArrowRight, 
  Star,
  Users,
  TrendingUp,
  Globe,
  Shield,
  CheckCircle,
  ShoppingCart,
  Wallet,
  Award,
  Target,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  ChevronRight,
  Play,
  BookOpen,
  Briefcase,
  Lightbulb,
  Heart,
  Leaf,
  DollarSign,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Info,
  Quote
} from 'lucide-react'
import { useAuthStore } from '@/store/session'
import { useThemeStore } from '@/store/theme'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface SovicoService {
  id: string
  name: string
  description: string
  icon: any
  price: number
  currency: string
  category: 'banking' | 'aviation' | 'realestate' | 'energy'
  features: string[]
  image: string
  website: string
  stats: {
    customers: string
    years: string
    revenue: string
  }
}

interface SovicoBusiness {
  id: string
  name: string
  description: string
  icon: any
  color: string
  website: string
  stats: {
    customers: string
    revenue: string
    marketShare: string
  }
  achievements: string[]
  services: string[]
}

interface Testimonial {
  id: string
  name: string
  position: string
  company: string
  content: string
  avatar: string
  rating: number
}

const SovicoPage: React.FC = () => {
  const { t } = useTranslation()
  const { wallet, isAuthenticated } = useAuthStore()
  const { isDark } = useThemeStore()
  const navigate = useNavigate()
  const [selectedService, setSelectedService] = useState<SovicoService | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('XLM')
  const [activeTab, setActiveTab] = useState('overview')

  // Sovico businesses data
  const sovicoBusinesses: SovicoBusiness[] = [
    {
      id: 'hdbank',
      name: 'HDBank',
      description: 'Ngân hàng TMCP Phát triển TP.HCM - Một trong những ngân hàng thương mại cổ phần hàng đầu Việt Nam',
      icon: CreditCard,
      color: 'blue',
      website: 'https://www.hdbank.com.vn',
      stats: {
        customers: '2.5M+',
        revenue: '15,000 tỷ VND',
        marketShare: 'Top 10 VN'
      },
      achievements: [
        'Ngân hàng có tốc độ tăng trưởng nhanh nhất Việt Nam',
        'Giải thưởng Ngân hàng số tốt nhất 2023',
        'Xếp hạng A+ từ Moody\'s'
      ],
      services: [
        'Tài khoản cá nhân & doanh nghiệp',
        'Cho vay & tín dụng',
        'Đầu tư & bảo hiểm',
        'Dịch vụ ngân hàng số'
      ]
    },
    {
      id: 'vietjet',
      name: 'Vietjet Air',
      description: 'Hãng hàng không tư nhân lớn nhất Việt Nam với mô hình chi phí thấp',
      icon: Plane,
      color: 'red',
      website: 'https://www.vietjetair.com',
      stats: {
        customers: '100M+',
        revenue: '50,000 tỷ VND',
        marketShare: '40% VN'
      },
      achievements: [
        'Hãng bay có tốc độ tăng trưởng nhanh nhất thế giới',
        'Giải thưởng Hãng bay chi phí thấp tốt nhất châu Á',
        'Chứng nhận IATA Operational Safety Audit'
      ],
      services: [
        'Vé máy bay nội địa & quốc tế',
        'Dịch vụ hành lý & ăn uống',
        'Chương trình khách hàng thân thiết',
        'Dịch vụ thuê máy bay'
      ]
    },
    {
      id: 'dragon-village',
      name: 'Dragon Village',
      description: 'Khu đô thị cao cấp với các dự án bất động sản quy mô lớn',
      icon: Home,
      color: 'green',
      website: 'https://dragonvillage.vn',
      stats: {
        customers: '50,000+',
        revenue: '100,000 tỷ VND',
        marketShare: 'Top 5 VN'
      },
      achievements: [
        'Dự án đô thị thông minh đầu tiên tại Việt Nam',
        'Giải thưởng Bất động sản tốt nhất 2023',
        'Chứng nhận LEED Platinum'
      ],
      services: [
        'Biệt thự & căn hộ cao cấp',
        'Trung tâm thương mại',
        'Khu vui chơi giải trí',
        'Dịch vụ quản lý tài sản'
      ]
    },
    {
      id: 'renewable-energy',
      name: 'Sovico Energy',
      description: 'Công ty năng lượng tái tạo hàng đầu với các dự án xanh',
      icon: Zap,
      color: 'yellow',
      website: 'https://sovicoenergy.vn',
      stats: {
        customers: '1M+',
        revenue: '5,000 tỷ VND',
        marketShare: '15% VN'
      },
      achievements: [
        'Nhà sản xuất năng lượng mặt trời lớn nhất Việt Nam',
        'Giải thưởng Doanh nghiệp xanh 2023',
        'Chứng nhận ISO 14001'
      ],
      services: [
        'Điện mặt trời & gió',
        'Hệ thống lưu trữ năng lượng',
        'Tư vấn năng lượng xanh',
        'Dịch vụ bảo trì & vận hành'
      ]
    }
  ]

  // Sovico ecosystem services
  const sovicoServices: SovicoService[] = [
    {
      id: 'hdbank-premium',
      name: 'HDBank Premium Account',
      description: 'Tài khoản ngân hàng cao cấp với nhiều ưu đãi đặc biệt',
      icon: CreditCard,
      price: 1000000,
      currency: 'VND',
      category: 'banking',
      features: [
        'Miễn phí chuyển khoản không giới hạn',
        'Lãi suất tiết kiệm cao',
        'Bảo hiểm tài khoản miễn phí',
        'Hỗ trợ 24/7'
      ],
      image: '/images/hdbank-logo.png',
      website: 'https://www.hdbank.com.vn',
      stats: {
        customers: '2.5M+',
        years: '20+',
        revenue: '15,000 tỷ VND'
      }
    },
    {
      id: 'vietjet-business',
      name: 'Vietjet Business Class',
      description: 'Vé máy bay hạng thương gia với dịch vụ cao cấp',
      icon: Plane,
      price: 5000000,
      currency: 'VND',
      category: 'aviation',
      features: [
        'Ghế ngồi rộng rãi, thoải mái',
        'Bữa ăn cao cấp',
        'Hành lý ký gửi miễn phí',
        'Ưu tiên check-in và lên máy bay'
      ],
      image: '/images/vietjet-logo.png',
      website: 'https://www.vietjetair.com',
      stats: {
        customers: '100M+',
        years: '15+',
        revenue: '50,000 tỷ VND'
      }
    },
    {
      id: 'dragon-village-villa',
      name: 'Dragon Village Villa',
      description: 'Biệt thự cao cấp tại khu đô thị Dragon Village',
      icon: Home,
      price: 50000000000,
      currency: 'VND',
      category: 'realestate',
      features: [
        'Thiết kế sang trọng, hiện đại',
        'Vị trí đắc địa, gần trung tâm',
        'Tiện ích đầy đủ',
        'Bảo hành 10 năm'
      ],
      image: '/images/dragon-village.jpg',
      website: 'https://dragonvillage.vn',
      stats: {
        customers: '50,000+',
        years: '10+',
        revenue: '100,000 tỷ VND'
      }
    },
    {
      id: 'renewable-energy',
      name: 'Năng lượng tái tạo',
      description: 'Đầu tư vào các dự án năng lượng xanh',
      icon: Zap,
      price: 100000000,
      currency: 'VND',
      category: 'energy',
      features: [
        'Góp phần bảo vệ môi trường',
        'Lợi nhuận ổn định',
        'Hỗ trợ phát triển bền vững',
        'Được chính phủ khuyến khích'
      ],
      image: '/images/renewable-energy.jpg',
      website: 'https://sovicoenergy.vn',
      stats: {
        customers: '1M+',
        years: '8+',
        revenue: '5,000 tỷ VND'
      }
    }
  ]

  const categories = [
    { key: 'banking', name: 'Tài chính - Ngân hàng', icon: CreditCard, color: 'blue' },
    { key: 'aviation', name: 'Hàng không', icon: Plane, color: 'red' },
    { key: 'realestate', name: 'Bất động sản', icon: Home, color: 'green' },
    { key: 'energy', name: 'Năng lượng', icon: Zap, color: 'yellow' }
  ]

  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Testimonials
  const testimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      position: 'CEO',
      company: 'Tech Startup',
      content: 'Sovico đã giúp chúng tôi phát triển từ một startup nhỏ thành công ty có quy mô lớn. Dịch vụ ngân hàng và hỗ trợ tài chính của HDBank rất chuyên nghiệp.',
      avatar: '/images/avatar1.jpg',
      rating: 5
    },
    {
      id: '2',
      name: 'Trần Thị B',
      position: 'Giám đốc Marketing',
      company: 'E-commerce',
      content: 'Vietjet Air đã trở thành đối tác tin cậy của chúng tôi. Chất lượng dịch vụ và giá cả cạnh tranh giúp chúng tôi tiết kiệm chi phí vận chuyển đáng kể.',
      avatar: '/images/avatar2.jpg',
      rating: 5
    },
    {
      id: '3',
      name: 'Lê Văn C',
      position: 'Chủ đầu tư',
      company: 'Real Estate',
      content: 'Dragon Village là một dự án bất động sản tuyệt vời. Vị trí đắc địa, thiết kế hiện đại và tiện ích đầy đủ đã thu hút nhiều khách hàng.',
      avatar: '/images/avatar3.jpg',
      rating: 5
    }
  ]

  const filteredServices = selectedCategory === 'all' 
    ? sovicoServices 
    : sovicoServices.filter(service => service.category === selectedCategory)

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }
    return price.toLocaleString()
  }

  const handleServiceSelect = (service: SovicoService) => {
    setSelectedService(service)
    setShowPaymentModal(true)
    setPaymentAmount(service.price.toString())
  }

  const handlePayment = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thanh toán')
      navigate('/login')
      return
    }

    if (!selectedService) return

    try {
      // Simulate payment processing
      toast.loading('Đang xử lý thanh toán...')
      
      // Here you would integrate with actual payment system
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success(`Thanh toán thành công cho ${selectedService.name}!`)
      setShowPaymentModal(false)
      setSelectedService(null)
    } catch (error) {
      toast.error('Thanh toán thất bại. Vui lòng thử lại.')
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      banking: 'blue',
      aviation: 'red', 
      realestate: 'green',
      energy: 'yellow'
    }
    return colors[category as keyof typeof colors] || 'gray'
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Building2 className="w-12 h-12 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent`}>
              {t('sovico.title', 'Hệ sinh thái Sovico')}
            </h1>
            <p className={`text-lg mb-8 max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
              {t('sovico.subtitle', 'Khám phá và sử dụng các dịch vụ đa dạng từ tập đoàn kinh tế hàng đầu Việt Nam')}
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
                <div className="text-2xl font-bold text-red-500 mb-1">4</div>
                <div className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Lĩnh vực chính</div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
                <div className="text-2xl font-bold text-yellow-500 mb-1">100M+</div>
                <div className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Khách hàng</div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
                <div className="text-2xl font-bold text-green-500 mb-1">20+</div>
                <div className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Năm kinh nghiệm</div>
              </div>
              <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
                <div className="text-2xl font-bold text-blue-500 mb-1">170K+</div>
                <div className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>Tỷ VND doanh thu</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setActiveTab('services')}
                className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white px-6 py-3 rounded-xl font-medium text-base transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Khám phá dịch vụ
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </button>
              <button
                onClick={() => setActiveTab('businesses')}
                className={`px-6 py-3 rounded-xl font-medium text-base transition-all duration-300 border-2 ${
                  isDark 
                    ? 'border-white/20 text-white hover:bg-white/10' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tìm hiểu doanh nghiệp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
              { id: 'businesses', label: 'Doanh nghiệp', icon: Building2 },
              { id: 'services', label: 'Dịch vụ', icon: ShoppingCart },
              { id: 'testimonials', label: 'Đánh giá', icon: Quote },
              { id: 'contact', label: 'Liên hệ', icon: Phone }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-500'
                    : isDark
                      ? 'border-transparent text-white/60 hover:text-white hover:border-white/30'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {activeTab === 'overview' && (
          <div className="space-y-16">
            {/* About Sovico */}
            <div className={`rounded-3xl p-8 md:p-12 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('sovico.about.title', 'Về Sovico Group')}
                  </h2>
                  <p className={`text-base mb-4 leading-relaxed ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                    {t('sovico.about.description', 'Sovico Group là tập đoàn kinh tế đa ngành hàng đầu tại Việt Nam, hoạt động trong các lĩnh vực then chốt như tài chính - ngân hàng, hàng không, bất động sản và năng lượng.')}
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                        Hơn 20 năm kinh nghiệm
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                        Hàng triệu khách hàng tin tưởng
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                        Cam kết phát triển bền vững
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {categories.map((category) => (
                    <div key={category.key} className={`p-6 rounded-2xl text-center transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}>
                      <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center bg-${category.color}-100`}>
                        <category.icon className={`w-6 h-6 text-${category.color}-600`} />
                      </div>
                      <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {category.name}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
                <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mb-6">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sứ mệnh</h3>
                <p className={`${isDark ? 'text-white/80' : 'text-gray-600'} leading-relaxed`}>
                  Tạo ra giá trị bền vững cho khách hàng, đối tác và cộng đồng thông qua các sản phẩm và dịch vụ chất lượng cao, đóng góp vào sự phát triển kinh tế - xã hội của Việt Nam.
                </p>
              </div>
              <div className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tầm nhìn</h3>
                <p className={`${isDark ? 'text-white/80' : 'text-gray-600'} leading-relaxed`}>
                  Trở thành tập đoàn kinh tế đa ngành hàng đầu Đông Nam Á, dẫn đầu trong đổi mới sáng tạo và phát triển bền vững.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'businesses' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Các doanh nghiệp thành viên
              </h2>
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                Khám phá các công ty con trong hệ sinh thái Sovico
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {sovicoBusinesses.map((business) => (
                <div key={business.id} className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} flex flex-col`}>
                  <div className="h-32 flex items-center justify-center">
                    <business.icon className="w-16 h-16 text-red-500" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {business.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${business.color}-100 text-${business.color}-700`}>
                        {business.stats.marketShare}
                      </span>
                    </div>
                    <p className={`text-sm mb-6 ${isDark ? 'text-white/70' : 'text-gray-600'} leading-relaxed`}>
                      {business.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {business.stats.customers}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Khách hàng</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {business.stats.revenue}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Doanh thu</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ★★★★★
                        </div>
                        <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Đánh giá</div>
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="mb-6">
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Thành tựu nổi bật</h4>
                      <div className="space-y-2">
                        {business.achievements.slice(0, 2).map((achievement, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Award className="w-4 h-4 text-yellow-500" />
                            <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                              {achievement}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Services */}
                    <div className="mb-6">
                      <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dịch vụ chính</h4>
                      <div className="flex flex-wrap gap-2">
                        {business.services.slice(0, 3).map((service, index) => (
                          <span key={index} className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-700'}`}>
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto">
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 text-center"
                      >
                        Truy cập website
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Dịch vụ của chúng tôi
              </h2>
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                Thanh toán dễ dàng bằng các đồng tiền số trong ví của bạn
              </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-full font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white'
                    : isDark
                      ? 'bg-white/10 text-white/80 hover:bg-white/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả
              </button>
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`px-6 py-3 rounded-full font-medium transition-colors flex items-center space-x-2 ${
                    selectedCategory === category.key
                      ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white'
                      : isDark
                        ? 'bg-white/10 text-white/80 hover:bg-white/20'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} flex flex-col`}
                >
                  <div className="h-32 bg-gradient-to-br from-red-500/20 to-yellow-500/20 flex items-center justify-center">
                    <service.icon className="w-16 h-16 text-red-500" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {service.name}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${getCategoryColor(service.category)}-100 text-${getCategoryColor(service.category)}-700`}>
                        {categories.find(c => c.key === service.category)?.name}
                      </span>
                    </div>
                    <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'} leading-relaxed`}>
                      {service.description}
                    </p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {service.stats.customers}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Khách hàng</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {service.stats.years}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Năm kinh nghiệm</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          ★★★★★
                        </div>
                        <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>Đánh giá</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <div className="mb-4">
                        <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatPrice(service.price, service.currency)}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                          Thanh toán bằng XLM, USDC, SYP
                        </p>
                      </div>
                      <button
                        onClick={() => handleServiceSelect(service)}
                        className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>Mua ngay</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Đánh giá từ khách hàng
              </h2>
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                Những chia sẻ chân thực từ khách hàng đã sử dụng dịch vụ
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {testimonial.name}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {testimonial.position} tại {testimonial.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className={`${isDark ? 'text-white/80' : 'text-gray-600'} leading-relaxed`}>
                    "{testimonial.content}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-12">
            <div className="text-center mb-12">
              <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Liên hệ với chúng tôi
              </h2>
              <p className={`text-base ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                Kết nối với Sovico Group và các doanh nghiệp thành viên
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
                <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Thông tin liên hệ
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-yellow-500 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Địa chỉ</h4>
                      <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        123 Nguyễn Huệ, Quận 1, TP.HCM
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Điện thoại</h4>
                      <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        +84 28 1234 5678
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Email</h4>
                      <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        info@sovicogroup.com
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Mạng xã hội</h4>
                  <div className="flex space-x-4">
                    <a href="#" className={`p-3 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                      <Facebook className="w-5 h-5" />
                    </a>
                    <a href="#" className={`p-3 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a href="#" className={`p-3 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a href="#" className={`p-3 rounded-xl ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
                <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Gửi tin nhắn
                </h3>
                <form className="space-y-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-white/5 border-white/20 text-white placeholder-white/50' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Nhập họ và tên"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      Email
                    </label>
                    <input
                      type="email"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-white/5 border-white/20 text-white placeholder-white/50' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Nhập email"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      Tin nhắn
                    </label>
                    <textarea
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-white/5 border-white/20 text-white placeholder-white/50' 
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                      }`}
                      placeholder="Nhập tin nhắn"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Gửi tin nhắn
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-8 max-w-md w-full ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white border border-slate-200'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Thanh toán
              </h3>
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {selectedService.name}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                  Số tiền
                </label>
                <input
                  type="text"
                  value={formatPrice(parseInt(paymentAmount), selectedService.currency)}
                  disabled
                  className={`w-full px-4 py-3 border rounded-lg ${
                    isDark 
                      ? 'bg-white/5 border-white/20 text-white' 
                      : 'bg-gray-50 border-slate-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                  Thanh toán bằng
                </label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    isDark 
                      ? 'bg-white/5 border-white/20 text-white' 
                      : 'bg-white border-slate-200 text-gray-900'
                  }`}
                >
                  <option value="XLM">XLM (Stellar Lumens)</option>
                  <option value="USDC">USDC (USD Coin)</option>
                  <option value="SYP">SYP (Sky Point)</option>
                </select>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                  Tỷ giá quy đổi sẽ được cập nhật theo thời gian thực
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-colors ${
                  isDark 
                    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Hủy
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SovicoPage
