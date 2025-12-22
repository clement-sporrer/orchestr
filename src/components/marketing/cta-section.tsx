import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface CTASectionProps {
  title: string
  subtitle?: string
  primaryCta: {
    label: string
    href: string
  }
  secondaryCta?: {
    label: string
    href: string
  }
}

export function CTASection({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: CTASectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-primary px-8 py-16 sm:px-16 sm:py-20 overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }} />
          </div>

          <div className="relative max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-4 text-lg text-primary-foreground/80">{subtitle}</p>
            )}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-base px-8"
              >
                <Link href={primaryCta.href}>
                  {primaryCta.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {secondaryCta && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
