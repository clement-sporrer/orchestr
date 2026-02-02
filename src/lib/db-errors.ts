/**
 * Database Error Handling
 * 
 * Provides structured error categorization and user-safe messages
 * for Prisma/PostgreSQL errors. No secrets or connection details are exposed.
 */

// =============================================================================
// ERROR TYPES
// =============================================================================

export type DbErrorCategory = 
  | 'connection'      // Can't reach database
  | 'timeout'         // Query or connection timed out
  | 'auth'            // Authentication failed
  | 'not_found'       // Record not found
  | 'constraint'      // Unique/foreign key violation
  | 'validation'      // Invalid data format
  | 'migration'       // Schema mismatch
  | 'unknown'         // Unclassified error

export interface CategorizedDbError {
  /** Error category for handling logic */
  category: DbErrorCategory
  /** Prisma error code (e.g., P2002) or null */
  code: string | null
  /** User-safe error message (no secrets) */
  userMessage: string
  /** Technical message for logging (no secrets) */
  technicalMessage: string
  /** HTTP status code to return */
  httpStatus: number
  /** Whether this error is retryable */
  isRetryable: boolean
}

// =============================================================================
// PRISMA ERROR CODE MAPPINGS
// =============================================================================

/**
 * Prisma error codes and their categorizations
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 */
const PRISMA_ERROR_MAP: Record<string, Omit<CategorizedDbError, 'code' | 'technicalMessage'>> = {
  // Connection errors (P1xxx)
  P1001: {
    category: 'connection',
    userMessage: 'Service temporairement indisponible. Veuillez réessayer.',
    httpStatus: 503,
    isRetryable: true,
  },
  P1002: {
    category: 'timeout',
    userMessage: 'La requête a pris trop de temps. Veuillez réessayer.',
    httpStatus: 504,
    isRetryable: true,
  },
  P1003: {
    category: 'migration',
    userMessage: 'Erreur de configuration du service.',
    httpStatus: 500,
    isRetryable: false,
  },
  P1008: {
    category: 'timeout',
    userMessage: 'Opération expirée. Veuillez réessayer.',
    httpStatus: 504,
    isRetryable: true,
  },
  P1010: {
    category: 'auth',
    userMessage: 'Erreur de configuration du service.',
    httpStatus: 500,
    isRetryable: false,
  },
  P1017: {
    category: 'connection',
    userMessage: 'Connexion au serveur fermée.',
    httpStatus: 503,
    isRetryable: true,
  },

  // Query errors (P2xxx)
  P2000: {
    category: 'validation',
    userMessage: 'Données invalides fournies.',
    httpStatus: 400,
    isRetryable: false,
  },
  P2001: {
    category: 'not_found',
    userMessage: 'Élément non trouvé.',
    httpStatus: 404,
    isRetryable: false,
  },
  P2002: {
    category: 'constraint',
    userMessage: 'Cet élément existe déjà.',
    httpStatus: 409,
    isRetryable: false,
  },
  P2003: {
    category: 'constraint',
    userMessage: 'Référence invalide. Vérifiez les données associées.',
    httpStatus: 400,
    isRetryable: false,
  },
  P2014: {
    category: 'constraint',
    userMessage: 'Cette modification violerait une contrainte de données.',
    httpStatus: 400,
    isRetryable: false,
  },
  P2021: {
    category: 'migration',
    userMessage: 'Erreur de configuration du service.',
    httpStatus: 500,
    isRetryable: false,
  },
  P2025: {
    category: 'not_found',
    userMessage: 'Élément non trouvé ou déjà supprimé.',
    httpStatus: 404,
    isRetryable: false,
  },

  // Migration errors (P3xxx)
  P3006: {
    category: 'migration',
    userMessage: 'Erreur de mise à jour du service.',
    httpStatus: 500,
    isRetryable: false,
  },
}

// =============================================================================
// ERROR CATEGORIZATION
// =============================================================================

/**
 * Extracts Prisma error code from an error message
 */
function extractPrismaCode(message: string): string | null {
  const match = message.match(/P\d{4}/)
  return match ? match[0] : null
}

/**
 * Categorizes a database error into a structured format.
 * 
 * @param error - Any error from a database operation
 * @returns Categorized error with user-safe message
 */
export function categorizeDbError(error: unknown): CategorizedDbError {
  const errorObj = error instanceof Error ? error : new Error(String(error))
  const message = errorObj.message || ''
  const code = extractPrismaCode(message)

  // Check for mapped Prisma errors
  if (code && PRISMA_ERROR_MAP[code]) {
    const mapped = PRISMA_ERROR_MAP[code]
    return {
      ...mapped,
      code,
      technicalMessage: `Prisma ${code}: ${sanitizeErrorMessage(message)}`,
    }
  }

  // Check for common patterns in unmapped errors
  if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
    return {
      category: 'connection',
      code: null,
      userMessage: 'Service temporairement indisponible.',
      technicalMessage: `Connection refused: ${sanitizeErrorMessage(message)}`,
      httpStatus: 503,
      isRetryable: true,
    }
  }

  if (message.includes('ETIMEDOUT') || message.includes('timeout')) {
    return {
      category: 'timeout',
      code: null,
      userMessage: 'La requête a pris trop de temps.',
      technicalMessage: `Timeout: ${sanitizeErrorMessage(message)}`,
      httpStatus: 504,
      isRetryable: true,
    }
  }

  if (message.includes('authentication') || message.includes('password')) {
    return {
      category: 'auth',
      code: null,
      userMessage: 'Erreur de configuration du service.',
      technicalMessage: 'Database authentication failed',
      httpStatus: 500,
      isRetryable: false,
    }
  }

  // Default unknown error
  return {
    category: 'unknown',
    code,
    userMessage: 'Une erreur inattendue s\'est produite.',
    technicalMessage: sanitizeErrorMessage(message),
    httpStatus: 500,
    isRetryable: false,
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Removes potentially sensitive information from error messages.
 * Strips connection strings, passwords, and IP addresses.
 */
function sanitizeErrorMessage(message: string): string {
  return message
    // Remove PostgreSQL connection strings
    .replace(/postgres(ql)?:\/\/[^\s]+/gi, '[CONNECTION_STRING]')
    // Remove passwords in URLs
    .replace(/:[^:@]+@/g, ':***@')
    // Remove IP addresses
    .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '[IP]')
    // Remove port numbers after IP
    .replace(/:\d{4,5}/g, ':[PORT]')
    // Truncate long messages
    .substring(0, 500)
}

/**
 * Wraps a database operation with error categorization.
 * 
 * @param operation - Async function to execute
 * @param context - Optional context for logging
 * @returns Result of the operation
 * @throws CategorizedDbError on failure
 */
export async function withDbErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const categorized = categorizeDbError(error)
    
    // Log technical details (safe for logs, no secrets)
    console.error(`[DB Error]${context ? ` [${context}]` : ''}`, {
      category: categorized.category,
      code: categorized.code,
      technical: categorized.technicalMessage,
    })
    
    // Create an error that includes both user and technical info
    const dbError = new Error(categorized.userMessage) as Error & { 
      dbError: CategorizedDbError 
    }
    dbError.dbError = categorized
    throw dbError
  }
}

/**
 * Checks if an error is a categorized database error.
 */
export function isDbError(error: unknown): error is Error & { dbError: CategorizedDbError } {
  return (
    error instanceof Error &&
    'dbError' in error &&
    typeof (error as { dbError: unknown }).dbError === 'object'
  )
}

/**
 * Gets an appropriate HTTP response for a database error.
 */
export function getDbErrorResponse(error: unknown): { 
  message: string
  status: number 
} {
  if (isDbError(error)) {
    return {
      message: error.dbError.userMessage,
      status: error.dbError.httpStatus,
    }
  }
  
  // For uncategorized errors, return generic message
  return {
    message: 'Une erreur inattendue s\'est produite.',
    status: 500,
  }
}



