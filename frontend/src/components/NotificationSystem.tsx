import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useThemeStore } from '@/store/theme'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Bell,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Zap
} from 'lucide-react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  timestamp: Date
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { isDark } = useThemeStore()

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      duration: notification.duration || 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
      <NotificationContainer isDark={isDark} />
    </NotificationContext.Provider>
  )
}

const NotificationContainer: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[10000] space-y-3 max-w-sm">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
          isDark={isDark}
        />
      ))}
    </div>
  )
}

const NotificationItem: React.FC<{
  notification: Notification
  onRemove: (id: string) => void
  isDark: boolean
}> = ({ notification, onRemove, isDark }) => {
  const getIcon = () => {
    if (notification.icon) return notification.icon

    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return isDark ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'
      case 'error':
        return isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
      case 'warning':
        return isDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
      case 'info':
        return isDark ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'
      default:
        return isDark ? 'bg-gray-900/20 border-gray-500/30' : 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={`p-4 rounded-xl border backdrop-blur-sm shadow-lg animate-in slide-in-from-right-5 duration-300 ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {notification.title}
          </h4>
          <p className={`text-sm mt-1 ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
            {notification.message}
          </p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="mt-2 text-xs font-medium text-blue-500 hover:text-blue-600 underline"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className={`flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors ${
            isDark ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Helper functions for common notifications
export const usePaymentNotifications = () => {
  const { addNotification } = useNotifications()

  const notifyPaymentSuccess = useCallback((amount: number, asset: string, txHash: string) => {
    addNotification({
      type: 'success',
      title: 'Thanh toán thành công',
      message: `Đã thanh toán ${amount.toLocaleString()} ${asset}`,
      icon: <CreditCard className="w-5 h-5 text-green-500" />,
      action: {
        label: 'Xem giao dịch',
        onClick: () => window.open(`https://stellar.expert/explorer/testnet/tx/${txHash}`, '_blank')
      }
    })
  }, [addNotification])

  const notifyPaymentError = useCallback((error: string) => {
    addNotification({
      type: 'error',
      title: 'Thanh toán thất bại',
      message: error,
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      duration: 8000
    })
  }, [addNotification])

  const notifyWalletUnlocked = useCallback(() => {
    addNotification({
      type: 'info',
      title: 'Ví đã được mở khóa',
      message: 'Bạn có thể thực hiện giao dịch',
      icon: <Zap className="w-5 h-5 text-blue-500" />
    })
  }, [addNotification])

  const notifyBalanceUpdated = useCallback((asset: string, newBalance: number) => {
    addNotification({
      type: 'info',
      title: 'Số dư đã cập nhật',
      message: `${asset}: ${newBalance.toLocaleString()}`,
      icon: <ArrowUpRight className="w-5 h-5 text-blue-500" />
    })
  }, [addNotification])

  return {
    notifyPaymentSuccess,
    notifyPaymentError,
    notifyWalletUnlocked,
    notifyBalanceUpdated
  }
}
