import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

/**
 * Récupère et valide la clé de chiffrement de manière lazy
 * Cette fonction est appelée uniquement au runtime, pas au build time
 */
function getEncryptionKey(): Buffer {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }

  // Vérifier que la clé fait 64 caractères (32 bytes en hex)
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes in hex)')
  }

  return Buffer.from(ENCRYPTION_KEY, 'hex')
}

/**
 * Chiffre un texte de manière sécurisée
 * Utilise AES-256-GCM avec un IV aléatoire
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty string')
  }

  try {
    const iv = crypto.randomBytes(16)
    const key = getEncryptionKey()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Déchiffre un texte chiffré
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty string')
  }

  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format')
    }

    const [ivHex, authTagHex, encrypted] = parts
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted format - missing parts')
    }
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data - data may be corrupted or key invalid')
  }
}

