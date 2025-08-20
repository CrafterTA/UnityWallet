import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, PiggyBank, CreditCard, Star } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'

const COLORS = ['#E31E24', '#FFC107', '#16A34A', '#3B82F6', '#8B5CF6']

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
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-navy-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
                 <h1 className="text-2xl font-bold text-navy-900 mb-2">{t('insights.title', 'Financial Insights')}</h1>
         <p className="text-navy-600">{t('insights.subtitle', 'Track your spending and discover savings opportunities')}</p>
      </div>

      {/* Credit Score Card */}
      {creditScore && (
        <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Credit Score</h3>
              <div className="text-3xl font-bold">{creditScore.score}</div>
              <p className="opacity-90">Grade: {creditScore.grade}</p>
            </div>
            <div className="text-right">
              <Star className="w-12 h-12 opacity-80 mb-2" />
              <p className="text-sm opacity-90">{creditScore.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-navy-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-navy-600">This Month</p>
              <p className="text-xl font-bold text-navy-900">
                ${spendingSummary?.total_spent || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-navy-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-navy-600">Potential Savings</p>
              <p className="text-xl font-bold text-success">
                ${insights?.potential_savings || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spending by Category */}
      {spendingSummary?.categories && (
        <div className="bg-white rounded-xl p-6 border border-navy-200">
          <h3 className="font-semibold text-navy-900 mb-4">Spending by Category</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingSummary.categories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {spendingSummary.categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Trend */}
      {spendingSummary?.monthly_trend && (
        <div className="bg-white rounded-xl p-6 border border-navy-200">
          <h3 className="font-semibold text-navy-900 mb-4">Monthly Spending Trend</h3>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingSummary.monthly_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Spent']} />
                <Bar dataKey="amount" fill="#E31E24" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      {insights?.recommendations && (
        <div className="space-y-4">
          <h3 className="font-semibold text-navy-900">Personalized Recommendations</h3>
          
          {insights.recommendations.map((recommendation, index) => (
            <div key={index} className="bg-white rounded-xl p-4 border border-navy-200">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-medium text-navy-900 mb-1">
                    {recommendation.title}
                  </h4>
                  <p className="text-sm text-navy-600 mb-2">
                    {recommendation.description}
                  </p>
                  {recommendation.savings && (
                    <div className="inline-flex items-center px-2 py-1 bg-success/10 rounded-full">
                      <span className="text-xs font-medium text-success">
                        Save ${recommendation.savings}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Travel Bundle Offer */}
      <div className="bg-gradient-to-r from-accent to-orange-400 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <CreditCard className="w-6 h-6" />
          <h3 className="font-semibold text-lg">Special Offer</h3>
        </div>
        <p className="mb-3">
          Save 15% on travel bundles! Book flights + accommodation together using SkyPoints.
        </p>
        <button className="bg-white text-accent font-semibold py-2 px-4 rounded-lg hover:bg-navy-50 transition-colors">
          Explore Deals
        </button>
      </div>
    </div>
  )
}

export default Insights
