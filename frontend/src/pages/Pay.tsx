import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QrCode, Camera, Send, ArrowUpRight, ArrowDownLeft, Copy, Wallet, Users, Clock, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import QRScanner from '@/components/QRScanner'

function Pay() {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')
  const navigate = useNavigate()

  const tabs = [
    { id: 'send', label: t('pay.send', 'Send'), icon: ArrowUpRight, description: t('pay.transferAssets', 'Transfer assets') },
    { id: 'receive', label: t('pay.receive', 'Receive'), icon: ArrowDownLeft, description: t('pay.getQRCode', 'Get QR code') },
  ]

  const recentContacts = [
    { name: 'Alice Johnson', address: 'GBRP...HNKZ', avatar: 'AJ' },
    { name: 'Bob Smith', address: 'GCXM...PLKJ', avatar: 'BS' },
    { name: 'Carol Davis', address: 'GDTY...QWER', avatar: 'CD' },
  ]

  const quickAmounts = ['$10', '$25', '$50', '$100']

  return (
    <div className={`min-h-screen ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('pay.title', 'Payments')}</h1>
          <p className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('pay.subtitle', 'Send and receive digital assets instantly')}</p>
        </div>
      </div>

                          {/* Tab Navigation */}
       <div className="relative mb-6">
         <div className={`${isDark ? 'bg-white/5' : 'bg-slate-100/50'} rounded-xl p-1.5 backdrop-blur-sm`}>
           <div className="flex space-x-1">
             {tabs.map((tab) => {
               const Icon = tab.icon
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as 'send' | 'receive')}
                   className={`relative flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-300 ease-out ${
                     activeTab === tab.id
                       ? `${isDark ? 'text-white' : 'text-slate-900'}`
                       : `${isDark ? 'text-white/60 hover:text-white/80' : 'text-slate-600 hover:text-slate-800'}`
                   }`}
                 >
                   {/* Active Indicator */}
                   {activeTab === tab.id && (
                     <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
                       isDark ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20' : 'bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-md shadow-yellow-400/20'
                     }`} />
                   )}
                   
                   {/* Content */}
                   <div className="relative z-10 flex items-center space-x-2">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                       activeTab === tab.id
                         ? `${isDark ? 'bg-white/20' : 'bg-white/20'}`
                         : `${isDark ? 'bg-white/10' : 'bg-white/60'}`
                     }`}>
                       <Icon className={`w-4 h-4 transition-all duration-300 ${
                         activeTab === tab.id
                           ? `${isDark ? 'text-white' : 'text-slate-900'}`
                           : `${isDark ? 'text-white/70' : 'text-slate-600'}`
                       }`} />
                     </div>
                     
                     <div className="text-left">
                       <div className={`font-semibold text-sm transition-all duration-300 ${
                         activeTab === tab.id
                           ? `${isDark ? 'text-white' : 'text-slate-900'}`
                           : `${isDark ? 'text-white/70' : 'text-slate-600'}`
                       }`}>
                         {tab.label}
                       </div>
                       <div className={`text-xs transition-all duration-300 ${
                         activeTab === tab.id
                           ? `${isDark ? 'text-white/80' : 'text-slate-700'}`
                           : `${isDark ? 'text-white/50' : 'text-slate-500'}`
                       }`}>
                         {tab.description}
                       </div>
                     </div>
                   </div>
                   
                   {/* Hover Effect */}
                   {activeTab !== tab.id && (
                     <div className={`absolute inset-0 rounded-lg transition-all duration-300 opacity-0 hover:opacity-100 ${
                       isDark ? 'bg-white/5' : 'bg-white/40'
                     }`} />
                   )}
                 </button>
               )
             })}
           </div>
         </div>
       </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'send' && (
          <div className="space-y-6">
            {/* Send Form */}
            <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl`}>
              <h3 className={`font-bold mb-6 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Wallet className="w-5 h-5 text-red-400" />
                <span>{t('pay.sendPayment', 'Send Payment')}</span>
              </h3>
              
              <div className="space-y-4">
                {/* Recipient */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    {t('pay.recipientAddress', 'Recipient Address')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('pay.enterWalletAddress', 'Enter wallet address or scan QR')}
                      className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm ${
                        isDark 
                          ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                          : 'bg-slate-100/80 border-slate-300 text-slate-900 placeholder-slate-500'
                      }`}
                    />
                    <button className={`absolute right-3 top-3 p-1 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-white/20' : 'hover:bg-slate-200'
                    }`}>
                      <QrCode className={`w-5 h-5 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
                    </button>
                  </div>
                </div>

                                 {/* Amount */}
                 <div>
                   <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                     {t('pay.amount', 'Amount')}
                   </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                       className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-xl font-semibold backdrop-blur-sm ${
                         isDark 
                           ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                           : 'bg-slate-100/80 border-slate-300 text-slate-900 placeholder-slate-500'
                       }`}
                     />
                     <span className={`absolute right-4 top-3 font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>USD</span>
                  </div>
                  
                                     {/* Quick Amount Buttons */}
                   <div className="flex space-x-2 mt-3">
                     {quickAmounts.map((amount) => (
                       <button
                         key={amount}
                         className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium border ${
                           isDark 
                             ? 'bg-white/10 hover:bg-white/20 text-white/80 border-white/20' 
                             : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
                         }`}
                       >
                         {amount}
                       </button>
                     ))}
                   </div>
                   <p className={`text-sm mt-2 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>{t('pay.quickAmounts', 'Quick Amounts')}</p>
                </div>

                                 {/* Message */}
                 <div>
                   <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                     {t('pay.message', 'Message (Optional)')}
                   </label>
                   <textarea
                     placeholder={t('pay.enterMessage', 'Enter a message for the recipient')}
                     rows={3}
                     className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none backdrop-blur-sm ${
                       isDark 
                         ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                         : 'bg-slate-100/80 border-slate-300 text-slate-900 placeholder-slate-500'
                     }`}
                   />
                 </div>

                                                 {/* Send Button */}
                <div className="flex justify-end">
                  <button className={`w-auto font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'}`}>
                    <div className="flex items-center justify-center space-x-2">
                      <Send className="w-5 h-5" />
                      <span>{t('pay.sendButton', 'Send Payment')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

                         {/* Recent Contacts */}
             <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl`}>
               <h3 className={`font-bold mb-4 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                 <Users className="w-5 h-5 text-yellow-400" />
                 <span>{t('pay.recentContacts', 'Recent Contacts')}</span>
               </h3>
              
              <div className="space-y-3">
                {recentContacts.map((contact, index) => (
                  <button
                    key={index}
                    className={`w-full flex items-center space-x-4 p-3 rounded-xl transition-colors group border ${
                      isDark 
                        ? 'hover:bg-white/10 border-white/10' 
                        : 'hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">{contact.avatar}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{contact.name}</div>
                      <div className={`text-sm font-mono ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{contact.address}</div>
                    </div>
                    <ArrowUpRight className={`w-4 h-4 transition-colors ${isDark ? 'text-white/60 group-hover:text-white/80' : 'text-slate-600 group-hover:text-slate-800'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'receive' && (
          <div className="space-y-6">
            {/* Receive Payment Form */}
            <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl`}>
              <h3 className={`font-bold mb-6 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <QrCode className="w-5 h-5 text-green-400" />
                <span>{t('pay.receivePayment', 'Nhận Thanh toán')}</span>
              </h3>
              
              <div className="space-y-4">
                {/* Amount */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    {t('pay.amount', 'Số tiền')}
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-xl font-semibold backdrop-blur-sm ${
                      isDark 
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                        : 'bg-slate-100/80 border-slate-300 text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>

                {/* Asset */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    {t('pay.asset', 'Tài sản')}
                  </label>
                  <select className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm ${
                    isDark 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-slate-100/80 border-slate-300 text-slate-900'
                  }`}>
                    <option value="SYP">SYP (15000.00 có sẵn)</option>
                    <option value="USDC">USDC (1000.00 có sẵn)</option>
                    <option value="XLM">XLM (500.00 có sẵn)</option>
                  </select>
                </div>

                {/* Note */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    {t('pay.note', 'Ghi chú (Tùy chọn)')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('pay.paymentDescription', 'Mô tả thanh toán')}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent backdrop-blur-sm ${
                      isDark 
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                        : 'bg-slate-100/80 border-slate-300 text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>

                                {/* Create QR Button */}
                <div className="flex justify-center">
                  <button className={`w-auto font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'}`}>
                    <div className="flex items-center justify-center space-x-2">
                      <QrCode className="w-5 h-5" />
                      <span>{t('pay.createQRCode', 'Tạo mã QR')}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

                         

                         {/* Address Display */}
              <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl`}>
                <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('pay.yourAddress', 'Your Address')}</h3>
              
               <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100/80 border-slate-200'} rounded-xl p-4 border backdrop-blur-sm`}>
                <div className="flex items-center justify-between">
                   <span className={`font-mono text-sm ${isDark ? 'text-white/80' : 'text-slate-600'}`}>GBRP...HNKZ4A2B</span>
                                                                        <button className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${isDark ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'}`}>
                   <Copy className="w-4 h-4" />
                   <span className="text-sm font-medium">{t('pay.copyAddress', 'Copy Address')}</span>
                 </button>
                </div>
              </div>
              
                              <p className={`text-sm mt-3 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                 {t('pay.shareQRCode', 'Share this address to receive payments from any compatible wallet')}
               </p>
            </div>

            {/* Scanner Option */}
            <div className="bg-gradient-to-br from-red-500/20 to-yellow-500/20 rounded-2xl p-6 border border-red-500/30 backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                                 <div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('pay.scanQRCode', 'Scan QR Code')}</h3>
                    <p className={`text-sm ${isDark ? 'text-white/70' : 'text-slate-700'}`}>{t('pay.generateQRCode', 'Let others scan your QR code')}</p>
                 </div>
              </div>
              
                                               <button className={`w-full font-medium py-3 px-4 rounded-xl transition-colors border backdrop-blur-sm ${
                   isDark 
                     ? 'bg-white/20 hover:bg-white/30 text-white border-white/20' 
                     : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 border-yellow-500'
                 }`}>
                   {t('pay.scanQRCode', 'Open Scanner')}
                 </button>
            </div>
          </div>
        )}
      </div>

             {/* Recent Activity */}
        <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl mt-6`}>
          <h3 className={`font-bold mb-4 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
           <Clock className="w-5 h-5 text-blue-400" />
           <span>{t('activity.recentActivity', 'Recent Activity')}</span>
         </h3>
         
         <div className="text-center py-8">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isDark ? 'bg-white/10' : 'bg-slate-200'
            }`}>
              <Clock className={`w-6 h-6 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
           </div>
            <p className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('activity.noTransactions', 'No recent transactions')}</p>
         </div>
       </div>
    </div>
  )
}

export default Pay
