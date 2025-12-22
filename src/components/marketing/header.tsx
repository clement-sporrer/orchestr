'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { cn } from '@/lib/utils'

export function MarketingHeader() {
  const t = useTranslations('nav')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { href: '/product', label: t('product') },
    { href: '/pricing', label: t('pricing') },
    { href: '/security', label: t('security') },
    { href: '/contact', label: t('contact') },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        isScrolled
          ? 'bg-background/95 backdrop-blur-sm border-b border-border shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold tracking-tight text-primary">
              ORCHESTR
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="minimal" />
            <Button variant="ghost" asChild>
              <Link href="/login">{t('login')}</Link>
            </Button>
            <Button asChild>
              <Link href="/contact?reason=demo">{t('requestAccess')}</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher variant="minimal" />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-foreground"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'block py-2 text-base font-medium',
                  pathname === link.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-border">
              <Button variant="outline" asChild className="w-full">
                <Link href="/login">{t('login')}</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/contact?reason=demo">{t('requestAccess')}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
