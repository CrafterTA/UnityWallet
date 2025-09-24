import React from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/session'
import { useSovicoExperience } from '@/hooks/useSovicoExperience'
import SovicoHero from '@/components/sovico/SovicoHero'
import SovicoTabs from '@/components/sovico/SovicoTabs'
import PaymentModal from '@/components/sovico/PaymentModal'
import ServiceExplorer from '@/components/sovico/ServiceExplorer'
import CompanyProfile from '@/components/sovico/CompanyProfile'
import LoyaltySection from '@/components/sovico/LoyaltySection'
import StoriesSection from '@/components/sovico/StoriesSection'
import AnalyticsPanel from '@/components/sovico/AnalyticsPanel'
import SupportSection from '@/components/sovico/SupportSection'
import { 
  Building2, 
  CheckCircle, 
  ArrowRight, 
  ShoppingCart, 
  Award, 
  Target, 
  Lightbulb, 
  BarChart3, 
  Quote, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Star, 
  TrendingUp, 
  Users, 
  Globe, 
  Shield, 
  Calendar,
  Package,
  Gift,
  BookOpen,
  Home,
  Zap,
  CreditCard,
  Plane,
  ExternalLink
} from 'lucide-react'

const Sovico2: React.FC = () => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  
  const { wallet } = useAuthStore()

  // Function to get company icon
  const getCompanyIcon = (company: any) => {
    switch (company.name) {
      case 'HDBank':
        return <CreditCard className="w-16 h-16 text-blue-500" />
      case 'Vietjet Air':
        return <Plane className="w-16 h-16 text-red-500" />
      case 'Dragon Village':
        return <Home className="w-16 h-16 text-green-500" />
      case 'Sovico Energy':
        return <Zap className="w-16 h-16 text-yellow-500" />
      default:
        return <Building2 className="w-16 h-16 text-red-500" />
    }
  }
  
  const {
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
    isPaymentProcessing,

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
    paymentError,
    paymentResult
  } = useSovicoExperience()

  const handleExploreServices = () => {
    setActiveTab('services')
  }

  const handleViewSolutions = () => {
    setActiveTab('solutions')
  }

  const handleFilterClick = () => {
    // TODO: Open filter modal
    console.log('Open filter modal')
  }

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSortBy(sortBy as 'price' | 'rating' | 'name' | 'createdAt' | 'popularity')
    setSortOrder(sortOrder)
  }

  const renderOverview = () => (
    <div className="space-y-16">
      {/* About Sovico */}
      <div className={`rounded-3xl p-8 md:p-12 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('sovico.about.title', 'Về Hệ sinh thái Sovico')}
            </h2>
            <p className={`text-base mb-4 leading-relaxed ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
              {t('sovico.about.description', 'Hệ sinh thái Sovico là marketplace trải nghiệm tích hợp thanh toán SYP, kết nối người dùng với các dịch vụ đa dạng từ tập đoàn kinh tế hàng đầu Việt Nam. Trải nghiệm mua sắm và sử dụng dịch vụ hoàn toàn mới với công nghệ blockchain.')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                  {t('sovico.about.feature1', 'Thanh toán tức thì bằng SYP')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                  {t('sovico.about.feature2', 'Ưu đãi độc quyền cho người dùng SYP')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                  {t('sovico.about.feature3', 'Tích hợp AI và phân tích dữ liệu')}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'banking', name: t('sovico.categories.banking', 'Ngân hàng'), icon: Building2, color: 'blue' },
              { key: 'aviation', name: t('sovico.categories.aviation', 'Hàng không'), icon: Globe, color: 'green' },
              { key: 'realestate', name: t('sovico.categories.realestate', 'Bất động sản'), icon: Home, color: 'purple' },
              { key: 'energy', name: t('sovico.categories.energy', 'Năng lượng'), icon: Zap, color: 'yellow' }
            ].map((category) => (
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
          <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('sovico.mission.title', 'Sứ mệnh')}
          </h3>
          <p className={`${isDark ? 'text-white/80' : 'text-gray-600'} leading-relaxed`}>
            {t('sovico.mission.description', 'Tạo ra một hệ sinh thái thanh toán thống nhất, kết nối người dùng với các dịch vụ chất lượng cao thông qua công nghệ blockchain và trí tuệ nhân tạo.')}
          </p>
        </div>
        <div className={`p-8 rounded-3xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <h3 className={`text-xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('sovico.vision.title', 'Tầm nhìn')}
          </h3>
          <p className={`${isDark ? 'text-white/80' : 'text-gray-600'} leading-relaxed`}>
            {t('sovico.vision.description', 'Trở thành nền tảng marketplace hàng đầu Đông Nam Á, dẫn đầu trong việc tích hợp thanh toán crypto và trải nghiệm người dùng cá nhân hóa.')}
          </p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      {analytics && (
        <div className={`rounded-3xl p-8 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('sovico.analytics.title', 'Thống kê thị trường')}
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {analytics?.sypMarketCap?.value?.toLocaleString() || '0'}
              </div>
              <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('sovico.analytics.marketCap', 'Vốn hóa SYP (VND)')}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {analytics?.sypMarketCap?.value?.toLocaleString() || '0'}
              </div>
              <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('sovico.analytics.sypPrice', 'Giá SYP (VND)')}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {analytics?.transactionMetrics?.totalTransactions?.toLocaleString() || '0'}
              </div>
              <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('sovico.analytics.transactions', 'Giao dịch')}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {analytics?.activeUsers?.value?.toLocaleString() || '0'}
              </div>
              <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('sovico.analytics.activeUsers', 'Người dùng hoạt động')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderSolutions = () => (
    <div className="space-y-12">
      <div className="text-center mb-12">
        <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('sovico.solutions.title', 'Gói giải pháp')}
        </h2>
        <p className={`text-base ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
          {t('sovico.solutions.subtitle', 'Các gói dịch vụ kết hợp với ưu đãi đặc biệt')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {solutions.map((solution) => (
          <div key={solution.id} className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} flex flex-col`}>
            <div className="h-32 bg-gradient-to-br from-red-500/20 to-yellow-500/20 flex items-center justify-center">
              <Package className="w-16 h-16 text-red-500" />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {solution.name}
                </h3>
                {solution.isPopular && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                    {t('sovico.solutions.popular', 'Phổ biến')}
                  </span>
                )}
              </div>
              <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'} leading-relaxed`}>
                {solution.shortDescription}
              </p>
              
              <div className="space-y-2 mb-6">
                {solution.benefits.slice(0, 3).map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {solution.priceInSYP?.toLocaleString()} SYP
                    </span>
                    {solution.originalPrice && (
                      <span className={`text-lg line-through ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        {solution.originalPrice.toLocaleString()} VND
                      </span>
                    )}
                  </div>
                  {solution.discount && (
                    <div className={`text-sm ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      {t('sovico.solutions.discount', 'Tiết kiệm')} {solution.discount}%
                    </div>
                  )}
                </div>
                <button
                  onClick={() => selectSolution(solution)}
                  className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{t('sovico.solutions.explore', 'Khám phá')}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderBusinesses = () => (
    <div className="space-y-12">
      <div className="text-center mb-12">
        <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('sovico.businesses.title', 'Các doanh nghiệp thành viên')}
        </h2>
        <p className={`text-base ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
          {t('sovico.businesses.subtitle', 'Khám phá các công ty con trong hệ sinh thái Sovico')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {companies.map((company) => (
          <div key={company.id} className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} flex flex-col`}>
            {/* Header with icon and badge */}
            <div className="h-32 flex items-center justify-center relative">
              {getCompanyIcon(company)}
              <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700`}>
                  {company.marketShare}
                </span>
              </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              {/* Company name and description */}
              <div className="mb-4">
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {company.name}
                </h3>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'} leading-relaxed`}>
                  {company.shortDescription}
                </p>
              </div>
              
              {/* KPIs Grid - Show all 4 KPIs */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {company.kpis.map((kpi, index) => (
                  <div key={index} className="text-center p-3 rounded-lg bg-white/5">
                    <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {kpi.value}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                      {kpi.name}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      +{kpi.changePercent}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Company info */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-green-400' : 'bg-green-500'}`}></div>
                  <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    {company.employees.toLocaleString()} nhân viên
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                  <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    Thành lập {company.establishedYear}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
                  <span className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    {company.headquarters}
                  </span>
                </div>
              </div>

              {/* Services preview */}
              <div className="mb-4">
                <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Dịch vụ chính
                </h4>
                <div className="flex flex-wrap gap-1">
                  {company.services.slice(0, 3).map((service, index) => (
                    <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-700'}`}>
                      {service}
                    </span>
                  ))}
                  {company.services.length > 3 && (
                    <span className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-700'}`}>
                      +{company.services.length - 3} khác
                    </span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-auto flex gap-3">
                <button
                  onClick={() => selectCompany(company)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300"
                >
                  {t('sovico.businesses.viewProfile', 'Xem hồ sơ')}
                </button>
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 border ${
                    isDark 
                      ? 'border-white/20 text-white hover:bg-white/10' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <ExternalLink className="w-4 h-4" />
                  Website
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderServices = () => (
    <div className="space-y-12">
      <div className="text-center mb-12">
        <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('sovico.services.title', 'Dịch vụ')}
        </h2>
        <p className={`text-base ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
          {t('sovico.services.subtitle', 'Marketplace dịch vụ với thanh toán SYP')}
        </p>
      </div>

      <ServiceExplorer
        services={services}
        isLoading={servicesLoading}
        onServiceSelect={selectService}
        onFilterChange={updateFilters}
        onSortChange={handleSortChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )

  const renderPromotions = () => (
    <LoyaltySection
      promotions={promotions}
      onRedeemPromotion={(promotion) => {
        console.log('Redeem promotion:', promotion)
        // TODO: Implement promotion redemption
      }}
      onViewAllPromotions={() => {
        console.log('View all promotions')
        // TODO: Navigate to all promotions page
      }}
      onViewAllTasks={() => {
        console.log('View all tasks')
        // TODO: Navigate to all tasks page
      }}
      onShareAchievement={(achievement) => {
        console.log('Share achievement:', achievement)
        // TODO: Implement social sharing
      }}
    />
  )

  const renderStories = () => (
    <StoriesSection
      stories={stories}
      onViewStory={(story) => {
        console.log('View story:', story)
        // TODO: Implement story viewing
      }}
      onLikeStory={(storyId) => {
        console.log('Like story:', storyId)
        // TODO: Implement story liking
      }}
      onShareStory={(story) => {
        console.log('Share story:', story)
        // TODO: Implement story sharing
      }}
      onViewAllStories={() => {
        console.log('View all stories')
        // TODO: Navigate to all stories page
      }}
      onFilterStories={(filters) => {
        console.log('Filter stories:', filters)
        // TODO: Implement story filtering
      }}
    />
  )

  const renderAnalytics = () => (
    <AnalyticsPanel
      analytics={analytics || {
        sypMarketCap: { value: 0, change: 0, trend: 'stable' },
        activeUsers: { value: 0, change: 0, trend: 'stable' },
        transactionVolume: { value: 0, change: 0, trend: 'stable' },
        revenue: { value: 0, change: 0, trend: 'stable' },
        exchangeRates: [],
        marketInsights: [],
        userMetrics: { totalUsers: 0, newUsers: 0, retentionRate: 0 },
        transactionMetrics: { totalTransactions: 0, successRate: 0, avgProcessingTime: 0 },
        peakHours: [],
        riskScore: 0,
        anomalies: []
      }}
      onRefresh={() => {
        console.log('Refresh analytics')
        // TODO: Implement analytics refresh
      }}
      onExportData={(format) => {
        console.log('Export data:', format)
        // TODO: Implement data export
      }}
      onViewDetails={(metric) => {
        console.log('View details:', metric)
        // TODO: Implement metric details view
      }}
      onSetTimeRange={(range) => {
        console.log('Set time range:', range)
        // TODO: Implement time range change
      }}
    />
  )

  const renderContact = () => (
    <SupportSection
      onContactSupport={(data) => {
        console.log('Contact support:', data)
        // TODO: Implement contact support
      }}
      onScheduleAppointment={(data) => {
        console.log('Schedule appointment:', data)
        // TODO: Implement appointment scheduling
      }}
      onStartChatbot={() => {
        console.log('Start chatbot')
        // TODO: Implement chatbot
      }}
      onViewFAQ={() => {
        console.log('View FAQ')
        // TODO: Navigate to FAQ page
      }}
      onDownloadGuide={(type) => {
        console.log('Download guide:', type)
        // TODO: Implement guide download
      }}
      onRateSupport={(rating, feedback) => {
        console.log('Rate support:', rating, feedback)
        // TODO: Implement support rating
      }}
    />
  )


  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'solutions':
        return renderSolutions()
      case 'businesses':
        return renderBusinesses()
      case 'services':
        return renderServices()
      case 'promotions':
        return renderPromotions()
      case 'stories':
        return renderStories()
      case 'analytics':
        return renderAnalytics()
      case 'contact':
        return renderContact()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <SovicoHero
        onExploreServices={handleExploreServices}
        onViewSolutions={handleViewSolutions}
        sypBalance={wallet?.balances?.SYP ? parseFloat(wallet.balances.SYP) : 0}
        exchangeRate={exchangeRates?.SYP?.VND || 5000}
      />

      {/* Navigation Tabs */}
      <SovicoTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onFilterClick={handleFilterClick}
        showSearch={['services', 'solutions', 'businesses'].includes(activeTab)}
        showSort={['services', 'solutions'].includes(activeTab)}
        showFilter={['services', 'solutions'].includes(activeTab)}
      />

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {renderTabContent()}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        checkoutState={checkoutState}
        onCheckoutChange={setCheckoutState}
        onProcessPayment={processPayment}
        onSuggestSwap={suggestSwap}
        exchangeRates={exchangeRates}
        balances={wallet?.balances || {}}
        isLoading={isPaymentProcessing}
        error={paymentError?.message}
        paymentResult={paymentResult}
      />

      {/* Company Profile Modal */}
      {selectedCompany && showCompanyProfile && (
        <CompanyProfile
          company={selectedCompany}
          stories={stories}
          onClose={() => {
            setShowCompanyProfile(false)
            setSelectedCompany(null)
          }}
          onViewStory={(story) => {
            console.log('View story:', story)
            // TODO: Implement story viewing
          }}
          onContactCompany={(company) => {
            console.log('Contact company:', company)
            // TODO: Implement company contact
          }}
          onViewServices={(companyId) => {
            console.log('View services for company:', companyId)
            // TODO: Navigate to company services
          }}
        />
      )}
    </div>
  )
}

export default Sovico2
