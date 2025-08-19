import { useState } from 'react'
import { QrCode, Camera, Send } from 'lucide-react'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import QRScanner from '@/components/QRScanner'

function Pay() {
  const [activeTab, setActiveTab] = useState<'create' | 'scan'>('create')

  const tabs = [
    { id: 'create', label: 'Create QR', icon: QrCode },
    { id: 'scan', label: 'Scan QR', icon: Camera },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy-900 mb-2">QR Payments</h1>
        <p className="text-navy-600">Create or scan QR codes for payments</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-navy-100 p-1 rounded-xl flex">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'create' | 'scan')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-navy-600 hover:text-navy-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'create' && <QRCodeGenerator />}
        {activeTab === 'scan' && <QRScanner />}
      </div>

      {/* Quick Send Option */}
      <div className="bg-white rounded-xl p-6 border border-navy-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-navy-900">Quick Send</h3>
            <p className="text-sm text-navy-600">Send to wallet address directly</p>
          </div>
        </div>
        
        <button className="w-full bg-navy-100 hover:bg-navy-200 text-navy-700 font-medium py-3 px-4 rounded-lg transition-colors">
          Enter Address Manually
        </button>
      </div>
    </div>
  )
}

export default Pay
