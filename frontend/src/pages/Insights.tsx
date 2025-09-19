/**
 * Advanced AI-Powered Wallet Insights Page
 * Comprehensive analytics dashboard with ML-driven insights
 */

import React, { useState, useMemo, useCallback } from 'react'
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
    return Object.entries(summary.current_balances)
      .map(([asset, balance], index) => ({
        name: asset,
        value: Number(balance),
        color: COLORS[index % COLORS.length]
      }))
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
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  AI Wallet Insights
                </h1>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  Machine learning powered analytics
                </p>
                  </div>
                </div>

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
                <option value={30}>Last 30 Days</option>
                <option value={60}>Last 60 Days</option>
                <option value={90}>Last 90 Days</option>
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

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
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
              </div>
            </div>

      {/* ====== Content ====== */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
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
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
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
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                        borderRadius: '12px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            color: isDark ? '#FFFFFF' : '#000000',
                            backdropFilter: 'blur(16px)'
                          }}
                          formatter={(value) => [
                            <span className="font-semibold">{formatCurrency(Number(value))}</span>, 
                            'Balance'
                          ]}
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
                            {entry.name}
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

            {/* Enhanced Balance History Chart */}
            {balanceHistoryData.length > 0 && (
              <div className={`group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:shadow-2xl ${
                isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}>
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg">
                        <LineChartIcon className="w-5 h-5 text-white" />
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

                    {/* Chart Controls */}
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isDark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedTimeframe}D
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        Live Data
                      </div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={450}>
                    <AreaChart data={balanceHistoryData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <defs>
                        {Object.keys(analytics?.balance_history || {}).map((asset, index) => (
                          <linearGradient key={`areaGradient-${index}`} id={`areaGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                            <stop offset="50%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                            <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1} />
                          </linearGradient>
                        ))}
                        
                        {/* Glow Effect */}
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <CartesianGrid 
                        strokeDasharray="1 3" 
                        stroke={isDark ? '#374151' : '#e2e8f0'} 
                        strokeOpacity={0.2}
                        vertical={false}
                      />
                      
                      <XAxis 
                        dataKey="date" 
                        stroke={isDark ? '#9CA3AF' : '#64748B'} 
                        fontSize={11}
                        fontWeight={500}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      
                      <YAxis 
                        stroke={isDark ? '#9CA3AF' : '#64748B'} 
                        fontSize={11}
                        fontWeight={500}
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        tickFormatter={(value) => formatCurrency(value, '').split(' ')[0]}
                      />
                      
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '16px',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                          color: isDark ? '#FFFFFF' : '#000000',
                          backdropFilter: 'blur(16px)',
                          padding: '12px 16px'
                        }}
                        labelStyle={{ 
                          color: isDark ? '#E2E8F0' : '#475569',
                          fontWeight: 600,
                          marginBottom: '8px'
                        }}
                        formatter={(value, name) => [
                          <div key={name} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[Object.keys(analytics?.balance_history || {}).indexOf(name as string) % COLORS.length] }}
                            />
                            <span className="font-semibold">{formatCurrency(Number(value))}</span>
                          </div>, 
                          name
                        ]}
                      />

                      {Object.keys(analytics?.balance_history || {}).map((asset, index) => (
                        <Area
                          key={asset}
                          type="monotone"
                          dataKey={asset}
                          stackId="1"
                          stroke={COLORS[index % COLORS.length]}
                          fill={`url(#areaGradient-${index})`}
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ 
                            r: 6, 
                            fill: COLORS[index % COLORS.length],
                            stroke: isDark ? '#1F2937' : '#FFFFFF',
                            strokeWidth: 2,
                            filter: 'url(#glow)'
                          }}
                          animationBegin={600}
                          animationDuration={2000}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Balance Summary */}
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(analytics?.balance_history || {}).slice(0, 4).map(([asset, data], index) => {
                      const currentValue = (data as any).values?.[(data as any).values?.length - 1] || 0
                      const previousValue = (data as any).values?.[(data as any).values?.length - 2] || 0
                      const change = currentValue - previousValue
                      const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0
                      
                        return (
                        <div key={asset} className={`p-3 rounded-xl border ${
                          isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className={`text-xs font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                              {asset}
                            </span>
                          </div>
                          <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {formatCurrency(currentValue)}
                          </div>
                          <div className={`text-xs flex items-center gap-1 ${
                            change >= 0 
                              ? 'text-emerald-400' 
                              : 'text-red-400'
                          }`}>
                            {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(changePercent).toFixed(1)}%
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

            {/* Chat Interface Placeholder */}
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
              <div className="text-center space-y-4">
                <Bot className="w-16 h-16 text-blue-500 mx-auto" />
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  AI Assistant Coming Soon
                </h3>
                <p className={`${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  Interactive chat with your personal financial AI assistant will be available in the next update.
                </p>
                <div className="flex justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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