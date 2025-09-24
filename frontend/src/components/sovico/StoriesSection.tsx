import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { 
  BookOpen, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  User, 
  Eye, 
  Heart, 
  Share2, 
  ExternalLink,
  Clock,
  Tag,
  ArrowRight,
  Filter,
  Search,
  Grid,
  List,
  Volume2,
  VolumeX
} from 'lucide-react'
import { SovicoStory } from '@/types/sovico'

interface StoriesSectionProps {
  stories: SovicoStory[]
  onViewStory?: (story: SovicoStory) => void
  onLikeStory?: (storyId: string) => void
  onShareStory?: (story: SovicoStory) => void
  onViewAllStories?: () => void
  onFilterStories?: (filters: { category?: string; mediaType?: string; dateRange?: string }) => void
}

const StoriesSection: React.FC<StoriesSectionProps> = ({
  stories,
  onViewStory,
  onLikeStory,
  onShareStory,
  onViewAllStories,
  onFilterStories
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMediaType, setSelectedMediaType] = useState('all')
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set())

  const tabs = [
    { id: 'all', label: t('stories.tabs.all', 'Tất cả'), icon: BookOpen },
    { id: 'blog', label: t('stories.tabs.blog', 'Blog'), icon: BookOpen },
    { id: 'video', label: t('stories.tabs.video', 'Video'), icon: Play },
    { id: 'podcast', label: t('stories.tabs.podcast', 'Podcast'), icon: Volume2 },
    { id: 'timeline', label: t('stories.tabs.timeline', 'Timeline'), icon: Calendar }
  ]

  const categories = [
    { id: 'all', label: t('stories.categories.all', 'Tất cả') },
    { id: 'business', label: t('stories.categories.business', 'Kinh doanh') },
    { id: 'technology', label: t('stories.categories.technology', 'Công nghệ') },
    { id: 'finance', label: t('stories.categories.finance', 'Tài chính') },
    { id: 'lifestyle', label: t('stories.categories.lifestyle', 'Lối sống') },
    { id: 'education', label: t('stories.categories.education', 'Giáo dục') }
  ]

  const mediaTypes = [
    { id: 'all', label: t('stories.mediaTypes.all', 'Tất cả') },
    { id: 'video', label: t('stories.mediaTypes.video', 'Video') },
    { id: 'audio', label: t('stories.mediaTypes.audio', 'Audio') },
    { id: 'text', label: t('stories.mediaTypes.text', 'Văn bản') },
    { id: 'image', label: t('stories.mediaTypes.image', 'Hình ảnh') }
  ]

  // Filter stories based on active tab and filters
  const filteredStories = stories.filter(story => {
    const matchesTab = activeTab === 'all' || story.mediaType === activeTab
    const matchesSearch = searchQuery === '' || 
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || story.category === selectedCategory
    const matchesMediaType = selectedMediaType === 'all' || story.mediaType === selectedMediaType
    
    return matchesTab && matchesSearch && matchesCategory && matchesMediaType
  })

  // Auto-rotate featured stories - DISABLED
  // useEffect(() => {
  //   if (isPlaying && filteredStories.length > 1) {
  //     const interval = setInterval(() => {
  //       setCurrentStoryIndex((prev) => (prev + 1) % filteredStories.length)
  //     }, 5000)
  //     return () => clearInterval(interval)
  //   }
  // }, [isPlaying, filteredStories.length])

  const handleLike = (storyId: string) => {
    setLikedStories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(storyId)) {
        newSet.delete(storyId)
      } else {
        newSet.add(storyId)
      }
      return newSet
    })
    onLikeStory?.(storyId)
  }

  const handleShare = (story: SovicoStory) => {
    onShareStory?.(story)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderFeaturedStory = () => {
    if (filteredStories.length === 0) return null

    const story = filteredStories[currentStoryIndex]
    const isLiked = likedStories.has(story.id)

    return (
      <div className={`relative rounded-2xl overflow-hidden ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
        <div className="aspect-video bg-black relative">
          {story.mediaType === 'video' ? (
            <>
               <iframe
                 src={story.mediaUrl}
                 className="w-full h-full"
                 frameBorder="0"
                 allowFullScreen
                 title={story.title}
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                 sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox"
                 referrerPolicy="no-referrer-when-downgrade"
                 loading="lazy"
               />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                    Video
                  </span>
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                    {story.category}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">{story.title}</h3>
                <p className="text-sm text-white/80 line-clamp-2">{story.excerpt}</p>
                
                {/* Navigation Controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentStoryIndex(Math.max(0, currentStoryIndex - 1))}
                      disabled={currentStoryIndex === 0}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-white/70">
                      {currentStoryIndex + 1} / {filteredStories.length}
                    </span>
                    <button
                      onClick={() => setCurrentStoryIndex(Math.min(filteredStories.length - 1, currentStoryIndex + 1))}
                      disabled={currentStoryIndex === filteredStories.length - 1}
                      className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(story.id)}
                      className={`p-2 rounded-full transition-colors ${
                        likedStories.has(story.id) 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${likedStories.has(story.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleShare(story)}
                      className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : story.mediaType === 'audio' || story.mediaType === 'podcast' ? (
            <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-yellow-500/20 flex items-center justify-center">
              <div className="text-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300 mb-4"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-red-500" />
                  ) : (
                    <Play className="w-8 h-8 text-red-500 ml-1" />
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  {story.duration && (
                    <span className="text-white/80 text-sm">
                      {formatDuration(story.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-yellow-500/20 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-white/60 mx-auto mb-4" />
                <p className="text-white/80 text-sm">
                  {t('stories.readMore', 'Đọc thêm')}
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {story.author?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {story.author}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                    {story.authorRole}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(story.createdAt)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLike(story.id)}
                className={`p-2 rounded-xl transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-600' 
                    : isDark 
                      ? 'hover:bg-white/10 text-white/60' 
                      : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => handleShare(story)}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onViewStory?.(story)}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300"
              >
                {t('stories.readMore', 'Đọc thêm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderStoryCard = (story: SovicoStory, index: number) => {
    const isLiked = likedStories.has(story.id)

    return (
      <div
        key={story.id}
        className={`${viewMode === 'grid' ? 'col-span-1' : 'col-span-full'} ${
          isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'
        } rounded-xl backdrop-blur-sm overflow-hidden hover:scale-105 transition-transform duration-300`}
      >
        <div className="aspect-video bg-gradient-to-br from-red-500/20 to-yellow-500/20 flex items-center justify-center relative">
          {story.mediaType === 'video' ? (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                onClick={() => onViewStory?.(story)}
                className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300"
              >
                <Play className="w-6 h-6 text-red-500 ml-1" />
              </button>
            </div>
          ) : (story.mediaType === 'audio' || story.mediaType === 'podcast') ? (
            <div className="text-center">
              <button
                onClick={() => onViewStory?.(story)}
                className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-300"
              >
                <Volume2 className="w-6 h-6 text-red-500" />
              </button>
            </div>
          ) : (
            <div className="text-center">
              <BookOpen className="w-12 h-12 text-white/60" />
            </div>
          )}
          
          {story.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {formatDuration(story.duration)}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              story.mediaType === 'video' ? 'bg-red-100 text-red-700' :
              story.mediaType === 'audio' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>
              {t(`stories.mediaTypes.${story.mediaType}`, story.mediaType)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'}`}>
              {t(`stories.categories.${story.category}`, story.category)}
            </span>
          </div>
          
          <h4 className={`font-semibold mb-2 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {story.title}
          </h4>
          
          <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {story.excerpt}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {story.author?.charAt(0) || 'A'}
                </span>
              </div>
              <div>
                <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {story.author}
                </p>
                <p className={`text-xs ${isDark ? 'text-white/60' : 'text-gray-500'}`}>
                  {formatDate(story.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleLike(story.id)}
                className={`p-1 rounded transition-colors ${
                  isLiked 
                    ? 'bg-red-100 text-red-600' 
                    : isDark 
                      ? 'hover:bg-white/10 text-white/60' 
                      : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => handleShare(story)}
                className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-white/10 text-white/60' : 'hover:bg-gray-100 text-gray-600'}`}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTimeline = () => {
    const timelineStories = stories
      .filter(story => story.mediaType === 'timeline')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return (
      <div className="space-y-6">
        {timelineStories.map((story, index) => (
          <div key={story.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full"></div>
              {index < timelineStories.length - 1 && (
                <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
              )}
            </div>
            <div className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {formatDate(story.createdAt)}
                </span>
              </div>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {story.title}
              </h4>
              <p className={`text-sm mb-3 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {story.excerpt}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {story.author?.charAt(0) || 'A'}
                  </span>
                </div>
                <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {story.author}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('stories.title', 'Stories & Media')}
          </h2>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('stories.subtitle', 'Câu chuyện, video và nội dung đa phương tiện')}
          </p>
        </div>
        <button
          onClick={onViewAllStories}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300"
        >
          {t('stories.viewAll', 'Xem tất cả')}
          <ArrowRight className="w-4 h-4" />
        </button>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder={t('stories.search', 'Tìm kiếm stories...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-sm ${
              isDark 
                ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm ${
            isDark 
              ? 'bg-white/5 border-white/10 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        
        <select
          value={selectedMediaType}
          onChange={(e) => setSelectedMediaType(e.target.value)}
          className={`px-3 py-2 rounded-xl border text-sm ${
            isDark 
              ? 'bg-white/5 border-white/10 text-white' 
              : 'bg-white border-gray-200 text-gray-900'
          }`}
        >
          {mediaTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl transition-colors ${
              viewMode === 'grid'
                ? 'bg-red-500 text-white'
                : isDark
                  ? 'hover:bg-white/10 text-white/70'
                  : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-colors ${
              viewMode === 'list'
                ? 'bg-red-500 text-white'
                : isDark
                  ? 'hover:bg-white/10 text-white/70'
                  : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'timeline' ? (
        renderTimeline()
      ) : (
        <div className="space-y-6">
          {/* Featured Story */}
          {filteredStories.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('stories.featured', 'Nổi bật')}
              </h3>
              {renderFeaturedStory()}
            </div>
          )}

          {/* Stories Grid */}
          {filteredStories.length > 0 ? (
            <div className={`grid gap-4 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              {filteredStories.map((story, index) => renderStoryCard(story, index))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h4 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('stories.noStories', 'Chưa có stories')}
              </h4>
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('stories.noStoriesDesc', 'Stories sẽ được cập nhật sớm')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StoriesSection
