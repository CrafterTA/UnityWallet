import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { useNotifications } from '@/components/NotificationSystem'
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
  ChevronUp,
  Copy,
  XCircle
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
  const { addNotification } = useNotifications()
  
  const [activeTab, setActiveTab] = useState('promotions')
  const [expandedPromotion, setExpandedPromotion] = useState<string | null>(null)
  const [showAllTasks, setShowAllTasks] = useState(false)
  const [redeemedCoupons, setRedeemedCoupons] = useState<string[]>([])

  // Load redeemed coupons from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('redeemedCoupons')
    if (stored) {
      try {
        setRedeemedCoupons(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing redeemed coupons:', error)
      }
    }
  }, [])


  // Get loyalty points from localStorage or use default
  const getLoyaltyPoints = (): SovicoLoyaltyPoints => {
    try {
      const stored = localStorage.getItem('loyaltyPoints')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Calculate level based on total points
        let level = 'bronze'
        if (parsed.total >= 50000) level = 'diamond'
        else if (parsed.total >= 25000) level = 'platinum'
        else if (parsed.total >= 10000) level = 'gold'
        else if (parsed.total >= 5000) level = 'silver'
        
        return {
          ...parsed,
          level,
          nextLevelPoints: level === 'diamond' ? 50000 : level === 'platinum' ? 50000 : level === 'gold' ? 25000 : level === 'silver' ? 10000 : 5000,
          benefits: [
            'Ưu đãi 5% cho tất cả giao dịch',
            'Miễn phí giao dịch SOL',
            'Hỗ trợ ưu tiên 24/7',
            'Quà tặng sinh nhật đặc biệt'
          ]
        }
      }
    } catch (error) {
      console.error('Error parsing loyalty points:', error)
    }
    
    // Default points
    return {
      total: 12500,
      available: 8500,
      used: 4000,
      expired: 0,
      level: 'gold',
      nextLevelPoints: 15000,
      benefits: [
        'Ưu đãi 5% cho tất cả giao dịch',
        'Miễn phí giao dịch SOL',
        'Hỗ trợ ưu tiên 24/7',
        'Quà tặng sinh nhật đặc biệt'
      ]
    }
  }

  const mockLoyaltyPoints: SovicoLoyaltyPoints = loyaltyPoints || getLoyaltyPoints()

  // Mock coupon codes that can be redeemed with points
  const mockCoupons = [
    {
      id: '1',
      code: 'WELCOME10',
      title: 'Giảm 10% cho giao dịch đầu tiên',
      description: 'Áp dụng cho tất cả dịch vụ Sovico',
      pointsRequired: 1000,
      discountType: 'percentage',
      discountValue: 10,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isRedeemed: false,
      category: 'discount'
    },
    {
      id: '2',
      code: 'FLIGHT50K',
      title: 'Giảm 50,000 VND vé máy bay',
      description: 'Áp dụng cho dịch vụ Vietjet Air',
      pointsRequired: 2000,
      discountType: 'fixed',
      discountValue: 50000,
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isRedeemed: false,
      category: 'aviation'
    },
    {
      id: '3',
      code: 'HOTEL100K',
      title: 'Giảm 100,000 VND khách sạn',
      description: 'Áp dụng cho Dragon Village Resort',
      pointsRequired: 3000,
      discountType: 'fixed',
      discountValue: 100000,
      validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      isRedeemed: false,
      category: 'hospitality'
    },
    {
      id: '4',
      code: 'BANKING5PERCENT',
      title: 'Giảm 5% phí ngân hàng',
      description: 'Áp dụng cho dịch vụ HDBank Premium',
      pointsRequired: 1500,
      discountType: 'percentage',
      discountValue: 5,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isRedeemed: false,
      category: 'banking'
    },
    {
      id: '5',
      code: 'ENERGY20PERCENT',
      title: 'Giảm 20% năng lượng mặt trời',
      description: 'Áp dụng cho Sovico Energy Solar',
      pointsRequired: 5000,
      discountType: 'percentage',
      discountValue: 20,
      validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      isRedeemed: false,
      category: 'energy'
    }
  ]

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
    { id: 'promotions', label: t('loyalty.tabs.promotions', 'Ưu đãi của tôi'), icon: Gift },
    { id: 'coupons', label: t('loyalty.tabs.coupons', 'Mã ưu đãi'), icon: Award },
    { id: 'tasks', label: t('loyalty.tabs.tasks', 'Nhiệm vụ'), icon: Target },
    { id: 'levels', label: t('loyalty.tabs.levels', 'Cấp độ'), icon: Crown }
  ]

  const renderCoupons = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('loyalty.coupons.title', 'Mã ưu đãi có thể đổi')}
        </h3>
        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {t('loyalty.coupons.availablePoints', 'Điểm khả dụng')}: <span className="font-semibold text-yellow-500">{mockLoyaltyPoints.available.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {mockCoupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 ${
              isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'
            } ${coupon.isRedeemed ? 'opacity-50' : ''}`}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    coupon.category === 'aviation' ? 'bg-blue-100 text-blue-600' :
                    coupon.category === 'hospitality' ? 'bg-green-100 text-green-600' :
                    coupon.category === 'banking' ? 'bg-purple-100 text-purple-600' :
                    coupon.category === 'energy' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {coupon.title}
                    </h4>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      {coupon.discountType === 'percentage' 
                        ? `${coupon.discountValue}% ${t('loyalty.coupons.discount', 'giảm giá')}`
                        : `${coupon.discountValue.toLocaleString('vi-VN')} VND ${t('loyalty.coupons.discount', 'giảm giá')}`
                      }
                    </div>
                  </div>
                </div>
                <div className={`text-right ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  <div className="text-sm">{t('loyalty.coupons.pointsRequired', 'Cần')}</div>
                  <div className="text-lg font-semibold text-yellow-500">{coupon.pointsRequired.toLocaleString()}</div>
                </div>
              </div>

              <p className={`text-sm mb-4 ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                {coupon.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-500'}`}>
                  {t('loyalty.coupons.validUntil', 'Có hiệu lực đến')}: {coupon.validUntil.toLocaleDateString('vi-VN')}
                </div>
                <div className={`text-sm font-mono px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  {coupon.code}
                </div>
              </div>

              <button
                onClick={() => {
                  if (mockLoyaltyPoints.available >= coupon.pointsRequired && !coupon.isRedeemed) {
                    // Update loyalty points in localStorage
                    const currentPoints = JSON.parse(localStorage.getItem('loyaltyPoints') || '{"total": 12500, "available": 8500, "used": 4000}')
                    const newPoints = {
                      ...currentPoints,
                      available: currentPoints.available - coupon.pointsRequired,
                      used: currentPoints.used + coupon.pointsRequired
                    }
                    localStorage.setItem('loyaltyPoints', JSON.stringify(newPoints))
                    
                    // Add to redeemed coupons
                    const newRedeemedCoupons = [...redeemedCoupons, coupon.id]
                    setRedeemedCoupons(newRedeemedCoupons)
                    localStorage.setItem('redeemedCoupons', JSON.stringify(newRedeemedCoupons))
                    
                    addNotification({
                      type: 'success',
                      title: 'Đổi mã thành công',
                      message: `Đã đổi mã ${coupon.code} thành công! Đã trừ ${coupon.pointsRequired} điểm.`,
                      icon: <CheckCircle className="w-5 h-5 text-green-500" />
                    })
                  } else if (coupon.isRedeemed) {
                    addNotification({
                      type: 'error',
                      title: 'Lỗi',
                      message: 'Mã đã được sử dụng!',
                      icon: <XCircle className="w-5 h-5 text-red-500" />
                    })
                  } else {
                    addNotification({
                      type: 'error',
                      title: 'Không đủ điểm',
                      message: 'Không đủ điểm để đổi mã này!',
                      icon: <XCircle className="w-5 h-5 text-red-500" />
                    })
                  }
                }}
                disabled={mockLoyaltyPoints.available < coupon.pointsRequired || coupon.isRedeemed}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  mockLoyaltyPoints.available >= coupon.pointsRequired && !coupon.isRedeemed
                    ? 'bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Award className="w-4 h-4" />
                {coupon.isRedeemed ? t('loyalty.coupons.redeemed', 'Đã đổi') : t('loyalty.coupons.redeem', 'Đổi ngay')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPromotions = () => {
    const myCoupons = mockCoupons.filter(coupon => redeemedCoupons.includes(coupon.id))
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('loyalty.promotions.title', 'Ưu đãi của tôi')}
          </h3>
          <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {myCoupons.length} {t('loyalty.promotions.couponsCount', 'mã ưu đãi')}
          </div>
        </div>

        {myCoupons.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h4 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t('loyalty.promotions.noMyCoupons', 'Chưa có ưu đãi nào')}
            </h4>
            <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {t('loyalty.promotions.noMyCouponsDesc', 'Hãy đổi mã ưu đãi để sử dụng')}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {myCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 ${
                  isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'
                }`}
              >
                <div className="p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        coupon.category === 'aviation' ? 'bg-blue-100 text-blue-600' :
                        coupon.category === 'hospitality' ? 'bg-green-100 text-green-600' :
                        coupon.category === 'banking' ? 'bg-purple-100 text-purple-600' :
                        coupon.category === 'energy' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {coupon.title}
                        </h4>
                        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}% ${t('loyalty.coupons.discount', 'giảm giá')}`
                            : `${coupon.discountValue.toLocaleString('vi-VN')} VND ${t('loyalty.coupons.discount', 'giảm giá')}`
                          }
                        </div>
                      </div>
                    </div>
                    <div className={`text-right ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      <div className="text-sm">{t('loyalty.coupons.validUntil', 'Có hiệu lực đến')}</div>
                      <div className="text-sm font-semibold">{coupon.validUntil.toLocaleDateString('vi-VN')}</div>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                    {coupon.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-sm font-mono px-3 py-1 rounded-lg ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                      {coupon.code}
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('loyalty.coupons.ready', 'Sẵn sàng sử dụng')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coupon.code)
                      addNotification({
                        type: 'success',
                        title: 'Copy thành công',
                        message: `Đã copy mã ${coupon.code}`,
                        icon: <CheckCircle className="w-5 h-5 text-green-500" />
                      })
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    {t('loyalty.coupons.copyCode', 'Copy mã')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

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
      case 'coupons':
        return renderCoupons()
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
