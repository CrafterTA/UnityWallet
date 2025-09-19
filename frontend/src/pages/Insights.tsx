/**
 * Advanced AI-Powered Wallet Insights Page
 * Comprehensive analytics dashboard with ML-driven insights
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Treemap
} from 'recharts'
import {
  Brain, Shield, AlertTriangle, TrendingUp, TrendingDown,
  Activity, DollarSign, Clock, Users, Zap, Eye, Target,
  Bot, MessageSquare, Settings, RefreshCw, Download,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Calendar, Filter, Search, ChevronDown, ChevronRight,
  Sparkles, Star, Gauge, Lock, Unlock, Bell, BellOff
} from 'lucide-react'

import { mlApi } from '@/api/ml'
import type { 
  AnalyticsResponse, FeatureEngineering, WalletSummary,
  AnomalyCheckResponse, AnomalyDetection, ChatSuggestionsResponse
} from '@/api/ml'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/session'

// ====== Constants ======
const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
const CHART_COLORS = {
  primary: '#3B82F6',
  success: '#10B981', 
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899'
}

// ====== Helper Functions ======
const formatCurrency = (amount: number, currency: string = 'XLM') => 
  `${amount.toFixed(3)} ${currency}`

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

const maskAddress = (address: string) => 
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'

const formatChatResponse = (content: string) => {
  // Clean up the content first
  let cleaned = content
    .replace(/SYP:GDV72SE3EKAEQBEHMS6JAKOWBAMDSV2N3N75Z3FO6WVOUP35KEUMWPPL:/g, 'SYP:')
    .replace(/USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5:/g, 'USDC:')
    .replace(/GAFV4WZIFH76JEGW5R5GQZKBO27EY46C2BSAQONBKQC5XTTCPNDM6LIF/g, 'GAFV4WZIF...M6LIF')
    .replace(/\[Asset Address\]/g, '')
    .replace(/\[Address\]/g, '')
    .replace(/\[Recipient Address\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Format with proper line breaks and structure
  let formatted = cleaned

  // Balance information formatting
  if (formatted.includes('Số dư trung bình')) {
    formatted = formatted
      .replace(/Số dư trung bình của bạn:/g, '**Số dư trung bình của bạn:**\n')
      .replace(/- (SYP|USDC|XLM):\s*([\d.]+)/g, '  • $1: $2\n')
      .replace(/Tài sản có biến động cao:/g, '\n**Tài sản có biến động cao:**')
      .replace(/:\s*(SYP|USDC|XLM)/g, ': $1')
  }

  // Spending analysis formatting
  if (formatted.includes('Tổng chi tiêu')) {
    formatted = formatted
      .replace(/Tổng chi tiêu: ([\d.]+)/g, '**Tổng chi tiêu:** $1\n')
      .replace(/Chi tiết theo tài sản:/g, '**Chi tiết theo tài sản:**\n')
      .replace(/- (SYP|USDC|XLM):\s*([\d.]+)\s*\(([\d.]+)%\)/g, '  • $1: $2 ($3%)\n')
      .replace(/Bạn thường gửi tiền cho:/g, '\n**Bạn thường gửi tiền cho:**\n')
      .replace(/(GAFV4WZIF[^:]*)/g, '  • $1\n')
  }

  // Anomaly detection formatting
  if (formatted.includes('Phát hiện') || formatted.includes('bất thường')) {
    formatted = formatted
      .replace(/Phát hiện (\d+) hoạt động bất thường:/g, '**Phát hiện $1 hoạt động bất thường:**\n')
      .replace(/- ([^:]+):\s*([^.\n]+)/g, '  • $1: $2\n')
      .replace(/Khuyến nghị:/g, '\n**Khuyến nghị:**\n')
  }

  // Pattern analysis formatting
  if (formatted.includes('Pattern số tròn') || formatted.includes('Xu hướng')) {
    formatted = formatted
      .replace(/Pattern số tròn: (\d+) trường hợp/g, '**Pattern số tròn:** $1 trường hợp\n')
      .replace(/Xu hướng giao dịch số tròn bất thường:/g, '**Xu hướng giao dịch số tròn bất thường:**\n')
      .replace(/(\d+\/\d+ giao dịch)/g, '$1\n')
  }

  // General formatting improvements
  formatted = formatted
    .replace(/(\d+)\s*giao dịch/g, '$1 giao dịch')
    .replace(/(\d+)\s*transactions/g, '$1 transactions')
    .replace(/\n\s*\n/g, '\n') // Remove multiple empty lines
    .replace(/\n$/, '') // Remove trailing newline
    .trim()

  return formatted
}

const getRiskColor = (riskScore: number) => {
  if (riskScore < 0.3) return 'text-green-400 bg-green-500/20 border-green-500/30'
  if (riskScore < 0.7) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
  return 'text-red-400 bg-red-500/20 border-red-500/30'
}

const getRiskStatus = (riskScore: number) => {
  if (riskScore < 0.3) return { text: 'SAFE', emoji: '✅' }
  if (riskScore < 0.7) return { text: 'MODERATE', emoji: '⚠️' }
  return { text: 'HIGH RISK', emoji: '🚨' }
}

const getActivityLevelColor = (level: string) => {
  switch (level) {
    case 'very_high': return 'text-red-400'
    case 'high': return 'text-orange-400'
    case 'medium': return 'text-blue-400'
    case 'low': return 'text-gray-400'
    default: return 'text-gray-500'
  }
}

// ====== Main Component ======
export default function Insights() {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const { wallet } = useAuthStore()
  
  const publicKey = wallet?.public_key || ''

  // ====== State Management ======
  const [selectedTimeframe, setSelectedTimeframe] = useState<30 | 60 | 90>(90)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'anomalies' | 'chat'>('overview')
  
  // Chat state
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [hasInitialQuestion, setHasInitialQuestion] = useState(false)
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  // ====== Data Fetching ======
  const queryConfig = { 
    enabled: !!publicKey, 
    retry: 2, 
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  }

  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    error: analyticsError,
    refetch: refetchAnalytics 
  } = useQuery({
    queryKey: ['ml-analytics', publicKey, selectedTimeframe],
    queryFn: () => mlApi.getWalletAnalytics(publicKey, selectedTimeframe, true),
    ...queryConfig,
  })

  const { 
    data: features, 
    isLoading: featuresLoading,
    refetch: refetchFeatures 
  } = useQuery({
    queryKey: ['ml-features', publicKey, selectedTimeframe],
    queryFn: () => mlApi.getWalletFeatures(publicKey, selectedTimeframe),
    ...queryConfig,
  })

  const { 
    data: summary, 
    isLoading: summaryLoading,
    refetch: refetchSummary 
  } = useQuery({
    queryKey: ['ml-summary', publicKey, selectedTimeframe],
    queryFn: () => mlApi.getWalletSummary(publicKey, selectedTimeframe),
    ...queryConfig,
  })

  const { 
    data: anomalyData, 
    isLoading: anomaliesLoading,
    refetch: refetchAnomalies 
  } = useQuery({
    queryKey: ['ml-anomalies', publicKey, Math.min(selectedTimeframe, 30)],
    queryFn: () => mlApi.checkAnomalies(publicKey, Math.min(selectedTimeframe, 30)),
    ...queryConfig,
  })

  const { 
    data: anomalyHistory,
    isLoading: anomalyHistoryLoading,
    error: anomalyHistoryError 
  } = useQuery({
    queryKey: ['ml-anomaly-history', publicKey, selectedTimeframe],
    queryFn: () => mlApi.getAnomalyHistory(publicKey, selectedTimeframe),
    ...queryConfig,
    retry: 0, // Disable retries for optional features that have issues
    enabled: false, // Temporarily disable this query
  })

  const { 
    data: chatSuggestions,
    isLoading: chatSuggestionsLoading,
    error: chatSuggestionsError 
  } = useQuery({
    queryKey: ['ml-chat-suggestions', publicKey],
    queryFn: () => mlApi.getChatSuggestions(publicKey),
    ...queryConfig,
    retry: 1, // Reduce retries for optional features
  })

  const { 
    data: quickStats,
    isLoading: quickStatsLoading 
  } = useQuery({
    queryKey: ['ml-quick-stats', publicKey],
    queryFn: () => mlApi.getQuickStats(publicKey),
    ...queryConfig,
  })

  // ====== Computed Data ======
  const isLoading = analyticsLoading || featuresLoading || summaryLoading || anomaliesLoading
  const hasError = analyticsError

  const riskScore = (anomalyData as AnomalyCheckResponse)?.risk_score || 0
  const anomalies = (anomalyData as AnomalyCheckResponse)?.anomalies || []
  const riskStatus = getRiskStatus(riskScore)

  // Create mock anomaly history from current anomalies since the ML endpoint has issues
  const mockAnomalyHistory = anomalies.length > 0 ? {
    account: publicKey,
    period: `${selectedTimeframe} days`,
    filters: { min_confidence: 0.5 },
    anomalies: anomalies,
    summary: {
      total: anomalies.length,
      by_type: anomalies.reduce((acc: any, a) => {
        acc[a.anomaly_type] = (acc[a.anomaly_type] || 0) + 1
        return acc
      }, {}),
      by_day: {},
      average_confidence: anomalies.length > 0 
        ? anomalies.reduce((sum, a) => sum + a.confidence_score, 0) / anomalies.length
        : 0,
      highest_confidence: anomalies.length > 0
        ? Math.max(...anomalies.map(a => a.confidence_score))
        : 0,
      latest_anomaly: anomalies.length > 0
        ? anomalies[0].timestamp
        : new Date().toISOString()
    }
  } : null

  // Chart data preparation
  const assetDistribution = useMemo(() => {
    if (!summary?.current_balances) return []
    
    const totalBalance = Object.values(summary.current_balances)
      .reduce((sum, balance) => sum + Number(balance), 0)
    
    return Object.entries(summary.current_balances)
      .map(([asset, balance], index) => {
        const value = Number(balance)
        const percentage = totalBalance > 0 ? (value / totalBalance) * 100 : 0
        
        // Format asset name for display
        let displayName = asset
        if (asset.includes(':')) {
          // For assets with issuer, show just the code
          displayName = asset.split(':')[0]
        }
        
        return {
          name: `${displayName} ${percentage.toFixed(1)}%`,
          value: value,
          color: COLORS[index % COLORS.length],
          originalName: asset,
          percentage: percentage
        }
      })
      .filter(item => item.value > 0.001)
      .sort((a, b) => b.value - a.value)
  }, [summary])

  const transactionTypeData = useMemo(() => {
    if (!summary?.transaction_counts) return []
    return Object.entries(summary.transaction_counts)
      .map(([type, count], index) => ({
        name: type.replace('_', ' ').toUpperCase(),
        value: Number(count),
        color: COLORS[index % COLORS.length]
      }))
      .filter(item => item.value > 0)
  }, [summary])

  const balanceHistoryData = useMemo(() => {
    if (!analytics?.balance_history) return []
    const history = analytics.balance_history
    
    // Combine all assets into time series
    const timePoints: Record<string, any> = {}
    
    Object.entries(history).forEach(([asset, data]) => {
      data.timestamps.forEach((timestamp, index) => {
        const date = new Date(timestamp).toISOString().split('T')[0]
        if (!timePoints[date]) {
          timePoints[date] = { date: new Date(timestamp).toLocaleDateString() }
        }
        timePoints[date][asset] = data.values[index] || 0
      })
    })
    
    return Object.values(timePoints)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [analytics])

  const riskRadarData = useMemo(() => {
    if (!features) return []
    
    return [
      { metric: 'Transaction Frequency', value: Math.min(100, (features.transactions_per_month / 50) * 100) },
      { metric: 'Balance Volatility', value: Math.min(100, (Object.values(features.balance_volatility)[0] || 0) / 100 * 100) },
      { metric: 'Large Transactions', value: Math.min(100, (features.large_transaction_count / features.total_transactions) * 100) },
      { metric: 'Refund Rate', value: features.refund_frequency * 100 },
      { metric: 'Debt Ratio', value: Math.min(100, (features.debt_to_asset_ratio || 0) * 50) },
      { metric: 'Peak Hour Activity', value: features.peak_transaction_hours.length * 20 }
    ]
  }, [features])

  // ====== Event Handlers ======
  const handleSendMessage = useCallback(async () => {
    if (!chatMessage.trim() || isChatLoading) return
    
    const userMessage = chatMessage.trim()
    setChatMessage('')
    setIsChatLoading(true)
    
    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    
    try {
      const response = await mlApi.askChatbot({
        public_key: publicKey,
        message: userMessage,
        context: {
          analytics: analytics,
          summary: summary,
          features: features
        }
      })
      
      // Add assistant response
      setChatMessages(prev => [...prev, { role: 'assistant', content: formatChatResponse(response.response) }])
    } catch (error) {
      console.error('Chat error:', error)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.' 
      }])
    } finally {
      setIsChatLoading(false)
    }
  }, [chatMessage, isChatLoading, publicKey, analytics, summary, features])

  // Auto-send initial question when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && !hasInitialQuestion && publicKey && !isChatLoading) {
      setHasInitialQuestion(true)
      const initialQuestion = 'Xin chào! Hãy cho tôi biết tổng quan về tài khoản của tôi.'
      setChatMessage(initialQuestion)
      
      // Auto-send the question
      setTimeout(async () => {
        const userMessage = initialQuestion
        setChatMessage('')
        setIsChatLoading(true)
        
        // Add user message
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
        
        try {
          const response = await mlApi.askChatbot({
            public_key: publicKey,
            message: userMessage,
            context: {
              analytics: analytics,
              summary: summary,
              features: features
            }
          })
          
          // Add assistant response
          setChatMessages(prev => [...prev, { role: 'assistant', content: formatChatResponse(response.response) }])
        } catch (error) {
          console.error('Chat error:', error)
          setChatMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.' 
          }])
        } finally {
          setIsChatLoading(false)
        }
      }, 500)
    }
  }, [activeTab, hasInitialQuestion, publicKey, isChatLoading, analytics, summary, features])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatLoading])

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([
      refetchAnalytics(),
      refetchFeatures(), 
      refetchSummary(),
      refetchAnomalies()
    ])
  }, [refetchAnalytics, refetchFeatures, refetchSummary, refetchAnomalies])

  // ====== Render Guards ======
  if (!publicKey) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="text-center space-y-4">
          <Lock className="w-16 h-16 text-gray-400 mx-auto" />
          <h2 className="text-2xl font-bold">Wallet Not Connected</h2>
          <p className="text-gray-500">Please connect your wallet to view insights.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="max-w-7xl mx-auto space-y-6 px-6 py-8">
          {/* Header Skeleton */}
          <div className="text-center space-y-4">
            <div className={`w-16 h-16 rounded-2xl mx-auto animate-pulse ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            <div className={`h-8 w-64 mx-auto rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            <div className={`h-4 w-96 mx-auto rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          </div>
          
          {/* Content Skeletons */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-64 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
          ))}
        </div>
      </div>
    )
  }

  if (hasError) {
  return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Unable to Load Analytics</h2>
          <p className="text-gray-500">Please ensure ML service is running and try again.</p>
          <button 
            onClick={handleRefreshAll}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
          </div>
        </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* ====== Header ====== */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          AI Wallet Insights
        </h1>
        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          Machine learning powered analytics
        </p>
      </div>

      {/* ====== Content ====== */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Tab Navigation with Controls */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'anomalies', label: 'Security', icon: Shield },
              { id: 'chat', label: 'AI Assistant', icon: Bot }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === id
                    ? isDark
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-slate-100 text-slate-900 border border-slate-200'
                    : isDark
                      ? 'text-white/70 hover:bg-white/5'
                      : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Controls on the right */}
          <div className="flex items-center gap-3">
            {/* Timeframe Selector */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(Number(e.target.value) as 30 | 60 | 90)}
              className={`px-3 py-2 rounded-lg border text-sm ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <option 
                value={30} 
                className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}
              >
                Last 30 Days
              </option>
              <option 
                value={60} 
                className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}
              >
                Last 60 Days
              </option>
              <option 
                value={90} 
                className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}
              >
                Last 90 Days
              </option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshAll}
              className={`p-2 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-2 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Risk Assessment Hero Card */}
            <div className={`relative overflow-hidden rounded-2xl p-8 ${
              isDark ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50' : 'bg-gradient-to-br from-slate-50 to-slate-100'
            } backdrop-blur-xl border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${getRiskColor(riskScore).replace('text-', 'bg-').replace('bg-green-400', 'bg-green-500').replace('bg-yellow-400', 'bg-yellow-500').replace('bg-red-400', 'bg-red-500')}/20`}>
                        <Shield className="w-6 h-6 text-current" />
                        </div>
                          <div>
                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Security Risk Assessment
                        </h2>
                        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                          AI-powered security analysis
                        </p>
                </div>
          </div>

                    <div className="flex items-center gap-6">
            <div>
                        <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {(riskScore * 100).toFixed(1)}%
              </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(riskScore)}`}>
                          {riskStatus.emoji} {riskStatus.text}
            </div>
          </div>

                      <div className="space-y-2">
                        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                          Anomalies Detected: <span className="font-semibold">{anomalies.length}</span>
              </div>
                        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                          Last Check: {anomalyData ? new Date((anomalyData as AnomalyCheckResponse).checked_at).toLocaleTimeString() : 'N/A'}
            </div>
            </div>
            </div>
          </div>

                  {/* Risk Gauge Chart */}
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Risk', value: riskScore * 100 },
                            { name: 'Safe', value: (1 - riskScore) * 100 }
                          ]}
                          cx="50%"
                          cy="50%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={30}
                          outerRadius={50}
                          dataKey="value"
                        >
                          <Cell fill={riskScore < 0.3 ? '#10B981' : riskScore < 0.7 ? '#F59E0B' : '#EF4444'} />
                          <Cell fill={isDark ? '#374151' : '#E5E7EB'} />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
              </div>
            </div>
            </div>
          </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                icon={Activity}
                title="Total Transactions"
                value={features?.total_transactions?.toString() || '0'}
                subtitle={`${features?.transactions_per_month?.toFixed(1) || '0'}/month avg`}
                color="from-blue-500 to-blue-600"
                isDark={isDark}
              />
              <MetricCard
                icon={DollarSign}
                title="Net Flow"
                value={formatCurrency(summary?.amounts?.net_flow || 0)}
                subtitle={summary?.amounts?.net_flow && summary.amounts.net_flow > 0 ? 'Positive' : 'Negative'}
                color="from-green-500 to-green-600"
                isDark={isDark}
              />
              <MetricCard
                icon={Users}
                title="Unique Contacts"
                value={features?.frequent_destinations?.length?.toString() || '0'}
                subtitle="Regular recipients"
                color="from-purple-500 to-purple-600"
                isDark={isDark}
              />
              <MetricCard
                icon={Gauge}
                title="Activity Level"
                value={(summary?.activity_level || 'low').replace('_', ' ').toUpperCase()}
                subtitle={`${selectedTimeframe} days period`}
                color="from-orange-500 to-red-500"
                isDark={isDark}
              />
        </div>

            {/* Enhanced Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enhanced Asset Distribution */}
              {assetDistribution.length > 0 && (
                <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-2xl ${
                  isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                        <PieChartIcon className="w-5 h-5 text-white" />
                </div>
                      <div>
                        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Asset Portfolio
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                          Your asset distribution
                        </p>
                      </div>
              </div>
              
                    <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                        <defs>
                          {assetDistribution.map((entry, index) => (
                            <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                              <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={assetDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                          innerRadius={60}
                          paddingAngle={2}
                      dataKey="value"
                          animationBegin={0}
                          animationDuration={1500}
                          label={({ name, percent }) => {
                            // Extract just the asset code from the name (remove percentage)
                            const assetCode = name.split(' ')[0]
                            return `${assetCode} ${(percent * 100).toFixed(1)}%`
                          }}
                          labelLine={false}
                        >
                          {assetDistribution.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={`url(#gradient-${index})`}
                              stroke={isDark ? '#1F2937' : '#FFFFFF'}
                              strokeWidth={2}
                            />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isDark ? 'rgba(2, 6, 23, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                        border: isDark ? '1px solid rgba(148,163,184,0.2)' : '1px solid rgba(226,232,240,1)',
                        borderRadius: '12px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        color: isDark ? '#F8FAFC' : '#0F172A', // màu chữ mặc định
                        backdropFilter: 'blur(16px)',
                      }}
                      itemStyle={{
                        color: isDark ? '#F8FAFC' : '#0F172A', // màu chữ cho items
                        fontWeight: 600,
                      }}
                      labelStyle={{
                        color: isDark ? '#E2E8F0' : '#334155', // màu label (tiêu đề)
                        fontWeight: 600,
                        marginBottom: 6,
                      }}
                      formatter={(value: any) => [`${formatCurrency(Number(value))}`, 'Balance']}
                      cursor={false}
                    />
                  </PieChart>
                </ResponsiveContainer>

                    {/* Asset Legend */}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {assetDistribution.slice(0, 4).map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                            {entry.originalName?.includes(':') ? entry.originalName.split(':')[0] : entry.originalName}
                          </span>
                        </div>
                      ))}
                    </div>
              </div>
            </div>
          )}

              {/* Enhanced Transaction Types */}
              {transactionTypeData.length > 0 && (
                <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-2xl ${
                  isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  {/* Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative p-6">
              <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                      <div>
                        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Activity Breakdown
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                          Transaction type analysis
                        </p>
                      </div>
              </div>
              
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={transactionTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke={isDark ? '#374151' : '#e2e8f0'} 
                          strokeOpacity={0.3}
                        />
                    <XAxis 
                          dataKey="name" 
                          stroke={isDark ? '#9CA3AF' : '#64748B'} 
                          fontSize={11}
                          fontWeight={500}
                          axisLine={false}
                          tickLine={false}
                    />
                    <YAxis 
                          stroke={isDark ? '#9CA3AF' : '#64748B'} 
                          fontSize={11}
                          fontWeight={500}
                          axisLine={false}
                          tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                        borderRadius: '12px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            color: isDark ? '#FFFFFF' : '#000000',
                            backdropFilter: 'blur(16px)'
                      }}
                          formatter={(value) => [
                            <span className="font-semibold">{value} transactions</span>, 
                            'Count'
                          ]}
                          cursor={false}
                    />
                    <Bar
                          dataKey="value" 
                          fill="url(#barGradient)"
                          radius={[8, 8, 0, 0]}
                          animationBegin={300}
                          animationDuration={1200}
                        >
                          {transactionTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Transaction Stats */}
                    <div className="mt-4 flex justify-between text-xs">
                      <div className={isDark ? 'text-white/60' : 'text-slate-500'}>
                        Total: {transactionTypeData.reduce((sum, item) => sum + item.value, 0)} transactions
                      </div>
                      <div className={isDark ? 'text-white/60' : 'text-slate-500'}>
                        {selectedTimeframe} days period
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== Balance Evolution (NEW) ===== */}
            {balanceHistoryData.length > 0 && (
              <div
                className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-2xl ${
                  isDark
                    ? 'bg-white/5 border-white/10 hover:border-white/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Overlay nhẹ khi hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-blue-500/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg">
                        <svg width="20" height="20" viewBox="0 0 24 24" className="text-white">
                          <path fill="currentColor" d="M3 3h2v18H3V3Zm16 3H9v2h10V6Zm0 5H9v2h10v-2Zm0 5H9v2h10v-2Z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Balance Evolution
                        </h3>
                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                          Historical balance trends
                        </p>
                      </div>
                    </div>

                    {/* Tags nhỏ bên phải */}
                    <div className="hidden sm:flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {selectedTimeframe}D
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        Live Data
                      </span>
                    </div>
                  </div>

                  {/* Chart */}
                  <ResponsiveContainer width="100%" height={420}>
                    <AreaChart data={balanceHistoryData} margin={{ top: 10, right: 24, left: 12, bottom: 10 }}>
                      {/* Gradients & glow */}
                      <defs>
                        {Object.keys(analytics?.balance_history || {}).map((asset, i) => (
                          <linearGradient key={`be-grad-${i}`} id={`be-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.55} />
                            <stop offset="60%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.22} />
                            <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.06} />
                          </linearGradient>
                        ))}
                        <filter id="be-soft-glow">
                          <feGaussianBlur stdDeviation="2.5" result="b" />
                          <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      <CartesianGrid
                        stroke={isDark ? 'rgba(148,163,184,.18)' : 'rgba(100,116,139,.18)'}
                        strokeDasharray="2 6"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="date"
                        tickMargin={8}
                        axisLine={false}
                        tickLine={false}
                        stroke={isDark ? '#A3AED0' : '#475569'}
                        fontSize={11}
                      />
                      <YAxis
                        width={64}
                        tickMargin={8}
                        axisLine={false}
                        tickLine={false}
                        stroke={isDark ? '#A3AED0' : '#475569'}
                        fontSize={11}
                        domain={['dataMin - 5%', 'dataMax + 10%']} // nới biên để dot/đỉnh không chạm trần
                        tickFormatter={(v) => Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v as number)}
                      />

                      <Tooltip
                        cursor={{ stroke: isDark ? 'rgba(148,163,184,.35)' : 'rgba(100,116,139,.35)', strokeWidth: 1.2 }}
                        contentStyle={{
                          backgroundColor: isDark ? 'rgba(2,6,23,.94)' : 'rgba(255,255,255,.98)',
                          border: isDark ? '1px solid rgba(148,163,184,.2)' : '1px solid rgba(226,232,240,1)',
                          borderRadius: 14,
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          boxShadow: '0 20px 45px -16px rgba(0,0,0,.35)',
                          backdropFilter: 'blur(10px)',
                          padding: '10px 12px',
                        }}
                        labelStyle={{ color: isDark ? '#E2E8F0' : '#334155', fontWeight: 700, marginBottom: 6 }}
                        itemStyle={{ color: isDark ? '#F8FAFC' : '#0F172A', fontWeight: 600 }}
                        formatter={(v: any, name: any) => [
                          `${Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(Number(v))} XLM`,
                          (name as string).includes(':') ? (name as string).split(':')[0] : (name as string),
                        ]}
                      />

                      {Object.keys(analytics?.balance_history || {}).map((asset, i) => (
                        <Area
                          key={asset}
                          type="monotone"
                          dataKey={asset}
                          connectNulls
                          baseValue={0}
                          stroke={COLORS[i % COLORS.length]}
                          fill={`url(#be-grad-${i})`}
                          strokeWidth={3}
                          strokeOpacity={0.95}
                          fillOpacity={0.6}
                          dot={false}
                          activeDot={{
                            r: 6,
                            strokeWidth: 2,
                            stroke: isDark ? '#0B1220' : '#FFFFFF',
                            fill: COLORS[i % COLORS.length],
                            filter: 'url(#be-soft-glow)',
                          }}
                          animationDuration={900}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Mini summary dưới chart */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(analytics?.balance_history || {})
                      .slice(0, 3)
                      .map(([asset, data], i) => {
                        const d = data as any
                        const vals = d?.values ?? []
                        const curr = vals[vals.length - 1] ?? 0
                        const prev = vals[vals.length - 2] ?? 0
                        const diffPct = prev ? ((curr - prev) / prev) * 100 : 0
                        const up = diffPct >= 0
                        const label = asset.includes(':') ? asset.split(':')[0] : asset
                        return (
                          <div
                            key={asset}
                            className={`p-4 rounded-xl border ${
                              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <span className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                                  {label}
                                </span>
                              </div>
                              <span className={`text-xs ${up ? 'text-emerald-400' : 'text-red-400'}`}>
                                {up ? '▲' : '▼'} {Math.abs(diffPct).toFixed(1)}%
                              </span>
                            </div>
                            <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {`${curr.toFixed(3)} XLM`}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )}

          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && features && (
          <>
            {/* Advanced Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                title="Peak Transaction Hours"
                value={features.peak_transaction_hours.map(h => `${h}:00`).join(', ') || 'N/A'}
                description="Most active hours of the day"
                icon={Clock}
                isDark={isDark}
              />
              <FeatureCard
                title="Refund Frequency"
                value={formatPercent(features.refund_frequency)}
                description="Rate of reverse transactions"
                icon={RefreshCw}
                isDark={isDark}
              />
              <FeatureCard
                title="Large Transactions"
                value={features.large_transaction_count.toString()}
                description={`Threshold: ${formatCurrency(features.large_transaction_threshold)}`}
                icon={TrendingUp}
                isDark={isDark}
              />
              <FeatureCard
                title="Debt-to-Asset Ratio"
                value={features.debt_to_asset_ratio ? features.debt_to_asset_ratio.toFixed(2) : 'N/A'}
                description="Financial leverage indicator"
                icon={Target}
                isDark={isDark}
              />
              <FeatureCard
                title="Balance Volatility"
                value={Object.keys(features.balance_volatility).length.toString()}
                description="Assets with volatility data"
                icon={Activity}
                isDark={isDark}
              />
              <FeatureCard
                title="Frequent Recipients"
                value={features.frequent_destinations.length.toString()}
                description="Regular transaction partners"
                icon={Users}
                isDark={isDark}
              />
            </div>

            {/* Risk Analysis Radar Chart */}
            {riskRadarData.length > 0 && (
              <ChartCard title="Risk Profile Analysis" icon={Target} isDark={isDark}>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={riskRadarData}>
                    <PolarGrid stroke={isDark ? '#374151' : '#e2e8f0'} />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: isDark ? '#9CA3AF' : '#64748B' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: isDark ? '#9CA3AF' : '#64748B' }} />
                    <Radar
                      name="Risk Factors"
                      dataKey="value"
                      stroke={CHART_COLORS.danger}
                      fill={CHART_COLORS.danger}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            {/* Detailed Balance Volatility */}
            {Object.keys(features.balance_volatility).length > 0 && (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Balance Volatility by Asset
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(features.balance_volatility).map(([asset, volatility]) => (
                    <div key={asset} className={`p-4 rounded-lg border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          volatility > 100 ? 'bg-red-500/20 text-red-400' :
                          volatility > 10 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {volatility > 100 ? 'High' : volatility > 10 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {volatility.toFixed(2)}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                        Standard deviation
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          </>
        )}

        {/* Anomalies/Security Tab */}
        {activeTab === 'anomalies' && (
          <>
            {/* Anomaly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>High Risk</h3>
                </div>
                <div className="text-3xl font-bold text-red-500 mb-2">
                  {anomalies.filter(a => a.confidence_score > 0.8).length}
                </div>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  Critical anomalies detected
                </p>
        </div>

              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Eye className="w-6 h-6 text-yellow-500" />
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Monitoring</h3>
                </div>
                <div className="text-3xl font-bold text-yellow-500 mb-2">
                  {anomalies.filter(a => a.confidence_score > 0.5 && a.confidence_score <= 0.8).length}
                </div>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  Activities under watch
                </p>
              </div>
              
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-green-500" />
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Safe</h3>
                </div>
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {((features?.total_transactions || 0) - anomalies.length).toString()}
                </div>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  Normal transactions
                </p>
              </div>
            </div>
            
            {/* Anomaly Timeline */}
            {anomalies.length > 0 && (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Recent Anomalies
                </h3>
                <div className="space-y-4">
                  {anomalies.slice(0, 10).map((anomaly, index) => (
                    <AnomalyCard key={index} anomaly={anomaly} isDark={isDark} />
                  ))}
                    </div>
            </div>
          )}

            {/* Anomaly History Summary */}
            {mockAnomalyHistory && (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Historical Analysis
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {mockAnomalyHistory?.summary?.total || 0}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      Total Anomalies
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {((mockAnomalyHistory?.summary?.average_confidence || 0) * 100).toFixed(1)}%
                    </div>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      Avg Confidence
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {((mockAnomalyHistory?.summary?.highest_confidence || 0) * 100).toFixed(1)}%
                    </div>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      Highest Risk
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {Object.keys(mockAnomalyHistory?.summary?.by_type || {}).length}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      Anomaly Types
                    </div>
                  </div>
        </div>

                {/* Anomaly Types Breakdown */}
                <div className="space-y-2">
                  <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Types Detected:
                      </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(mockAnomalyHistory?.summary?.by_type || {}).map(([type, count]) => (
                      <span 
                        key={type}
                        className={`px-3 py-1 rounded-full text-sm border ${isDark ? 'bg-white/5 border-white/10 text-white/80' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                      >
                        {type.replace('_', ' ')}: {count as number}
                        </span>
                    ))}
                      </div>
                    </div>
                  </div>
            )}
          </>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'chat' && (
          <>
            {/* Quick Stats Summary */}
            {quickStats && (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-white/10' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="w-6 h-6 text-purple-500" />
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    AI Assistant Summary
                  </h3>
                </div>
            
                <p className={`text-lg mb-6 ${isDark ? 'text-white/90' : 'text-slate-800'}`}>
                  {quickStats.summary}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {quickStats.stats.total_transactions}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      Total Transactions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(quickStats.stats.total_sent)}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      Total Sent
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {formatCurrency(quickStats.stats.total_received)}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      Total Received
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {quickStats.stats.account_age_days}
                      </div>
                    <div className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                      Account Age (Days)
                    </div>
                  </div>
            </div>
          </div>
        )}

            {/* Chat Suggestions */}
            {chatSuggestions && !chatSuggestionsError ? (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Suggested Questions
                  </h3>
            </div>
                <p className={`mb-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  Try asking the AI assistant about these topics:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(chatSuggestions as any)?.suggestions?.map((suggestion: string, index: number) => (
                    <button
                      key={index}
                      onClick={async () => {
                        if (isChatLoading) return
                        
                        const userMessage = suggestion
                        setChatMessage('')
                        setIsChatLoading(true)
                        
                        // Add user message
                        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
                        
                        try {
                          const response = await mlApi.askChatbot({
                            public_key: publicKey,
                            message: userMessage,
                            context: {
                              analytics: analytics,
                              summary: summary,
                              features: features
                            }
                          })
                          
                          // Add assistant response
                          setChatMessages(prev => [...prev, { role: 'assistant', content: formatChatResponse(response.response) }])
                        } catch (error) {
                          console.error('Chat error:', error)
                          setChatMessages(prev => [...prev, { 
                            role: 'assistant', 
                            content: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.' 
                          }])
                        } finally {
                          setIsChatLoading(false)
                        }
                      }}
                      className={`p-3 rounded-lg text-left transition-colors border ${
                        isDark 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    </button>
                  ))}
          </div>
              </div>
            ) : (
              <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-6 h-6 text-blue-500" />
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Default Questions
                  </h3>
                </div>
                <p className={`mb-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  Common questions you can ask about your wallet:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Số dư hiện tại của tôi là bao nhiêu?',
                    'Có hoạt động bất thường nào không?',
                    'Phân tích chi tiêu của tôi',
                    'Tôi thường giao dịch vào giờ nào?',
                    'Giao dịch lớn nhất của tôi là gì?',
                    'Tài sản nào chiếm tỷ trọng lớn nhất?'
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={async () => {
                        if (isChatLoading) return
                        
                        const userMessage = suggestion
                        setChatMessage('')
                        setIsChatLoading(true)
                        
                        // Add user message
                        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
                        
                        try {
                          const response = await mlApi.askChatbot({
                            public_key: publicKey,
                            message: userMessage,
                            context: {
                              analytics: analytics,
                              summary: summary,
                              features: features
                            }
                          })
                          
                          // Add assistant response
                          setChatMessages(prev => [...prev, { role: 'assistant', content: formatChatResponse(response.response) }])
                        } catch (error) {
                          console.error('Chat error:', error)
                          setChatMessages(prev => [...prev, { 
                            role: 'assistant', 
                            content: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.' 
                          }])
                        } finally {
                          setIsChatLoading(false)
                        }
                      }}
                      className={`p-3 rounded-lg text-left transition-colors border ${
                        isDark 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    </button>
                  ))}
        </div>
          </div>
        )}

            {/* Chat Interface */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-white/10' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 rounded-full ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <Bot className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    AI Assistant
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    Your personal financial advisor
                  </p>
                </div>
              </div>

              {/* Chat Messages */}
              <div className={`h-96 overflow-y-auto mb-6 p-4 rounded-xl ${isDark ? 'bg-slate-900/50 backdrop-blur-sm' : 'bg-slate-50/80 backdrop-blur-sm'}`}>
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                      <Bot className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      Welcome to AI Assistant!
                    </p>
                    <p className={`${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                      Ask me anything about your wallet activity
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          message.role === 'user'
                            ? isDark 
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                            : isDark
                              ? 'bg-white/10 text-white border border-white/20'
                              : 'bg-white text-slate-900 border border-slate-200'
                        }`}>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content.split('\n').map((line, index) => {
                              // Handle bullet points
                              if (line.trim().startsWith('•')) {
                                return (
                                  <div key={index} className="flex items-start gap-2 mb-1">
                                    <span className="text-blue-400 dark:text-blue-400 mt-1 flex-shrink-0">•</span>
                                    <span className="flex-1">{line.replace('•', '').trim()}</span>
                                  </div>
                                )
                              }
                              // Handle bold text
                              if (line.includes('**')) {
                                const parts = line.split(/(\*\*.*?\*\*)/g)
                                return (
                                  <div key={index} className="mb-2">
                                    {parts.map((part, partIndex) => {
                                      if (part.startsWith('**') && part.endsWith('**')) {
                                        return (
                                          <strong key={partIndex} className="font-bold text-slate-900 dark:text-slate-100">
                                            {part.slice(2, -2)}
                                          </strong>
                                        )
                                      }
                                      return <span key={partIndex}>{part}</span>
                                    })}
                                  </div>
                                )
                              }
                              // Regular lines
                              return (
                                <div key={index} className={line.trim() ? 'mb-2' : 'mb-1'}>
                                  {line}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          isDark ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-slate-900 border border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="text-xs ml-2">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your wallet activity..."
                    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 ${
                      isDark 
                        ? 'bg-slate-800/50 border-white/20 text-white placeholder-white/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    } focus:outline-none`}
                    disabled={isChatLoading}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <MessageSquare className={`w-5 h-5 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || isChatLoading}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                    !chatMessage.trim() || isChatLoading
                      ? isDark
                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : isDark
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/25'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/25'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>

              {/* Quick Questions */}
              <div className="mt-6">
                <p className={`text-sm font-medium mb-4 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                  Quick questions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Số dư hiện tại của tôi là bao nhiêu?',
                    'Có hoạt động bất thường nào không?',
                    'Phân tích chi tiêu của tôi',
                    'Tôi thường giao dịch vào giờ nào?'
                  ].map((question, index) => (
                    <button
                      key={index}
                      onClick={async () => {
                        if (isChatLoading) return
                        
                        const userMessage = question
                        setChatMessage('')
                        setIsChatLoading(true)
                        
                        // Add user message
                        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
                        
                        try {
                          const response = await mlApi.askChatbot({
                            public_key: publicKey,
                            message: userMessage,
                            context: {
                              analytics: analytics,
                              summary: summary,
                              features: features
                            }
                          })
                          
                          // Add assistant response
                          setChatMessages(prev => [...prev, { role: 'assistant', content: formatChatResponse(response.response) }])
                        } catch (error) {
                          console.error('Chat error:', error)
                          setChatMessages(prev => [...prev, { 
                            role: 'assistant', 
                            content: 'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Vui lòng thử lại sau.' 
                          }])
                        } finally {
                          setIsChatLoading(false)
                        }
                      }}
                      className={`p-3 rounded-xl text-left transition-all duration-200 border ${
                        isDark 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white/90 hover:border-white/20' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800 hover:border-slate-300'
                      } group`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-500/20 group-hover:bg-blue-500/30' : 'bg-blue-100 group-hover:bg-blue-200'}`}>
                          <Sparkles className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">{question}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ====== Helper Components ======

const MetricCard = ({ icon: Icon, title, value, subtitle, color, isDark }: any) => (
  <div className={`p-6 rounded-2xl border transition-all duration-300 group ${
    isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300'
  }`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div>
      <p className={`text-sm mb-1 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{title}</p>
      <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{subtitle}</p>
    </div>
  </div>
)

const ChartCard = ({ title, icon: Icon, children, isDark }: any) => (
  <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
    </div>
    {children}
  </div>
)

const FeatureCard = ({ title, value, description, icon: Icon, isDark }: any) => (
  <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1">
        <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h4>
        <p className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {value}
        </p>
        <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>
    </div>
  </div>
)

const AnomalyCard = ({ anomaly, isDark }: any) => (
  <div className={`p-4 rounded-xl border ${
    anomaly.confidence_score > 0.8 
      ? isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
      : anomaly.confidence_score > 0.5
        ? isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
        : isDark ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'
  }`}>
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${
        anomaly.confidence_score > 0.8 ? 'bg-red-500/20 text-red-400' :
        anomaly.confidence_score > 0.5 ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-blue-500/20 text-blue-400'
      }`}>
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {anomaly.anomaly_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Anomaly Detected'}
          </h4>
          <span className={`text-xs px-2 py-1 rounded-full ${
            anomaly.confidence_score > 0.8 ? 'bg-red-500/20 text-red-400' :
            anomaly.confidence_score > 0.5 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {(anomaly.confidence_score * 100).toFixed(0)}%
          </span>
        </div>
        <p className={`text-sm mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          {anomaly.description || 'Unusual activity detected'}
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className={`${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            {new Date(anomaly.timestamp).toLocaleString()}
          </span>
          <span className={`${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            {anomaly.recommended_action}
          </span>
        </div>
      </div>
    </div>
  </div>
)