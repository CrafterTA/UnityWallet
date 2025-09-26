// Currency conversion utilities

export interface ExchangeRate {
  [assetCode: string]: number; // Rate to USD
}

// Default exchange rates (fallback values)
export const DEFAULT_RATES: ExchangeRate = {
  // USDC removed - only SOL and USDT supported
  'USDT': 1.0,          // 1 USDT = $1 USD
  'SOL': 195.3673,      // 1 SOL ≈ $195.3673 USD (approximate)
  'BTC': 43000,         // 1 BTC ≈ $43,000 USD
  'ETH': 2600,          // 1 ETH ≈ $2,600 USD
};

/**
 * Get USD value for an asset amount
 */
export const getUSDValue = (assetCode: string, amount: string, rates: ExchangeRate = DEFAULT_RATES): number => {
  const numAmount = parseFloat(amount) || 0;
  
  // Get asset code without issuer (e.g., "SOL:ISSUER" -> "SOL")
  const shortCode = assetCode.includes(':') ? assetCode.split(':')[0] : assetCode;
  
  // Get exchange rate, default to 1.0 if not found
  const rate = rates[shortCode] || 1.0;
  
  return numAmount * rate;
};

/**
 * Format USD value for display
 */
export const formatUSDValue = (value: number): string => {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format asset amount for display
 */
export const formatAssetAmount = (amount: string, decimals: number = 2): string => {
  // Parse as string to preserve precision, then convert to number
  const num = parseFloat(amount) || 0;
  
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

/**
 * Format asset amount for display with asset-specific precision
 */
export const formatAssetAmountWithPrecision = (amount: string, assetCode: string, decimals: number = 2): string => {
  // Parse as string to preserve precision, then convert to number
  const num = parseFloat(amount) || 0;
  
  // Use more decimal places for all assets to avoid rounding issues
  const actualDecimals = Math.max(decimals, 6);
  
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: actualDecimals, 
    maximumFractionDigits: actualDecimals 
  });
};

/**
 * Fetch live exchange rates from Solana DEX via chain service
 */
export const fetchLiveRates = async (chainApi: any): Promise<ExchangeRate> => {
  try {
    const rates: ExchangeRate = { ...DEFAULT_RATES };
    
    // Fetch rates for each asset against USDT (as base)
    const assets = ['SOL'];
    
    for (const asset of assets) {
      try {
        // Skip if asset is already USDT
        if (asset === 'USDT') continue;
        
        // Get quote from chain service: 1 ASSET -> USDT
        const quote = await chainApi.getSwapQuote({
          mode: 'send',
          source_token: { 
            mint: asset === 'SOL' ? 'native' : asset,
            symbol: asset
          },
          dest_token: { 
            mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT mint on devnet
            symbol: 'USDT'
          },
          source_amount: '0.01'
          // No source_account needed for price queries
        });
        
        // Extract rate from quote
        const rate = parseFloat(quote.implied_price || '1');
        if (rate > 0) {
          rates[asset] = rate;
        }
      } catch (error) {
        console.warn(`Failed to fetch rate for ${asset}, using default:`, error);
      }
    }
    
    return rates;
  } catch (error) {
    console.warn('Failed to fetch live rates, using defaults:', error);
    return DEFAULT_RATES;
  }
};