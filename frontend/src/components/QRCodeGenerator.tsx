import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode.react'
import { Copy, Download, Share, QrCode } from 'lucide-react'
import { walletApi } from '@/api/wallet'
import toast from 'react-hot-toast'

function QRCodeGenerator() {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('100')
  const [selectedAsset, setSelectedAsset] = useState('SYP')
  const [memo, setMemo] = useState('')
  const [generatedQR, setGeneratedQR] = useState('')

  const { data: balances } = useQuery({
    queryKey: ['balances'],
    queryFn: walletApi.getBalances,
  })

  const { data: walletAddress } = useQuery({
    queryKey: ['wallet-address'],
    queryFn: walletApi.getAddress,
  })

  const handleGenerateQR = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t('qr.invalidAmount', 'Please enter a valid amount'))
      return
    }

    // Create payment request payload
    const paymentRequest = {
      destination: walletAddress || 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP', // Use real wallet address
      asset_code: selectedAsset,
      amount: amount,
      memo: memo,
      type: 'payment_request',
    }

    const qrData = JSON.stringify(paymentRequest)
    setGeneratedQR(qrData)
    toast.success(t('qr.generated', 'QR code generated!'))
  }

  const handleCopyQR = () => {
    navigator.clipboard.writeText(generatedQR)
    toast.success(t('qr.copied', 'QR data copied to clipboard!'))
  }

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `payment-qr-${amount}-${selectedAsset}.png`
      a.click()
      toast.success(t('qr.downloaded', 'QR code downloaded!'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
        <h3 className="font-bold text-white mb-6 flex items-center space-x-2">
          <QrCode className="w-5 h-5 text-green-400" />
          <span>{t('qr.paymentRequest', 'Payment Request')}</span>
        </h3>
        
        <div className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              {t('qr.amount', 'Amount')}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm"
              placeholder={t('qr.enterAmount', 'Enter amount')}
              min="0"
              step="0.01"
            />
          </div>

          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              {t('qr.asset', 'Asset')}
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white backdrop-blur-sm"
            >
              {balances?.map((balance) => (
                <option key={balance.asset_code} value={balance.asset_code} className="bg-slate-800 text-white">
                  {balance.asset_code} ({parseFloat(balance.amount).toFixed(3)} {t('qr.available', 'available')})
                </option>
              ))}
            </select>
          </div>

          {/* Memo Input */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              {t('qr.memo', 'Memo (Optional)')}
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm"
              placeholder={t('qr.paymentDescription', 'Payment description')}
              maxLength={28}
            />
          </div>

          <button
            onClick={handleGenerateQR}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>{t('qr.generateQRCode', 'Generate QR Code')}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Generated QR Code */}
      {generatedQR && (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl text-center space-y-6">
          <h3 className="font-bold text-white flex items-center justify-center space-x-2">
            <QrCode className="w-5 h-5 text-green-400" />
            <span>{t('qr.paymentQRCode', 'Payment QR Code')}</span>
          </h3>
          
          <div className="flex justify-center">
            <div className="p-6 bg-white rounded-2xl border-2 border-white/30 shadow-xl">
              <QRCode
                value={generatedQR}
                size={200}
                bgColor="#FFFFFF"
                fgColor="#0F172A"
                level="M"
                includeMargin={true}
              />
            </div>
          </div>

          <div className="text-sm text-white/80 bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="mb-1">{t('qr.amount', 'Amount')}: <span className="font-medium text-white">{amount} {selectedAsset}</span></p>
            {memo && <p>{t('qr.memo', 'Memo')}: <span className="font-medium text-white">{memo}</span></p>}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCopyQR}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20 backdrop-blur-sm"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm font-medium">{t('qr.copy', 'Copy')}</span>
            </button>
            
            <button
              onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20 backdrop-blur-sm"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">{t('qr.download', 'Download')}</span>
            </button>
            
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: t('qr.paymentRequest', 'Payment Request'),
                    text: t('qr.paymentRequestFor', 'Payment request for {amount} {asset}', { amount, asset: selectedAsset }),
                  })
                } else {
                  handleCopyQR()
                }
              }}
              className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20 backdrop-blur-sm"
            >
              <Share className="w-4 h-4" />
              <span className="text-sm font-medium">{t('qr.share', 'Share')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRCodeGenerator
