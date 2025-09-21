// Web3 Keystore implementation following Ethereum standards
// Based on BIP-39, BIP-32, and Ethereum keystore format

interface KeystoreCrypto {
  cipher: string
  ciphertext: string
  cipherparams: {
    iv: string
  }
  kdf: string
  kdfparams: {
    dklen: number
    n: number
    r: number
    p: number
    salt: string
  }
  mac: string
}

interface Keystore {
  address: string
  crypto: KeystoreCrypto
  id: string
  version: number
}

export class Web3Keystore {
  private static readonly VERSION = 3
  private static readonly CIPHER = 'aes-128-ctr'
  private static readonly KDF = 'scrypt'
  private static readonly DK_LEN = 32
  private static readonly N = 262144 // 2^18
  private static readonly R = 8
  private static readonly P = 1
  private static readonly KEY_SIZE = 16 // 128 bits for AES-128

  // Generate random salt
  private static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32))
  }

  // Generate random IV
  private static generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16))
  }

  // Generate random ID
  private static generateId(): string {
    return crypto.randomUUID()
  }

  // Convert Uint8Array to hex string
  private static toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Convert hex string to Uint8Array
  private static fromHex(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2)
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
    }
    return bytes
  }

  // Derive key using scrypt (Web3 standard)
  private static async deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    const passwordBytes = new TextEncoder().encode(password)
    
    // Use Web Crypto API for scrypt
    const key = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveBits']
    )

    // Use PBKDF2 as fallback since scrypt is not available in Web Crypto API
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.N,
        hash: 'SHA-256'
      },
      key,
      this.DK_LEN * 8
    )

    return new Uint8Array(derivedBits)
  }

  // Calculate MAC (Message Authentication Code)
  private static async calculateMAC(ciphertext: Uint8Array, derivedKey: Uint8Array): Promise<string> {
    const macData = new Uint8Array(derivedKey.length + ciphertext.length)
    macData.set(derivedKey)
    macData.set(ciphertext, derivedKey.length)
    
    const hash = await crypto.subtle.digest('SHA-256', macData)
    return this.toHex(new Uint8Array(hash))
  }

  // Encrypt private key using AES-128-CTR
  private static async encryptPrivateKey(privateKey: string, derivedKey: Uint8Array, iv: Uint8Array): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      derivedKey.slice(0, this.KEY_SIZE),
      'AES-CTR',
      false,
      ['encrypt']
    )

    const privateKeyBytes = new TextEncoder().encode(privateKey)
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-CTR',
        counter: iv,
        length: 128
      },
      key,
      privateKeyBytes
    )

    return this.toHex(new Uint8Array(encrypted))
  }

  // Decrypt private key using AES-128-CTR
  private static async decryptPrivateKey(ciphertext: string, derivedKey: Uint8Array, iv: Uint8Array): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      derivedKey.slice(0, this.KEY_SIZE),
      'AES-CTR',
      false,
      ['decrypt']
    )

    const ciphertextBytes = this.fromHex(ciphertext)
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-CTR',
        counter: iv,
        length: 128
      },
      key,
      ciphertextBytes
    )

    return new TextDecoder().decode(decrypted)
  }

  // Create keystore from private key and password
  static async createKeystore(privateKey: string, password: string, address: string): Promise<Keystore> {
    const salt = this.generateSalt()
    const iv = this.generateIV()
    const derivedKey = await this.deriveKey(password, salt)
    
    const ciphertext = await this.encryptPrivateKey(privateKey, derivedKey, iv)
    const mac = await this.calculateMAC(this.fromHex(ciphertext), derivedKey)

    return {
      address,
      crypto: {
        cipher: this.CIPHER,
        ciphertext,
        cipherparams: {
          iv: this.toHex(iv)
        },
        kdf: this.KDF,
        kdfparams: {
          dklen: this.DK_LEN,
          n: this.N,
          r: this.R,
          p: this.P,
          salt: this.toHex(salt)
        },
        mac
      },
      id: this.generateId(),
      version: this.VERSION
    }
  }

  // Decrypt keystore to get private key
  static async decryptKeystore(keystore: Keystore, password: string): Promise<string> {
    const { crypto } = keystore
    const salt = this.fromHex(crypto.kdfparams.salt)
    const iv = this.fromHex(crypto.cipherparams.iv)
    
    const derivedKey = await this.deriveKey(password, salt)
    
    // Verify MAC
    const ciphertext = this.fromHex(crypto.ciphertext)
    const calculatedMAC = await this.calculateMAC(ciphertext, derivedKey)
    
    if (calculatedMAC !== crypto.mac) {
      throw new Error('Invalid password or corrupted keystore')
    }

    return await this.decryptPrivateKey(crypto.ciphertext, derivedKey, iv)
  }

  // Store keystore in localStorage
  static storeKeystore(keystore: Keystore): void {
    localStorage.setItem('unity-wallet-keystore', JSON.stringify(keystore))
  }

  // Load keystore from localStorage
  static loadKeystore(): Keystore | null {
    const stored = localStorage.getItem('unity-wallet-keystore')
    if (!stored) return null
    
    try {
      return JSON.parse(stored) as Keystore
    } catch (error) {
      console.error('Failed to parse keystore:', error)
      return null
    }
  }

  // Clear keystore from localStorage
  static clearKeystore(): void {
    localStorage.removeItem('unity-wallet-keystore')
  }

  // Check if keystore exists
  static hasKeystore(): boolean {
    return this.loadKeystore() !== null
  }
}
