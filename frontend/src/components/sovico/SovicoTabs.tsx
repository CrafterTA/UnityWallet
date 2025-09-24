import React from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { 
  BarChart3, 
  Package, 
  Building2, 
  ShoppingCart, 
  Gift, 
  BookOpen, 
  Phone,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react'

interface SovicoTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: string
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
  onFilterClick: () => void
  showSearch?: boolean
  showSort?: boolean
  showFilter?: boolean
}

const SovicoTabs: React.FC<SovicoTabsProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  onFilterClick,
  showSearch = true,
  showSort = true,
  showFilter = true
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()

  const tabs = [
    { 
      id: 'overview', 
      label: t('sovico.tabs.overview', 'Tổng quan'), 
      icon: BarChart3,
      description: t('sovico.tabs.overviewDesc', 'Tổng quan về Hệ sinh thái Sovico')
    },
    { 
      id: 'solutions', 
      label: t('sovico.tabs.solutions', 'Gói giải pháp'), 
      icon: Package,
      description: t('sovico.tabs.solutionsDesc', 'Các gói dịch vụ kết hợp')
    },
    { 
      id: 'businesses', 
      label: t('sovico.tabs.businesses', 'Doanh nghiệp'), 
      icon: Building2,
      description: t('sovico.tabs.businessesDesc', 'Thông tin các công ty thành viên')
    },
    { 
      id: 'services', 
      label: t('sovico.tabs.services', 'Dịch vụ'), 
      icon: ShoppingCart,
      description: t('sovico.tabs.servicesDesc', 'Marketplace dịch vụ')
    },
    { 
      id: 'promotions', 
      label: t('sovico.tabs.promotions', 'Ưu đãi'), 
      icon: Gift,
      description: t('sovico.tabs.promotionsDesc', 'Khuyến mãi và ưu đãi')
    },
    { 
      id: 'stories', 
      label: t('sovico.tabs.stories', 'Stories'), 
      icon: BookOpen,
      description: t('sovico.tabs.storiesDesc', 'Câu chuyện thành công')
    },
    { 
      id: 'contact', 
      label: t('sovico.tabs.contact', 'Liên hệ'), 
      icon: Phone,
      description: t('sovico.tabs.contactDesc', 'Hỗ trợ và liên hệ')
    }
  ]

  const sortOptions = [
    { value: 'popularity', label: t('sovico.sort.popularity', 'Phổ biến') },
    { value: 'price', label: t('sovico.sort.price', 'Giá') },
    { value: 'rating', label: t('sovico.sort.rating', 'Đánh giá') },
    { value: 'name', label: t('sovico.sort.name', 'Tên') },
    { value: 'createdAt', label: t('sovico.sort.newest', 'Mới nhất') }
  ]

  return (
    <div className="sticky top-0 z-40 border-b border-gray-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation */}
        <div className="flex flex-col lg:flex-row gap-4 py-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 lg:gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-red-500 to-yellow-500 text-white shadow-lg'
                    : isDark
                      ? 'text-white/70 hover:text-white hover:bg-white/10'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title={tab.description}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search and Controls */}
          <div className="flex flex-1 gap-3">
            {/* Search */}
            {showSearch && (
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t('sovico.search.placeholder', 'Tìm kiếm dịch vụ, gói giải pháp...')}
                    className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm ${
                      isDark
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-red-500/50 focus:ring-red-500/20'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500 focus:ring-red-500/20'
                    } focus:outline-none focus:ring-2`}
                  />
                </div>
              </div>
            )}

            {/* Sort - Only show for certain tabs */}
            {showSort && !['solutions', 'services'].includes(activeTab) && (
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value, sortOrder)}
                  className={`px-3 py-2 rounded-xl border text-sm ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white focus:border-red-500/50 focus:ring-red-500/20'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
                  } focus:outline-none focus:ring-2`}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`p-2 rounded-xl border transition-colors ${
                    isDark
                      ? 'border-white/20 text-white hover:bg-white/10'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                  title={sortOrder === 'asc' ? t('sovico.sort.desc', 'Giảm dần') : t('sovico.sort.asc', 'Tăng dần')}
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Filter - Only show for certain tabs */}
            {showFilter && !['solutions', 'services'].includes(activeTab) && (
              <button
                onClick={onFilterClick}
                className={`px-4 py-2 rounded-xl border font-medium text-sm transition-colors ${
                  isDark
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Filter className="w-4 h-4 inline mr-2" />
                {t('sovico.filter.button', 'Bộ lọc')}
              </button>
            )}
          </div>
        </div>

        {/* Active Tab Description */}
        {activeTab && (
          <div className="pb-4">
            <div className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
              {tabs.find(tab => tab.id === activeTab)?.description}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SovicoTabs
