import Link from 'next/link'
import { Linkedin, Twitter } from 'lucide-react'

const footerLinks = [
  { href: '/legal/privacy', label: 'Privacy' },
  { href: '/legal/terms', label: 'Terms' },
  { href: '/security', label: 'Security' },
  { href: '/contact', label: 'Contact' },
]

export function MarketingFooter() {
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
              Recruitment Orchestration Platform
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

          {/* Social Links */}
          <div className="flex items-center gap-4">
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
            Powered by{' '}
            <span className="font-medium text-foreground">Sporrer</span>
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            © {new Date().getFullYear()} ORCHESTR. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
