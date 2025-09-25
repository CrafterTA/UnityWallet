import { Web3Keystore } from './web3Keystore'

interface SessionData {
  session_token: string
  expires_at: string
  public_key: string
}

interface EncryptedSecretData {
  encryptedSecret: string
  iv: string
  publicKey: string
  timestamp: number
}

export class SessionManager {
  private static readonly SESSION_STORAGE_KEY = 'unity-wallet-session'
  private static readonly ENCRYPTED_SECRET_KEY = 'unity-wallet-encrypted-secret'
  private static readonly API_BASE_URL = 'http://localhost:8000' // Adjust based on your backend URL

  // Generate random IV for AES encryption
  private static generateIV( ): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16))
  }

  // Convert string to Uint8Array
  private static stringToUint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str)
  }

  // Convert Uint8Array to string
  private static uint8ArrayToString(arr: Uint8Array): string {
    return new TextDecoder().decode(arr)
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

  // Helper to ensure the input is a pure ArrayBuffer for crypto.subtle APIs
  // This is a more robust way to handle TypeScript's strict BufferSource type checking.
  private static ensureArrayBuffer(data: Uint8Array): ArrayBuffer {
    // Create a new ArrayBuffer and copy the contents of the Uint8Array into it.
    // This explicitly detaches the buffer from the Uint8Array view if it was part of a larger buffer,
    // ensuring it's a standalone ArrayBuffer that TypeScript will accept as BufferSource.
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    return buffer;
  }

  // Encrypt secret key using session token
  private static async encryptSecret(secret: string, sessionToken: string): Promise<EncryptedSecretData> {
    const iv = this.generateIV()
    const secretBytes = this.stringToUint8Array(secret)
    
    // Convert hex session token to bytes (sessionToken is now a hex string of 32 bytes)
    const sessionKeyBytes = this.fromHex(sessionToken)

    // Import session key bytes as encryption key (32 bytes = 256 bits for AES-256)
    const key = await crypto.subtle.importKey(
      'raw',
      this.ensureArrayBuffer(sessionKeyBytes), // Use helper to ensure a pure ArrayBuffer
      'AES-GCM',
      false,
      ['encrypt']
    )

    // Encrypt the secret
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: this.ensureArrayBuffer(iv)
      },
      key,
      this.ensureArrayBuffer(secretBytes) // Use helper to ensure a pure ArrayBuffer
    )

    return {
      encryptedSecret: this.toHex(new Uint8Array(encrypted)),
      iv: this.toHex(iv),
      publicKey: '', // Will be set by caller
      timestamp: Date.now()
    }
  }

  // Decrypt secret key using session token
  private static async decryptSecret(encryptedData: EncryptedSecretData, sessionToken: string): Promise<string> {
    const encryptedBytes = this.fromHex(encryptedData.encryptedSecret)
    const iv = this.fromHex(encryptedData.iv)
    
    // Convert hex session token to bytes (sessionToken is now a hex string of 32 bytes)
    const sessionKeyBytes = this.fromHex(sessionToken)

    // Import session key bytes as decryption key (32 bytes = 256 bits for AES-256)
    const key = await crypto.subtle.importKey(
      'raw',
      this.ensureArrayBuffer(sessionKeyBytes), // Use helper to ensure a pure ArrayBuffer
      'AES-GCM',
      false,
      ['decrypt']
    )

    // Decrypt the secret
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: this.ensureArrayBuffer(iv)
      },
      key,
      this.ensureArrayBuffer(encryptedBytes) // Use helper to ensure a pure ArrayBuffer
    )

    return this.uint8ArrayToString(new Uint8Array(decrypted))
  }

  // Login and create session
  static async login(publicKey: string, password: string): Promise<{ success: boolean; sessionData?: SessionData; error?: string }> {
    try {
      // First verify password with keystore
      const keystore = Web3Keystore.loadKeystore()
      if (!keystore) {
        return { success: false, error: 'No keystore found' }
      }

      // Decrypt keystore to verify password and get secret key
      const secret = await Web3Keystore.decryptKeystore(keystore, password)

      // Call backend to create session
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for HttpOnly cookies
        body: JSON.stringify({
          public_key: publicKey,
          password_verified: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: error.detail || 'Login failed' }
      }

      const sessionData: SessionData = await response.json()

      // Encrypt secret key with session token and store in sessionStorage
      const encryptedData = await this.encryptSecret(secret, sessionData.session_token)
      encryptedData.publicKey = publicKey

      sessionStorage.setItem(this.ENCRYPTED_SECRET_KEY, JSON.stringify(encryptedData))

      // Store session info (without session token for security)
      const sessionInfo = {
        expiresAt: sessionData.expires_at,
        publicKey: sessionData.public_key,
        hasSession: true
      }
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionInfo))

      return { success: true, sessionData }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Login failed: ' + (error as Error).message }
    }
  }

  // Verify and restore session on page load
  static async verifySession(): Promise<{ success: boolean; secret?: string; publicKey?: string; error?: string }> {
    try {
      // Check if we have encrypted secret in sessionStorage
      const encryptedDataStr = sessionStorage.getItem(this.ENCRYPTED_SECRET_KEY)
      const sessionInfoStr = sessionStorage.getItem(this.SESSION_STORAGE_KEY)

      if (!encryptedDataStr || !sessionInfoStr) {
        return { success: false, error: 'No session data found' }
      }

      const encryptedData: EncryptedSecretData = JSON.parse(encryptedDataStr)
      const sessionInfo = JSON.parse(sessionInfoStr)

      // Check if session is expired (client-side check)
      if (new Date(sessionInfo.expiresAt) <= new Date()) {
        this.clearSession()
        return { success: false, error: 'Session expired' }
      }

      // Verify session with backend
      const response = await fetch(`${this.API_BASE_URL}/auth/verify`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        this.clearSession()
        return { success: false, error: 'Session verification failed' }
      }

      const verifyData = await response.json()

      // Decrypt secret key using session token from backend
      const secret = await this.decryptSecret(encryptedData, verifyData.session_token)

      return {
        success: true,
        secret,
        publicKey: encryptedData.publicKey
      }
    } catch (error) {
      console.error('Session verification error:', error)
      this.clearSession()
      return { success: false, error: 'Session verification failed: ' + (error as Error).message }
    }
  }

  // Refresh session token
  static async refreshSession(): Promise<{ success: boolean; error?: string }> {
    try {
      const encryptedDataStr = sessionStorage.getItem(this.ENCRYPTED_SECRET_KEY)
      if (!encryptedDataStr) {
        return { success: false, error: 'No session to refresh' }
      }

      const encryptedData: EncryptedSecretData = JSON.parse(encryptedDataStr)

      // Get current secret with old session token
      const verifyResponse = await fetch(`${this.API_BASE_URL}/auth/verify`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!verifyResponse.ok) {
        return { success: false, error: 'Cannot verify current session' }
      }

      const currentSession = await verifyResponse.json()
      const currentSecret = await this.decryptSecret(encryptedData, currentSession.session_token)

      // Refresh session
      const refreshResponse = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include'
      })

      if (!refreshResponse.ok) {
        return { success: false, error: 'Session refresh failed' }
      }

      const newSessionData = await refreshResponse.json()

      // Re-encrypt secret with new session token
      const newEncryptedData = await this.encryptSecret(currentSecret, newSessionData.session_token)
      newEncryptedData.publicKey = encryptedData.publicKey

      // Update stored data
      sessionStorage.setItem(this.ENCRYPTED_SECRET_KEY, JSON.stringify(newEncryptedData))

      const sessionInfo = {
        expiresAt: newSessionData.expiresAt,
        publicKey: newSessionData.publicKey,
        hasSession: true
      }
      sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(sessionInfo))

      return { success: true }
    } catch (error) {
      console.error('Session refresh error:', error)
      return { success: false, error: 'Session refresh failed: ' + (error as Error).message }
    }
  }

  // Logout and clear session
  static async logout(): Promise<void> {
    try {
      // Call backend logout
      await fetch(`${this.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local session data
      this.clearSession()
    }
  }

  // Clear local session data
  static clearSession(): void {
    sessionStorage.removeItem(this.SESSION_STORAGE_KEY)
    sessionStorage.removeItem(this.ENCRYPTED_SECRET_KEY)
  }

  // Check if session exists locally
  static hasSession(): boolean {
    const sessionInfo = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
    if (!sessionInfo) return false

    try {
      const parsed = JSON.parse(sessionInfo)
      return parsed.hasSession && new Date(parsed.expiresAt) > new Date()
    } catch {
      return false
    }
  }

  // Get session info
  static getSessionInfo(): { publicKey?: string; expiresAt?: string } | null {
    const sessionInfo = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
    if (!sessionInfo) return null

    try {
      return JSON.parse(sessionInfo)
    } catch {
      return null
    }
  }
}