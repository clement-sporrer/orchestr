import { LucideIcon } from 'lucide-react'

interface Step {
  number: number
  title: string
  description: string
  icon: LucideIcon
}

interface StepsProps {
  title: string
  subtitle?: string
  steps: Step[]
}

export function Steps({ title, subtitle, steps }: StepsProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 text-lg text-gray-600">{subtitle}</p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-200" />
              )}
              
              <div className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all">
                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <step.icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-blue-600 mb-2">
                  Step {step.number}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

