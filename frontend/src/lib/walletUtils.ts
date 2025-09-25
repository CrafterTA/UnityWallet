// Utility functions for wallet operations
// This handles deriving secret key from mnemonic when needed

import { Keypair } from '@solana/web3.js';

export class WalletUtils {
  /**
   * Derive secret key from mnemonic phrase
   * This should only be called when needed for transactions
   * @param mnemonic - The mnemonic phrase
   * @returns The secret key
   */
  static deriveSecretFromMnemonic(mnemonic: string): string {
    try {
      // For Solana, we can use the mnemonic to derive keypair
      // In production, you should use proper BIP39 derivation with Solana's derivation path
      // This is a simplified version for demo purposes
      
      // Note: This is NOT secure for production use
      // In real implementation, use proper BIP39 with Solana derivation path
      const keypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(mnemonic)));
      return JSON.stringify(Array.from(keypair.secretKey));
    } catch (error) {
      console.error('Failed to derive secret from mnemonic:', error);
      throw new Error('Invalid mnemonic phrase');
    }
  }

  /**
   * Get secret key for current wallet
   * This should only be called when needed for transactions
   * @param mnemonic - The mnemonic phrase
   * @returns The secret key
   */
  static async getSecretKey(mnemonic: string): Promise<string> {
    if (!mnemonic) {
      throw new Error('No mnemonic available');
    }
    
    return this.deriveSecretFromMnemonic(mnemonic);
  }

  /**
   * Check if wallet is properly set up
   * @param wallet - The wallet object
   * @returns True if wallet has mnemonic
   */
  static isWalletReady(wallet: any): boolean {
    return !!(wallet?.mnemonic);
  }
}
