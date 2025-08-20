import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, PiggyBank, CreditCard, Star, BarChart3, Target, Zap, TrendingDown, Wallet } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

function Insights() {
  const { t } = useTranslation()
  const { data: spendingSummary, isLoading } = useQuery({
    queryKey: ['spending-summary'],
    queryFn: analyticsApi.getSpendingSummary,
  })

  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: analyticsApi.getInsights,
  })

  const { data: creditScore } = useQuery({
    queryKey: ['credit-score'],
    queryFn: analyticsApi.getCreditScore,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen text-white">
        <div className="max-w-6xl mx-auto space-y-6 px-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-6xl mx-auto space-y-6 px-6">
                          {/* Enhanced Header */}
         <div className="mb-8">
           <div className="text-center">
             <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <BarChart3 className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl font-bold text-white mb-2">{t('insights.title', 'Financial Insights')}</h1>
             <p className="text-white/70">{t('insights.subtitle', 'Track your spending patterns and discover smart savings opportunities with AI-powered insights')}</p>
           </div>
         </div>

        {/* Credit Score Card */}
        {creditScore && (
          <div className="bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">{t('insights.creditScore', 'Credit Score')}</h3>
                    <p className="text-white/70 text-sm">{t('insights.creditScoreDesc', 'Your financial health indicator')}</p>
                  </div>
                </div>
                <div className="text-4xl font-bold text-white">{creditScore.score}</div>
                <div className="flex items-center gap-2">
                  <span className="text-white/90">{t('insights.grade', 'Grade')}:</span>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30">
                    {creditScore.grade}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-sm text-white/70 mb-1">{t('insights.status', 'Status')}</p>
                  <p className="text-white font-semibold">{creditScore.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">{t('insights.thisMonth', 'This Month')}</p>
              <p className="text-2xl font-bold text-white">
                ${spendingSummary?.total_spent || '0'}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                <PiggyBank className="w-6 h-6 text-white" />
              </div>
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">{t('insights.potentialSavings', 'Potential Savings')}</p>
              <p className="text-2xl font-bold text-green-400">
                ${insights?.potential_savings || '0'}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">{t('insights.avgSpending', 'Avg. Daily')}</p>
              <p className="text-2xl font-bold text-blue-400">
                ${Math.round((spendingSummary?.total_spent || 0) / 30)}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <Star className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">{t('insights.categories', 'Categories')}</p>
              <p className="text-2xl font-bold text-purple-400">
                {spendingSummary?.categories?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category */}
          {spendingSummary?.categories && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{t('insights.spendingByCategory', 'Spending by Category')}</h3>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingSummary.categories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {spendingSummary.categories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          {spendingSummary?.monthly_trend && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white">{t('insights.monthlyTrend', 'Monthly Spending Trend')}</h3>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendingSummary.monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, 'Spent']}
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        color: 'white'
                      }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="url(#gradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#F59E0B" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Insights & Recommendations */}
        {insights?.recommendations && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-2">{t('insights.recommendations', 'Personalized Recommendations')}</h3>
              <p className="text-white/70">{t('insights.recommendationsDesc', 'AI-powered insights to help you save more')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex-shrink-0">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                        {recommendation.title}
                      </h4>
                      <p className="text-white/70 mb-4 leading-relaxed">
                        {recommendation.description}
                      </p>
                      {recommendation.savings && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
                          <PiggyBank className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-medium text-green-400">
                            {t('insights.saveAmount', 'Save')} ${recommendation.savings}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Offer Card */}
        <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{t('insights.specialOffer', 'Special Offer')}</h3>
              <p className="text-white/70">{t('insights.specialOfferDesc', 'Exclusive deals just for you')}</p>
            </div>
          </div>
          <p className="text-white/90 text-lg mb-6 leading-relaxed">
            {t('insights.travelOffer', 'Save 15% on travel bundles! Book flights + accommodation together using SkyPoints.')}
          </p>
          <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl">
            {t('insights.exploreDeals', 'Explore Deals')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Insights
