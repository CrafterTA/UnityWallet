import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  QrCode,
  Camera,
  Send as SendIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Wallet,
  Users,
  Clock,
  Shield,
  Sparkles,
  Check,
  ScanLine,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/theme'
import { walletApi } from '@/api/wallet'
import { transactionsApi, Transaction } from '@/api/transactions'
import { formatAssetAmountWithPrecision } from '@/lib/currency'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import QRScanner from '@/components/QRScanner'
import TransactionDetailModal from '@/components/TransactionDetailModal'
import toast from 'react-hot-toast'

/* ---------------- Helpers (top-level) ---------------- */
function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

const Pulse = () => (
  <span className="inline-block h-2 w-2 rounded-full bg-gradient-to-r from-red-500 to-yellow-400 animate-ping" />
)

/* 👉 HOISTED components: giữ identity ổn định, không làm remount subtree */
const SectionCard: React.FC<React.PropsWithChildren<{ title?: React.ReactNode, icon?: React.ReactNode, tone?: 'default' | 'accent', dark?: boolean }>> = ({ title, icon, tone = 'default', dark, children }) => (
  <section className={classNames(
    'rounded-2xl border shadow-xl backdrop-blur-md',
    dark ? 'border-white/15 bg-white/10' : 'border-slate-200 bg-white'
  )}>
    {(title || icon) && (
      <header className={classNames(
        'flex items-center gap-2 px-6 pt-6',
        tone === 'accent' && 'bg-gradient-to-r from-red-500/10 to-yellow-400/10 rounded-t-2xl pb-2'
      )}>
        {icon}
        {title && <h3 className={classNames('font-bold', dark ? 'text-white' : 'text-slate-900')}>{title}</h3>}
      </header>
    )}
    <div className="p-6 pt-4">{children}</div>
  </section>
)

const FieldLabel: React.FC<React.PropsWithChildren<{ dark?: boolean }>> = ({ dark, children }) => (
  <label className={classNames('block text-sm font-medium mb-2', dark ? 'text-white/80' : 'text-slate-900')}>{children}</label>
)

/* ---------------- Component ---------------- */
export default function Pay() {
  const { t } = useTranslation()
  const { isDark } = useThemeStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [note, setNote] = useState<string>('')
  const [asset, setAsset] = useState('USD')
  const [showScanner, setShowScanner] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch real wallet balances
  const { data: balances, isLoading: balancesLoading, error: balancesError, refetch: refetchBalances } = useQuery({
    queryKey: ['wallet-balances-pay'],
    queryFn: walletApi.getBalances,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Always refetch when component mounts
  })

  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['recent-transactions-pay'],
    queryFn: () => transactionsApi.getTransactions({ page: 1, per_page: 20 }), // Lấy nhiều hơn để có đủ 5 non-swap
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
  })

  // Process recent transactions (exclude swap transactions, take first 5)
  const recentTransactions = transactionsData?.transactions
    .filter((tx) => tx.tx_type !== 'SWAP') // Bỏ qua swap transactions
    .slice(0, 5) // Lấy 5 giao dịch gần nhất (không phải swap)
    .map((tx) => {
      let type = 'sent' // default fallback
      
      if (tx.tx_type === 'PAYMENT') {
        type = tx.direction === 'received' ? 'received' : 'sent'
      }
      
      const from = type === 'received' ? tx.source : undefined // Địa chỉ người gửi cho received
      const to = type === 'sent' ? tx.destination : undefined // Địa chỉ người nhận cho sent
    
    return {
      id: tx.id,
        type: type,
      amount: tx.amount,
      symbol: tx.asset_code,
      to,
      from,
      time: new Date(tx.created_at).toLocaleDateString(),
      status: tx.status.toLowerCase()
    }
  }) || []

  // Fetch wallet address
  const { data: walletAddress, isLoading: addressLoading, error: addressError } = useQuery({
    queryKey: ['wallet-address-pay'],
    queryFn: walletApi.getAddress,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Auto-select first available asset when balances load
  useEffect(() => {
    if (balances && balances.length > 0) {
      // Check if current asset exists in balances, if not select first available
      const currentAssetExists = balances.some(b => b.asset_code === asset)
      if (!currentAssetExists) {
        setAsset(balances[0].asset_code)
      }
    }
  }, [balances, asset]) // Add asset back to dependencies

  // Handlers (useCallback cho gọn)
  const handleRecipientChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value), [])
  const handleAmountChange    = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value), [])
  const handleNoteChange      = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNote(e.target.value), [])
  const handleAssetChange     = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setAsset(e.target.value), [])

  const tabs = useMemo(() => ([
    { id: 'send', label: t('pay.send', 'Send'), icon: ArrowUpRight, description: t('pay.transferAssets', 'Transfer assets') },
    { id: 'receive', label: t('pay.receive', 'Receive'), icon: ArrowDownLeft, description: t('pay.getQRCode', 'Get QR code') },
  ] as const), [t])

  // Process real contacts from recent transactions - chỉ lấy địa chỉ của người khác
  const recentContacts = transactionsData?.transactions
    .filter(tx => tx.destination && tx.direction === 'sent') // Chỉ lấy transactions gửi đi (không phải nhận về)
    .map(tx => ({
      name: tx.destination?.substring(0, 8) + '...' + tx.destination?.slice(-4) || 'Unknown',
      address: tx.destination || 'Unknown',
      avatar: tx.destination?.substring(0, 2).toUpperCase() || 'U'
    }))
    .filter((contact, index, self) => 
      index === self.findIndex(c => c.address === contact.address)
    ) // Remove duplicates
    .slice(0, 3) || [] // Limit to 3 contacts

  const quickAmounts = ['$10', '$25', '$50', '$100']

  // Get current asset balance
  const currentAssetBalance = balances?.find(b => b.asset_code === asset)
  const availableBalance = currentAssetBalance ? parseFloat(currentAssetBalance.amount) : 0

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(t)
  }, [copied])

  const handleQuickAmount = useCallback((val: string) => {
    const numericValue = val.replace(/[^0-9.]/g, '')
    setAmount(numericValue)
  }, [])

  const handleSend = async () => {
    if (!recipient || !amount) {
      toast.error(t('pay.fillAllFields', 'Please fill in all fields'))
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(t('pay.invalidAmount', 'Please enter a valid amount'))
      return
    }

    if (amountNum > availableBalance) {
      toast.error(t('pay.insufficientBalance', 'Insufficient balance'))
      return
    }

    setIsSubmitting(true)
    toast.loading(t('pay.processingPayment', 'Processing payment...'), { id: 'payment' })

    try {
      const result = await walletApi.payment({
        destination: recipient,
        asset_code: asset,
        amount: amount,
        memo: note
      })
      
      if (result.status === 'success') {
        toast.success(t('pay.paymentSent', 'Payment sent successfully!'), { id: 'payment' })
        setRecipient('')
        setAmount('')
        setNote('')
        
        // Refetch data immediately to update UI
        await Promise.all([
          refetchBalances(),
          refetchTransactions(),
          queryClient.invalidateQueries({ queryKey: ['wallet-balances'] }),
          queryClient.invalidateQueries({ queryKey: ['transactions'] }),
          queryClient.invalidateQueries({ queryKey: ['activity-summary'] }),
          queryClient.invalidateQueries({ queryKey: ['recent-transactions-wallet'] }),
          queryClient.invalidateQueries({ queryKey: ['activity-transactions'] })
        ])
      } else {
        toast.error(t('pay.paymentFailed', 'Payment failed. Please try again.'), { id: 'payment' })
      }
    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Payment failed. Please try again.'
      toast.error(errorMessage, { id: 'payment' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      toast.success(t('pay.addressCopied', 'Address copied to clipboard'))
    } catch {
      toast.error(t('pay.copyFailed', 'Failed to copy address'))
    }
  }

  const myAddress = walletAddress || 'GBRP...HNKZ4A2B'

  /* ---------------- Render ---------------- */
  return (
    <div className={classNames('min-h-screen', isDark ? 'text-white' : 'text-slate-900')}>
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-yellow-500 shadow-2xl">
          <SendIcon className="h-8 w-8 text-white" />
          <div className="absolute -inset-2 -z-10 blur-2xl bg-gradient-to-br from-red-500/30 to-yellow-400/30 rounded-3xl" />
        </div>
        <h1 className={classNames('text-3xl font-extrabold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
          {t('pay.title', 'Payments')}
        </h1>
        <p className={classNames('mt-1', isDark ? 'text-white/70' : 'text-slate-600')}>
          {t('pay.subtitle', 'Send and receive digital assets instantly')}
        </p>

        {(balancesLoading || balancesError) && (
          <div className={classNames(
            'mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1',
            isDark ? 'bg-white/5 ring-white/10 text-white/70' : 'bg-slate-100 ring-slate-200 text-slate-700'
          )}>
            {balancesLoading && <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
            {balancesError && <span className="text-red-400">{t('common.dataLoadError', 'Unable to load wallet data')}</span>}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="relative mb-6 flex justify-center">
        <div className={classNames('rounded-xl p-1 backdrop-blur-sm inline-flex', isDark ? 'bg-white/5' : 'bg-slate-100/60')}>
          <div className="grid grid-cols-2 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                                      className={classNames(
                      'relative overflow-hidden rounded-lg px-4 py-2 text-center transition-all duration-300 border w-40',
                      active ? 'scale-[1.01]' : 'hover:bg-white/5',
                      active 
                        ? (activeTab === 'send' ? (isDark ? 'border-red-500' : 'border-red-500') : (isDark ? 'border-green-500' : 'border-green-500'))
                        : (isDark ? 'border-white/20' : 'border-slate-300')
                    )}
                  aria-pressed={active}
                >
                  {active && (
                    <div className={classNames('absolute inset-0 rounded-lg', 
                      activeTab === 'send' 
                        ? (isDark ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20' : 'bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/20')
                        : (isDark ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-md shadow-green-500/20' : 'bg-gradient-to-r from-green-500 to-green-600 shadow-md shadow-green-500/20')
                    )} />
                  )}
                  <div className="relative z-10 flex flex-col items-center gap-0.5">
                    <div className={classNames(
                      'grid h-5 w-5 place-items-center rounded transition-all duration-300',
                      active ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-white/60'
                    )}>
                      <Icon className={classNames('h-3 w-3', 
                        active ? 'text-white' : 
                        tab.id === 'send' ? (isDark ? 'text-red-400' : 'text-red-500') :
                        tab.id === 'receive' ? (isDark ? 'text-green-400' : 'text-green-500') :
                        (isDark ? 'text-white/80' : 'text-slate-700')
                      )} />
                    </div>
                    <div className="text-center">
                      <div className={classNames('text-xs font-semibold', active ? '!text-white' : (isDark ? 'text-white/80' : 'text-slate-700'))}>{tab.label}</div>
                      <div className={classNames('text-[10px]', active ? '!text-white' : (isDark ? 'text-white/60' : 'text-slate-500'))}>{tab.description}</div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {/* SEND TAB */}
        {activeTab === 'send' && (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <SectionCard dark={isDark} title={<span className="flex items-center gap-2"><Wallet className="h-5 w-5 text-red-400" />{t('pay.sendPayment','Send Payment')}</span>}>
                
                {/* Error/Loading State */}
                {balancesError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{t('pay.walletError', 'Unable to load wallet. Please refresh and try again.')}</p>
                  </div>
                )}

                {/* Recipient */}
                <div>
                  <FieldLabel dark={isDark}>{t('pay.recipientAddress','Recipient Address')}</FieldLabel>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipient}
                      onChange={handleRecipientChange}
                      placeholder={t('pay.enterWalletAddress','Enter wallet address or scan QR')}
                      className={classNames(
                        'w-full rounded-xl px-4 py-3 outline-none ring-1 focus:ring-2 transition',
                        isDark ? 'bg-white/10 ring-white/20 text-white placeholder-white/50 focus:ring-red-500'
                               : 'bg-slate-100/80 ring-slate-300 text-slate-900 placeholder-slate-500 focus:ring-red-500'
                      )}
                    />
                    <button
                      onClick={() => setShowScanner(true)}
                      className={classNames('absolute right-3 top-3 rounded-lg p-1 transition-colors', isDark ? 'hover:bg-white/20' : 'hover:bg-slate-200')}
                      aria-label={t('pay.scanQRCode','Scan QR Code')}
                      type="button"
                    >
                      <QrCode className={classNames('h-5 w-5', isDark ? 'text-white/70' : 'text-slate-600')} />
                    </button>
                  </div>
                </div>

                {/* Amount + asset */}
                <div className="grid gap-4 sm:grid-cols-[1fr,180px]">
                  <div>
                    <FieldLabel dark={isDark}>
                      {t('pay.amount','Amount')}
                    </FieldLabel>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        max={availableBalance}
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder={balancesLoading ? t('pay.loadingBalance', 'Loading balance...') : "0.00"}
                        disabled={balancesLoading}
                        className={classNames(
                          'w-full rounded-xl px-4 py-3 text-xl font-semibold outline-none ring-1 focus:ring-2',
                          parseFloat(amount) > availableBalance && amount && !balancesLoading ? 'ring-red-500' : '',
                          balancesLoading ? 'opacity-50 cursor-not-allowed' : '',
                          isDark ? 'bg-white/10 ring-white/20 text-white placeholder-white/40 focus:ring-red-500'
                                 : 'bg-slate-100/80 ring-slate-300 text-slate-900 placeholder-slate-500 focus:ring-red-500'
                        )}
                      />
                      <span className={classNames('pointer-events-none absolute right-4 top-3 font-medium', isDark ? 'text-white/70' : 'text-slate-600')}>{asset}</span>
                    </div>
                    
                    {balancesLoading && amount && (
                      <p className="text-blue-500 text-sm mt-1 flex items-center gap-2">
                        <Pulse />
                        {t('pay.loadingBalance', 'Loading balance...')}
                      </p>
                    )}
                    {!balancesLoading && parseFloat(amount) > availableBalance && amount && (
                      <p className="text-red-500 text-sm mt-1">{t('pay.insufficientBalance', 'Insufficient balance')}</p>
                    )}
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickAmounts.map((qa) => (
                        <button
                          key={qa}
                          onClick={() => handleQuickAmount(qa)}
                          type="button"
                          disabled={balancesLoading}
                          className={classNames(
                            'rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                            isDark ? 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
                                   : 'border-slate-300 bg-slate-200 text-slate-700 hover:bg-slate-300'
                          )}
                        >{qa}</button>
                      ))}
                    </div>
                    <p className={classNames('mt-2 text-sm', isDark ? 'text-white/60' : 'text-slate-600')}>{t('pay.quickAmounts','Quick Amounts')}</p>
                  </div>

                  <div>
                    <FieldLabel dark={isDark}>{t('pay.asset','Asset')}</FieldLabel>
                    <select
                      value={asset}
                      onChange={handleAssetChange}
                      disabled={balancesLoading || !balances?.length}
                      className={classNames(
                        'w-full rounded-xl px-4 py-3 outline-none ring-1 focus:ring-2 disabled:opacity-50',
                        isDark ? 'bg-white/10 ring-white/20 text-white focus:ring-red-500' : 'bg-slate-100/80 ring-slate-300 text-slate-900 focus:ring-red-500'
                      )}
                      style={isDark ? { 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      } : {}}
                    >
                      {balances?.map((balance) => (
                        <option 
                          key={balance.asset_code} 
                          value={balance.asset_code} 
                          className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}
                        >
                          {balance.asset_code} ({formatAssetAmountWithPrecision(balance.amount, balance.asset_code, 6)})
                        </option>
                      )) || (
                        <option value="" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}>
                          {balancesLoading ? t('common.loading', 'Loading...') : t('pay.noAssets', 'No assets available')}
                        </option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div className="mt-4">
                  <FieldLabel dark={isDark}>{t('pay.message','Message (Optional)')}</FieldLabel>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={handleNoteChange}
                    placeholder={t('pay.enterMessage','Enter a message for the recipient')}
                    className={classNames(
                      'w-full resize-none rounded-xl px-4 py-3 outline-none ring-1 focus:ring-2',
                      isDark ? 'bg-white/10 ring-white/20 text-white placeholder-white/50 focus:ring-red-500'
                             : 'bg-slate-100/80 ring-slate-300 text-slate-900 placeholder-slate-600 focus:ring-red-500'
                    )}
                  />
                </div>

                {/* Send button */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSend}
                    disabled={!recipient || !amount || isSubmitting || balancesLoading || !!balancesError || parseFloat(amount) > availableBalance}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 shadow-lg',
                      (!recipient || !amount || isSubmitting || balancesLoading || !!balancesError || parseFloat(amount) > availableBalance)
                        ? 'opacity-60 cursor-not-allowed'
                        : 'hover:scale-[1.02]',
                      isDark ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'
                    )}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <SendIcon className="h-5 w-5" />
                    )}
                    {isSubmitting ? t('pay.sending', 'Sending...') : t('pay.sendButton', 'Send Payment')}
                  </button>
                </div>
              </SectionCard>

              {/* Recent Contacts */}
              <SectionCard dark={isDark} title={<span className="flex items-center gap-2"><Users className="h-5 w-5 text-yellow-400" />{t('pay.recentContacts','Recent Contacts')}</span>}>
                <div className="space-y-3">
                  {recentContacts.map((c, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRecipient(c.address)}
                      type="button"
                      className={classNames(
                        'group flex w-full items-center gap-4 rounded-xl border p-3 text-left transition',
                        isDark ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-100/80'
                      )}
                    >
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-red-500 to-yellow-500 text-white shadow">
                        <span className="text-sm font-semibold">{c.avatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className={classNames('font-medium', isDark ? 'text-white' : 'text-slate-900')}>{c.name}</div>
                        <div className={classNames('font-mono text-xs truncate', isDark ? 'text-white/60' : 'text-slate-600')}>{c.address}</div>
                      </div>
                      <ArrowUpRight className={classNames('h-4 w-4 transition-colors', isDark ? 'text-white/60 group-hover:text-white/80' : 'text-slate-600 group-hover:text-slate-800')} />
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Aside / Tips */}
            <div className="lg:col-span-2 space-y-6">
              <SectionCard dark={isDark} tone="accent" icon={<div className="grid h-10 w-10 place-items-center rounded-xl bg-red-500 text-white"><ScanLine className="h-5 w-5"/></div>} title={t('pay.scannerFast','Scan & Fill Fast')}>
                <p className={classNames('text-sm', isDark ? 'text-white/70' : 'text-slate-600')}>
                  {t('pay.scannerHint','Use the QR scanner to auto-fill recipient and amount from a payment request.')}
                </p>
                <button
                  onClick={() => setShowScanner(true)}
                  type="button"
                  className={classNames('mt-3 w-full rounded-xl border px-4 py-3 font-medium backdrop-blur-sm transition', isDark ? 'border-white/20 bg-white/10 hover:bg-white/20' : 'border-yellow-500 bg-yellow-400 text-slate-900 hover:bg-yellow-500')}
                >
                  {t('pay.scanQRCode','Open Scanner')}
                </button>
              </SectionCard>

              <SectionCard dark={isDark} title={<span className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-400" />{t('activity.recentActivity','Recent Activity')}</span>}>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        onClick={() => {
                          // Tìm transaction gốc từ API data
                          const originalTx = transactionsData?.transactions.find(transaction => transaction.id === tx.id)
                          if (originalTx) {
                            setSelectedTransaction(originalTx)
                            setIsModalOpen(true)
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                            {tx.type === 'sent' ? <ArrowUpRight className="h-4 w-4 text-red-400" /> : 
                             tx.type === 'received' ? <ArrowDownLeft className="h-4 w-4 text-green-400" /> : 
                             <Clock className="h-4 w-4 text-blue-400" />}
                          </div>
                          <div>
                            <p className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {tx.type}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                              {tx.type === 'sent' ? `To: ${tx.to ? `${tx.to.substring(0, 8)}...${tx.to.slice(-4)}` : 'Unknown'}` : 
                               tx.type === 'received' ? `From: ${tx.from ? `${tx.from.substring(0, 8)}...${tx.from.slice(-4)}` : 'Unknown'}` : 
                               `${tx.symbol}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            tx.type === 'sent' ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {tx.type === 'sent' ? '-' : '+'}{formatAssetAmountWithPrecision(tx.amount, tx.symbol, 6)} {tx.symbol}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{tx.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <div className={classNames('mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                      <Clock className={classNames('h-6 w-6', isDark ? 'text-white/60' : 'text-slate-600')} />
                    </div>
                    <p className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('activity.noTransactions','No recent transactions')}</p>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}

        {/* RECEIVE TAB */}
        {activeTab === 'receive' && (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 space-y-6">
              <SectionCard dark={isDark} title={<span className="flex items-center gap-2"><QrCode className="h-5 w-5 text-green-400" />{t('pay.receivePayment','Receive Payment')}</span>}>
                <div className="min-h-[400px] flex flex-col items-center justify-center">
                  {!showQR ? (
                    <div className="text-center space-y-6">
                      <div className={classNames('w-32 h-32 rounded-2xl flex items-center justify-center mx-auto', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                        <QrCode className="w-16 h-16 text-green-400" />
                      </div>
                      <div>
                        <h3 className={classNames('text-xl font-semibold mb-2', isDark ? 'text-white' : 'text-slate-900')}>
                          {t('pay.createQRCode','Create QR Code')}
                        </h3>
                        <p className={classNames('text-sm', isDark ? 'text-white/70' : 'text-slate-700')}>
                          {t('pay.qrDescription','Generate a QR code to receive payments')}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowQR(true)}
                        type="button"
                        className={classNames('inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold transition-all duration-300 shadow-lg hover:scale-[1.02]', isDark ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500')}
                      >
                        <QrCode className="h-6 w-6" />
                        {t('pay.createQRCode','Create QR Code')}
                      </button>
                    </div>
                  ) : (
                    <div className="w-full max-w-md">
                      <div className={classNames('rounded-2xl p-6 ring-1', isDark ? 'bg-white/5 ring-white/10' : 'bg-white ring-slate-200')}>
                        {/* Tạo QR code với dữ liệu từ form */}
                        <QRCodeGenerator />
                      </div>
                      <p className={classNames('mt-4 text-sm text-center', isDark ? 'text-white/70' : 'text-slate-700')}>
                        {t('pay.shareQRCode','Share this address to receive payments from any compatible wallet')}
                      </p>
                    </div>
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <SectionCard dark={isDark} title={t('pay.yourAddress','Your Address')}>
                <div className={classNames('rounded-xl border p-4', isDark ? 'border-white/20 bg-white/10' : 'border-slate-200 bg-slate-100/80')}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className={classNames('font-mono text-sm tracking-wide break-all', isDark ? 'text-white/80' : 'text-slate-700')}>
                        {myAddress}
                      </span>
                    </div>
                    <button
                      onClick={() => copyAddress(myAddress)}
                      type="button"
                      className={classNames('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex-shrink-0', isDark ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500')}
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? (
                        <span className="inline-flex items-center gap-1"><Check className="h-4 w-4" /> {t('pay.copied','Copied')}</span>
                      ) : (
                        <span className="hidden sm:inline">{t('pay.copyAddress','Copy Address')}</span>
                      )}
                    </button>
                  </div>
                </div>
                <p className={classNames('mt-3 text-sm', isDark ? 'text-white/70' : 'text-slate-700')}>
                  {t('pay.shareQRCode','Share this address to receive payments from any compatible wallet')}
                </p>
              </SectionCard>

              <SectionCard dark={isDark} title={<span className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-400" />{t('activity.recentActivity','Recent Activity')}</span>}>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        onClick={() => {
                          // Tìm transaction gốc từ API data
                          const originalTx = transactionsData?.transactions.find(transaction => transaction.id === tx.id)
                          if (originalTx) {
                            setSelectedTransaction(originalTx)
                            setIsModalOpen(true)
                          }
                        }}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-white/10 transition-colors ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                            {tx.type === 'sent' ? <ArrowUpRight className="h-4 w-4 text-red-400" /> : 
                             tx.type === 'received' ? <ArrowDownLeft className="h-4 w-4 text-green-400" /> : 
                             <Clock className="h-4 w-4 text-blue-400" />}
                          </div>
                          <div>
                            <p className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {tx.type}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                              {tx.type === 'sent' ? `To: ${tx.to ? `${tx.to.substring(0, 8)}...${tx.to.slice(-4)}` : 'Unknown'}` : 
                               tx.type === 'received' ? `From: ${tx.from ? `${tx.from.substring(0, 8)}...${tx.from.slice(-4)}` : 'Unknown'}` : 
                               `${tx.symbol}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            tx.type === 'sent' ? 'text-red-400' : 'text-green-400'
                          }`}>
                            {tx.type === 'sent' ? '-' : '+'}{formatAssetAmountWithPrecision(tx.amount, tx.symbol, 6)} {tx.symbol}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{tx.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <div className={classNames('mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                      <Clock className={classNames('h-6 w-6', isDark ? 'text-white/60' : 'text-slate-600')} />
                    </div>
                    <p className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('activity.noTransactions','No recent transactions')}</p>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}
      </div>



      {/* Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[200] grid place-items-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowScanner(false)} />
          <div className={classNames('relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl', isDark ? 'border-white/15 bg-slate-900' : 'border-slate-200 bg-white')}>
            <div className="p-4">
              {/* KẾT NỐI SCANNER: trả dữ liệu về form & đóng modal */}
              <QRScanner
                autoStart={true}
                onClose={() => setShowScanner(false)}
                onResult={(data: any) => {
                  if (data?.address) setRecipient(data.address)
                  if (data?.amount) setAmount(String(data.amount))
                  if (data?.asset) setAsset(data.asset)
                  if (data?.note) setNote(data.note)
                  setShowScanner(false)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTransaction(null)
        }}
      />
    </div>
  )
}
