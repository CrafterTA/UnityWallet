import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  BarChart3, 
  Shield, 
  AlertTriangle, 
  Bot, 
  Zap, 
  Clock,
  Users,
  Wallet,
  Target,
  TrendingDown,
  Eye,
  Brain,
  Gauge
} from 'lucide-react'
import { mlApi } from '@/api/ml'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/session'

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

function Insights() {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const { wallet } = useAuthStore()
  
  const publicKey = wallet?.public_key || ''

  // Fetch comprehensive wallet analytics from ML service
  const { data: walletAnalytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['ml-wallet-comprehensive', publicKey],
    queryFn: () => mlApi.getWalletAnalytics(publicKey, 90),
    enabled: !!publicKey,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Fetch wallet features (lighter endpoint)
  const { data: walletFeatures, isLoading: featuresLoading, error: featuresError } = useQuery({
    queryKey: ['ml-wallet-features', publicKey],
    queryFn: () => mlApi.getWalletFeatures(publicKey),
    enabled: !!publicKey,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Fetch wallet summary
  const { data: walletSummary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['ml-wallet-summary', publicKey],
    queryFn: () => mlApi.getWalletSummary(publicKey),
    enabled: !!publicKey,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Fetch balance history for charts
  const { data: balanceHistory, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['ml-balance-history', publicKey],
    queryFn: () => mlApi.getBalanceHistory(publicKey),
    enabled: !!publicKey,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Fetch anomalies
  const { data: anomalyData, isLoading: anomaliesLoading, error: anomaliesError } = useQuery({
    queryKey: ['ml-anomalies', publicKey],
    queryFn: () => mlApi.checkAnomalies(publicKey, 30),
    enabled: !!publicKey,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  const isLoading = analyticsLoading || featuresLoading || summaryLoading || historyLoading || anomaliesLoading
  const hasError = analyticsError || featuresError || summaryError || historyError || anomaliesError

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="max-w-7xl mx-auto space-y-6 px-6 py-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`h-32 backdrop-blur-xl rounded-2xl border animate-pulse ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'
            }`} />
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
        </div>
      </div>
    )
  }

  // Process data for charts
  const features = walletAnalytics?.features || walletFeatures
  const summary = walletSummary
  const anomalies = (anomalyData as any)?.anomalies || []
  const riskScore = (anomalyData as any)?.risk_score || 0

  // Prepare chart data
  const assetDistribution = summary?.current_balances ? 
    Object.entries(summary.current_balances).map(([asset, balance], index) => ({
      name: asset,
      value: parseFloat(balance as string),
      color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0) : []

  const transactionTypes = summary?.transaction_counts ? 
    Object.entries(summary.transaction_counts).map(([type, count], index) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: count as number,
      color: COLORS[index % COLORS.length]
    })) : []

  const balanceChartData = balanceHistory && Object.keys(balanceHistory).length > 0 ?
    Object.entries(balanceHistory).flatMap(([asset, data]: [string, any]) => 
      data.timestamps?.map((timestamp: string, index: number) => ({
        date: new Date(timestamp).toLocaleDateString(),
        [asset]: data.values?.[index] || 0
      })) || []
    ) : []

  return (
    <div className={`min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            AI-Powered Wallet Insights
          </h1>
          <p className={isDark ? 'text-white/70' : 'text-slate-600'}>
            Machine learning analysis of your blockchain activity
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 px-6">

        {/* Risk Assessment Card */}
        <div className="bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  riskScore < 0.3 ? 'bg-gradient-to-br from-green-500 to-green-600' :
                  riskScore < 0.7 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                  'bg-gradient-to-br from-red-500 to-red-600'
                }`}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Security Risk Score
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                    AI-powered security assessment
                  </p>
                </div>
              </div>
              <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {(riskScore * 100).toFixed(1)}%
              </div>
              <div className="flex items-center gap-2">
                <span className={isDark ? 'text-white/90' : 'text-slate-700'}>Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  riskScore < 0.3 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                  riskScore < 0.7 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                  'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {(anomalyData as any)?.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'}`}>
                <p className={`text-sm mb-1 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  Anomalies Detected
                </p>
                <p className={`font-semibold text-2xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {(anomalyData as any)?.anomaly_count || 0}
                </p>
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
            color="from-blue-500 to-blue-600"
            isDark={isDark}
          />
          <MetricCard
            icon={DollarSign}
            title="Net Flow"
            value={`$${summary?.amounts?.net_flow?.toFixed(2) || '0.00'}`}
            color="from-green-500 to-green-600"
            isDark={isDark}
          />
          <MetricCard
            icon={TrendingUp}
            title="Transactions/Month"
            value={features?.transactions_per_month?.toFixed(1) || '0'}
            color="from-purple-500 to-purple-600"
            isDark={isDark}
          />
          <MetricCard
            icon={Gauge}
            title="Activity Level"
            value={summary?.activity_level?.replace('_', ' ').toUpperCase() || 'LOW'}
            color="from-orange-500 to-red-500"
            isDark={isDark}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Distribution */}
          {assetDistribution.length > 0 && (
            <ChartCard title="Asset Distribution" icon={Wallet} isDark={isDark}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {assetDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Balance']} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Transaction Types */}
          {transactionTypes.length > 0 && (
            <ChartCard title="Transaction Types" icon={BarChart3} isDark={isDark}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={transactionTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e2e8f0'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? '#9CA3AF' : '#64748B'} 
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={isDark ? '#9CA3AF' : '#64748B'} 
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                      borderRadius: '8px',
                      color: isDark ? '#FFFFFF' : '#000000'
                    }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Balance History Chart */}
        {balanceChartData.length > 0 && (
          <ChartCard title="Balance History" icon={TrendingUp} isDark={isDark}>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={balanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e2e8f0'} />
                <XAxis 
                  dataKey="date" 
                  stroke={isDark ? '#9CA3AF' : '#64748B'} 
                  fontSize={12}
                />
                <YAxis 
                  stroke={isDark ? '#9CA3AF' : '#64748B'} 
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
                    borderRadius: '8px',
                    color: isDark ? '#FFFFFF' : '#000000'
                  }}
                />
                {Object.keys(balanceHistory || {}).map((asset, index) => (
                  <Line 
                    key={asset}
                    type="monotone" 
                    dataKey={asset} 
                    stroke={COLORS[index % COLORS.length]} 
                    strokeWidth={2}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Anomaly Detection */}
        {anomalies.length > 0 && (
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Anomaly Detection
                </h3>
                <p className={isDark ? 'text-white/70' : 'text-slate-600'}>
                  AI-powered security alerts and unusual activity detection
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {anomalies.slice(0, 5).map((anomaly: any, index: number) => (
                <AnomalyCard key={index} anomaly={anomaly} isDark={isDark} />
              ))}
            </div>
          </div>
        )}

        {/* Feature Analysis */}
        {features && (
          <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Advanced Analytics
                </h3>
                <p className={isDark ? 'text-white/70' : 'text-slate-600'}>
                  Machine learning feature analysis
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FeatureCard
                title="Peak Hours"
                value={features.peak_transaction_hours?.join(', ') || 'N/A'}
                description="Most active hours"
                isDark={isDark}
              />
              <FeatureCard
                title="Refund Frequency"
                value={`${(features.refund_frequency * 100).toFixed(1)}%`}
                description="Reverse transaction pattern"
                isDark={isDark}
              />
              <FeatureCard
                title="Large Transactions"
                value={features.large_transaction_count?.toString() || '0'}
                description="High-value transactions"
                isDark={isDark}
              />
              <FeatureCard
                title="Frequent Destinations"
                value={features.frequent_destinations?.length?.toString() || '0'}
                description="Regular recipients"
                isDark={isDark}
              />
              <FeatureCard
                title="Payment Count"
                value={features.payment_count?.toString() || '0'}
                description="Payment transactions"
                isDark={isDark}
              />
              <FeatureCard
                title="Swap Count"
                value={features.swap_count?.toString() || '0'}
                description="Swap transactions"
                isDark={isDark}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Helper Components
const MetricCard = ({ icon: Icon, title, value, color, isDark }: any) => (
  <div className={`${isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white/80 border-slate-200 hover:border-slate-300'} backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 group`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div>
      <p className={`text-sm mb-1 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{title}</p>
      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {value}
      </p>
    </div>
  </div>
)

const ChartCard = ({ title, icon: Icon, children, isDark }: any) => (
  <div className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-2xl p-6 border`}>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
    </div>
    {children}
  </div>
)

const AnomalyCard = ({ anomaly, isDark }: any) => (
  <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${
        anomaly.confidence_score > 0.8 ? 'bg-red-500/20 text-red-400' :
        anomaly.confidence_score > 0.6 ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-blue-500/20 text-blue-400'
      }`}>
        <AlertTriangle className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <h4 className={`font-semibold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {anomaly.anomaly_type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Anomaly Detected'}
        </h4>
        <p className={`text-sm mb-2 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          {anomaly.description || 'Unusual activity detected'}
        </p>
        <div className="flex items-center justify-between text-xs">
          <span className={`${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            Confidence: {(anomaly.confidence_score * 100).toFixed(1)}%
          </span>
          <span className={`${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            {new Date(anomaly.timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  </div>
)

const FeatureCard = ({ title, value, description, isDark }: any) => (
  <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
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
)

export default Insights