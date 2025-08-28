// src/components/QRScanner.tsx
import { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'
import { Camera, Upload, AlertCircle, CheckCircle, X, Shield, Video, VideoOff } from 'lucide-react'
import { walletApi } from '@/api/wallet'
import toast from 'react-hot-toast'

type PaymentQR =
  | { address: string; amount?: string | number; asset?: string; note?: string }
  | { destination: string; amount?: string | number; asset_code?: string; memo?: string }

interface QRScannerProps {
  /** Nếu truyền vào, component sẽ trả dữ liệu quét về qua callback và tự đóng */
  onResult?: (data: any) => void
  /** Tự động bật camera khi mount (mặc định: true) */
  autoStart?: boolean
  /** Gọi khi đóng (dùng cho modal) */
  onClose?: () => void
  /** Tùy chọn className/skin đơn giản */
  className?: string
}

function QRScanner({ onResult, autoStart = true, onClose, className }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown')
  const [isLoading, setIsLoading] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    // Hints: chỉ QR + cố gắng hơn
    const hints = new Map<DecodeHintType, any>()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
    hints.set(DecodeHintType.TRY_HARDER, true)
    hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8')

    readerRef.current = new BrowserMultiFormatReader(hints as any)

    // Kiểm tra quyền camera khi component mount
    checkCameraPermission()

    if (autoStart) {
      // Delay một chút để component render xong
      setTimeout(() => {
        startScanning()
      }, 1000)
    }

    return () => stopScanning()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart])

  // Kiểm tra quyền camera - sử dụng cách tiếp cận thực tế hơn
  const checkCameraPermission = async () => {
    try {
      // Thử truy cập camera để kiểm tra quyền
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      // Nếu thành công, dừng stream và set permission
      testStream.getTracks().forEach(track => track.stop())
      setCameraPermission('granted')
      
    } catch (err: any) {
      console.log('Camera permission check failed:', err)
      if (err.name === 'NotAllowedError') {
        setCameraPermission('denied')
      } else if (err.name === 'NotFoundError') {
        setCameraPermission('unknown')
      } else {
        setCameraPermission('prompt')
      }
    }
  }

  const startScanning = async () => {
    try {
      setError(null)
      setIsLoading(true)
      setIsScanning(true)

      if (readerRef.current && videoRef.current) {
        // Yêu cầu quyền camera với options đơn giản hơn
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', // Ưu tiên camera sau
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 }
          },
          audio: false
        })

        setStream(mediaStream)
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          
          // Đợi video load xong
          await new Promise((resolve, reject) => {
            if (videoRef.current) {
              const videoTimeout = setTimeout(() => reject(new Error('Video load timeout')), 5000)
              
              videoRef.current.onloadedmetadata = () => {
                clearTimeout(videoTimeout)
                resolve(true)
              }
              
              videoRef.current.onerror = () => {
                clearTimeout(videoTimeout)
                reject(new Error('Video load error'))
              }
              
              // Bắt đầu play video
              videoRef.current.play().catch(console.warn)
            }
          })

          // Đảm bảo QR reader được khởi tạo
          if (!readerRef.current) {
            throw new Error('QR reader not initialized')
          }
          
          // Bắt đầu quét QR
          try {
            // Lấy danh sách devices để tìm camera
            const devices = await navigator.mediaDevices.enumerateDevices()
            const videoDevices = devices.filter(device => device.kind === 'videoinput')
            
            // Sử dụng device đầu tiên hoặc null để tự động chọn
            const deviceId = videoDevices.length > 0 ? videoDevices[0].deviceId : null
            
            // Bắt đầu quét QR
            readerRef.current.decodeFromVideoDevice(
              deviceId, // Device ID cụ thể
              videoRef.current,
              (result, err) => {
                if (result) {
                  handleQRScanned(result.getText())
                }
                if (err && err.name !== 'NotFoundException') {
                  console.warn('QR scan error:', err)
                }
              }
            )
          } catch (scanError: any) {
            throw new Error(`Failed to start QR scanning: ${scanError.message || 'Unknown error'}`)
          }

          setIsLoading(false)
          setCameraPermission('granted')
        }
      }
    } catch (err: any) {
      setIsLoading(false)
      setIsScanning(false)
      
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow camera permission to scan QR codes.')
        setCameraPermission('denied')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.')
      } else if (err.message === 'Video load timeout') {
        setError('Camera took too long to start. Please try again.')
      } else {
        setError(`Failed to access camera: ${err.message || 'Unknown error'}`)
      }
    }
  }

  const stopScanning = () => {
    if (readerRef.current) {
      try {
        readerRef.current.reset()
              } catch (err) {
          // Silent error handling
        }
    }
    
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop()
      })
      setStream(null)
    }
    
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null
    }
    
    setIsScanning(false)
    setIsLoading(false)
  }

  const requestCameraPermission = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      // Thử yêu cầu quyền camera
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      
      // Nếu thành công, dừng stream và bắt đầu quét
      testStream.getTracks().forEach(track => track.stop())
      
              setCameraPermission('granted')
        setIsLoading(false)
        
        // Bắt đầu quét
        startScanning()
      } catch (err: any) {
        setIsLoading(false)
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please enable camera access in your browser settings.')
        setCameraPermission('denied')
      } else {
        setError(`Failed to request camera permission: ${err.message || 'Unknown error'}`)
      }
    }
  }

  // Effect để tự động gắn stream vào video element khi stream thay đổi
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(() => {})
    }
  }, [stream])

  /** Chuẩn hóa 2 schema khác nhau về 1 object thống nhất cho Pay */
  const normalize = (raw: PaymentQR) => {
    const isA = (obj: any) => obj && (obj.address || obj.asset || obj.note)
    const isB = (obj: any) => obj && (obj.destination || obj.asset_code || obj.memo)

    if (isA(raw as any)) {
      const a = raw as any
      return {
        address: a.address,
        amount: a.amount,
        asset: a.asset,
        note: a.note
      }
    }
    if (isB(raw as any)) {
      const b = raw as any
      return {
        address: b.destination,
        amount: b.amount,
        asset: b.asset_code,
        note: b.memo
      }
    }
    return null
  }

  const handleQRScanned = (text: string) => {
    try {
      const raw: PaymentQR = JSON.parse(text)
      const normalized = normalize(raw)

      if (!normalized || !normalized.address) {
        toast.error('Invalid QR data')
        return
      }

      if (onResult) {
        stopScanning()
        onResult(normalized)
        toast.success('QR scanned!')
        onClose?.()
      } else {
        setScannedData({
          destination: normalized.address,
          amount: normalized.amount,
          asset_code: normalized.asset,
          memo: normalized.note
        })
        stopScanning()
        toast.success('QR code scanned successfully!')
      }
    } catch (err) {
      toast.error('Invalid QR code format')
    }
  }

  // ✅ Upload ảnh: sử dụng FileReader để tránh CSP blob URL issues
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !readerRef.current) return

    // Dừng camera nếu đang quét
    stopScanning()

    try {
      // Sử dụng FileReader để đọc file thành base64 data URL
      const reader = new FileReader()
      const load = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
      })
      reader.readAsDataURL(file)
      const dataUrl = await load

      // Tạo Image element từ data URL
      const img = new Image()
      const imgLoad = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = reject
      })
      img.src = dataUrl
      await imgLoad

      // Decode QR code từ image element
      const result = await readerRef.current.decodeFromImageElement(img as HTMLImageElement)
      handleQRScanned(result.getText())
    } catch (error) {
      toast.error('Could not read QR code from image')
    } finally {
      // Cho phép chọn lại cùng một file
      event.target.value = ''
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
        memo: scannedData.memo
      })
      toast.success(`Payment sent! TX: ${result.hash.slice(0, 8)}...`)
      setScannedData(null)
    } catch {
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={`space-y-6 ${className ?? ''}`}>
      {/* Header chỉ hiện khi dùng trong modal */}
      {onClose && (
        <div className="flex items-center justify-between border-b px-2 pb-3">
          <h3 className="font-semibold">Scan QR Code</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Scanner Interface */}
      {!scannedData && (
        <div className="rounded-xl border p-6 bg-white/90 dark:bg-white/5 dark:border-white/15 border-navy-200 space-y-4">
          <h3 className="font-semibold text-center">Scan QR Code</h3>

          {/* Camera Permission Error */}
          {cameraPermission === 'denied' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-32 h-32 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <VideoOff className="w-16 h-16 text-red-500" />
                </div>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Camera access is blocked. Please enable camera permission in your browser settings.
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={requestCameraPermission}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Shield className="w-5 h-5" />
                  <span>Request Camera Permission</span>
                </button>
                
                <label className="w-full bg-navy-100 hover:bg-navy-200 dark:bg-white/10 dark:hover:bg-white/20 text-navy-700 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Upload Image Instead</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          )}

          {/* Camera Loading */}
          {isLoading && (
            <div className="text-center space-y-4">
              <div className="w-32 h-32 bg-navy-100 dark:bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-navy-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-navy-600 dark:text-white/70">Starting camera...</p>
              <button
                onClick={stopScanning}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Camera Not Started */}
          {!isScanning && !isLoading && cameraPermission !== 'denied' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-32 h-32 bg-navy-100 dark:bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-16 h-16 text-navy-400 dark:text-white/60" />
                </div>
                <p className="text-navy-600 dark:text-white/70 mb-4">Tap to start scanning or upload an image</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={startScanning}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Start Camera</span>
                </button>

                <label className="w-full bg-navy-100 hover:bg-navy-200 dark:bg-white/10 dark:hover:bg-white/20 text-navy-700 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              

            </div>
          )}

          {/* Camera Active - Luôn hiển thị video element để đảm bảo ref tồn tại */}
          <div className="space-y-4">
            <div
              className="qr-scanner-container mx-auto relative overflow-hidden rounded-lg border-2 border-gray-300"
              style={{ aspectRatio: '1 / 1' }}
            >
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover bg-gray-900" 
                autoPlay 
                playsInline 
                muted 
              />
              
              {/* Scanner overlay chỉ hiện khi đang quét */}
              {isScanning && !isLoading && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-primary/70 rounded-lg" />
                  {/* Corner indicators */}
                  <div className="absolute top-8 left-8 w-6 h-6 border-l-2 border-t-2 border-primary/70"></div>
                  <div className="absolute top-8 right-8 w-6 h-6 border-r-2 border-t-2 border-primary/70"></div>
                  <div className="absolute bottom-8 left-8 w-6 h-6 border-l-2 border-b-2 border-primary/70"></div>
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-r-2 border-b-2 border-primary/70"></div>
                </div>
              )}
              
              {/* Placeholder khi chưa có camera */}
              {!isScanning && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <Camera className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Camera preview will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            {isScanning && !isLoading && (
              <div className="text-center">
                <p className="text-navy-600 dark:text-white/70 mb-4">Position QR code within the frame</p>
                <button 
                  onClick={stopScanning} 
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  Stop Scanning
                </button>
              </div>
            )}
          </div>

          {/* General Error */}
          {error && cameraPermission !== 'denied' && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}


        </div>
      )}

      {/* Standalone Payment Confirmation (chỉ dùng khi không truyền onResult) */}
      {scannedData && !onResult && (
        <div className="rounded-xl border p-6 bg-white/90 dark:bg-white/5 dark:border-white/15 border-navy-200 space-y-4">
          <div className="flex items-center space-x-2 text-success">
            <CheckCircle className="w-6 h-6" />
            <h3 className="font-semibold">Payment Request Scanned</h3>
          </div>

          <div className="bg-navy-50 dark:bg-white/10 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-navy-600 dark:text-white/70">Amount:</span>
              <span className="font-semibold">
                {scannedData.amount} {scannedData.asset_code}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-navy-600 dark:text-white/70">To:</span>
              <span className="font-mono text-sm">
                {scannedData.destination.slice(0, 8)}...{scannedData.destination.slice(-8)}
              </span>
            </div>

            {scannedData.memo && (
              <div className="flex justify-between">
                <span className="text-navy-600 dark:text-white/70">Memo:</span>
                <span>{scannedData.memo}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button onClick={() => setScannedData(null)} className="flex-1 bg-navy-100 hover:bg-navy-200 dark:bg-white/10 dark:hover:bg-white/20 font-medium py-3 px-4 rounded-lg transition-colors">
              Cancel
            </button>

            <button
              onClick={processPayment}
              disabled={isProcessing}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Confirm Payment</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRScanner
