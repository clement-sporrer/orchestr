'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Download, 
  CheckCircle2, 
  ArrowRight,
  Linkedin,
  MousePointer,
  FolderOpen,
  Chrome,
  Sparkles,
  Zap,
  Shield,
  Clock
} from 'lucide-react'

export default function ExtensionPublicPage() {
  const features = [
    { icon: Zap, title: '1 clic', description: 'Capture instantanée' },
    { icon: Shield, title: '100% gratuit', description: 'Pas de frais cachés' },
    { icon: Clock, title: '30 secondes', description: 'Installation rapide' },
    { icon: Sparkles, title: 'IA intégrée', description: 'Scoring automatique' },
  ]

  const steps = [
    {
      title: 'Téléchargez',
      description: 'Cliquez sur le gros bouton bleu',
      icon: Download,
    },
    {
      title: 'Dézippez',
      description: 'Double-cliquez sur le fichier .zip',
      icon: FolderOpen,
    },
    {
      title: 'Chrome Extensions',
      description: 'Ouvrez chrome://extensions',
      icon: Chrome,
    },
    {
      title: 'Chargez',
      description: 'Mode dev → Charger non empaquetée',
      icon: MousePointer,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero */}
      <div className="container max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0077B5] to-[#00A0DC] text-white shadow-2xl mb-8">
          <Linkedin className="h-12 w-12" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Extension Chrome <span className="text-[#0077B5]">ORCHESTR</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Capturez n&apos;importe quel profil LinkedIn en <strong>1 seul clic</strong>.
          <br />
          Directement dans votre ATS.
        </p>

        {/* Big Download Button */}
        <a 
          href="/orchestr-extension.zip"
          download="orchestr-extension.zip"
          className="inline-block"
        >
          <Button 
            size="lg" 
            className="h-20 px-12 text-xl bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#006399] hover:to-[#0088BC] shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 rounded-2xl"
          >
            <Download className="mr-4 h-8 w-8" />
            Télécharger gratuitement
          </Button>
        </a>

        <p className="text-sm text-muted-foreground mt-4">
          Compatible Chrome, Edge, Brave, Opera
        </p>
      </div>

      {/* Features */}
      <div className="container max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0 space-y-2">
                <feature.icon className="h-8 w-8 mx-auto text-[#0077B5]" />
                <h3 className="font-bold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Installation Steps */}
      <div className="bg-slate-100 dark:bg-slate-900 py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Installation en <span className="text-[#0077B5]">4 étapes</span>
          </h2>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((stepItem, i) => (
              <div 
                key={i}
                className="relative text-center"
              >
                {/* Arrow between steps */}
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute -right-3 top-8 h-6 w-6 text-muted-foreground" />
                )}
                
                <div className={`
                  inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 text-white
                  ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : i === 2 ? 'bg-orange-500' : 'bg-green-500'}
                `}>
                  <stepItem.icon className="h-8 w-8" />
                </div>
                <h3 className="font-semibold mb-1">{stepItem.title}</h3>
                <p className="text-sm text-muted-foreground">{stepItem.description}</p>
              </div>
            ))}
          </div>

          {/* Detailed Guide Link */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Besoin d&apos;un guide plus détaillé ?
            </p>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Voir le guide complet dans l&apos;app
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Comment ça marche
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-[#0077B5]/20">
            <CardContent className="p-0 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Linkedin className="h-6 w-6 text-[#0077B5]" />
              </div>
              <h3 className="font-semibold text-lg">1. Naviguez sur LinkedIn</h3>
              <p className="text-muted-foreground">
                Trouvez un profil intéressant sur LinkedIn comme d&apos;habitude.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-purple-500/20">
            <CardContent className="p-0 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <MousePointer className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg">2. Cliquez sur l&apos;extension</h3>
              <p className="text-muted-foreground">
                Un clic sur l&apos;icône ORCHESTR capture tout automatiquement.
              </p>
            </CardContent>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow border-2 border-transparent hover:border-green-500/20">
            <CardContent className="p-0 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg">3. C&apos;est dans l&apos;ATS !</h3>
              <p className="text-muted-foreground">
                Le candidat est ajouté avec toutes ses infos et un score IA.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] py-16">
        <div className="container max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à gagner du temps ?
          </h2>
          <p className="text-lg opacity-90 mb-8">
            Installez l&apos;extension en 30 secondes
          </p>
          <a 
            href="/orchestr-extension.zip"
            download="orchestr-extension.zip"
          >
            <Button 
              size="lg" 
              variant="secondary"
              className="h-16 px-10 text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <Download className="mr-3 h-6 w-6" />
              Télécharger maintenant
            </Button>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ORCHESTR ?{' '}
          <Link href="/signup" className="text-[#0077B5] hover:underline font-medium">
            Créer un compte gratuit
          </Link>
        </p>
      </div>
    </div>
  )
}

