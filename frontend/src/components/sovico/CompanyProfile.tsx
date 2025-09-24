import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Star,
  Award,
  Calendar,
  ExternalLink,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Share2,
  Heart,
  BookOpen,
  BarChart3,
  Target,
  Zap,
  Shield,
  Clock,
  X
} from 'lucide-react'
import { SovicoCompany, SovicoStory } from '@/types/sovico'

interface CompanyProfileProps {
  company: SovicoCompany
  stories?: SovicoStory[]
  onClose: () => void
  onViewStory?: (story: SovicoStory) => void
  onContactCompany?: (company: SovicoCompany) => void
  onViewServices?: (companyId: string) => void
}

const CompanyProfile: React.FC<CompanyProfileProps> = ({
  company,
  stories = [],
  onClose,
  onViewStory,
  onContactCompany,
  onViewServices
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [liked, setLiked] = useState(false)

  // Auto-rotate stories
  useEffect(() => {
    if (isPlaying && stories.length > 1) {
      const interval = setInterval(() => {
        setCurrentStoryIndex((prev) => (prev + 1) % stories.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [isPlaying, stories.length])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B'
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: currency === 'VND' ? 0 : 2
    }).format(amount)
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const tabs = [
    { id: 'overview', label: t('company.tabs.overview', 'Tổng quan'), icon: Building2 },
    { id: 'kpis', label: t('company.tabs.kpis', 'KPI'), icon: BarChart3 },
    { id: 'stories', label: t('company.tabs.stories', 'Stories'), icon: BookOpen },
    { id: 'contact', label: t('company.tabs.contact', 'Liên hệ'), icon: Phone }
  ]

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Company Header */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-yellow-500 rounded-3xl flex items-center justify-center flex-shrink-0">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {company.name}
              </h2>
              {company.isVerified && (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <p className={`text-lg mb-4 ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
              {company.description}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  {t('company.established', 'Thành lập')} {company.establishedYear}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  {formatNumber(company.employees)} {t('company.employees', 'nhân viên')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-500" />
                <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                  {company.headquarters}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked(!liked)}
              className={`p-3 rounded-xl transition-colors ${
                liked 
                  ? 'bg-red-500 text-white' 
                  : isDark 
                    ? 'bg-white/10 text-white/70 hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => onContactCompany?.(company)}
              className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-red-600 hover:to-yellow-600 transition-all duration-300"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('company.revenue', 'Doanh thu')}
            </h3>
          </div>
          <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(company.revenue, company.currency)}
          </div>
          <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('company.annual', 'Hàng năm')}
          </div>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('company.marketShare', 'Thị phần')}
            </h3>
          </div>
          <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {company.marketShare}
          </div>
          <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('company.inVietnam', 'Tại Việt Nam')}
          </div>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('company.achievements', 'Thành tựu')}
            </h3>
          </div>
          <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {company.achievements.length}
          </div>
          <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('company.awards', 'Giải thưởng')}
          </div>
        </div>
      </div>

      {/* Services & Partnerships */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('company.services', 'Dịch vụ chính')}
          </h3>
          <div className="space-y-3">
            {company.services.map((service, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                  {service}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onViewServices?.(company.id)}
            className="mt-4 w-full bg-gradient-to-r from-red-500 to-yellow-500 text-white px-4 py-2 rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300"
          >
            {t('company.viewServices', 'Xem dịch vụ')}
          </button>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('company.partnerships', 'Đối tác')}
          </h3>
          <div className="space-y-3">
            {company.partnerships.map((partnership, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                  {partnership}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Media */}
      {company.socialMedia && (
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('company.socialMedia', 'Mạng xã hội')}
          </h3>
          <div className="flex items-center gap-4">
            {company.socialMedia.facebook && (
              <a
                href={company.socialMedia.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
            )}
            {company.socialMedia.linkedin && (
              <a
                href={company.socialMedia.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
            {company.socialMedia.twitter && (
              <a
                href={company.socialMedia.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            )}
            {company.socialMedia.youtube && (
              <a
                href={company.socialMedia.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderKPIs = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('company.kpis.title', 'Chỉ số KPI')}
        </h3>
        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {t('company.kpis.subtitle', 'Các chỉ số hiệu suất quan trọng được cập nhật realtime')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {company.kpis.map((kpi, index) => (
          <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {kpi.name}
              </h4>
              <div className="flex items-center gap-2">
                {getTrendIcon(kpi.trend)}
                {kpi.changePercent && (
                  <span className={`text-sm font-medium ${getTrendColor(kpi.trend)}`}>
                    {kpi.changePercent > 0 ? '+' : ''}{kpi.changePercent}%
                  </span>
                )}
              </div>
            </div>
            
            <div className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {kpi.value}
            </div>
            
            <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {kpi.unit}
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className={isDark ? 'text-white/60' : 'text-gray-500'}>
                {t('company.lastUpdated', 'Cập nhật')}: {new Date(kpi.lastUpdated).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderStories = () => {
    // Filter stories by company
    const companyStories = stories.filter(story => 
      story.company && story.company.toLowerCase() === company.name.toLowerCase()
    )

    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('company.stories.title', 'Stories')}
          </h3>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('company.stories.subtitle', 'Câu chuyện thành công và trải nghiệm từ khách hàng')}
          </p>
        </div>

        {stories.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h4 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('company.stories.loading', 'Đang tải stories...')}
            </h4>
          </div>
        ) : companyStories.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h4 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('company.stories.noStories', 'Chưa có stories')}
            </h4>
            <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {t('company.stories.noStoriesDesc', 'Stories sẽ được cập nhật sớm')}
            </p>
          </div>
        ) : (
        <div className="space-y-4">
          {/* Story Carousel */}
          <div className={`relative rounded-2xl overflow-hidden ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
            <div className="aspect-video bg-black relative hover:cursor-pointer">
              {companyStories[currentStoryIndex]?.mediaType === 'video' ? (
                <>
                  <iframe
                    src={companyStories[currentStoryIndex]?.mediaUrl}
                    className="w-full h-full cursor-pointer"
                    frameBorder="0"
                    allowFullScreen
                    title={companyStories[currentStoryIndex]?.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    referrerPolicy="no-referrer-when-downgrade"
                    loading="lazy"
                    style={{ 
                      pointerEvents: 'auto',
                      zIndex: 1,
                      position: 'relative'
                    }}
                  />
                  {/* Fallback button if iframe doesn't work */}
                  <div className="absolute top-4 right-4">
                    <a
                      href={companyStories[currentStoryIndex]?.mediaUrl?.replace('/embed/', '/watch?v=')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Mở trong YouTube
                    </a>
                  </div>
                </>
              ) : companyStories[currentStoryIndex]?.mediaType === 'audio' ? (
                <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-yellow-500/20 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-red-500" />
                    ) : (
                      <Play className="w-8 h-8 text-red-500 ml-1" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-yellow-500/20 flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-red-500" />
                </div>
              )}
            </div>
            
            {/* Overlay chỉ hiển thị khi không phải video */}
            {companyStories[currentStoryIndex]?.mediaType !== 'video' && (
              <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <h4 className="text-xl font-bold mb-2">
                    {companyStories[currentStoryIndex]?.title}
                  </h4>
                  <p className="text-white/80 mb-4">
                    {companyStories[currentStoryIndex]?.excerpt}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {companyStories[currentStoryIndex]?.author?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          {companyStories[currentStoryIndex]?.author}
                        </div>
                        <div className="text-xs text-white/70">
                          {companyStories[currentStoryIndex]?.authorRole}
                        </div>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1))}
                        disabled={currentStoryIndex === 0}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentStoryIndex(Math.min(companyStories.length - 1, currentStoryIndex + 1))}
                        disabled={currentStoryIndex === companyStories.length - 1}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Story List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {companyStories.map((story, index) => (
              <div
                key={story.id}
                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                  index === currentStoryIndex
                    ? isDark
                      ? 'bg-red-500/20 border border-red-500/30'
                      : 'bg-red-50 border border-red-200'
                    : isDark
                      ? 'bg-white/5 border border-white/10'
                      : 'bg-white/80 border border-gray-200'
                } backdrop-blur-sm`}
                onClick={() => {
                  setCurrentStoryIndex(index)
                  onViewStory?.(story)
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    {story.mediaType === 'video' ? (
                      <Play className="w-6 h-6 text-white" />
                    ) : story.mediaType === 'podcast' ? (
                      <Zap className="w-6 h-6 text-white" />
                    ) : (
                      <BookOpen className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {story.title}
                    </h4>
                    <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      {story.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className={isDark ? 'text-white/60' : 'text-gray-500'}>
                          {new Date(story.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        <span className={isDark ? 'text-white/60' : 'text-gray-500'}>
                          {story.likeCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        <span className={isDark ? 'text-white/60' : 'text-gray-500'}>
                          {story.shareCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    )
  }

  const renderContact = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('company.contact.title', 'Liên hệ')}
        </h3>
        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {t('company.contact.subtitle', 'Kết nối với chúng tôi')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h4 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('company.contact.info', 'Thông tin liên hệ')}
          </h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-red-500" />
              <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                {company.contact.phone}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-red-500" />
              <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                {company.contact.email}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-red-500" />
              <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                {company.contact.address}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-red-500" />
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className={`${isDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                {company.website}
              </a>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h4 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('company.contact.form', 'Gửi tin nhắn')}
          </h4>
          <form className="space-y-4">
            <input
              type="text"
              placeholder={t('company.contact.name', 'Họ và tên')}
              className={`w-full px-4 py-3 rounded-xl border ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            />
            <input
              type="email"
              placeholder={t('company.contact.email', 'Email')}
              className={`w-full px-4 py-3 rounded-xl border ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            />
            <textarea
              placeholder={t('company.contact.message', 'Tin nhắn')}
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border ${
                isDark
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
            >
              {t('company.contact.send', 'Gửi tin nhắn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'kpis':
        return renderKPIs()
      case 'stories':
        return renderStories()
      case 'contact':
        return renderContact()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose()
          }}
        />
        
        <div 
          className={`relative w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-800' : 'bg-white'}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onClose()
                }}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {company.name}
                </h2>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {t('company.profile', 'Hồ sơ công ty')}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex border-b flex-shrink-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-red-500 border-b-2 border-red-500'
                    : isDark
                      ? 'text-white/70 hover:text-white hover:bg-white/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyProfile
