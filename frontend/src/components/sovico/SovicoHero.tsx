import React from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/session'
import { 
  Play, 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Users, 
  Shield,
  Zap,
  Gift
} from 'lucide-react'

interface SovicoHeroProps {
  onExploreServices: () => void
  onViewSolutions: () => void
  sypBalance?: number
  exchangeRate?: number
}

const SovicoHero: React.FC<SovicoHeroProps> = ({
  onExploreServices,
  onViewSolutions,
  sypBalance = 0,
  exchangeRate = 5000
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const { wallet } = useAuthStore()

  const stats = [
    {
      icon: Users,
      value: '100M+',
      label: t('sovico.hero.stats.customers', 'Khách hàng'),
      color: 'text-blue-500'
    },
    {
      icon: TrendingUp,
      value: '4',
      label: t('sovico.hero.stats.categories', 'Lĩnh vực'),
      color: 'text-green-500'
    },
    {
      icon: Star,
      value: '4.9',
      label: t('sovico.hero.stats.rating', 'Đánh giá'),
      color: 'text-yellow-500'
    },
    {
      icon: Shield,
      value: '20+',
      label: t('sovico.hero.stats.years', 'Năm kinh nghiệm'),
      color: 'text-purple-500'
    }
  ]

  const features = [
    {
      icon: Zap,
      title: t('sovico.hero.features.instant', 'Thanh toán tức thì'),
      description: t('sovico.hero.features.instantDesc', 'Thanh toán bằng SYP trong vài giây')
    },
    {
      icon: Gift,
      title: t('sovico.hero.features.rewards', 'Ưu đãi độc quyền'),
      description: t('sovico.hero.features.rewardsDesc', 'Nhận ưu đãi đặc biệt khi sử dụng SYP')
    },
    {
      icon: Shield,
      title: t('sovico.hero.features.secure', 'Bảo mật cao'),
      description: t('sovico.hero.features.secureDesc', 'Công nghệ blockchain an toàn')
    }
  ]

  return (
    <div className="relative overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Logo & Badge */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className={`text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent`}>
            {t('sovico.hero.title', 'Hệ sinh thái Sovico')}
          </h1>
          
          <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed ${isDark ? 'text-white/90' : 'text-gray-700'}`}>
            {t('sovico.hero.subtitle', 'Marketplace trải nghiệm tích hợp thanh toán SYP - Khám phá và sử dụng các dịch vụ đa dạng từ tập đoàn kinh tế hàng đầu Việt Nam')}
          </p>

          {/* SYP Balance Display */}
          {wallet && (
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-8 ${isDark ? 'bg-white/10 border border-white/20' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <div className="text-left">
                <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {t('sovico.hero.balance.syp', 'SYP Balance')}
                </div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {sypBalance.toLocaleString()} SYP
                </div>
                <div className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  ≈ {(sypBalance * exchangeRate).toLocaleString()} VND
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
                <div className={`w-10 h-10 mx-auto mb-3 rounded-lg flex items-center justify-center ${stat.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </div>
                <div className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <div key={index} className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'} backdrop-blur-sm`}>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-yellow-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onExploreServices}
              className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {t('sovico.hero.cta.explore', 'Khám phá bằng SYP')}
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={onViewSolutions}
              className={`px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 border-2 ${
                isDark 
                  ? 'border-white/20 text-white hover:bg-white/10' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } flex items-center justify-center gap-2`}
            >
              <Play className="w-5 h-5" />
              {t('sovico.hero.cta.solutions', 'Xem gói giải pháp')}
            </button>
          </div>

          {/* Video Preview */}
          <div className="mt-16">
            <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className="aspect-video bg-black">
                <iframe
                  src="https://www.youtube.com/embed/5uz-6CBcAZo?autoplay=0&rel=0&modestbranding=1&controls=1&showinfo=0&iv_load_policy=3&fs=1&cc_load_policy=0&disablekb=0&enablejsapi=1"
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  title="Khám phá Hệ sinh thái Sovico"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox"
                  referrerPolicy="no-referrer-when-downgrade"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-xl font-bold mb-2">
                  {t('sovico.hero.video.title', 'Khám phá Hệ sinh thái Sovico')}
                </h3>
                <p className="text-white/80">
                  {t('sovico.hero.video.description', 'Xem cách Hệ sinh thái Sovico thay đổi cách bạn sử dụng dịch vụ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SovicoHero
