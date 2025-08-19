import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'qrcode.react'
import { Copy, Download, Share } from 'lucide-react'
import { walletApi } from '@/api/wallet'
import toast from 'react-hot-toast'

function QRCodeGenerator() {
  const [amount, setAmount] = useState('100')
  const [selectedAsset, setSelectedAsset] = useState('SYP')
  const [memo, setMemo] = useState('')
  const [generatedQR, setGeneratedQR] = useState('')

  const { data: balances } = useQuery({
    queryKey: ['balances'],
    queryFn: walletApi.getBalances,
  })

  const handleGenerateQR = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Create payment request payload
    const paymentRequest = {
      destination: 'GDQOE23CFSUMSVQK4Y5JHPPYK73VYCNHZHA7ENKCV37P6SUEO6XQBKPP', // Demo wallet
      asset_code: selectedAsset,
      amount: amount,
      memo: memo,
      type: 'payment_request',
    }

    const qrData = JSON.stringify(paymentRequest)
    setGeneratedQR(qrData)
    toast.success('QR code generated!')
  }

  const handleCopyQR = () => {
    navigator.clipboard.writeText(generatedQR)
    toast.success('QR data copied to clipboard!')
  }

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `payment-qr-${amount}-${selectedAsset}.png`
      a.click()
      toast.success('QR code downloaded!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-xl p-6 border border-navy-200 space-y-4">
        <h3 className="font-semibold text-navy-900 mb-4">Payment Request</h3>
        
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter amount"
            min="0"
            step="0.01"
          />
        </div>

        {/* Asset Selection */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Asset
          </label>
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="w-full px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {balances?.map((balance) => (
              <option key={balance.asset_code} value={balance.asset_code}>
                {balance.asset_code} ({parseFloat(balance.balance).toFixed(2)} available)
              </option>
            ))}
          </select>
        </div>

        {/* Memo Input */}
        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">
            Memo (Optional)
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full px-4 py-3 border border-navy-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Payment description"
            maxLength={28}
          />
        </div>

        <button
          onClick={handleGenerateQR}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Generate QR Code
        </button>
      </div>

      {/* Generated QR Code */}
      {generatedQR && (
        <div className="bg-white rounded-xl p-6 border border-navy-200 text-center space-y-4">
          <h3 className="font-semibold text-navy-900">Payment QR Code</h3>
          
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl border-2 border-navy-200">
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

          <div className="text-sm text-navy-600">
            <p>Amount: <span className="font-medium">{amount} {selectedAsset}</span></p>
            {memo && <p>Memo: <span className="font-medium">{memo}</span></p>}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleCopyQR}
              className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-navy-100 hover:bg-navy-200 text-navy-700 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            
            <button
              onClick={handleDownloadQR}
              className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-navy-100 hover:bg-navy-200 text-navy-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Payment Request',
                    text: `Payment request for ${amount} ${selectedAsset}`,
                  })
                } else {
                  handleCopyQR()
                }
              }}
              className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-navy-100 hover:bg-navy-200 text-navy-700 rounded-lg transition-colors"
            >
              <Share className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRCodeGenerator
