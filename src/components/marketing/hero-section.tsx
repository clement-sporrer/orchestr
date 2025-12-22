import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface HeroSectionProps {
  title: string
  subtitle: string
  primaryCta?: {
    label: string
    href: string
  }
  secondaryCta?: {
    label: string
    href: string
  }
}

export function HeroSection({
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28">
      {/* Background gradient - warm tones */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/30 to-background -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
            {title}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
          
          {(primaryCta || secondaryCta) && (
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {primaryCta && (
                <Button
                  asChild
                  size="lg"
                  className="text-base px-8"
                >
                  <Link href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              {secondaryCta && (
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-base px-8"
                >
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
