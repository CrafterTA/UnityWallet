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
import * as StellarBase from 'stellar-base';
import { Buffer } from 'buffer';
import { getUSDValue, formatUSDValue, formatAssetAmount, formatAssetAmountWithPrecision, fetchLiveRates, ExchangeRate, DEFAULT_RATES } from '@/lib/currency';
import TransactionDetailModal from '@/components/TransactionDetailModal';

// Polyfills
if (!window.Buffer) window.Buffer = Buffer;
if (!window.global) window.global = window;
if (!window.process) window.process = { env: {} } as any;

// Aliases
const { TransactionBuilder, Networks, Keypair } = StellarBase;
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
  EyeOff,
  Coins,
  CheckCircle,
  AlertCircle,
  X
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
  
  // Onboard flow states
  const [showTrustlineModal, setShowTrustlineModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBonusResult, setShowBonusResult] = useState(false);
  const [trustlineData, setTrustlineData] = useState<any>(null);
  const [onboardData, setOnboardData] = useState<any>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [isReceivingBonus, setIsReceivingBonus] = useState(false);
  const [bonusResult, setBonusResult] = useState<any>(null);

  // Check if this is first time entering wallet (show trustline modal first)
  useEffect(() => {
    const showTrustlineModalFlag = localStorage.getItem('show_trustline_modal');
    
    if (isAuthenticated && wallet?.public_key && showTrustlineModalFlag === 'true') {
      localStorage.removeItem('show_trustline_modal');
      handleAutoBeginOnboard();
    } else if (isAuthenticated && wallet?.public_key && !showTrustlineModalFlag) {
      // Only refetch balances if not showing onboard modals
      refetchBalances();
    }
  }, [isAuthenticated, wallet?.public_key]);

  // Auto-fetch onboard data for new wallet
  const handleAutoBeginOnboard = async () => {
    try {
      // First check current balances to see if wallet already has SYP tokens
      const currentBalances = await chainApi.getBalances(wallet?.public_key || '');
      
      // Check if wallet already has SYP tokens
      const hasSYPTokens = currentBalances?.balances && 
        Object.keys(currentBalances.balances).some(key => key.startsWith('SYP:') || key === 'SYP');
      
      if (hasSYPTokens) {
        // Wallet already has SYP tokens, no need for onboard
        console.log('Wallet already has SYP tokens, skipping onboard');
        toast.success('Welcome back! Your wallet is ready.');
        refetchBalances();
        return;
      }
      
      const response = await chainApi.beginOnboard({
        public_key: wallet?.public_key || ''
      });
      
      setOnboardData(response);
      
      if (response.status === 'ready_to_sign') {
        setTrustlineData(response);
        setShowTrustlineModal(true);
      } else if (response.status === 'skip_sign') {
        // Skip directly to bonus if no trustlines needed
        await handleCompleteOnboard(response);
      }
    } catch (error) {
      toast.error('Failed to begin onboard process');
      console.error('Begin onboard error:', error);
      // Fallback to refetch balances
      refetchBalances();
    }
  };

  // Handle trustline confirmation
  const handleConfirmTrustline = () => {
    setShowTrustlineModal(false);
    setShowConfirmModal(true);
  };

  // Handle skip trustline
  const handleSkipTrustline = () => {
    setShowTrustlineModal(false);
    // Set loading state for skip
    setIsReceivingBonus(true);
    // Skip directly to bonus with empty signed_xdr
    handleCompleteOnboard({ ...trustlineData, signed_xdr: '' });
  };

  // Function to sign XDR with user's secret key
  const signXdrWithSecret = async (xdr: string, secret: string): Promise<string> => {
    try {
      const tx = TransactionBuilder.fromXDR(xdr, Networks.TESTNET);
      const keypair = Keypair.fromSecret(secret);
      tx.sign(keypair);
      return tx.toXDR();
    } catch (error) {
      console.error('Error signing XDR:', error);
      throw new Error('Failed to sign transaction');
    }
  };

  // Handle transaction signing
  const handleSignTransaction = async () => {
    // Prevent multiple clicks
    if (isSigning || isReceivingBonus) {
      return;
    }
    
    setIsSigning(true);
    try {
      if (!trustlineData?.xdr) {
        throw new Error('Missing XDR from /onboard/begin');
      }
      
      // Get secret key - either from wallet or derive from mnemonic
      let secretKey = wallet?.secret;
      
      if (!secretKey && wallet?.mnemonic) {
        // Derive secret key from mnemonic
        secretKey = WalletUtils.deriveSecretFromMnemonic(wallet.mnemonic);
      }
      
      if (!secretKey) {
        throw new Error('No user secret to sign with. Please unlock wallet first.');
      }

      // Sign the XDR with user's secret key
      const signedXdr = await signXdrWithSecret(trustlineData.xdr, secretKey);
      
      // Switch to receiving bonus state (keep confirm modal open)
      setIsSigning(false);
      setIsReceivingBonus(true);
      
      // Complete onboard with signed XDR
      await handleCompleteOnboard({ ...trustlineData, signed_xdr: signedXdr });
      
      // Close confirm modal only after bonus is received
      setShowConfirmModal(false);
    } catch (error) {
      toast.error('Failed to sign transaction');
      console.error('Transaction signing error:', error);
      setIsSigning(false);
      setIsReceivingBonus(false);
    }
  };

  // Handle complete onboard process
  const handleCompleteOnboard = async (dataToUse?: any) => {
    const data = dataToUse || trustlineData || onboardData;
    if (!data) return;
    
    try {
      const publicKey = wallet?.public_key;
      if (!publicKey) {
        throw new Error('No wallet public key found. Please login first.');
      }
      
      // Use signed XDR if available, otherwise empty
      const requestBody = {
        public_key: publicKey,
        signed_xdr: data.signed_xdr || ''
      };
      
      // Complete onboard process with signed XDR
      const response = await chainApi.completeOnboard(requestBody);
      
      // Find SYP balance with issuer
      const sypKey = Object.keys(response.balances || {}).find(key => key.startsWith('SYP:'));
      
      if (response.status === 'success') {
        // Show success message
        toast.success(`Received ${response.airdrop_amount || '500'} SYP bonus tokens!`);
        
        // Set bonus result and show result modal
        setBonusResult({
          amount: response.airdrop_amount || '500',
          steps: response.steps || { 'Account funded': 'completed', 'Trustlines set': 'completed', 'Bonus received': 'completed' }
        });
        setShowBonusResult(true);
        
        // Mark as seen
        localStorage.setItem('has_seen_bonus', 'true');
        
        // Convert balances format for display
        const formattedBalances = Object.entries(response.balances || {}).map(([key, amount]) => {
          const [asset, issuer] = key.includes(':') ? key.split(':') : [key, ''];
          return {
            asset_code: asset,
            issuer: issuer,
            amount: amount.toString()
          };
        });
        
        setApiBalances(formattedBalances);
        
        // Don't refetch here - will refetch when bonus modal is closed
      } else {
        // Handle other statuses or errors
        const errorMessage = (response as any).message || 'Unknown error';
        toast.error(`Onboard failed: ${errorMessage}`);
      }
    } catch (error) {
      toast.error('Failed to complete onboard process');
      // Show more detailed error info
      if (error instanceof Error) {
        if (error.message?.includes('400')) {
          toast.error('Invalid request to onboard complete. Check XDR format.');
        } else if (error.message?.includes('500')) {
          toast.error('Server error. Check if environment variables are set correctly.');
        }
      }
    } finally {
      setIsSigning(false);
      setIsReceivingBonus(false);
    }
  };

  // Close bonus result modal
  const handleCloseBonusResult = async () => {
    setShowBonusResult(false);
    setBonusResult(null);
    
    // Now refetch balances after user acknowledges the bonus
    try {
      await refetchBalances();
    } catch (error) {
      console.error('Failed to refetch balances:', error);
      // If refetch fails, reload the page as fallback
      window.location.reload();
    }
  };


  // State for balances from API response
  const [apiBalances, setApiBalances] = useState<any>(null);
  
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

  // Always use fresh balances from API, fallback to cached apiBalances
  const currentBalances = balances || apiBalances;

  // Clear apiBalances when fresh balances are loaded
  useEffect(() => {
    if (balances) {
      setApiBalances(null);
    }
  }, [balances]);


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
        amount: amount as string,
      }))
    : [];

  // Calculate total balance with live USD conversion
  const totalBalance = balancesArray?.reduce((sum: number, balance: any) => {
    return sum + getUSDValue(balance.asset_code, balance.amount, exchangeRates);
  }, 0) || 0;

  // Process balances for display (show only asset code like XLM, SYP, USDC)
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
                  <Coins className="w-6 h-6 text-white" />
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

      {/* Trustline Modal */}
      {showTrustlineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-8 max-w-md w-full ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.trustlineRequired')}</h3>
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>{t('wallet.toReceiveSYPTokens')}</p>
            </div>

            <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-orange-900/20 border border-orange-600/20' : 'bg-orange-50 border border-orange-200'}`}>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-orange-300' : 'text-orange-800'}`}>{t('wallet.whatIsTrustline')}</h4>
              <p className={`text-sm ${isDark ? 'text-orange-400' : 'text-orange-700'}`}>
                {t('wallet.trustlineExplanation')}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleConfirmTrustline}
                className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
              >
                {t('wallet.confirmTrustline')}
              </button>
              <button
                onClick={handleSkipTrustline}
                disabled={isReceivingBonus}
                className={`w-full disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                {isReceivingBonus ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    {t('wallet.receivingBonus')}
                  </>
                ) : (
                  t('wallet.skipForNow')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Transaction Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-8 max-w-md w-full ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.confirmTransaction', 'Confirm Transaction')}</h3>
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>{t('wallet.reviewAndSignTrustline', 'Please review and sign the trustline transaction.')}</p>
            </div>

            <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('wallet.transactionDetails', 'Transaction Details')}</h4>
              <div className={`space-y-2 text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                <div className="flex justify-between">
                  <span>{t('wallet.operation', 'Operation')}:</span>
                  <span>{t('wallet.changeTrust', 'Change Trust')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('wallet.asset', 'Asset')}:</span>
                  <span>SYP</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('wallet.limit', 'Limit')}:</span>
                  <span>{t('wallet.unlimited', 'Unlimited')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSignTransaction}
                disabled={isSigning || isReceivingBonus}
                className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isSigning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('wallet.signing', 'Signing...')}</span>
                  </>
                ) : isReceivingBonus ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('wallet.receivingBonus', 'Receiving Bonus...')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>{t('wallet.signAndConfirm', 'Sign & Confirm')}</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className={`w-full font-semibold py-3 px-6 rounded-xl transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
{t('wallet.backToReview', 'Back to Review')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Result Modal */}
      {showBonusResult && bonusResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-8 max-w-md w-full ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white'}`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="w-8 h-8 text-green-600" />
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('wallet.bonusReceived', 'Bonus Received!')}</h3>
              <p className={`${isDark ? 'text-white/70' : 'text-gray-600'}`}>{t('wallet.successfullyReceivedWelcomeBonus', 'You have successfully received your welcome bonus.')}</p>
            </div>

            <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-green-900/20 border border-green-600/20' : 'bg-green-50 border border-green-200'}`}>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  +{bonusResult.amount} SYP
                </div>
                <p className={`${isDark ? 'text-green-400' : 'text-green-700'}`}>{t('wallet.welcomeBonusTokens', 'Welcome bonus tokens')}</p>
              </div>
            </div>



            <button
              onClick={handleCloseBonusResult}
              className="w-full bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            >
{t('wallet.continueToWallet', 'Continue to Wallet')}
            </button>
          </div>
        </div>
      )}

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