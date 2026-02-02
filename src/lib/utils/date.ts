import { getLocale } from 'next-intl/server'

/**
 * Format a date using the current locale
 */
export async function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): Promise<string> {
  const locale = await getLocale()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

/**
 * Format a date with time using the current locale
 */
export async function formatDateTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): Promise<string> {
  const locale = await getLocale()
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

/**
 * Client-side date formatting (for use in client components)
 */
export function formatDateClient(
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

/**
 * Client-side date-time formatting (for use in client components)
 */
export function formatDateTimeClient(
  date: Date | string,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return dateObj.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}



