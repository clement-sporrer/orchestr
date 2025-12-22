interface Logo {
  name: string
  placeholder?: boolean
}

interface TestimonialStripProps {
  title?: string
  logos: Logo[]
}

export function TestimonialStrip({
  title = 'Trusted by recruitment agencies across Europe',
  logos,
}: TestimonialStripProps) {
  return (
    <section className="py-12 border-y border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-muted-foreground mb-8">{title}</p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {logos.map((logo, index) => (
            <div
              key={index}
              className="flex items-center justify-center h-8 px-4"
            >
              {/* Placeholder logo */}
              <div className="text-lg font-semibold text-muted-foreground/30">
                {logo.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
