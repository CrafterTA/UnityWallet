// Secure storage utilities for sensitive wallet data
// This provides Web3-standard encryption for secret keys using password

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}

// Web3-standard encryption using PBKDF2 + AES-GCM
export class SecureStorage {
  private static async getKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: 100000, // Web3 standard
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, password: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16)); // Random salt
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await this.getKey(password, salt);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );
    
    return {
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv)),
      salt: btoa(String.fromCharCode(...salt))
    };
  }

  static async decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    const decoder = new TextDecoder();
    
    const encrypted = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const salt = Uint8Array.from(atob(encryptedData.salt), c => c.charCodeAt(0));
    
    const key = await this.getKey(password, salt);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return decoder.decode(decrypted);
  }

  // Store sensitive data in sessionStorage with encryption
  static async setSecureItem(key: string, value: string, password: string): Promise<void> {
    if (!value) return; // Don't store empty values
    try {
      const encrypted = await this.encrypt(value, password);
      sessionStorage.setItem(key, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Failed to encrypt data:', error);
      throw new Error('Failed to store sensitive data securely');
    }
  }

  // Retrieve and decrypt sensitive data from sessionStorage
  static async getSecureItem(key: string, password: string): Promise<string | null> {
    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;
      
      const encryptedData: EncryptedData = JSON.parse(stored);
      return await this.decrypt(encryptedData, password);
    } catch (error) {
      console.error('Failed to decrypt data:', error);
      return null;
    }
  }

  // Clear all secure data
  static clearSecureData(): void {
    const keys = ['wallet-secret', 'wallet-mnemonic']; // Clear both secret key and mnemonic
    keys.forEach(key => sessionStorage.removeItem(key));
  }
}
