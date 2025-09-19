// Currency conversion utilities

export interface ExchangeRate {
  [assetCode: string]: number; // Rate to USD
}

// Default exchange rates (fallback values)
export const DEFAULT_RATES: ExchangeRate = {
  'USDC': 1.0,          // 1 USDC = $1 USD
  'XLM': 0.11,          // 1 XLM ≈ $0.11 USD (approximate)
  'SYP': 1.0,           // 1 SYP = $1 USD (assuming pegged to USD)
  'BTC': 43000,         // 1 BTC ≈ $43,000 USD
  'ETH': 2600,          // 1 ETH ≈ $2,600 USD
};

/**
 * Get USD value for an asset amount
 */
export const getUSDValue = (assetCode: string, amount: string, rates: ExchangeRate = DEFAULT_RATES): number => {
  const numAmount = parseFloat(amount) || 0;
  
  // Get asset code without issuer (e.g., "SYP:ISSUER" -> "SYP")
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
  const num = parseFloat(amount) || 0;
  
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};

/**
 * Fetch live exchange rates from Stellar DEX via chain service
 */
export const fetchLiveRates = async (chainApi: any): Promise<ExchangeRate> => {
  try {
    const rates: ExchangeRate = { ...DEFAULT_RATES };
    
    // Fetch rates for each asset against USDC (as base)
    const assets = ['XLM', 'SYP'];
    
    for (const asset of assets) {
      try {
        // Skip if asset is already USDC
        if (asset === 'USDC') continue;
        
        // Get quote from chain service: 1 ASSET -> USDC
        const quote = await chainApi.getSwapQuote({
          mode: 'send',
          source_asset: { code: asset },
          dest_asset: { code: 'USDC' },
          source_amount: '1',
          source_account: 'GDUMMY' // Dummy account for price query
        });
        
        // Extract rate from quote
        const rate = parseFloat(quote.implied_price || quote.price || '1');
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