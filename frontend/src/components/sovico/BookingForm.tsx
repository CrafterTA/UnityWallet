import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '@/store/theme'
import { Calendar, User, MapPin, CreditCard, Plane, Hotel, Zap, Building2 } from 'lucide-react'

interface BookingFormProps {
  service: any
  onBookingSubmit: (bookingData: any) => void
  onCancel: () => void
}

const BookingForm: React.FC<BookingFormProps> = ({ service, onBookingSubmit, onCancel }) => {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    idNumber: '',
    idType: 'cccd', // cccd or passport
    
    // Service-specific data
    flightData: {
      departure: '',
      arrival: '',
      departureDate: '',
      returnDate: '',
      passengers: 1,
      seatClass: 'business'
    },
    hotelData: {
      checkIn: '',
      checkOut: '',
      guests: 2,
      roomType: 'suite',
      specialRequests: ''
    },
    bankingData: {
      accountType: 'premium',
      monthlyIncome: '',
      employmentStatus: 'employed'
    },
    energyData: {
      propertyType: 'house',
      roofArea: '',
      monthlyElectricityBill: '',
      installationAddress: ''
    }
  })

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onBookingSubmit(formData)
  }

  const getServiceIcon = () => {
    switch (service.category) {
      case 'aviation':
        return <Plane className="w-6 h-6" />
      case 'hospitality':
        return <Hotel className="w-6 h-6" />
      case 'banking':
        return <Building2 className="w-6 h-6" />
      case 'energy':
        return <Zap className="w-6 h-6" />
      default:
        return <CreditCard className="w-6 h-6" />
    }
  }

  const getSelectStyles = () => ({
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'white',
    color: isDark ? 'white' : 'black'
  })

  const getOptionStyles = () => ({
    backgroundColor: isDark ? '#374151' : 'white',
    color: isDark ? 'white' : 'black'
  })

  const renderFlightForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Plane className="w-5 h-5" />
        Thông tin chuyến bay
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Sân bay đi</label>
          <select
            value={formData.flightData.departure}
            onChange={(e) => handleInputChange('flightData.departure', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'white',
              color: isDark ? 'white' : 'black'
            }}
          >
            <option value="" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Chọn sân bay đi</option>
            <option value="HAN" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Hà Nội (HAN)</option>
            <option value="SGN" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>TP.HCM (SGN)</option>
            <option value="DAD" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Đà Nẵng (DAD)</option>
            <option value="HPH" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Hải Phòng (HPH)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Sân bay đến</label>
          <select
            value={formData.flightData.arrival}
            onChange={(e) => handleInputChange('flightData.arrival', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'white',
              color: isDark ? 'white' : 'black'
            }}
          >
            <option value="" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Chọn sân bay đến</option>
            <option value="HAN" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Hà Nội (HAN)</option>
            <option value="SGN" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>TP.HCM (SGN)</option>
            <option value="DAD" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Đà Nẵng (DAD)</option>
            <option value="BKK" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Bangkok (BKK)</option>
            <option value="SIN" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Singapore (SIN)</option>
            <option value="KUL" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Kuala Lumpur (KUL)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Ngày đi</label>
          <input
            type="date"
            value={formData.flightData.departureDate}
            onChange={(e) => handleInputChange('flightData.departureDate', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Ngày về</label>
          <input
            type="date"
            value={formData.flightData.returnDate}
            onChange={(e) => handleInputChange('flightData.returnDate', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Số hành khách</label>
          <select
            value={formData.flightData.passengers}
            onChange={(e) => handleInputChange('flightData.passengers', parseInt(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={getSelectStyles()}
          >
            {[1,2,3,4,5,6,7,8,9].map(num => (
              <option key={num} value={num} style={getOptionStyles()}>{num} người</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Hạng ghế</label>
          <select
            value={formData.flightData.seatClass}
            onChange={(e) => handleInputChange('flightData.seatClass', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'white',
              color: isDark ? 'white' : 'black'
            }}
          >
            <option value="business" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Business Class</option>
            <option value="economy" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Economy Class</option>
            <option value="premium" style={{ backgroundColor: isDark ? '#374151' : 'white', color: isDark ? 'white' : 'black' }}>Premium Economy</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderHotelForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Hotel className="w-5 h-5" />
        Thông tin đặt phòng
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Ngày nhận phòng</label>
          <input
            type="date"
            value={formData.hotelData.checkIn}
            onChange={(e) => handleInputChange('hotelData.checkIn', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Ngày trả phòng</label>
          <input
            type="date"
            value={formData.hotelData.checkOut}
            onChange={(e) => handleInputChange('hotelData.checkOut', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Số khách</label>
          <select
            value={formData.hotelData.guests}
            onChange={(e) => handleInputChange('hotelData.guests', parseInt(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={getSelectStyles()}
          >
            {[1,2,3,4,5,6].map(num => (
              <option key={num} value={num} style={getOptionStyles()}>{num} người</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Loại phòng</label>
          <select
            value={formData.hotelData.roomType}
            onChange={(e) => handleInputChange('hotelData.roomType', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={getSelectStyles()}
          >
            <option value="suite" style={getOptionStyles()}>Suite</option>
            <option value="deluxe" style={getOptionStyles()}>Deluxe</option>
            <option value="standard" style={getOptionStyles()}>Standard</option>
            <option value="villa" style={getOptionStyles()}>Villa</option>
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Yêu cầu đặc biệt</label>
          <textarea
            value={formData.hotelData.specialRequests}
            onChange={(e) => handleInputChange('hotelData.specialRequests', e.target.value)}
            placeholder="Ví dụ: Phòng tầng cao, view biển, giường đôi..."
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            rows={3}
          />
        </div>
      </div>
    </div>
  )

  const renderBankingForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Building2 className="w-5 h-5" />
        Thông tin tài khoản
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Loại tài khoản</label>
          <select
            value={formData.bankingData.accountType}
            onChange={(e) => handleInputChange('bankingData.accountType', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={getSelectStyles()}
          >
            <option value="premium" style={getOptionStyles()}>Premium</option>
            <option value="vip" style={getOptionStyles()}>VIP</option>
            <option value="platinum" style={getOptionStyles()}>Platinum</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Thu nhập hàng tháng (VND)</label>
          <input
            type="number"
            value={formData.bankingData.monthlyIncome}
            onChange={(e) => handleInputChange('bankingData.monthlyIncome', e.target.value)}
            placeholder="Ví dụ: 50000000"
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Tình trạng việc làm</label>
          <select
            value={formData.bankingData.employmentStatus}
            onChange={(e) => handleInputChange('bankingData.employmentStatus', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={getSelectStyles()}
          >
            <option value="employed" style={getOptionStyles()}>Đang làm việc</option>
            <option value="business" style={getOptionStyles()}>Kinh doanh</option>
            <option value="freelance" style={getOptionStyles()}>Freelance</option>
            <option value="retired" style={getOptionStyles()}>Đã nghỉ hưu</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderEnergyForm = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Zap className="w-5 h-5" />
        Thông tin lắp đặt
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Loại bất động sản</label>
          <select
            value={formData.energyData.propertyType}
            onChange={(e) => handleInputChange('energyData.propertyType', e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            style={getSelectStyles()}
          >
            <option value="house" style={getOptionStyles()}>Nhà riêng</option>
            <option value="apartment" style={getOptionStyles()}>Chung cư</option>
            <option value="villa" style={getOptionStyles()}>Biệt thự</option>
            <option value="office" style={getOptionStyles()}>Văn phòng</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Diện tích mái (m²)</label>
          <input
            type="number"
            value={formData.energyData.roofArea}
            onChange={(e) => handleInputChange('energyData.roofArea', e.target.value)}
            placeholder="Ví dụ: 50"
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Hóa đơn điện hàng tháng (VND)</label>
          <input
            type="number"
            value={formData.energyData.monthlyElectricityBill}
            onChange={(e) => handleInputChange('energyData.monthlyElectricityBill', e.target.value)}
            placeholder="Ví dụ: 2000000"
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">Địa chỉ lắp đặt</label>
          <textarea
            value={formData.energyData.installationAddress}
            onChange={(e) => handleInputChange('energyData.installationAddress', e.target.value)}
            placeholder="Nhập địa chỉ chi tiết để lắp đặt hệ thống pin mặt trời"
            className={`w-full px-3 py-2 rounded-lg border ${
              isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
            rows={3}
          />
        </div>
      </div>
    </div>
  )

  const renderServiceSpecificForm = () => {
    switch (service.category) {
      case 'aviation':
        return renderFlightForm()
      case 'hospitality':
        return renderHotelForm()
      case 'banking':
        return renderBankingForm()
      case 'energy':
        return renderEnergyForm()
      default:
        return null
    }
  }

  return (
    <div className={`fixed inset-0 z-[10001] flex items-center justify-center p-4 ${isDark ? 'bg-black/50' : 'bg-white/50'} backdrop-blur-sm`}>
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border ${
        isDark ? 'bg-gray-900 border-white/20' : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-white/10' : 'bg-gray-100'
            }`}>
              {getServiceIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{service.name}</h2>
              <p className="text-sm opacity-70">Đặt {service.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                Thông tin cá nhân
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Họ và tên *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Ngày sinh *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Loại giấy tờ</label>
                  <select
                    value={formData.idType}
                    onChange={(e) => handleInputChange('idType', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="cccd" style={getOptionStyles()}>CCCD/CMND</option>
                    <option value="passport" style={getOptionStyles()}>Hộ chiếu</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.idType === 'cccd' ? 'Số CCCD/CMND *' : 'Số hộ chiếu *'}
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    required
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-white/10 border-white/20 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Service-specific form */}
            {renderServiceSpecificForm()}

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                  isDark 
                    ? 'bg-white/10 text-white hover:bg-white/20' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hủy
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors bg-gradient-to-r from-red-500 to-yellow-500 text-white hover:from-red-600 hover:to-yellow-600`}
              >
                Tiếp tục thanh toán
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BookingForm
