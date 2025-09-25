import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/store/theme';
import { useAuthStore } from '@/store/session';
import { WalletUtils } from '@/lib/walletUtils';
import { walletApi } from '@/api/wallet';
import { chainApi } from '@/api/chain';
import { transactionsApi } from '@/api/transactions';
import { toast } from 'react-hot-toast';
import { getUSDValue, formatUSDValue, formatAssetAmount, formatAssetAmountWithPrecision, fetchLiveRates, ExchangeRate, DEFAULT_RATES } from '@/lib/currency';
import TransactionDetailModal from '@/components/TransactionDetailModal';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Wallet, 
  Send, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowUpDown,
  RefreshCw, 
  Eye,
  EyeOff
} from 'lucide-react';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

interface Balance {
  asset_code: string;
  amount: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  symbol: string;
  to?: string;
  from?: string;
  time: string;
  status: string;
}

const WalletPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useThemeStore();
  const { wallet, isAuthenticated, logout } = useAuthStore();
  
  // Refs for animations
  const walletRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const assetsRef = useRef<HTMLDivElement>(null);
  
  // State
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  

  // Refetch balances when wallet changes
  useEffect(() => {
    if (isAuthenticated && wallet?.public_key) {
      refetchBalances();
    }
  }, [isAuthenticated, wallet?.public_key]);



  
  // State for exchange rates
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate>(DEFAULT_RATES);

  // Fetch real wallet balances
  const { data: balances, isLoading, error: balancesError, refetch: refetchBalances } = useQuery({
    queryKey: ['wallet-balances', wallet?.public_key],
    queryFn: () => chainApi.getBalances(wallet?.public_key || ''),
    enabled: isAuthenticated && !!wallet?.public_key,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Use fresh balances from API
  const currentBalances = balances;


  // Fetch wallet address
  const { data: walletAddress, isLoading: addressLoading, error: addressError } = useQuery({
    queryKey: ['wallet-address'],
    queryFn: walletApi.getAddress,
    enabled: isAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Fetch live exchange rates
  const { data: liveRates, isLoading: ratesLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => fetchLiveRates(chainApi),
    enabled: isAuthenticated && !!wallet?.public_key,
    retry: 1,
    refetchInterval: 120000, // Refresh every 2 minutes (giảm từ 30s)
    refetchOnWindowFocus: false,
  });

  // Update exchange rates when live rates are fetched
  useEffect(() => {
    if (liveRates) {
      setExchangeRates(liveRates);
    }
  }, [liveRates]);

  // Wallet data with real address from API
  const walletData = {
    address: walletAddress || wallet?.public_key || 'GB7TAYRUZGE6TVT7NHP5SMDJQSPJRTCZ5T3ZWSGDN7W7CJFMTZ5HJLQD'
  };

  // Extract balances array from API response
  const balancesArray = currentBalances?.balances
    ? Object.entries(currentBalances.balances).map(([asset, amount]) => ({
        asset_code: asset as string,
        short_code: (asset as string).includes(':') ? (asset as string).split(':')[0] : (asset as string),
        amount: (amount as any).balance_ui || (amount as any).balance || (amount as unknown as string),
      }))
    : [];

  // Calculate total balance with live USD conversion
  const totalBalance = balancesArray?.reduce((sum: number, balance: any) => {
    return sum + getUSDValue(balance.asset_code, balance.amount, exchangeRates);
  }, 0) || 0;

  // Process balances for display (show only asset code like SOL, USDC, USDT)
  const processedBalances = balancesArray?.map((balance: any) => {
    const usdValue = getUSDValue(balance.asset_code, balance.amount, exchangeRates);
    return {
      symbol: balance.short_code || balance.asset_code,
      amount: balance.amount,
      value: usdValue, // USD value with live conversion rates
      change24h: 0, // No change data available yet
      isPositive: true
    };
  }) || [];


  // Fetch recent transactions
  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['recent-transactions-wallet'],
    queryFn: () => transactionsApi.getTransactions({ page: 1, per_page: 5 }),
    retry: 1,
    refetchOnWindowFocus: false, // Tắt refetch khi focus để giảm refresh
  })

  // Process recent transactions (take first 5)
  const recentTransactions = transactionsData?.transactions
    .slice(0, 5) // Lấy 5 giao dịch gần nhất
    .map((tx) => {
      let type = 'sent' // default fallback
      
      if (tx.tx_type === 'SWAP') {
        type = 'swapped'
      } else if (tx.tx_type === 'PAYMENT') {
        type = tx.direction === 'received' ? 'received' : 'sent'
      }
      
      return {
        // Keep original Transaction object for modal
        ...tx,
        // Add display properties for UI
        displayType: type,
        displayAmount: tx.amount,
        displaySymbol: tx.asset_code,
        displayTo: tx.destination,
        displayFrom: tx.source,
        displayTime: new Date(tx.created_at).toLocaleDateString(),
        displayStatus: tx.status.toLowerCase()
      }
    }) || []

  // GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Wallet card animation
      gsap.fromTo(walletRef.current, 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );

      // Quick Actions animation
      gsap.fromTo(quickActionsRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power2.out" }
      );

      // Assets animation
      gsap.fromTo(assetsRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power2.out" }
      );

      // Quick Actions buttons animation
      gsap.utils.toArray('.quick-action-btn').forEach((btn: any, index) => {
        gsap.fromTo(btn,
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            delay: 0.1 * index,
            ease: "back.out(1.7)"
          }
        );
      });

    });

    return () => ctx.revert();
  }, []); // Chỉ chạy 1 lần khi component mount

  // Separate useEffect for scroll animations when data changes
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Scroll animations for assets
      gsap.utils.toArray('.asset-card').forEach((card: any, index) => {
        gsap.fromTo(card,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.6,
            delay: 0.1 * index,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              end: "bottom 20%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      // Transaction animations
      gsap.utils.toArray('.transaction-item').forEach((item: any, index) => {
        gsap.fromTo(item,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 0.5,
            delay: 0.1 * index,
            ease: "power2.out",
            scrollTrigger: {
              trigger: item,
              start: "top 85%",
              end: "bottom 15%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
    });

    return () => ctx.revert();
  }, [processedBalances, recentTransactions]); // Chỉ chạy khi data thay đổi

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.pleaseLoginToAccess')}</h1>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
          >
            {t('wallet.goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Wallet Card */}
        <div ref={walletRef} className="bg-gradient-to-r from-red-500 to-yellow-500 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('wallet.totalBalance')}</h2>
              <p className="text-red-100">{t('wallet.yourDigitalAssets')}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl font-bold">
                  {showBalance ? formatUSDValue(totalBalance) : '••••••'}
                </div>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                {ratesLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              <div className="text-red-100 text-sm">
                {showBalance ? (ratesLoading ? t('wallet.updatingRates') : t('wallet.usdLive')) : '••••'}
              </div>
          </div>
        </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">{t('wallet.walletAddress')}</p>
              <p className="font-mono text-sm">
                {showBalance ? `${walletData.address.slice(0, 8)}...${walletData.address.slice(-8)}` : '••••••••••••••••'}
              </p>
          </div>
            <button
              onClick={() => navigator.clipboard.writeText(walletData.address)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>
          </div>

        {/* Quick Actions */}
        <div ref={quickActionsRef} className="mb-8">
          <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.quickActions')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Send */}
            <button
              onClick={() => window.location.href = '/pay'}
              className={`quick-action-btn group relative overflow-hidden rounded-xl p-6 border transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/80 border-slate-200 hover:bg-slate-100'}`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpRight className="w-6 h-6 text-white" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.send')}</h4>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{t('wallet.transferAssets')}</p>
              </div>
            </button>

            {/* Receive */}
            <button
              onClick={() => window.location.href = '/pay'}
              className={`quick-action-btn group relative overflow-hidden rounded-xl p-6 border transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/80 border-slate-200 hover:bg-slate-100'}`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <ArrowDownLeft className="w-6 h-6 text-white" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.receive')}</h4>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{t('wallet.getQRCode')}</p>
              </div>
            </button>

            {/* Swap */}
            <button
              onClick={() => window.location.href = '/swap'}
              className={`quick-action-btn group relative overflow-hidden rounded-xl p-6 border transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/80 border-slate-200 hover:bg-slate-100'}`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.swap')}</h4>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{t('wallet.exchangeAssets')}</p>
              </div>
            </button>

            {/* Activity */}
            <button
              onClick={() => window.location.href = '/activity'}
              className={`quick-action-btn group relative overflow-hidden rounded-xl p-6 border transition-all duration-300 hover:scale-105 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/80 border-slate-200 hover:bg-slate-100'}`}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <ArrowUpDown className="w-6 h-6 text-white" />
                </div>
                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.activity')}</h4>
                <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{t('wallet.viewHistory')}</p>
              </div>
            </button>
          </div>
        </div>

        {/* Assets */}
        <div ref={assetsRef} className="mb-8">
          <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.assets')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processedBalances.map((balance: any, index: number) => (
              <div key={index} className={`asset-card backdrop-blur-sm rounded-xl p-6 border transition-all duration-200 ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/80 border-white/20 hover:bg-white/90'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{balance.symbol.charAt(0)}</span>
                      </div>
                      <div>
                      <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{balance.symbol}</h4>
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{t('wallet.digitalAsset')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {showBalance ? formatAssetAmountWithPrecision(balance.amount || '0', balance.symbol, 6) : '••••'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                      {showBalance ? formatUSDValue(balance.value || 0) : '••••'}
                    </p>
                      </div>
                    </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${balance.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {showBalance ? `${balance.change24h > 0 ? '+' : ''}${balance.change24h}%` : '••••'}
                  </span>
                  <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>24h</span>
                  </div>
                </div>
            ))}
          </div>
        </div>

      {/* Recent Transactions */}
        <div className="mb-8">
          <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.recentTransactions')}</h3>
        <div className="space-y-3">
          {transactionsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>{t('wallet.loadingTransactions')}</p>
            </div>
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <div 
                key={tx.id} 
                onClick={() => {
                    setSelectedTransaction(tx as any);
                    setIsModalOpen(true);
                  }}
                  className={`transaction-item backdrop-blur-sm rounded-xl border p-4 transition-all duration-200 cursor-pointer ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/80 border-slate-200 hover:bg-slate-200/80'}`}
              >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.displayType === 'received' ? 'bg-green-100' : tx.displayType === 'swapped' ? 'bg-blue-100' : 'bg-red-100'
                      }`}>
                        {tx.displayType === 'received' ? (
                          <ArrowDownLeft className="w-5 h-5 text-green-600" />
                        ) : tx.displayType === 'swapped' ? (
                          <ArrowUpDown className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                        )}
                    </div>
                    <div>
                        <p className={`font-semibold capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {tx.displayType === 'sent' ? t('wallet.sent') : tx.displayType === 'swapped' ? t('wallet.swapped', 'Swapped') : t('wallet.received')}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                          {tx.displayType === 'swapped' 
                            ? `${t('wallet.swap', 'Asset swap')}` 
                            : tx.displayType === 'sent' 
                              ? `${t('wallet.to')}: ${tx.displayTo?.slice(0, 8)}...` 
                              : `${t('wallet.from')}: ${tx.displayFrom?.slice(0, 8)}...`
                          }
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                      <p className={`font-semibold ${tx.displayType === 'received' ? 'text-green-600' : tx.displayType === 'swapped' ? 'text-blue-600' : 'text-red-600'}`}>
                        {tx.displayType === 'received' ? '+' : tx.displayType === 'swapped' ? '↔' : '-'}{tx.displayAmount} {tx.displaySymbol}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>{tx.displayTime}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
              <div className="text-center py-12">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <ArrowUpRight className={`w-8 h-8 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
              </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.noTransactionsYet')}</h3>
                <p className={`${isDark ? 'text-white/60' : 'text-gray-600'}`}>{t('wallet.transactionHistoryWillAppear')}</p>
            </div>
          )}
        </div>
        </div>


      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction as any}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
      />
    </div>
  );
};

export default WalletPage;