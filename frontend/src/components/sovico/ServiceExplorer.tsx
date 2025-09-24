import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List, 
  Star, 
  Clock, 
  Users, 
  ShoppingCart,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Plane,
  Home,
  Zap
} from 'lucide-react'
import { SovicoService, SovicoFilter } from '@/types/sovico'

interface ServiceExplorerProps {
  services: SovicoService[]
  isLoading?: boolean
  onServiceSelect: (service: SovicoService) => void
  onFilterChange: (filters: SovicoFilter) => void
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  searchQuery: string
  onSearchChange: (query: string) => void
  filters: SovicoFilter
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

const ServiceExplorer: React.FC<ServiceExplorerProps> = ({
  services,
  isLoading = false,
  onServiceSelect,
  onFilterChange,
  onSortChange,
  searchQuery,
  onSearchChange,
  filters,
  sortBy,
  sortOrder
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)

  // Filter and sort services
  const filteredAndSortedServices = useMemo(() => {
    let filtered = services

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(service => service.category === filters.category)
    }

    // Apply subcategory filter
    if (filters.subcategory) {
      filtered = filtered.filter(service => service.subcategory === filters.subcategory)
    }

    // Apply company filter
    if (filters.company) {
      filtered = filtered.filter(service => service.company === filters.company)
    }

    // Apply price range filter
    if (filters.priceRange) {
      filtered = filtered.filter(service => {
        const price = service.price
        return price >= filters.priceRange!.min && price <= filters.priceRange!.max
      })
    }

    // Apply rating filter
    if (filters.rating) {
      filtered = filtered.filter(service => service.rating >= filters.rating!)
    }

    // Apply features filter
    if (filters.features && filters.features.length > 0) {
      filtered = filtered.filter(service =>
        filters.features!.some(feature => service.features.includes(feature))
      )
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(service =>
        filters.tags!.some(tag => service.tags.includes(tag))
      )
    }

    // Apply active filter
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(service => service.isActive === filters.isActive)
    }

    // Apply KYC filter
    if (filters.requiresKYC !== undefined) {
      filtered = filtered.filter(service => service.requiresKYC === filters.requiresKYC)
    }

    // Sort services
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'popularity':
        default:
          comparison = b.reviewCount - a.reviewCount
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [services, searchQuery, filters, sortBy, sortOrder])

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(services.map(service => service.category))]
    return uniqueCategories.map(category => ({
      value: category,
      label: t(`sovico.categories.${category}`, category),
      count: services.filter(service => service.category === category).length
    }))
  }, [services, t])

  const companies = useMemo(() => {
    const uniqueCompanies = [...new Set(services.map(service => service.company))]
    return uniqueCompanies.map(company => ({
      value: company,
      label: company,
      count: services.filter(service => service.company === company).length
    }))
  }, [services])

  const allFeatures = useMemo(() => {
    const features = new Set<string>()
    services.forEach(service => {
      service.features.forEach(feature => features.add(feature))
    })
    return Array.from(features).sort()
  }, [services])

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    services.forEach(service => {
      service.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [services])

  const priceRange = useMemo(() => {
    const prices = services.map(service => service.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  }, [services])

  const handleFilterChange = (key: keyof SovicoFilter, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value
    })
  }

  const clearFilters = () => {
    onFilterChange({})
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: currency === 'VND' ? 0 : 2
    }).format(amount)
  }

  // Function to get service icon based on category
  const getServiceIcon = (service: SovicoService) => {
    switch (service.category) {
      case 'banking':
        return <CreditCard className="w-16 h-16 text-blue-500" />
      case 'aviation':
        return <Plane className="w-16 h-16 text-red-500" />
      case 'hospitality':
        return <Home className="w-16 h-16 text-green-500" />
      case 'energy':
        return <Zap className="w-16 h-16 text-yellow-500" />
      default:
        return <ShoppingCart className="w-16 h-16 text-red-500" />
    }
  }

  const renderServiceCard = (service: SovicoService) => (
    <div
      key={service.id}
      className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer flex flex-col ${
        isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'
      }`}
      onClick={() => onServiceSelect(service)}
    >
      <div className="h-32 bg-gradient-to-br from-red-500/20 to-yellow-500/20 flex items-center justify-center">
        {getServiceIcon(service)}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {service.name}
          </h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700`}>
            {service.category}
          </span>
        </div>
        
        <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'} leading-relaxed`}>
          {service.description}
        </p>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {service.rating}
            </span>
            <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
              ({service.reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-blue-500" />
            <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
              {service.company}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {service.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                {feature}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatPrice(service.price, service.currency)}
              </div>
              {service.priceInSYP && (
                <div className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  {service.priceInSYP.toLocaleString()} SYP
                </div>
              )}
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300">
              {t('sovico.services.buy', 'Mua ngay')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderServiceListItem = (service: SovicoService) => (
    <div
      key={service.id}
      className={`p-6 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer ${
        isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'
      }`}
      onClick={() => onServiceSelect(service)}
    >
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-10 h-10 text-red-500" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {service.name}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700`}>
              {service.category}
            </span>
          </div>
          
          <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {service.description}
          </p>
          
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {service.rating}
              </span>
              <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                ({service.reviewCount})
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                {service.company}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-purple-500" />
              <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                {new Date(service.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {service.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs ${
                  isDark ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatPrice(service.price, service.currency)}
          </div>
          {service.priceInSYP && (
            <div className={`text-sm mb-4 ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
              {service.priceInSYP.toLocaleString()} SYP
            </div>
          )}
          <button className="px-6 py-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300">
            {t('sovico.services.buy', 'Mua ngay')}
          </button>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={`rounded-2xl overflow-hidden shadow-lg ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'}`}>
              <div className="h-32 bg-gray-200 animate-pulse" />
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('sovico.filters.title', 'Bộ lọc')}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSort(!showSort)}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
              }`}
            >
              {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
            </button>
            <div className="flex items-center border rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-red-500 text-white' : isDark ? 'text-white/70' : 'text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-red-500 text-white' : isDark ? 'text-white/70' : 'text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {t('sovico.filters.category', 'Danh mục')}
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white focus:border-red-500/50 focus:ring-red-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
                } focus:outline-none focus:ring-2`}
              >
                <option value="">{t('sovico.filters.allCategories', 'Tất cả danh mục')}</option>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label} ({category.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {t('sovico.filters.company', 'Công ty')}
              </label>
              <select
                value={filters.company || ''}
                onChange={(e) => handleFilterChange('company', e.target.value || undefined)}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white focus:border-red-500/50 focus:ring-red-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
                } focus:outline-none focus:ring-2`}
              >
                <option value="">{t('sovico.filters.allCompanies', 'Tất cả công ty')}</option>
                {companies.map((company) => (
                  <option key={company.value} value={company.value}>
                    {company.label} ({company.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {t('sovico.filters.priceRange', 'Khoảng giá')}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    min: e.target.value ? Number(e.target.value) : undefined
                  })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white focus:border-red-500/50 focus:ring-red-500/20'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
                  } focus:outline-none focus:ring-2`}
                />
                <span className={isDark ? 'text-white/70' : 'text-gray-500'}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    max: e.target.value ? Number(e.target.value) : undefined
                  })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white focus:border-red-500/50 focus:ring-red-500/20'
                      : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
                  } focus:outline-none focus:ring-2`}
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {t('sovico.filters.rating', 'Đánh giá tối thiểu')}
              </label>
              <select
                value={filters.rating || ''}
                onChange={(e) => handleFilterChange('rating', e.target.value ? Number(e.target.value) : undefined)}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white focus:border-red-500/50 focus:ring-red-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
                } focus:outline-none focus:ring-2`}
              >
                <option value="">{t('sovico.filters.anyRating', 'Bất kỳ')}</option>
                <option value="4">4+ ⭐</option>
                <option value="4.5">4.5+ ⭐</option>
                <option value="4.8">4.8+ ⭐</option>
              </select>
            </div>
          </div>
        )}

        {showSort && (
          <div className="mt-4">
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('sovico.filters.sortBy', 'Sắp xếp theo')}
            </label>
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value, sortOrder)}
                className={`px-3 py-2 rounded-xl border text-sm ${
                  isDark
                    ? 'bg-white/10 border-white/20 text-white focus:border-red-500/50 focus:ring-red-500/20'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500/20'
                } focus:outline-none focus:ring-2`}
              >
                <option value="popularity">{t('sovico.sort.popularity', 'Phổ biến')}</option>
                <option value="price">{t('sovico.sort.price', 'Giá')}</option>
                <option value="rating">{t('sovico.sort.rating', 'Đánh giá')}</option>
                <option value="name">{t('sovico.sort.name', 'Tên')}</option>
                <option value="createdAt">{t('sovico.sort.newest', 'Mới nhất')}</option>
              </select>
              
              <button
                onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                className={`p-2 rounded-xl border transition-colors ${
                  isDark
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(filters.category || filters.company || filters.priceRange || filters.rating) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
              {t('sovico.filters.active', 'Bộ lọc đang áp dụng')}:
            </span>
            {filters.category && (
              <span className="px-3 py-1 bg-red-500/20 text-red-700 rounded-full text-sm">
                {t(`sovico.categories.${filters.category}`, filters.category)}
                <button
                  onClick={() => handleFilterChange('category', undefined)}
                  className="ml-2 hover:text-red-900"
                >
                  <X className="w-3 h-3 inline" />
                </button>
              </span>
            )}
            {filters.company && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-700 rounded-full text-sm">
                {filters.company}
                <button
                  onClick={() => handleFilterChange('company', undefined)}
                  className="ml-2 hover:text-blue-900"
                >
                  <X className="w-3 h-3 inline" />
                </button>
              </span>
            )}
            {filters.rating && (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-700 rounded-full text-sm">
                {filters.rating}+ ⭐
                <button
                  onClick={() => handleFilterChange('rating', undefined)}
                  className="ml-2 hover:text-yellow-900"
                >
                  <X className="w-3 h-3 inline" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className={`px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t('sovico.filters.clearAll', 'Xóa tất cả')}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {t('sovico.results.found', 'Tìm thấy')} {filteredAndSortedServices.length} {t('sovico.results.services', 'dịch vụ')}
        </div>
        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {t('sovico.results.showing', 'Hiển thị')} {filteredAndSortedServices.length} {t('sovico.results.of', 'trong')} {services.length}
        </div>
      </div>

      {/* Services Grid/List */}
      {filteredAndSortedServices.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('sovico.results.noResults', 'Không tìm thấy dịch vụ')}
          </h3>
          <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('sovico.results.noResultsDesc', 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm')}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-8' 
          : 'space-y-4'
        }>
          {filteredAndSortedServices.map(service => 
            viewMode === 'grid' ? renderServiceCard(service) : renderServiceListItem(service)
          )}
        </div>
      )}
    </div>
  )
}

export default ServiceExplorer
