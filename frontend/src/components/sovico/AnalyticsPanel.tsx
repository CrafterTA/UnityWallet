import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Target, 
  Zap,
  PieChart,
  LineChart,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { SovicoAnalytics } from '@/types/sovico'

interface AnalyticsPanelProps {
  analytics: SovicoAnalytics
  onRefresh?: () => void
  onExportData?: (format: 'csv' | 'pdf' | 'excel') => void
  onViewDetails?: (metric: string) => void
  onSetTimeRange?: (range: '1d' | '7d' | '30d' | '90d' | '1y') => void
}

const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  analytics,
  onRefresh,
  onExportData,
  onViewDetails,
  onSetTimeRange
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | '90d' | '1y'>('7d')
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const tabs = [
    { id: 'overview', label: t('analytics.tabs.overview', 'Tổng quan'), icon: BarChart3 },
    { id: 'market', label: t('analytics.tabs.market', 'Thị trường'), icon: TrendingUp },
    { id: 'users', label: t('analytics.tabs.users', 'Người dùng'), icon: Users },
    { id: 'transactions', label: t('analytics.tabs.transactions', 'Giao dịch'), icon: Activity },
    { id: 'risks', label: t('analytics.tabs.risks', 'Rủi ro'), icon: Shield }
  ]

  const timeRanges = [
    { id: '1d', label: t('analytics.timeRanges.1d', '1 ngày') },
    { id: '7d', label: t('analytics.timeRanges.7d', '7 ngày') },
    { id: '30d', label: t('analytics.timeRanges.30d', '30 ngày') },
    { id: '90d', label: t('analytics.timeRanges.90d', '90 ngày') },
    { id: '1y', label: t('analytics.timeRanges.1y', '1 năm') }
  ]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await onRefresh?.()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleTimeRangeChange = (range: '1d' | '7d' | '30d' | '90d' | '1y') => {
    setTimeRange(range)
    onSetTimeRange?.(range)
  }

  const toggleMetricExpansion = (metricId: string) => {
    setExpandedMetrics(prev => {
      const newSet = new Set(prev)
      if (newSet.has(metricId)) {
        newSet.delete(metricId)
      } else {
        newSet.add(metricId)
      }
      return newSet
    })
  }

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

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'high', color: 'red', icon: AlertTriangle }
    if (score >= 60) return { level: 'medium', color: 'yellow', icon: Clock }
    return { level: 'low', color: 'green', icon: CheckCircle }
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            {getTrendIcon(analytics.sypMarketCap.trend)}
          </div>
          <h3 className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('analytics.sypMarketCap', 'Vốn hóa SYP')}
          </h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(analytics.sypMarketCap.value)}
          </p>
          <p className={`text-sm ${analytics.sypMarketCap.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(analytics.sypMarketCap.change)}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            {getTrendIcon(analytics.activeUsers.trend)}
          </div>
          <h3 className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('analytics.activeUsers', 'Người dùng hoạt động')}
          </h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(analytics.activeUsers.value)}
          </p>
          <p className={`text-sm ${analytics.activeUsers.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(analytics.activeUsers.change)}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            {getTrendIcon(analytics.transactionVolume.trend)}
          </div>
          <h3 className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('analytics.transactionVolume', 'Khối lượng giao dịch')}
          </h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(analytics.transactionVolume.value)}
          </p>
          <p className={`text-sm ${analytics.transactionVolume.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(analytics.transactionVolume.change)}
          </p>
        </div>

        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            {getTrendIcon(analytics.revenue.trend)}
          </div>
          <h3 className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('analytics.revenue', 'Doanh thu')}
          </h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(analytics.revenue.value)}
          </p>
          <p className={`text-sm ${analytics.revenue.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercentage(analytics.revenue.change)}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.sypPriceChart', 'Biểu đồ giá SYP')}
          </h3>
          <div className="h-64 bg-gradient-to-br from-red-500/10 to-yellow-500/10 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('analytics.chartPlaceholder', 'Biểu đồ sẽ được hiển thị ở đây')}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.userDistribution', 'Phân bố người dùng')}
          </h3>
          <div className="h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('analytics.chartPlaceholder', 'Biểu đồ sẽ được hiển thị ở đây')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMarket = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.exchangeRates', 'Tỷ giá hối đoái')}
          </h3>
          <div className="space-y-4">
            {analytics.exchangeRates.map((rate, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {rate.from}
                    </span>
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {rate.from} → {rate.to}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      {rate.lastUpdated}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {rate.rate.toFixed(6)}
                  </p>
                  <p className={`text-sm ${rate.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(rate.change)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.marketInsights', 'Thông tin thị trường')}
          </h3>
          <div className="space-y-4">
            {analytics.marketInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  insight.type === 'positive' ? 'bg-green-500' :
                  insight.type === 'negative' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {insight.title}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('analytics.totalUsers', 'Tổng người dùng')}
          </h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(analytics.userMetrics.totalUsers)}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('analytics.newUsers', 'Người dùng mới')}
          </h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatNumber(analytics.userMetrics.newUsers)}
          </p>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-sm font-medium mb-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('analytics.retentionRate', 'Tỷ lệ giữ chân')}
          </h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {analytics.userMetrics.retentionRate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  )

  const renderTransactions = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.transactionStats', 'Thống kê giao dịch')}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('analytics.totalTransactions', 'Tổng giao dịch')}
              </span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatNumber(analytics.transactionMetrics.totalTransactions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('analytics.successRate', 'Tỷ lệ thành công')}
              </span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {analytics.transactionMetrics.successRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('analytics.avgProcessingTime', 'Thời gian xử lý TB')}
              </span>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {analytics.transactionMetrics.avgProcessingTime}ms
              </span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.peakHours', 'Giờ cao điểm')}
          </h3>
          <div className="space-y-2">
            {analytics.peakHours.map((hour, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {hour.time}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-yellow-500 rounded-full"
                      style={{ width: `${hour.percentage}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {hour.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderRisks = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.riskScore', 'Điểm rủi ro')}
          </h3>
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={isDark ? '#374151' : '#e5e7eb'}
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={analytics.riskScore >= 80 ? '#ef4444' : analytics.riskScore >= 60 ? '#f59e0b' : '#10b981'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(analytics.riskScore / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {analytics.riskScore}
                </span>
              </div>
            </div>
            <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {t(`analytics.riskLevels.${getRiskLevel(analytics.riskScore).level}`, getRiskLevel(analytics.riskScore).level)}
            </p>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.anomalies', 'Bất thường phát hiện')}
          </h3>
          <div className="space-y-3">
            {analytics.anomalies.map((anomaly, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  anomaly.severity === 'high' ? 'bg-red-500' :
                  anomaly.severity === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {anomaly.type}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {anomaly.description}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    {anomaly.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'market':
        return renderMarket()
      case 'users':
        return renderUsers()
      case 'transactions':
        return renderTransactions()
      case 'risks':
        return renderRisks()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('analytics.title', 'Analytics & Insights')}
          </h2>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('analytics.subtitle', 'Phân tích dữ liệu và thông tin chi tiết')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-xl transition-colors ${
              isRefreshing
                ? 'bg-gray-100 text-gray-400'
                : isDark
                  ? 'hover:bg-white/10 text-white/70'
                  : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value as any)}
              className={`px-3 py-2 rounded-xl border text-sm appearance-none pr-8 ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              {timeRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={() => onExportData?.('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300"
          >
            <Download className="w-4 h-4" />
            {t('analytics.export', 'Xuất dữ liệu')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white'
                : isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {renderTabContent()}
    </div>
  )
}

export default AnalyticsPanel
