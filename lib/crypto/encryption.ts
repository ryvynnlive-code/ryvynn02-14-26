/**
 * Client-Side Encryption Utilities
 * Uses Web Crypto API with AES-GCM-256 for authenticated encryption
 *
 * Security notes:
 * - Keys are derived from user password using PBKDF2
 * - Each entry gets a unique random IV
 * - Ciphertext and IV are base64-encoded for storage
 * - AES-GCM provides both confidentiality and authenticity
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96 bits recommended for AES-GCM
const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16

/**
 * Convert string to ArrayBuffer
 */
function stringToBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer
}

/**
 * Convert ArrayBuffer to string
 */
function bufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer)
}

/**
 * Convert ArrayBuffer to base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return bufferToBase64(salt.buffer as ArrayBuffer)
}

/**
 * Derive encryption key from password using PBKDF2
 *
 * @param password - User's password or passphrase
 * @param saltBase64 - Base64-encoded salt (use generateSalt() to create)
 * @returns CryptoKey for AES-GCM encryption/decryption
 */
export async function deriveKey(
  password: string,
  saltBase64: string
): Promise<CryptoKey> {
  // Import password as key material
  const passwordBuffer = stringToBuffer(password)
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive AES key from password
  const salt = base64ToBuffer(saltBase64)
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )

  return key
}

/**
 * Generate a random IV for encryption
 * Each message should use a unique IV
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * Encrypt plaintext using AES-GCM
 *
 * @param plaintext - Text to encrypt
 * @param key - CryptoKey derived from deriveKey()
 * @returns Object with base64-encoded ciphertext and IV
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = generateIV()
  const plaintextBuffer = stringToBuffer(plaintext)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv as any,
    },
    key,
    plaintextBuffer
  )

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
  }
}

/**
 * Decrypt ciphertext using AES-GCM
 *
 * @param ciphertext - Base64-encoded ciphertext
 * @param iv - Base64-encoded initialization vector
 * @param key - CryptoKey derived from deriveKey()
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (wrong key or tampered data)
 */
export async function decrypt(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const ciphertextBuffer = base64ToBuffer(ciphertext)
  const ivBuffer = base64ToBuffer(iv)

  try {
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: ivBuffer as any,
      },
      key,
      ciphertextBuffer
    )

    return bufferToString(plaintextBuffer)
  } catch (error) {
    throw new Error('Decryption failed: Invalid key or corrupted data')
  }
}

/**
 * Store encryption salt in localStorage
 * The salt is not secret, but we need it to derive the key consistently
 */
export function storeSalt(userId: string, salt: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`ryvynn_salt_${userId}`, salt)
  }
}

/**
 * Retrieve encryption salt from localStorage
 */
export function getSalt(userId: string): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(`ryvynn_salt_${userId}`)
  }
  return null
}

/**
 * Initialize encryption for a new user
 * Generates and stores a salt for key derivation
 */
export function initializeEncryption(userId: string): string {
  const salt = generateSalt()
  storeSalt(userId, salt)
  return salt
}

/**
 * Check if encryption is initialized for a user
 */
export function isEncryptionInitialized(userId: string): boolean {
  return getSalt(userId) !== null
}
