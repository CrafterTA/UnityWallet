import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
import QRCodeGenerator from '@/components/QRCodeGenerator'
import QRScanner from '@/components/QRScanner'
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

  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [note, setNote] = useState<string>('')
  const [asset, setAsset] = useState('USDC')
  const [showScanner, setShowScanner] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  // Handlers (useCallback cho gọn)
  const handleRecipientChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value), [])
  const handleAmountChange    = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value), [])
  const handleNoteChange      = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNote(e.target.value), [])
  const handleAssetChange     = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setAsset(e.target.value), [])

  const tabs = useMemo(() => ([
    { id: 'send', label: t('pay.send', 'Send'), icon: ArrowUpRight, description: t('pay.transferAssets', 'Transfer assets') },
    { id: 'receive', label: t('pay.receive', 'Receive'), icon: ArrowDownLeft, description: t('pay.getQRCode', 'Get QR code') },
  ] as const), [t])

  const recentContacts = [
    { name: 'Alice Johnson', address: 'GBRP...HNKZ', avatar: 'AJ' },
    { name: 'Bob Smith', address: 'GCXM...PLKJ', avatar: 'BS' },
    { name: 'Carol Davis', address: 'GDTY...QWER', avatar: 'CD' },
  ]
  const quickAmounts = ['$10', '$25', '$50', '$100']

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1200)
    return () => clearTimeout(t)
  }, [copied])

  const handleQuickAmount = useCallback((val: string) => {
    const numericValue = val.replace(/[^0-9.]/g, '')
    setAmount(numericValue)
  }, [])

  const handleSend = () => {
    // Kiểm tra dữ liệu đầu vào
    if (!recipient || !amount) {
      toast.error(t('pay.pleaseFillAllFields', 'Please fill in all required fields'))
      return
    }

    // Hiển thị thông báo đang xử lý
    toast.loading(t('pay.processingPayment', 'Processing payment...'), { id: 'payment' })

    // TODO: Gọi API transfer thực tế ở đây
    // const result = await walletApi.payment({
    //   destination: recipient,
    //   asset_code: asset,
    //   amount: amount,
    //   memo: note
    // })

    // Giả lập xử lý (thay thế bằng API call thực tế)
    setTimeout(() => {
      // Thông báo thành công
      toast.success(t('pay.paymentSent', 'Payment sent successfully!'), { id: 'payment' })
    
      setRecipient('')
      setAmount('')
      setNote('')
    }, 1000)
  }

  const copyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
    } catch {}
  }

  const myAddress = 'GBRP...HNKZ4A2B'

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

        <div className={classNames(
          'mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1',
          isDark ? 'bg-white/5 ring-white/10 text-white/70' : 'bg-slate-100 ring-slate-200 text-slate-700'
        )}>
          <Shield className="h-3.5 w-3.5" />
          {t('pay.secureByDesign', 'Secure by design')}
          <span className="mx-1">·</span>
          <Sparkles className="h-3.5 w-3.5" />
          {t('pay.feesInstant', 'Low fees · Near-instant')}
        </div>
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
                    <FieldLabel dark={isDark}>{t('pay.amount','Amount')}</FieldLabel>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className={classNames(
                          'w-full rounded-xl px-4 py-3 text-xl font-semibold outline-none ring-1 focus:ring-2',
                          isDark ? 'bg-white/10 ring-white/20 text-white placeholder-white/40 focus:ring-red-500'
                                 : 'bg-slate-100/80 ring-slate-300 text-slate-900 placeholder-slate-500 focus:ring-red-500'
                        )}
                      />
                      <span className={classNames('pointer-events-none absolute right-4 top-3 font-medium', isDark ? 'text-white/70' : 'text-slate-600')}>USD</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickAmounts.map((qa) => (
                        <button
                          key={qa}
                          onClick={() => handleQuickAmount(qa)}
                          type="button"
                          className={classNames(
                            'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
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
                      className={classNames(
                        'w-full rounded-xl px-4 py-3 outline-none ring-1 focus:ring-2',
                        isDark ? 'bg-white/10 ring-white/20 text-white focus:ring-red-500' : 'bg-slate-100/80 ring-slate-300 text-slate-900 focus:ring-red-500'
                      )}
                      style={isDark ? { 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white'
                      } : {}}
                    >
                      <option value="USDC" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}>USDC</option>
                      <option value="XLM" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}>XLM</option>
                      <option value="SYP" className={isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}>SYP</option>
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
                    disabled={!recipient || !amount}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-300 shadow-lg',
                      !recipient || !amount
                        ? 'opacity-60 cursor-not-allowed '
                        : 'hover:scale-[1.02]',
                      isDark ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/30' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'
                    )}
                  >
                    <SendIcon className="h-5 w-5" />
                    {t('pay.sendButton', 'Send Payment')}
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
                        <div className={classNames('font-mono text-xs', isDark ? 'text-white/60' : 'text-slate-600')}>{c.address}</div>
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
                <div className="py-2 text-center">
                  <div className={classNames('mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                    <Clock className={classNames('h-6 w-6', isDark ? 'text-white/60' : 'text-slate-600')} />
                  </div>
                  <p className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('activity.noTransactions','No recent transactions')}</p>
                </div>
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
                  <div className="flex items-center justify-between gap-3">
                    <span className={classNames('font-mono text-sm tracking-wide', isDark ? 'text-white/80' : 'text-slate-700')}>{myAddress}</span>
                    <button
                      onClick={() => copyAddress(myAddress)}
                      type="button"
                      className={classNames('inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors', isDark ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500')}
                    >
                      <Copy className="h-4 w-4" />
                      {copied ? (
                        <span className="inline-flex items-center gap-1"><Check className="h-4 w-4" /> {t('pay.copied','Copied')}</span>
                      ) : (
                        <span>{t('pay.copyAddress','Copy Address')}</span>
                      )}
                    </button>
                  </div>
                </div>
                <p className={classNames('mt-3 text-sm', isDark ? 'text-white/70' : 'text-slate-700')}>
                  {t('pay.shareQRCode','Share this address to receive payments from any compatible wallet')}
                </p>
              </SectionCard>

              <SectionCard dark={isDark} title={<span className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-400" />{t('activity.recentActivity','Recent Activity')}</span>}>
                <div className="py-2 text-center">
                  <div className={classNames('mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full', isDark ? 'bg-white/10' : 'bg-slate-200')}>
                    <Clock className={classNames('h-6 w-6', isDark ? 'text-white/60' : 'text-slate-600')} />
                  </div>
                  <p className={isDark ? 'text-white/70' : 'text-slate-600'}>{t('activity.noTransactions','No recent transactions')}</p>
                </div>
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
    </div>
  )
}
