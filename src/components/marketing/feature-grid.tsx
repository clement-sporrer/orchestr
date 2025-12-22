import { LucideIcon } from 'lucide-react'

interface Feature {
  title: string
  description: string
  icon: LucideIcon
}

interface FeatureGridProps {
  title: string
  subtitle?: string
  features: Feature[]
  columns?: 2 | 3 | 4
}

export function FeatureGrid({
  title,
  subtitle,
  features,
  columns = 3,
}: FeatureGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <section className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className={`grid ${gridCols[columns]} gap-8`}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-5">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

