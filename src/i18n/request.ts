import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, type Locale, locales } from './config'

// Static imports for messages (required for production builds)
import frMessages from './messages/fr.json'
import enMessages from './messages/en.json'

const messages = {
  fr: frMessages,
  en: enMessages,
} as const

export default getRequestConfig(async () => {
  let locale: Locale = defaultLocale

  try {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('locale')?.value as Locale | undefined
    if (localeCookie && locales.includes(localeCookie)) {
      locale = localeCookie
    }
  } catch {
    // Cookies not available (static generation), use default locale
  }

  return {
    locale,
    messages: messages[locale],
  }
})
