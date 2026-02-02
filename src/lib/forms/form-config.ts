/**
 * Global React Hook Form configuration
 * Consistent form behavior across the application
 */

export const formConfig = {
  mode: 'onChange' as const, // Real-time validation
  reValidateMode: 'onChange' as const,
  criteriaMode: 'all' as const,
  shouldFocusError: true,
  shouldUnregister: false,
}

/**
 * Common validation messages in French
 */
export const validationMessages = {
  required: 'Ce champ est obligatoire',
  email: 'Email invalide',
  url: 'URL invalide',
  min: (min: number) => `Minimum ${min} caractères`,
  max: (max: number) => `Maximum ${max} caractères`,
  minValue: (min: number) => `Valeur minimale: ${min}`,
  maxValue: (max: number) => `Valeur maximale: ${max}`,
  pattern: 'Format invalide',
}

/**
 * Use validationMessages in schemas: .min(1, validationMessages.required) etc.
 */
