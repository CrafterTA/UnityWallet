import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QrCode, Camera, Send, ArrowUpRight, ArrowDownLeft, Copy, Wallet, Users, Clock, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import QRScanner from '@/components/QRScanner'

function Pay() {
  const { t } = useTranslation()
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
    <div className="min-h-screen text-white">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('pay.title', 'Payments')}</h1>
          <p className="text-white/70">{t('pay.subtitle', 'Send and receive digital assets instantly')}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white/10 backdrop-blur-sm p-1.5 rounded-2xl flex border border-white/20 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'send' | 'receive')}
              className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm scale-[1.02] border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeTab === tab.id ? 'bg-red-500/30' : 'bg-white/10'
              }`}>
                <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-red-300' : 'text-white/60'}`} />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">{tab.label}</div>
                <div className="text-xs opacity-75">{tab.description}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'send' && (
          <div className="space-y-6">
            {/* Send Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="font-bold text-white mb-6 flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-red-400" />
                <span>{t('pay.sendPayment', 'Send Payment')}</span>
              </h3>
              
              <div className="space-y-4">
                {/* Recipient */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    {t('pay.recipientAddress', 'Recipient Address')}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t('pay.enterWalletAddress', 'Enter wallet address or scan QR')}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-white placeholder-white/50 backdrop-blur-sm"
                    />
                    <button className="absolute right-3 top-3 p-1 hover:bg-white/20 rounded-lg transition-colors">
                      <QrCode className="w-5 h-5 text-white/60" />
                    </button>
                  </div>
                </div>

                                 {/* Amount */}
                 <div>
                   <label className="block text-sm font-medium text-white/80 mb-2">
                     {t('pay.amount', 'Amount')}
                   </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-xl font-semibold text-white placeholder-white/50 backdrop-blur-sm"
                    />
                    <span className="absolute right-4 top-3 text-white/70 font-medium">USD</span>
                  </div>
                  
                                     {/* Quick Amount Buttons */}
                   <div className="flex space-x-2 mt-3">
                     {quickAmounts.map((amount) => (
                       <button
                         key={amount}
                         className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 rounded-lg transition-colors text-sm font-medium border border-white/20"
                       >
                         {amount}
                       </button>
                     ))}
                   </div>
                   <p className="text-sm text-white/60 mt-2">{t('pay.quickAmounts', 'Quick Amounts')}</p>
                </div>

                                 {/* Message */}
                 <div>
                   <label className="block text-sm font-medium text-white/80 mb-2">
                     {t('pay.message', 'Message (Optional)')}
                   </label>
                   <textarea
                     placeholder={t('pay.enterMessage', 'Enter a message for the recipient')}
                     rows={3}
                     className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-white placeholder-white/50 backdrop-blur-sm"
                   />
                 </div>

                                 {/* Send Button */}
                 <button className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                   <div className="flex items-center justify-center space-x-2">
                     <Send className="w-5 h-5" />
                     <span>{t('pay.sendButton', 'Send Payment')}</span>
                   </div>
                 </button>
              </div>
            </div>

                         {/* Recent Contacts */}
             <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
               <h3 className="font-bold text-white mb-4 flex items-center space-x-2">
                 <Users className="w-5 h-5 text-yellow-400" />
                 <span>{t('pay.recentContacts', 'Recent Contacts')}</span>
               </h3>
              
              <div className="space-y-3">
                {recentContacts.map((contact, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center space-x-4 p-3 hover:bg-white/10 rounded-xl transition-colors group border border-white/10"
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">{contact.avatar}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">{contact.name}</div>
                      <div className="text-sm text-white/60 font-mono">{contact.address}</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-white/60 group-hover:text-white/80 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'receive' && (
          <div className="space-y-6">
            {/* QR Code Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="font-bold text-white mb-6 flex items-center justify-center space-x-2">
                <QrCode className="w-5 h-5 text-green-400" />
                <span>{t('pay.receive', 'Receive')} {t('pay.title', 'Payments')}</span>
              </h3>
              
              <QRCodeGenerator />
            </div>

                         {/* Address Display */}
             <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
               <h3 className="font-bold text-white mb-4">{t('pay.yourAddress', 'Your Address')}</h3>
              
              <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white/80 text-sm">GBRP...HNKZ4A2B</span>
                                     <button className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-red-500 to-yellow-500 text-white rounded-lg hover:from-red-600 hover:to-yellow-600 transition-colors">
                     <Copy className="w-4 h-4" />
                     <span className="text-sm font-medium">{t('pay.copyAddress', 'Copy Address')}</span>
                   </button>
                </div>
              </div>
              
                             <p className="text-sm text-white/70 mt-3">
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
                   <h3 className="font-semibold text-white">{t('pay.scanQRCode', 'Scan QR Code')}</h3>
                   <p className="text-sm text-white/70">{t('pay.generateQRCode', 'Let others scan your QR code')}</p>
                 </div>
              </div>
              
                             <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-xl transition-colors border border-white/20 backdrop-blur-sm">
                 {t('pay.scanQRCode', 'Open Scanner')}
               </button>
            </div>
          </div>
        )}
      </div>

             {/* Recent Activity */}
       <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl mt-6">
         <h3 className="font-bold text-white mb-4 flex items-center space-x-2">
           <Clock className="w-5 h-5 text-blue-400" />
           <span>{t('activity.recentActivity', 'Recent Activity')}</span>
         </h3>
         
         <div className="text-center py-8">
           <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
             <Clock className="w-6 h-6 text-white/60" />
           </div>
           <p className="text-white/70">{t('activity.noTransactions', 'No recent transactions')}</p>
         </div>
       </div>
    </div>
  )
}

export default Pay
