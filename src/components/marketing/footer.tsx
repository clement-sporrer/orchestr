'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Linkedin, Twitter } from 'lucide-react'
import { LanguageSwitcher } from '@/components/language-switcher'

export function MarketingFooter() {
  const t = useTranslations('footer')

  const footerLinks = [
    { href: '/legal/privacy', label: t('links.privacy') },
    { href: '/legal/terms', label: t('links.terms') },
    { href: '/security', label: t('links.security') },
    { href: '/contact', label: t('links.contact') },
  ]

  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="text-center md:text-left">
            <Link href="/" className="text-lg font-bold text-primary">
              ORCHESTR
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {t('tagline')}
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social Links & Language */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="minimal" />
            <a
              href="#"
              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            {t('poweredBy')}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            © {new Date().getFullYear()} ORCHESTR. {t('copyright')}
          </p>
        </div>
      </div>
    </footer>
  )
}
