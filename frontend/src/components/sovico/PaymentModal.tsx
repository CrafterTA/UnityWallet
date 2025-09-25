import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { useAuthStore } from '@/store/session'
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Zap, 
  Coins, 
  DollarSign,
  Clock,
  ExternalLink,
  Copy,
  Download,
  Eye,
  EyeOff,
  Printer,
  Hash,
  Calendar,
  User
} from 'lucide-react'
import { SovicoService, SovicoSolution, SovicoCheckoutState, SovicoPaymentResult } from '@/types/sovico'
import { usePaymentNotifications } from '@/components/NotificationSystem'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  checkoutState: SovicoCheckoutState
  onCheckoutChange: (state: SovicoCheckoutState) => void
  onProcessPayment: () => Promise<SovicoPaymentResult>
  onSuggestSwap: (fromAsset: string, toAsset: string, amount: number) => void
  exchangeRates?: any
  balances?: Record<string, string>
  isLoading?: boolean
  error?: string
  paymentResult?: SovicoPaymentResult
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  checkoutState,
  onCheckoutChange,
  onProcessPayment,
  onSuggestSwap,
  exchangeRates,
  balances = {},
  isLoading = false,
  error,
  paymentResult
}) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const { wallet, unlockWallet } = useAuthStore()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const { notifyPaymentSuccess, notifyPaymentError, notifyWalletUnlocked } = usePaymentNotifications()
  
  const totalSteps = 4
  const isService = !!checkoutState.service
  const isSolution = !!checkoutState.solution
  const item = isService ? checkoutState.service : checkoutState.solution

  // Calculate balances in different assets
  const sypBalance = parseFloat(balances.SYP || '0')
  const xlmBalance = parseFloat(balances.XLM || '0')
  const usdcBalance = parseFloat(balances.USDC || '0')

  // Check if user has enough balance
  const hasEnoughSYP = sypBalance >= (checkoutState.totalInSYP || 0)
  const hasEnoughXLM = xlmBalance >= (checkoutState.totalInXLM || 0)
  const hasEnoughUSDC = usdcBalance >= (checkoutState.totalInUSDC || 0)

  const canPayWithSelectedAsset = () => {
    switch (checkoutState.selectedAsset) {
      case 'SYP': return hasEnoughSYP
      case 'XLM': return hasEnoughXLM
      case 'USDC': return hasEnoughUSDC
      default: return false
    }
  }

  const getBalanceForAsset = (asset: string) => {
    switch (asset) {
      case 'SYP': return sypBalance
      case 'XLM': return xlmBalance
      case 'USDC': return usdcBalance
      default: return 0
    }
  }

  const getAmountForAsset = (asset: string) => {
    switch (asset) {
      case 'SYP': return checkoutState.totalInSYP || 0
      case 'XLM': return checkoutState.totalInXLM || 0
      case 'USDC': return checkoutState.totalInUSDC || 0
      default: return 0
    }
  }

  const handleAssetChange = (asset: string) => {
    onCheckoutChange({
      ...checkoutState,
      selectedAsset: asset
    })
  }

  const handleAddonToggle = (addonId: string) => {
    const updatedAddons = checkoutState.addons.map(addon => 
      addon.id === addonId 
        ? { ...addon, isSelected: !addon.isSelected }
        : addon
    )
    
    // Recalculate total
    const addonTotal = updatedAddons
      .filter(addon => addon.isSelected)
      .reduce((sum, addon) => sum + addon.price, 0)
    
    const newTotal = (item?.price || 0) + addonTotal
    
    onCheckoutChange({
      ...checkoutState,
      addons: updatedAddons,
      totalAmount: newTotal
    })
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConfirmPayment = async () => {
    try {
      const result = await onProcessPayment()
      if (result?.success) {
        notifyPaymentSuccess(
          result.amount, 
          result.asset || 'SYP', 
          result.transactionHash || ''
        )
        setCurrentStep(4) // Move to step 4 to show invoice
      }
    } catch (error) {
      console.error('Payment failed:', error)
      if (error instanceof Error && error.message === 'WALLET_LOCKED') {
        setShowUnlockModal(true)
      } else {
        notifyPaymentError(error instanceof Error ? error.message : 'Payment failed')
      }
    }
  }

  const handleUnlockWallet = async () => {
    if (!password.trim()) {
      setPasswordError(t('wallet.passwordRequired', 'Mật khẩu là bắt buộc'))
      return
    }

    try {
      await unlockWallet(password)
      setShowUnlockModal(false)
      setPassword('')
      setPasswordError('')
      notifyWalletUnlocked()
      // Retry payment after unlocking
      const result = await onProcessPayment()
      if (result?.success) {
        notifyPaymentSuccess(
          result.amount, 
          result.asset || 'SYP', 
          result.transactionHash || ''
        )
        setCurrentStep(4) // Move to step 4 to show invoice
      }
    } catch (error) {
      setPasswordError(t('wallet.incorrectPassword', 'Mật khẩu không đúng'))
    }
  }

  const handleCloseUnlockModal = () => {
    setShowUnlockModal(false)
    setPassword('')
    setPasswordError('')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      minimumFractionDigits: currency === 'VND' ? 0 : 2
    }).format(amount)
  }

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
      invoiceNumber: paymentResult?.transactionHash?.slice(-8).toUpperCase() || 'N/A',
      date: paymentResult?.timestamp,
      amount: paymentResult?.amount,
      asset: paymentResult?.asset,
      service: item?.name,
      company: item?.company || 'Sovico Ecosystem'
    }
    
    const dataStr = JSON.stringify(invoiceData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${paymentResult?.transactionHash?.slice(-8) || 'unknown'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className={`relative w-full max-w-2xl rounded-3xl shadow-2xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {t('payment.title', 'Thanh toán')}
                </h2>
                <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {t('payment.step', 'Bước')} {currentStep} / {totalSteps}
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i + 1 <= currentStep
                      ? 'bg-red-500'
                      : isDark
                        ? 'bg-white/20'
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Service Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('payment.step1.title', 'Chi tiết dịch vụ')}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {t('payment.step1.subtitle', 'Xem lại thông tin dịch vụ bạn muốn mua')}
                  </p>
                </div>

                {item && (
                  <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-500 rounded-xl flex items-center justify-center">
                        {isService ? (
                          <CreditCard className="w-8 h-8 text-white" />
                        ) : (
                          <Zap className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </h4>
                        <p className={`text-sm mb-4 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(item.price, item.currency)}
                          </div>
                          {isSolution && 'originalPrice' in item && item.originalPrice && (
                            <div className={`text-lg line-through ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                              {formatPrice(item.originalPrice, item.currency)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add-ons */}
                {checkoutState.addons.length > 0 && (
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {t('payment.addons', 'Dịch vụ bổ sung')}
                    </h4>
                    <div className="space-y-3">
                      {checkoutState.addons.map((addon) => (
                        <label key={addon.id} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addon.isSelected}
                            onChange={() => handleAddonToggle(addon.id)}
                            className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                          />
                          <div className="flex-1">
                            <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {addon.name}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                              {addon.description}
                            </div>
                          </div>
                          <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {formatPrice(addon.price, addon.currency)}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('payment.step2.title', 'Phương thức thanh toán')}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {t('payment.step2.subtitle', 'Chọn tài sản để thanh toán')}
                  </p>
                </div>

                <div className="space-y-3">
                  {['SYP', 'XLM', 'USDC'].map((asset) => {
                    const balance = getBalanceForAsset(asset)
                    const amount = getAmountForAsset(asset)
                    const hasEnough = balance >= amount
                    
                    return (
                      <button
                        key={asset}
                        onClick={() => handleAssetChange(asset)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all ${
                          checkoutState.selectedAsset === asset
                            ? 'border-red-500 bg-red-500/10'
                            : isDark
                              ? 'border-white/20 hover:border-white/40'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              asset === 'SYP' ? 'bg-gradient-to-r from-red-500 to-yellow-500' :
                              asset === 'XLM' ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              <Coins className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {asset}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                                {t('payment.balance', 'Số dư')}: {balance.toLocaleString()} {asset}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {amount.toLocaleString()} {asset}
                            </div>
                            <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                              ≈ {formatPrice(amount * (exchangeRates?.[asset]?.VND || 1), 'VND')}
                            </div>
                          </div>
                        </div>
                        
                        {!hasEnough && (
                          <div className="mt-3 flex items-center gap-2 text-orange-500">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">
                              {t('payment.insufficient', 'Số dư không đủ')}
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {!canPayWithSelectedAsset() && (
                  <div className={`p-4 rounded-2xl ${isDark ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'}`}>
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <div className="flex-1">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {t('payment.insufficientTitle', 'Số dư không đủ')}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          {t('payment.insufficientDesc', 'Bạn cần thêm tài sản để thanh toán')}
                        </div>
                      </div>
                      <button
                        onClick={() => onSuggestSwap('XLM', checkoutState.selectedAsset, getAmountForAsset(checkoutState.selectedAsset))}
                        className="px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
                      >
                        {t('payment.swap', 'Swap')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('payment.step3.title', 'Xác nhận thanh toán')}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {t('payment.step3.subtitle', 'Kiểm tra lại thông tin trước khi thanh toán')}
                  </p>
                </div>

                <div className={`p-6 rounded-2xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                        {t('payment.item', 'Dịch vụ')}:
                      </span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item?.name}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                        {t('payment.amount', 'Số tiền')}:
                      </span>
                      <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {getAmountForAsset(checkoutState.selectedAsset).toLocaleString()} {checkoutState.selectedAsset}
                        {checkoutState.selectedAsset === 'SYP' && checkoutState.totalAmount && (
                          <span className={`text-sm font-normal ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                            {' '}({formatPrice(checkoutState.totalAmount, 'VND')})
                          </span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                        {t('payment.recipient', 'Người nhận')}:
                      </span>
                      <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {checkoutState.paymentAddress}
                      </span>
                    </div>
                    
                    {checkoutState.memo && (
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-white/70' : 'text-gray-600'}>
                          {t('payment.memo', 'Memo')}:
                        </span>
                        <span className={`font-mono text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {checkoutState.memo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Wallet Info */}
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('payment.walletInfo', 'Thông tin ví')}
                      </div>
                      <div className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        {t('payment.walletDesc', 'Giao dịch sẽ được ký bằng ví của bạn')}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {showSecretKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {showSecretKey && wallet?.secret && (
                    <div className="mt-3 p-3 bg-black/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          {t('payment.secretKey', 'Secret Key')}:
                        </span>
                        <button
                          onClick={() => copyToClipboard(wallet.secret)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <div className={`font-mono text-xs break-all ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {wallet.secret}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Invoice */}
            {currentStep === 4 && paymentResult?.success && (
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Hóa đơn thanh toán
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    Giao dịch thành công
                  </p>
                </div>

                {/* Company Info */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">S</span>
                    </div>
                    <div>
                      <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item?.company || 'Sovico Ecosystem'}
                      </h1>
                      <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                        Hệ sinh thái dịch vụ số
                      </p>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Thông tin hóa đơn
                    </h4>
                    <div className="space-y-2">
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
                    <h4 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Thông tin thanh toán
                    </h4>
                    <div className="space-y-2">
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
                <div className="mb-6">
                  <h4 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Chi tiết dịch vụ
                  </h4>
                  <div className={`p-6 rounded-xl border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {item?.name}
                        </h5>
                        <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                          Dịch vụ trong hệ sinh thái Sovico
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatAmount(paymentResult.amount, paymentResult.asset)}
                          {paymentResult.asset === 'SYP' && checkoutState.totalAmount && (
                            <span className={`text-lg font-normal ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                              {' '}({formatPrice(checkoutState.totalAmount, 'VND')})
                            </span>
                          )}
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
                    <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Thanh toán thành công
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                      Giao dịch đã được xác nhận trên Stellar network
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    In hóa đơn
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Tải xuống
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Error */}
            {currentStep === 4 && !paymentResult?.success && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {t('payment.error.title', 'Thanh toán thất bại')}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                    {error || t('payment.error.subtitle', 'Có lỗi xảy ra trong quá trình thanh toán')}
                  </p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && currentStep < 4 && (
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {error}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-between p-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <button
              onClick={currentStep === 1 ? onClose : handleBack}
              className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {currentStep === 1 ? t('common.cancel', 'Hủy') : t('common.back', 'Quay lại')}
            </button>

            {currentStep < totalSteps && (
              <button
                onClick={handleNext}
                disabled={currentStep === 2 && !canPayWithSelectedAsset()}
                className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  currentStep === 2 && !canPayWithSelectedAsset()
                    ? isDark
                      ? 'bg-white/10 text-white/50 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-red-600 hover:to-yellow-600'
                }`}
              >
                {currentStep === totalSteps - 1 ? t('payment.confirm', 'Xác nhận') : t('common.next', 'Tiếp theo')}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === totalSteps - 1 && !paymentResult && (
              <button
                onClick={handleConfirmPayment}
                disabled={isLoading || !canPayWithSelectedAsset()}
                className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                  isLoading || !canPayWithSelectedAsset()
                    ? isDark
                      ? 'bg-white/10 text-white/50 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-red-600 hover:to-yellow-600'
                }`}
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    {t('payment.processing', 'Đang xử lý...')}
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {t('payment.payNow', 'Thanh toán ngay')}
                  </>
                )}
              </button>
            )}

            {currentStep === totalSteps && !paymentResult?.success && (
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-medium transition-colors bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-red-600 hover:to-yellow-600"
              >
                {t('common.done', 'Hoàn thành')}
              </button>
            )}

            {currentStep === totalSteps && paymentResult?.success && (
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-medium transition-colors bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-red-600 hover:to-yellow-600"
              >
                {t('common.close', 'Đóng')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unlock Wallet Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]">
          <div className={`w-full max-w-md mx-4 p-6 rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-900 border border-white/20' : 'bg-white border border-gray-200'
          }`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {t('wallet.unlockWallet', 'Mở khóa ví')}
              </h3>
              <p className={`text-sm ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                {t('wallet.unlockToPay', 'Nhập mật khẩu để mở khóa ví và thanh toán')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                  {t('wallet.password', 'Mật khẩu')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('wallet.enterPasswordPlaceholder', 'Nhập mật khẩu ví')}
                  className={`w-full px-4 py-3 rounded-xl border transition-colors ${
                    isDark
                      ? 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-red-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-red-500'
                  }`}
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCloseUnlockModal}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                    isDark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {t('common.cancel', 'Hủy')}
                </button>
                <button
                  onClick={handleUnlockWallet}
                  className="flex-1 px-4 py-3 rounded-xl font-medium transition-colors bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-red-600 hover:to-yellow-600"
                >
                  {t('wallet.unlock', 'Mở khóa')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PaymentModal
