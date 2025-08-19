import { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library'
import { Camera, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { walletApi } from '@/api/wallet'
import toast from 'react-hot-toast'

function QRScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, ['QR_CODE'])
    readerRef.current = new BrowserMultiFormatReader(hints)

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)
      
      if (readerRef.current && videoRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        
        videoRef.current.srcObject = stream
        
        readerRef.current.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result, _error) => {
            if (result) {
              handleQRScanned(result.getText())
            }
          }
        )
      }
    } catch (err) {
      setError('Camera access denied or not available')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset()
    }
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
  }

  const handleQRScanned = (data: string) => {
    try {
      const paymentData = JSON.parse(data)
      setScannedData(paymentData)
      stopScanning()
      toast.success('QR code scanned successfully!')
    } catch (err) {
      toast.error('Invalid QR code format')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && readerRef.current) {
      readerRef.current.decodeFromImageUrl(URL.createObjectURL(file))
        .then(result => {
          handleQRScanned(result.getText())
        })
        .catch(() => {
          toast.error('Could not read QR code from image')
        })
    }
  }

  const processPayment = async () => {
    if (!scannedData) return
    
    setIsProcessing(true)
    try {
      const result = await walletApi.payment({
        destination: scannedData.destination,
        asset_code: scannedData.asset_code,
        amount: scannedData.amount,
        memo: scannedData.memo,
      })
      
      toast.success(`Payment sent! TX: ${result.hash.slice(0, 8)}...`)
      setScannedData(null)
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Scanner Interface */}
      {!scannedData && (
        <div className="bg-white rounded-xl p-6 border border-navy-200 space-y-4">
          <h3 className="font-semibold text-navy-900 text-center">Scan QR Code</h3>
          
          {!isScanning ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-32 h-32 bg-navy-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-16 h-16 text-navy-400" />
                </div>
                <p className="text-navy-600 mb-4">
                  Tap to start scanning or upload an image
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={startScanning}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Camera</span>
                </button>
                
                <label className="w-full bg-navy-100 hover:bg-navy-200 text-navy-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="qr-scanner-container mx-auto">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-lg"
                  autoPlay
                  playsInline
                />
                <div className="qr-scanner-overlay">
                  <div className="qr-scanner-viewfinder" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-navy-600 mb-4">Position QR code within the frame</p>
                <button
                  onClick={stopScanning}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Stop Scanning
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      )}

      {/* Payment Confirmation */}
      {scannedData && (
        <div className="bg-white rounded-xl p-6 border border-navy-200 space-y-4">
          <div className="flex items-center space-x-2 text-success">
            <CheckCircle className="w-6 h-6" />
            <h3 className="font-semibold text-navy-900">Payment Request Scanned</h3>
          </div>
          
          <div className="bg-navy-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-navy-600">Amount:</span>
              <span className="font-semibold text-navy-900">
                {scannedData.amount} {scannedData.asset_code}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-navy-600">To:</span>
              <span className="font-mono text-sm text-navy-900">
                {scannedData.destination.slice(0, 8)}...{scannedData.destination.slice(-8)}
              </span>
            </div>
            
            {scannedData.memo && (
              <div className="flex justify-between">
                <span className="text-navy-600">Memo:</span>
                <span className="text-navy-900">{scannedData.memo}</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => setScannedData(null)}
              className="flex-1 bg-navy-100 hover:bg-navy-200 text-navy-700 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={processPayment}
              disabled={isProcessing}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Confirm Payment</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRScanner
