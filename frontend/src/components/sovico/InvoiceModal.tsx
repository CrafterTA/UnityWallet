import React from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle, 
  Clock, 
  Hash,
  Calendar,
  User,
  CreditCard,
  ExternalLink
} from 'lucide-react'
import { SovicoPaymentResult } from '@/types/sovico'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  paymentResult: SovicoPaymentResult | null
  serviceName?: string
  companyName?: string
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  paymentResult,
  serviceName = 'Dịch vụ Sovico',
  companyName = 'Sovico Ecosystem'
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()

  if (!isOpen || !paymentResult) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number, asset: string) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ' + asset
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    const invoiceData = {
      invoiceNumber: paymentResult.transactionHash?.slice(-8).toUpperCase() || 'N/A',
      date: paymentResult.timestamp,
      amount: paymentResult.amount,
      asset: paymentResult.asset,
      service: serviceName,
      company: companyName
    }
    
    const dataStr = JSON.stringify(invoiceData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${paymentResult.transactionHash?.slice(-8) || 'unknown'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        isDark ? 'bg-gray-900 border border-white/20' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 border-b border-white/10 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Hóa đơn thanh toán</h2>
                <p className="text-white/80">Giao dịch thành công</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                title="In hóa đơn"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                title="Tải xuống"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8">
          {/* Company Info */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
                  {companyName}
                </h1>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  Hệ sinh thái dịch vụ số
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Thông tin hóa đơn
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Mã giao dịch: <span className="font-mono">{paymentResult.transactionHash?.slice(0, 16) || 'N/A'}...</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Ngày: {formatDate(paymentResult.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Ledger: {paymentResult.ledger}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Thông tin thanh toán
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Người nhận: {paymentResult.recipient.slice(0, 16)}...
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Tài sản: {paymentResult.asset}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  <a 
                    href={paymentResult.horizonUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:text-blue-600 underline"
                  >
                    Xem trên Stellar Explorer
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-8">
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Chi tiết dịch vụ
            </h3>
            <div className={`p-6 rounded-xl border ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {serviceName}
                  </h4>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Dịch vụ trong hệ sinh thái Sovico
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {formatAmount(paymentResult.amount, paymentResult.asset)}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Đã thanh toán
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-center gap-3 p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="text-center">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Thanh toán thành công
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                Giao dịch đã được xác nhận trên Stellar network
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              Cảm ơn bạn đã sử dụng dịch vụ của {companyName}
            </p>
            <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>
              Hóa đơn này được tạo tự động và có giá trị pháp lý
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceModal
