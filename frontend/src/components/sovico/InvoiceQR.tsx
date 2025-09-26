import React from 'react'
import QRCode from 'qrcode'

interface InvoiceQRProps {
  bookingData: any
  transactionData: any
  className?: string
}

const InvoiceQR: React.FC<InvoiceQRProps> = ({ bookingData, transactionData, className = '' }) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('')

  React.useEffect(() => {
    const generateQR = async () => {
      try {
        // Create QR data with personal and transaction information
        const qrData = {
          // Personal Information
          fullName: bookingData.fullName,
          email: bookingData.email,
          phone: bookingData.phone,
          dateOfBirth: bookingData.dateOfBirth,
          idNumber: bookingData.idNumber,
          idType: bookingData.idType,
          
          // Transaction Information
          transactionId: transactionData.signature || transactionData.hash,
          amount: transactionData.amount,
          currency: transactionData.asset,
          timestamp: transactionData.timestamp,
          recipient: transactionData.recipient,
          
          // Service Information
          serviceName: transactionData.serviceName,
          serviceCategory: transactionData.serviceCategory,
          
          // Additional verification data
          verificationHash: generateVerificationHash(bookingData, transactionData)
        }

        const qrString = JSON.stringify(qrData)
        const qrCodeDataURL = await QRCode.toDataURL(qrString, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        
        setQrCodeUrl(qrCodeDataURL)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQR()
  }, [bookingData, transactionData])

  const generateVerificationHash = (booking: any, transaction: any) => {
    // Simple hash generation for verification - encode to base64 safely
    const data = `${booking.fullName}-${booking.idNumber}-${transaction.signature}-${transaction.timestamp}`
    try {
      // Use encodeURIComponent to handle Unicode characters, then btoa
      return btoa(encodeURIComponent(data)).substring(0, 16)
    } catch (error) {
      // Fallback: use only ASCII characters
      const asciiData = data.replace(/[^\x00-\x7F]/g, '?')
      return btoa(asciiData).substring(0, 16)
    }
  }

  if (!qrCodeUrl) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm">Đang tạo QR...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="w-32 h-32 bg-white rounded-lg p-2 shadow-sm">
        <img 
          src={qrCodeUrl} 
          alt="Invoice QR Code" 
          className="w-full h-full object-contain"
        />
      </div>
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-600 font-medium">Mã QR dịch vụ</p>
        <p className="text-xs text-gray-500">Quét để sử dụng dịch vụ</p>
      </div>
    </div>
  )
}

export default InvoiceQR
