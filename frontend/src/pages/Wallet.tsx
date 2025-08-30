import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useThemeStore } from '@/store/theme';
import { walletApi } from '@/api/wallet';
import { useAuthStore } from '@/store/session';
import toast from 'react-hot-toast';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Send, 
  ArrowDownToLine, 
  ArrowLeftRight, 
  History, 
  Shield, 
  Settings,
  Copy,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Coins,
  CircleDollarSign,
  AlertCircle
} from 'lucide-react';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

export default function WalletPage() {
  const { t } = useTranslation();
  const { isDark } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const walletRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLDivElement>(null);
  const assetsRef = useRef<HTMLDivElement>(null);
  const [showBalance, setShowBalance] = React.useState(true);

  // Fetch real wallet balances
  const { data: balances, isLoading, error: balancesError } = useQuery({
    queryKey: ['wallet-balances'],
    queryFn: walletApi.getBalances,
    enabled: isAuthenticated,
    retry: 1,
    refetchOnWindowFocus: false,
  })

  // Mock wallet data - this could come from auth context
  const walletData = {
    address: 'GB7TAYRUZGE6TVT7NHP5SMDJQSPJRTCZ5T3ZWSGDN7W7CJFMTZ5HJLQD'
  };

  // Calculate total balance from API data
  const totalBalance = balances?.reduce((sum, balance) => {
    return sum + parseFloat(balance.amount);
  }, 0) || 0;

  // Process real asset data
  const assets = balances?.map((balance, index) => ({
    id: index + 1,
    name: balance.asset_code === 'SYP' ? 'Stellar Yield Points' : 
          balance.asset_code === 'USDC' ? 'USD Coin' :
          balance.asset_code === 'XLM' ? 'Stellar Lumens' : balance.asset_code,
    symbol: balance.asset_code,
    icon: balance.asset_code === 'SYP' ? Coins : 
          balance.asset_code === 'USDC' ? CircleDollarSign :
          balance.asset_code === 'XLM' ? DollarSign : Coins,
    balance: parseFloat(balance.amount),
    value: parseFloat(balance.amount), // 1:1 ratio for demo
    change24h: 0, // No change data available yet
    isPositive: true
  })) || [];

  // No real transaction data from backend yet, show empty state
  const recentTransactions: any[] = [];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Wallet card animation
      gsap.fromTo(walletRef.current, 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );

      // Balance animation
      gsap.fromTo(balanceRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6, delay: 0.2, ease: "back.out(1.7)" }
      );

      // Assets animation
      gsap.fromTo(assetsRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power2.out" }
      );

      // Scroll animations
      gsap.utils.toArray('.asset-card').forEach((card: any, index) => {
        gsap.fromTo(card,
          { opacity: 0, x: -50 },
          {
            opacity: 1,
            x: 0,
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
          { opacity: 0, x: 30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            delay: 0.05 * index,
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
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(walletData.address);
    toast.success(t('wallet.addressCopied', 'Wallet address copied to clipboard'));
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="h-4 w-4 text-red-400" />;
      case 'receive':
        return <ArrowDownRight className="h-4 w-4 text-green-400" />;
      case 'swap':
        return <ArrowLeftRight className="h-4 w-4 text-blue-400" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="text-center">
          <Wallet className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('wallet.loginRequired', 'Login Required')}
          </h2>
          <p className={`${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            {t('wallet.loginMessage', 'Please log in to view your wallet')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t('wallet.title', 'My Wallet')}
        </h1>
        <p className={isDark ? 'text-white/70' : 'text-slate-600'}>
          {t('wallet.subtitle', 'Manage your digital assets securely')}
        </p>
      </div>

      {/* Error State */}
      {balancesError && (
        <div className={`${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} backdrop-blur-sm rounded-2xl p-6 border text-center`}>
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            {t('common.errorLoading', 'Error Loading Data')}
          </h3>
          <p className={`mb-4 ${isDark ? 'text-red-300' : 'text-red-600'}`}>
            {t('wallet.errorMessage', 'Unable to load wallet data. Please refresh and try again.')}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('common.refresh', 'Refresh')}
          </button>
        </div>
      )}

      {/* Wallet Card */}
      {!balancesError && (
        <div ref={walletRef} className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-6 border shadow-xl`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('wallet.mainWallet', 'Main Wallet')}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-mono ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                    {walletData.address.slice(0, 8)}...{walletData.address.slice(-8)}
                  </span>
                  <button
                    onClick={copyAddress}
                    className={`transition-colors ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'}`}>
                <Settings className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
              </button>
              <button className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-200 hover:bg-slate-300'}`}>
                <Shield className={`h-4 w-4 ${isDark ? 'text-white/60' : 'text-slate-600'}`} />
              </button>
            </div>
          </div>

          {/* Balance Section */}
          <div ref={balanceRef} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                {t('wallet.totalBalance', 'Total Balance')}
              </span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className={`transition-colors ${isDark ? 'text-white/40 hover:text-white/60' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {showBalance ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </div>
            <div className={`text-4xl sm:text-5xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {showBalance ? `$${totalBalance.toLocaleString()}` : '****'}
            </div>
            {isLoading && (
              <div className="flex items-center justify-center mb-2">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
            <div className={`flex items-center justify-center gap-1 text-sm text-gray-400`}>
              <span>
                {isLoading ? t('common.loading', 'Loading...') : 
                 balancesError ? t('wallet.errorLoadingData', 'Error loading data') :
                 t('wallet.realTimeData', 'Real-time data from Stellar network')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 group ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/80'}`}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Send className="h-5 w-5 text-white" />
          </div>
          <span className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
            {t('wallet.send', 'Send')}
          </span>
        </button>
        <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 group ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/80'}`}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowDownToLine className="h-5 w-5 text-white" />
          </div>
          <span className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
            {t('wallet.receive', 'Receive')}
          </span>
        </button>
        <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 group ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/80'}`}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowLeftRight className="h-5 w-5 text-white" />
          </div>
          <span className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
            {t('wallet.swap', 'Swap')}
          </span>
        </button>
        <button className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 group ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/80'}`}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <History className="h-5 w-5 text-white" />
          </div>
          <span className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
            {t('wallet.history', 'History')}
          </span>
        </button>
      </div>

      {/* Assets Section */}
      {!balancesError && (
        <div ref={assetsRef}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('wallet.assets', 'Assets')}
            </h2>
            <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isDark ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'}`}>
              <Plus className="h-4 w-4" />
              {t('wallet.addAsset', 'Add Asset')}
            </button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              // Loading state
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`h-20 backdrop-blur-sm rounded-2xl border animate-pulse ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'}`} />
                ))}
              </div>
            ) : assets.length > 0 ? (
              assets.map((asset) => (
                <div key={asset.id} className={`asset-card backdrop-blur-sm rounded-2xl border p-4 sm:p-6 transition-all duration-200 ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white/80 border-slate-200 hover:bg-slate-200/80'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                        <asset.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{asset.name}</h3>
                        <p className={`text-sm ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{asset.balance.toFixed(2)} {asset.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        ${asset.value.toLocaleString()}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        asset.isPositive ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{asset.isPositive ? '+' : ''}{asset.change24h}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Empty state
              <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-2xl p-12 border text-center`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100/80 border-slate-200'}`}>
                  <Coins className={`w-8 h-8 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('wallet.noAssets', 'No assets found')}
                </h3>
                <p className={`mb-6 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                  {t('wallet.noAssetsMessage', 'Your wallet appears to be empty. Add some assets to get started.')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('wallet.recentTransactions', 'Recent Transactions')}
          </h2>
          <button className="text-sm text-white/60 hover:text-white transition-colors">
            {t('wallet.viewAll', 'View All')}
          </button>
        </div>

        <div className="space-y-3">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <div key={tx.id} className={`transaction-item backdrop-blur-sm rounded-xl border p-4 transition-all duration-200 ${isDark ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-white/80 border-slate-200 hover:bg-slate-200/80'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <h3 className={`text-sm font-medium capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {tx.type}
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
                        {tx.type === 'send' ? `To: ${tx.to}` : 
                         tx.type === 'receive' ? `From: ${tx.from}` : 
                         `${tx.symbol} → ${tx.to}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-semibold ${
                      tx.type === 'send' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.symbol}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-600'}`}>{tx.time}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Empty transaction state
            <div className={`${isDark ? 'bg-white/10 border-white/20' : 'bg-white/80 border-slate-200'} backdrop-blur-sm rounded-xl p-8 border text-center`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                <History className={`w-6 h-6 ${isDark ? 'text-white/60' : 'text-slate-500'}`} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('wallet.noTransactions', 'No transactions yet')}
              </h3>
              <p className={`${isDark ? 'text-white/70' : 'text-slate-600'}`}>
                {t('wallet.noTransactionsMessage', 'Start by sending or receiving some assets')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
