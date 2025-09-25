import { apiClient } from './client'
import { chainApi } from './chain'

export interface Balance {
  balance: string
  balance_ui: string
  mint: string
  decimals: number
  symbol: string
}

export interface BalancesResponse {
  balances: Record<string, Balance>
}

export interface PaymentRequest {
  destination: string
  token: {
    mint: string
    symbol?: string
    decimals?: number
  }
  amount: string
  memo?: string
}

export interface PaymentResponse {
  success: boolean
  signature: string
  transaction: string
  balances: Record<string, any>
  explorer_link?: string
  solscan_link?: string
}

export interface SwapRequest {
  selling_asset_code: string
  buying_asset_code: string
  amount: string
}

export interface SwapResponse {
  signature: string
  transaction: string
  balances: Record<string, any>
  explorer_link?: string
  solscan_link?: string
}

export interface QuoteResponse {
  quote_id: string
  from_asset: string
  to_asset: string
  from_amount: string
  to_amount: string
  exchange_rate: string
  fee_amount: string
  fee_percentage: string
  expires_at: string
  created_at: string
  provider: string
}

export interface TransactionResult {
  signature: string
  status: 'pending' | 'success' | 'failed'
  slot?: number
}

export const walletApi = {
  async getBalances(): Promise<Balance[]> {
    try {
      // Get wallet from store
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      if (!wallet.state?.wallet?.public_key) {
        // Return empty balances if no wallet
        return []
      }
      
      const response = await chainApi.getBalances(wallet.state.wallet.public_key)
      
      // Convert chain service response to our format
      const balances: Balance[] = Object.entries(response.balances).map(([symbol, balanceData]) => ({
        balance: balanceData.balance,
        balance_ui: balanceData.balance_ui,
        mint: balanceData.mint,
        decimals: balanceData.decimals,
        symbol: balanceData.symbol
      }))
      
      return balances
    } catch (error) {
      console.error('Wallet balance error:', error)
      // Return empty balances on error instead of throwing
      return []
    }
  },

  async getAddress(): Promise<string> {
    try {
      // Get wallet from store instead of localStorage
      const { useAuthStore } = await import('@/store/session')
      const { wallet } = useAuthStore.getState()
      
      if (!wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }
      
      return wallet.public_key
    } catch (error) {
      throw new Error('Failed to get wallet address')
    }
  },

  async payment(request: PaymentRequest): Promise<TransactionResult> {
    try {
      // Get wallet from store instead of localStorage
      const { useAuthStore } = await import('@/store/session')
      const { wallet } = useAuthStore.getState()
      
      if (!wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }

      // Get secret key - either from wallet or derive from mnemonic
      let secretKey = wallet?.secret
      
      if (!secretKey && wallet?.mnemonic) {
        // Derive secret key from mnemonic
        const { WalletUtils } = await import('@/lib/walletUtils')
        secretKey = WalletUtils.deriveSecretFromMnemonic(wallet.mnemonic)
      }
      
      if (!secretKey) {
        // If no secret key available, wallet is locked
        const { useAuthStore } = await import('@/store/session')
        const { lockWallet } = useAuthStore.getState()
        lockWallet() // This will trigger unlock modal
        throw new Error('Wallet is locked. Please unlock wallet first to perform transactions.')
      }

      // Use the old execute endpoint for now (requires secret key)
      const response = await chainApi.executeSend({
        secret: secretKey,
        destination: request.destination,
        source: request.token,
        amount: request.amount
      })

      return {
        signature: response.signature,
        status: 'success' as const,
        slot: undefined
      }
    } catch (error) {
      console.error('Payment error:', error)
      throw new Error('Payment failed. Please try again.')
    }
  },

  async swap(request: { selling_asset_code: string; buying_asset_code: string; amount: string }): Promise<TransactionResult> {
    try {
      // Get wallet from store instead of localStorage
      const { useAuthStore } = await import('@/store/session')
      const { wallet } = useAuthStore.getState()
      
      
      if (!wallet?.public_key) {
        throw new Error('No wallet found. Please login first.')
      }

      // Get secret key - either from wallet or derive from mnemonic
      let secretKey = wallet?.secret
      
      if (!secretKey && wallet?.mnemonic) {
        // Derive secret key from mnemonic
        const { WalletUtils } = await import('@/lib/walletUtils')
        secretKey = WalletUtils.deriveSecretFromMnemonic(wallet.mnemonic)
      }
      
      if (!secretKey) {
        // If no secret key available, wallet is locked
        const { useAuthStore } = await import('@/store/session')
        const { lockWallet } = useAuthStore.getState()
        lockWallet() // This will trigger unlock modal
        throw new Error('Wallet is locked. Please unlock wallet first to perform transactions.')
      }


      // Get swap quote first
      const quoteResponse = await chainApi.getSwapQuote({
        mode: 'send',
        source_token: { 
          mint: request.selling_asset_code === 'SOL' ? 'native' : request.selling_asset_code,
          symbol: request.selling_asset_code
        },
        dest_token: { 
          mint: request.buying_asset_code === 'SOL' ? 'native' : request.buying_asset_code,
          symbol: request.buying_asset_code
        },
        source_amount: request.amount,
        source_account: wallet.public_key,
        slippage_bps: 200
      })
      

      const destMin = quoteResponse.dest_min_suggest || quoteResponse.destination_amount || '0'

      // Execute swap using the old execute endpoint
      const swapResponse = await chainApi.executeSwap({
        mode: 'send',
        secret: secretKey,
        destination: wallet.public_key,
        source_token: { 
          mint: request.selling_asset_code === 'SOL' ? 'native' : request.selling_asset_code,
          symbol: request.selling_asset_code
        },
        dest_token: { 
          mint: request.buying_asset_code === 'SOL' ? 'native' : request.buying_asset_code,
          symbol: request.buying_asset_code
        },
        source_amount: request.amount,
        dest_min: destMin,
        route: quoteResponse.raw?.routePlan || []
      })

      return {
        signature: swapResponse.signature,
        status: 'success' as const
      }
    } catch (error) {
      console.error('Swap error:', error)
      throw new Error('Swap failed. Please try again.')
    }
  },

  async getQuote(
    fromAsset: string,
    toAsset: string,
    amount: string
  ): Promise<QuoteResponse> {
    try {
      // Get public key from wallet store
      const wallet = JSON.parse(localStorage.getItem('unity-wallet-auth') || '{}')
      const publicKey = wallet.state?.wallet?.public_key

      if (!publicKey) {
        throw new Error('No wallet found. Please login first.')
      }

      const response = await chainApi.getSwapQuote({
        mode: 'send',
        source_token: { 
          mint: fromAsset === 'SOL' ? 'native' : fromAsset,
          symbol: fromAsset
        },
        dest_token: { 
          mint: toAsset === 'SOL' ? 'native' : toAsset,
          symbol: toAsset
        },
        source_amount: amount,
        source_account: publicKey,
        slippage_bps: 200
      })

      // Map from chain service response structure
      return {
        quote_id: `quote-${Date.now()}`,
        from_asset: fromAsset,
        to_asset: toAsset,
        from_amount: amount,
        to_amount: response.destination_amount || response.dest_min_suggest || '0',
        exchange_rate: response.implied_price || '1',
        fee_amount: response.network_fee_sol || '0.000005',
        fee_percentage: '0.1',
        expires_at: new Date(Date.now() + 30000).toISOString(),
        created_at: new Date().toISOString(),
        provider: 'chain-api'
      }
    } catch (error) {
      console.error('Quote error:', error)
      throw new Error('Quote service unavailable. Please ensure chain service is running.')
    }
  },
}
