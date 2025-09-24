import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { 
  Gift, 
  Star, 
  Trophy, 
  Crown, 
  Zap, 
  Flame, 
  Target, 
  CheckCircle, 
  Clock, 
  Calendar,
  Award,
  Coins,
  TrendingUp,
  Users,
  Sparkles,
  Heart,
  Share2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { SovicoPromotion, SovicoLoyaltyPoints } from '@/types/sovico'

interface LoyaltySectionProps {
  promotions: SovicoPromotion[]
  loyaltyPoints?: SovicoLoyaltyPoints
  onRedeemPromotion?: (promotion: SovicoPromotion) => void
  onViewAllPromotions?: () => void
  onViewAllTasks?: () => void
  onShareAchievement?: (achievement: string) => void
}

const LoyaltySection: React.FC<LoyaltySectionProps> = ({
  promotions,
  loyaltyPoints,
  onRedeemPromotion,
  onViewAllPromotions,
  onViewAllTasks,
  onShareAchievement
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  
  const [activeTab, setActiveTab] = useState('promotions')
  const [expandedPromotion, setExpandedPromotion] = useState<string | null>(null)
  const [showAllTasks, setShowAllTasks] = useState(false)

  // Mock loyalty points if not provided
  const mockLoyaltyPoints: SovicoLoyaltyPoints = loyaltyPoints || {
    total: 12500,
    available: 8500,
    used: 4000,
    expired: 0,
    level: 'gold',
    nextLevelPoints: 15000,
    benefits: [
      'Ưu đãi 5% cho tất cả giao dịch',
      'Miễn phí giao dịch SYP',
      'Hỗ trợ ưu tiên 24/7',
      'Quà tặng sinh nhật đặc biệt'
    ]
  }

  // Mock tasks
  const tasks = [
    {
      id: '1',
      title: t('loyalty.tasks.firstPurchase', 'Giao dịch đầu tiên'),
      description: t('loyalty.tasks.firstPurchaseDesc', 'Thực hiện giao dịch đầu tiên với SYP'),
      points: 1000,
      isCompleted: true,
      progress: 100,
      type: 'purchase'
    },
    {
      id: '2',
      title: t('loyalty.tasks.referFriend', 'Giới thiệu bạn bè'),
      description: t('loyalty.tasks.referFriendDesc', 'Mời 3 người bạn sử dụng Sovico'),
      points: 2000,
      isCompleted: false,
      progress: 66,
      type: 'referral'
    },
    {
      id: '3',
      title: t('loyalty.tasks.weeklySpend', 'Chi tiêu hàng tuần'),
      description: t('loyalty.tasks.weeklySpendDesc', 'Chi tiêu 1,000,000 VND trong tuần'),
      points: 500,
      isCompleted: false,
      progress: 75,
      type: 'spending'
    },
    {
      id: '4',
      title: t('loyalty.tasks.socialShare', 'Chia sẻ mạng xã hội'),
      description: t('loyalty.tasks.socialShareDesc', 'Chia sẻ Sovico trên Facebook'),
      points: 200,
      isCompleted: false,
      progress: 0,
      type: 'social'
    }
  ]

  const getLevelInfo = (level: string) => {
    switch (level) {
      case 'bronze':
        return {
          name: t('loyalty.levels.bronze', 'Đồng'),
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
          icon: Trophy,
          minPoints: 0
        }
      case 'silver':
        return {
          name: t('loyalty.levels.silver', 'Bạc'),
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          icon: Award,
          minPoints: 5000
        }
      case 'gold':
        return {
          name: t('loyalty.levels.gold', 'Vàng'),
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100',
          icon: Crown,
          minPoints: 10000
        }
      case 'platinum':
        return {
          name: t('loyalty.levels.platinum', 'Bạch kim'),
          color: 'text-blue-500',
          bgColor: 'bg-blue-100',
          icon: Star,
          minPoints: 25000
        }
      case 'diamond':
        return {
          name: t('loyalty.levels.diamond', 'Kim cương'),
          color: 'text-purple-500',
          bgColor: 'bg-purple-100',
          icon: Sparkles,
          minPoints: 50000
        }
      default:
        return {
          name: t('loyalty.levels.bronze', 'Đồng'),
          color: 'text-orange-500',
          bgColor: 'bg-orange-100',
          icon: Trophy,
          minPoints: 0
        }
    }
  }

  const getPromotionTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Gift className="w-5 h-5" />
      case 'cashback':
        return <Coins className="w-5 h-5" />
      case 'points':
        return <Star className="w-5 h-5" />
      case 'gift':
        return <Heart className="w-5 h-5" />
      default:
        return <Gift className="w-5 h-5" />
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <Zap className="w-5 h-5" />
      case 'referral':
        return <Users className="w-5 h-5" />
      case 'spending':
        return <TrendingUp className="w-5 h-5" />
      case 'social':
        return <Share2 className="w-5 h-5" />
      default:
        return <Target className="w-5 h-5" />
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: currency === 'VND' ? 0 : 2
    }).format(amount)
  }

  const levelInfo = getLevelInfo(mockLoyaltyPoints.level)
  const progressToNextLevel = ((mockLoyaltyPoints.total - levelInfo.minPoints) / (mockLoyaltyPoints.nextLevelPoints - levelInfo.minPoints)) * 100

  const tabs = [
    { id: 'promotions', label: t('loyalty.tabs.promotions', 'Ưu đãi'), icon: Gift },
    { id: 'tasks', label: t('loyalty.tabs.tasks', 'Nhiệm vụ'), icon: Target },
    { id: 'levels', label: t('loyalty.tabs.levels', 'Cấp độ'), icon: Crown }
  ]

  const renderPromotions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('loyalty.promotions.title', 'Ưu đãi hiện tại')}
        </h3>
        <button
          onClick={onViewAllPromotions}
          className={`text-sm font-medium ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} transition-colors`}
        >
          {t('loyalty.promotions.viewAll', 'Xem tất cả')}
        </button>
      </div>

      {promotions.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h4 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('loyalty.promotions.noPromotions', 'Chưa có ưu đãi')}
          </h4>
          <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('loyalty.promotions.noPromotionsDesc', 'Ưu đãi sẽ được cập nhật sớm')}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {promotions.map((promotion) => (
            <div
              key={promotion.id}
              className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 ${
                isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'
              }`}
            >
              <div className={`p-6 ${promotion.bannerColor ? `bg-${promotion.bannerColor}-500/10` : 'bg-gradient-to-r from-red-500/10 to-yellow-500/10'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      promotion.type === 'discount' ? 'bg-red-100 text-red-600' :
                      promotion.type === 'cashback' ? 'bg-green-100 text-green-600' :
                      promotion.type === 'points' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-pink-100 text-pink-600'
                    }`}>
                      {getPromotionTypeIcon(promotion.type)}
                    </div>
                    <div>
                      <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {promotion.title}
                      </h4>
                      <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {promotion.type === 'discount' ? `${promotion.value}% ${t('loyalty.promotions.off', 'giảm giá')}` :
                         promotion.type === 'cashback' ? `${promotion.value}% ${t('loyalty.promotions.cashback', 'hoàn tiền')}` :
                         promotion.type === 'points' ? `${promotion.value} ${t('loyalty.promotions.pointsLabel', 'points')}` :
                         t('loyalty.promotions.gift', 'Quà tặng')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedPromotion(expandedPromotion === promotion.id ? null : promotion.id)}
                    className={`p-2 rounded-xl transition-colors ${
                      isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                  >
                    {expandedPromotion === promotion.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <p className={`text-sm mb-4 ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                  {promotion.description}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-500'}`}>
                    {t('loyalty.promotions.validUntil', 'Có hiệu lực đến')}: {new Date(promotion.endDate).toLocaleDateString()}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-500'}`}>
                    {promotion.usedCount}/{promotion.usageLimit || '∞'} {t('loyalty.promotions.used', 'đã sử dụng')}
                  </div>
                </div>

                {expandedPromotion === promotion.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <h5 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('loyalty.promotions.terms', 'Điều kiện')}:
                    </h5>
                    <ul className="space-y-1">
                      {promotion.terms.map((term, index) => (
                        <li key={index} className={`text-sm flex items-start gap-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          <span className="w-1 h-1 bg-current rounded-full mt-2 flex-shrink-0" />
                          {term}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => onRedeemPromotion?.(promotion)}
                  className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  {t('loyalty.promotions.redeem', 'Sử dụng ngay')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('loyalty.tasks.title', 'Nhiệm vụ hàng ngày')}
        </h3>
        <button
          onClick={onViewAllTasks}
          className={`text-sm font-medium ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} transition-colors`}
        >
          {t('loyalty.tasks.viewAll', 'Xem tất cả')}
        </button>
      </div>

      <div className="space-y-4">
        {tasks.slice(0, showAllTasks ? tasks.length : 3).map((task) => (
          <div
            key={task.id}
            className={`p-6 rounded-2xl transition-all duration-300 ${
              task.isCompleted
                ? isDark
                  ? 'bg-green-500/10 border border-green-500/20'
                  : 'bg-green-50 border border-green-200'
                : isDark
                  ? 'bg-white/5 border border-white/10'
                  : 'bg-white/80 border border-gray-200'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                task.isCompleted
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {task.isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  getTaskTypeIcon(task.type)
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  <div className={`text-sm font-medium ${
                    task.isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    +{task.points} {t('loyalty.points', 'điểm')}
                  </div>
                </div>
                
                <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {task.description}
                </p>

                {!task.isCompleted && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                        {t('loyalty.tasks.progress', 'Tiến độ')}
                      </span>
                      <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                        {task.progress}%
                      </span>
                    </div>
                    <div className={`w-full h-2 rounded-full ${
                      isDark ? 'bg-white/10' : 'bg-gray-200'
                    }`}>
                      <div
                        className="h-2 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {task.isCompleted && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {t('loyalty.tasks.completed', 'Đã hoàn thành')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length > 3 && (
        <button
          onClick={() => setShowAllTasks(!showAllTasks)}
          className={`w-full py-3 rounded-xl font-medium transition-colors ${
            isDark
              ? 'bg-white/5 text-white/70 hover:bg-white/10'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {showAllTasks ? (
            <>
              <ChevronUp className="w-4 h-4 inline mr-2" />
              {t('loyalty.tasks.showLess', 'Ẩn bớt')}
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 inline mr-2" />
              {t('loyalty.tasks.showMore', 'Xem thêm')} ({tasks.length - 3})
            </>
          )}
        </button>
      )}
    </div>
  )

  const renderLevels = () => (
    <div className="space-y-6">
      <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('loyalty.levels.title', 'Cấp độ thành viên')}
      </h3>

      {/* Current Level */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${levelInfo.bgColor}`}>
            <levelInfo.icon className={`w-8 h-8 ${levelInfo.color}`} />
          </div>
          <div>
            <h4 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {levelInfo.name}
            </h4>
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {mockLoyaltyPoints.total.toLocaleString()} {t('loyalty.points', 'điểm')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
              {t('loyalty.levels.progressToNext', 'Tiến độ đến cấp tiếp theo')}
            </span>
            <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
              {Math.round(progressToNextLevel)}%
            </span>
          </div>
          <div className={`w-full h-3 rounded-full ${
            isDark ? 'bg-white/10' : 'bg-gray-200'
          }`}>
            <div
              className="h-3 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressToNextLevel, 100)}%` }}
            />
          </div>
          <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('loyalty.levels.nextLevel', 'Cần thêm')} {mockLoyaltyPoints.nextLevelPoints - mockLoyaltyPoints.total} {t('loyalty.points', 'điểm')} {t('loyalty.levels.toReach', 'để đạt cấp tiếp theo')}
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
        <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('loyalty.levels.benefits', 'Quyền lợi cấp độ')}
        </h4>
        <div className="space-y-3">
          {mockLoyaltyPoints.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className={isDark ? 'text-white/80' : 'text-gray-600'}>
                {benefit}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Points Summary */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mockLoyaltyPoints.available.toLocaleString()}
          </div>
          <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('loyalty.points.available', 'Điểm khả dụng')}
          </div>
        </div>
        <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mockLoyaltyPoints.used.toLocaleString()}
          </div>
          <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('loyalty.points.used', 'Điểm đã dùng')}
          </div>
        </div>
        <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
          <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {mockLoyaltyPoints.total.toLocaleString()}
          </div>
          <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('loyalty.points.total', 'Tổng điểm')}
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'promotions':
        return renderPromotions()
      case 'tasks':
        return renderTasks()
      case 'levels':
        return renderLevels()
      default:
        return renderPromotions()
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className={`text-3xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('loyalty.title', 'Chương trình khách hàng thân thiết')}
        </h2>
        <p className={`text-lg ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
          {t('loyalty.subtitle', 'Tích điểm, nhận ưu đãi và trải nghiệm dịch vụ đặc biệt')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className={`inline-flex rounded-2xl p-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg'
                  : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  )
}

export default LoyaltySection
