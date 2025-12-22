import { getTranslations } from 'next-intl/server'
import { HeroSection } from '@/components/marketing/hero-section'
import { TestimonialStrip } from '@/components/marketing/testimonial-strip'
import { Steps } from '@/components/marketing/steps'
import { FeatureGrid } from '@/components/marketing/feature-grid'
import { CTASection } from '@/components/marketing/cta-section'
import {
  Briefcase,
  Search,
  Calendar,
  CheckCircle,
  Zap,
  RefreshCw,
  Database,
  Smile,
} from 'lucide-react'

export default async function HomePage() {
  const t = await getTranslations('home')
  const tNav = await getTranslations('nav')

  return (
    <>
      <HeroSection
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
        primaryCta={{ label: t('hero.cta'), href: '/signup' }}
        secondaryCta={{ label: t('hero.ctaSecondary'), href: '/product' }}
      />

      <TestimonialStrip
        title={t('socialProof.title')}
        logos={[
          { name: 'Talent Partners' },
          { name: 'SearchPro' },
          { name: 'HireFirst' },
          { name: 'RecruteursPro' },
          { name: 'TopSearch' },
        ]}
      />

      <Steps
        title={t('howItWorks.title')}
        subtitle={t('howItWorks.subtitle')}
        steps={[
          {
            number: 1,
            title: t('howItWorks.step1.title'),
            description: t('howItWorks.step1.description'),
            icon: Briefcase,
          },
          {
            number: 2,
            title: t('howItWorks.step2.title'),
            description: t('howItWorks.step2.description'),
            icon: Search,
          },
          {
            number: 3,
            title: t('howItWorks.step3.title'),
            description: t('howItWorks.step3.description'),
            icon: Calendar,
          },
          {
            number: 4,
            title: t('howItWorks.step4.title'),
            description: t('howItWorks.step4.description'),
            icon: CheckCircle,
          },
        ]}
      />

      <FeatureGrid
        title={t('benefits.title')}
        features={[
          {
            title: t('benefits.speed.title'),
            description: t('benefits.speed.description'),
            icon: Zap,
          },
          {
            title: t('benefits.consistency.title'),
            description: t('benefits.consistency.description'),
            icon: RefreshCw,
          },
          {
            title: t('benefits.capitalize.title'),
            description: t('benefits.capitalize.description'),
            icon: Database,
          },
          {
            title: t('benefits.experience.title'),
            description: t('benefits.experience.description'),
            icon: Smile,
          },
        ]}
        columns={4}
      />

      {/* Screenshot section */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              {t('cta.title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('cta.subtitle')}
            </p>
          </div>
          
          {/* Screenshot placeholder */}
          <div className="relative aspect-[16/9] max-w-5xl mx-auto bg-muted rounded-2xl border border-border overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>
                <p className="text-muted-foreground">Dashboard screenshot</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title={t('cta.title')}
        subtitle={t('cta.subtitle')}
        primaryCta={{ label: t('cta.button'), href: '/signup' }}
        secondaryCta={{ label: tNav('pricing'), href: '/pricing' }}
      />
    </>
  )
}
