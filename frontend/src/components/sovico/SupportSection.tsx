import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send, 
  Calendar, 
  User, 
  Building2, 
  HelpCircle, 
  Search, 
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  ThumbsUp,
  ThumbsDown,
  Bot,
  Headphones,
  FileText,
  Download,
  Share2
} from 'lucide-react'

interface SupportSectionProps {
  onContactSupport?: (data: ContactFormData) => void
  onScheduleAppointment?: (data: AppointmentData) => void
  onStartChatbot?: () => void
  onViewFAQ?: () => void
  onDownloadGuide?: (type: 'user' | 'business' | 'developer') => void
  onRateSupport?: (rating: number, feedback?: string) => void
}

interface ContactFormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high'
  category: 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report'
}

interface AppointmentData {
  name: string
  email: string
  phone: string
  date: string
  time: string
  service: string
  message: string
}

const SupportSection: React.FC<SupportSectionProps> = ({
  onContactSupport,
  onScheduleAppointment,
  onStartChatbot,
  onViewFAQ,
  onDownloadGuide,
  onRateSupport
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  
  const [activeTab, setActiveTab] = useState('contact')
  const [expandedFAQ, setExpandedFAQ] = useState<Set<number>>(new Set())
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  })
  const [appointmentForm, setAppointmentForm] = useState<AppointmentData>({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    service: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const tabs = [
    { id: 'contact', label: t('support.tabs.contact', 'Liên hệ'), icon: Phone },
    { id: 'appointment', label: t('support.tabs.appointment', 'Đặt lịch'), icon: Calendar },
    { id: 'faq', label: t('support.tabs.faq', 'FAQ'), icon: HelpCircle },
    { id: 'chatbot', label: t('support.tabs.chatbot', 'Chatbot'), icon: Bot },
    { id: 'resources', label: t('support.tabs.resources', 'Tài liệu'), icon: FileText }
  ]

  const priorities = [
    { id: 'low', label: t('support.priorities.low', 'Thấp'), color: 'green' },
    { id: 'medium', label: t('support.priorities.medium', 'Trung bình'), color: 'yellow' },
    { id: 'high', label: t('support.priorities.high', 'Cao'), color: 'red' }
  ]

  const categories = [
    { id: 'technical', label: t('support.categories.technical', 'Kỹ thuật') },
    { id: 'billing', label: t('support.categories.billing', 'Thanh toán') },
    { id: 'general', label: t('support.categories.general', 'Chung') },
    { id: 'feature_request', label: t('support.categories.feature_request', 'Yêu cầu tính năng') },
    { id: 'bug_report', label: t('support.categories.bug_report', 'Báo lỗi') }
  ]

  const services = [
    { id: 'consultation', label: t('support.services.consultation', 'Tư vấn') },
    { id: 'technical_support', label: t('support.services.technical_support', 'Hỗ trợ kỹ thuật') },
    { id: 'training', label: t('support.services.training', 'Đào tạo') },
    { id: 'integration', label: t('support.services.integration', 'Tích hợp') },
    { id: 'custom_development', label: t('support.services.custom_development', 'Phát triển tùy chỉnh') }
  ]

  const faqItems = [
    {
      id: 1,
      question: t('support.faq.howToStart', 'Làm thế nào để bắt đầu sử dụng Sovico?'),
      answer: t('support.faq.howToStartAnswer', 'Bạn có thể bắt đầu bằng cách tạo tài khoản, kết nối ví của mình và khám phá các dịch vụ có sẵn trong hệ sinh thái Sovico.')
    },
    {
      id: 2,
      question: t('support.faq.paymentMethods', 'Các phương thức thanh toán nào được hỗ trợ?'),
      answer: t('support.faq.paymentMethodsAnswer', 'Chúng tôi hỗ trợ thanh toán bằng SYP, XLM, USDC và các loại tiền điện tử khác thông qua mạng Stellar.')
    },
    {
      id: 3,
      question: t('support.faq.security', 'Dữ liệu của tôi có an toàn không?'),
      answer: t('support.faq.securityAnswer', 'Chúng tôi sử dụng mã hóa end-to-end và các công nghệ bảo mật tiên tiến để bảo vệ dữ liệu của bạn.')
    },
    {
      id: 4,
      question: t('support.faq.fees', 'Có phí giao dịch nào không?'),
      answer: t('support.faq.feesAnswer', 'Phí giao dịch rất thấp và được tính dựa trên mạng Stellar. Chúng tôi cung cấp bảng phí minh bạch.')
    },
    {
      id: 5,
      question: t('support.faq.technicalIssues', 'Tôi gặp vấn đề kỹ thuật, làm sao để được hỗ trợ?'),
      answer: t('support.faq.technicalIssuesAnswer', 'Bạn có thể liên hệ qua hotline, email hoặc sử dụng chatbot để được hỗ trợ 24/7.')
    }
  ]

  const contactInfo = {
    hotline: '+84 28 1234 5678',
    email: 'support@sovico.com',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM, Việt Nam',
    hours: '24/7'
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onContactSupport?.(contactForm)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      console.error('Error submitting contact form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onScheduleAppointment?.(appointmentForm)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (error) {
      console.error('Error scheduling appointment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const renderContact = () => (
    <div className="space-y-6">
      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('support.contactInfo', 'Thông tin liên hệ')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {contactInfo.hotline}
                </p>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {t('support.hotline', 'Hotline')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {contactInfo.email}
                </p>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {t('support.email', 'Email')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {contactInfo.address}
                </p>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {t('support.address', 'Địa chỉ')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {contactInfo.hours}
                </p>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {t('support.hours', 'Giờ làm việc')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('support.quickActions', 'Hành động nhanh')}
          </h3>
          <div className="space-y-3">
            <button
              onClick={onStartChatbot}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-red-600 hover:to-yellow-600 transition-all duration-300"
            >
              <Bot className="w-5 h-5" />
              <span>{t('support.startChatbot', 'Bắt đầu Chatbot')}</span>
            </button>
            
            <button
              onClick={onViewFAQ}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span>{t('support.viewFAQ', 'Xem FAQ')}</span>
            </button>
            
            <button
              onClick={() => onDownloadGuide?.('user')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>{t('support.downloadGuide', 'Tải hướng dẫn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contact Form */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('support.contactForm', 'Gửi yêu cầu hỗ trợ')}
        </h3>
        
        {submitted && (
          <div className="mb-4 p-4 bg-green-100 border border-green-200 rounded-xl flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{t('support.submitted', 'Yêu cầu đã được gửi thành công!')}</span>
          </div>
        )}

        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {t('support.name', 'Họ và tên')} *
              </label>
              <input
                type="text"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
                placeholder={t('support.namePlaceholder', 'Nhập họ và tên')}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {t('support.email', 'Email')} *
              </label>
              <input
                type="email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
                placeholder={t('support.emailPlaceholder', 'Nhập email')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {t('support.phone', 'Số điện thoại')}
              </label>
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                className={`w-full px-3 py-2 rounded-xl border ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
                placeholder={t('support.phonePlaceholder', 'Nhập số điện thoại')}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {t('support.priority', 'Mức độ ưu tiên')}
              </label>
              <select
                value={contactForm.priority}
                onChange={(e) => setContactForm(prev => ({ ...prev, priority: e.target.value as any }))}
                className={`w-full px-3 py-2 rounded-xl border ${
                  isDark 
                    ? 'bg-white/5 border-white/10 text-white' 
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {priorities.map((priority) => (
                  <option key={priority.id} value={priority.id}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.category', 'Danh mục')}
            </label>
            <select
              value={contactForm.category}
              onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value as any }))}
              className={`w-full px-3 py-2 rounded-xl border ${
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
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.subject', 'Tiêu đề')} *
            </label>
            <input
              type="text"
              required
              value={contactForm.subject}
              onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
              className={`w-full px-3 py-2 rounded-xl border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              placeholder={t('support.subjectPlaceholder', 'Nhập tiêu đề')}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.message', 'Nội dung')} *
            </label>
            <textarea
              required
              rows={4}
              value={contactForm.message}
              onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
              className={`w-full px-3 py-2 rounded-xl border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              placeholder={t('support.messagePlaceholder', 'Mô tả chi tiết vấn đề của bạn')}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-red-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('support.submitting', 'Đang gửi...') : t('support.submit', 'Gửi yêu cầu')}
          </button>
        </form>
      </div>
    </div>
  )

  const renderAppointment = () => (
    <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {t('support.scheduleAppointment', 'Đặt lịch hẹn')}
      </h3>
      
      {submitted && (
        <div className="mb-4 p-4 bg-green-100 border border-green-200 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{t('support.appointmentScheduled', 'Lịch hẹn đã được đặt thành công!')}</span>
        </div>
      )}

      <form onSubmit={handleAppointmentSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.name', 'Họ và tên')} *
            </label>
            <input
              type="text"
              required
              value={appointmentForm.name}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-3 py-2 rounded-xl border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              placeholder={t('support.namePlaceholder', 'Nhập họ và tên')}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.email', 'Email')} *
            </label>
            <input
              type="email"
              required
              value={appointmentForm.email}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full px-3 py-2 rounded-xl border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              placeholder={t('support.emailPlaceholder', 'Nhập email')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.phone', 'Số điện thoại')} *
            </label>
            <input
              type="tel"
              required
              value={appointmentForm.phone}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, phone: e.target.value }))}
              className={`w-full px-3 py-2 rounded-xl border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
              placeholder={t('support.phonePlaceholder', 'Nhập số điện thoại')}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.service', 'Dịch vụ')} *
            </label>
            <select
              required
              value={appointmentForm.service}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, service: e.target.value }))}
              className={`w-full px-3 py-2 rounded-xl border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value="">{t('support.selectService', 'Chọn dịch vụ')}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.date', 'Ngày')} *
            </label>
            <input
              type="date"
              required
              value={appointmentForm.date}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
              className={`w-full px-3 py-2 rounded-xl border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {t('support.time', 'Giờ')} *
            </label>
            <input
              type="time"
              required
              value={appointmentForm.time}
              onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
              className={`w-full px-3 py-2 rounded-xl border ${
                isDark 
                  ? 'bg-white/5 border-white/10 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            {t('support.message', 'Ghi chú')}
          </label>
          <textarea
            rows={3}
            value={appointmentForm.message}
            onChange={(e) => setAppointmentForm(prev => ({ ...prev, message: e.target.value }))}
            className={`w-full px-3 py-2 rounded-xl border ${
              isDark 
                ? 'bg-white/5 border-white/10 text-white placeholder-white/50' 
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
            placeholder={t('support.appointmentMessagePlaceholder', 'Mô tả thêm về yêu cầu của bạn')}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-red-500 to-yellow-500 text-white px-6 py-3 rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('support.scheduling', 'Đang đặt lịch...') : t('support.schedule', 'Đặt lịch hẹn')}
        </button>
      </form>
    </div>
  )

  const renderFAQ = () => (
    <div className="space-y-4">
      {faqItems.map((item) => (
        <div
          key={item.id}
          className={`rounded-xl overflow-hidden ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}
        >
          <button
            onClick={() => toggleFAQ(item.id)}
            className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.question}
            </span>
            {expandedFAQ.has(item.id) ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          {expandedFAQ.has(item.id) && (
            <div className="px-4 pb-4">
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {item.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const renderChatbot = () => (
    <div className={`p-6 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm`}>
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('support.chatbotTitle', 'Chatbot AI')}
        </h3>
        <p className={`text-sm mb-6 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {t('support.chatbotDesc', 'Trò chuyện với AI để được hỗ trợ nhanh chóng 24/7')}
        </p>
        <button
          onClick={onStartChatbot}
          className="bg-gradient-to-r from-red-500 to-yellow-500 text-white px-8 py-3 rounded-xl font-medium hover:from-red-600 hover:to-yellow-600 transition-all duration-300"
        >
          {t('support.startChat', 'Bắt đầu trò chuyện')}
        </button>
      </div>
    </div>
  )

  const renderResources = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onDownloadGuide?.('user')}
          className={`p-6 rounded-xl text-left ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('support.userGuide', 'Hướng dẫn người dùng')}
          </h3>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('support.userGuideDesc', 'Hướng dẫn sử dụng cơ bản cho người dùng mới')}
          </p>
        </button>

        <button
          onClick={() => onDownloadGuide?.('business')}
          className={`p-6 rounded-xl text-left ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-green-600" />
          </div>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('support.businessGuide', 'Hướng dẫn doanh nghiệp')}
          </h3>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('support.businessGuideDesc', 'Hướng dẫn tích hợp cho doanh nghiệp')}
          </p>
        </button>

        <button
          onClick={() => onDownloadGuide?.('developer')}
          className={`p-6 rounded-xl text-left ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white/80 border border-gray-200'} backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('support.developerGuide', 'Tài liệu API')}
          </h3>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('support.developerGuideDesc', 'Tài liệu API và SDK cho developers')}
          </p>
        </button>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'contact':
        return renderContact()
      case 'appointment':
        return renderAppointment()
      case 'faq':
        return renderFAQ()
      case 'chatbot':
        return renderChatbot()
      case 'resources':
        return renderResources()
      default:
        return renderContact()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t('support.title', 'Hỗ trợ & Liên hệ')}
          </h2>
          <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {t('support.subtitle', 'Chúng tôi luôn sẵn sàng hỗ trợ bạn')}
          </p>
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

export default SupportSection
