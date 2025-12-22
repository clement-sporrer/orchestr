import { LucideIcon } from 'lucide-react'

interface FeatureSectionProps {
  id?: string
  badge?: string
  title: string
  description: string
  bullets: string[]
  icon: LucideIcon
  imagePosition?: 'left' | 'right'
}

export function FeatureSection({
  id,
  badge,
  title,
  description,
  bullets,
  icon: Icon,
  imagePosition = 'right',
}: FeatureSectionProps) {
  return (
    <section id={id} className="py-20 lg:py-28 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
          imagePosition === 'left' ? 'lg:flex-row-reverse' : ''
        }`}>
          {/* Content */}
          <div className={imagePosition === 'left' ? 'lg:order-2' : ''}>
            {badge && (
              <span className="inline-block text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                {badge}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              {description}
            </p>
            <ul className="space-y-3">
              {bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <span className="text-foreground/80">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Image placeholder */}
          <div className={imagePosition === 'left' ? 'lg:order-1' : ''}>
            <div className="relative aspect-[4/3] bg-muted rounded-2xl overflow-hidden border border-border">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Screenshot placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
