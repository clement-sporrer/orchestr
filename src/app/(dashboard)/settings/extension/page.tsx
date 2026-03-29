'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Download,
  CheckCircle2,
  Copy,
  Check,
  Puzzle,
  MousePointer,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

const EXTENSION_API_URL_INPUT_ID = 'extension-install-api-url'
const EXTENSION_EMAIL_INPUT_ID = 'extension-install-email'

/** LinkedIn mark (avoids deprecated lucide-react `Linkedin` brand icon). */
function LinkedInMark({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z" />
    </svg>
  )
}

export default function ExtensionInstallationPage() {
  const [apiUrl] = useState(() =>
    globalThis.window === undefined ? '' : globalThis.window.location.origin,
  )
  const [userEmail, setUserEmail] = useState('')
  const [copied, setCopied] = useState<'url' | 'email' | null>(null)

  const copyToClipboard = async (text: string, type: 'url' | 'email') => {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    toast.success('Copié !')
    setTimeout(() => setCopied(null), 2000)
  }

  const steps = [
    {
      number: 1,
      title: 'Téléchargez',
      description: 'Cliquez sur le bouton ci-dessous',
      icon: Download,
      color: 'bg-blue-500',
    },
    {
      number: 2,
      title: 'Dézippez',
      description: 'Double-cliquez sur le fichier téléchargé',
      icon: Puzzle,
      color: 'bg-purple-500',
    },
    {
      number: 3,
      title: 'Installez',
      description: 'Glissez dans Chrome',
      icon: MousePointer,
      color: 'bg-green-500',
    },
  ]

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-[#0077B5] to-[#00A0DC] text-white shadow-lg">
          <LinkedInMark className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Extension Chrome ORCHESTR
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Capturez les profils LinkedIn en <strong>1 clic</strong>
        </p>
      </div>

      {/* Big Download Button */}
      <div className="flex justify-center">
        <a 
          href="/orchestr-extension.zip"
          download="orchestr-extension.zip"
        >
          <Button 
            size="lg" 
            className="h-16 px-8 text-lg bg-linear-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#006399] hover:to-[#0088BC] shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="mr-3 h-6 w-6" />
            Télécharger l&apos;extension
            <ArrowRight className="ml-3 h-5 w-5" />
          </Button>
        </a>
      </div>

      {/* 3 Simple Steps */}
      <div className="grid grid-cols-3 gap-4">
        {steps.map((step) => (
          <Card key={step.number} className="text-center p-6 hover:shadow-md transition-shadow">
            <CardContent className="p-0 space-y-3">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${step.color} text-white text-xl font-bold`}>
                {step.number}
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Steps */}
      <Card className="overflow-hidden">
        <div className="bg-linear-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            Guide d&apos;installation rapide
          </h2>
        </div>
        <CardContent className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
              1
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Après le téléchargement</h3>
              <p className="text-sm text-muted-foreground">
                Un fichier <code className="bg-muted px-2 py-0.5 rounded">orchestr-extension.zip</code> sera téléchargé.
                <br />
                <strong>Double-cliquez dessus</strong> pour le décompresser.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
              2
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Ouvrez les extensions Chrome</h3>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-1.5 rounded text-sm flex-1">chrome://extensions</code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard('chrome://extensions', 'url')}
                >
                  {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Copiez cette adresse et collez-la dans Chrome
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold">
              3
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Activez le mode développeur</h3>
              <p className="text-sm text-muted-foreground">
                En haut à droite de la page, cliquez sur le bouton <strong>&quot;Mode développeur&quot;</strong>
              </p>
              <div className="bg-muted p-3 rounded-lg inline-flex items-center gap-2">
                <div className="w-10 h-5 bg-blue-500 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                </div>
                <span className="text-sm">Mode développeur</span>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
              4
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Chargez l&apos;extension</h3>
              <p className="text-sm text-muted-foreground">
                Cliquez sur <strong>&quot;Charger l&apos;extension non empaquetée&quot;</strong>
                <br />
                Sélectionnez le dossier <code className="bg-muted px-2 py-0.5 rounded">chrome-extension</code> que vous venez de dézipper
              </p>
            </div>
          </div>

          {/* Success */}
          <div className="flex gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-200">C&apos;est installé !</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                L&apos;icône ORCHESTR apparaît dans votre barre d&apos;extensions Chrome
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Configuration (30 secondes)
          </h2>
        </div>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Cliquez sur l&apos;icône ORCHESTR dans Chrome, puis entrez :
          </p>
          
          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor={EXTENSION_API_URL_INPUT_ID} className="text-sm font-medium">
              URL de l&apos;API
            </Label>
            <div className="flex gap-2">
              <Input
                id={EXTENSION_API_URL_INPUT_ID}
                value={apiUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button 
                variant="outline"
                onClick={() => copyToClipboard(apiUrl, 'url')}
              >
                {copied === 'url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor={EXTENSION_EMAIL_INPUT_ID} className="text-sm font-medium">
              Clé API
            </Label>
            <p className="text-sm text-muted-foreground">
              Votre <strong>email de connexion ORCHESTR</strong>
            </p>
            <div className="flex gap-2">
              <Input
                id={EXTENSION_EMAIL_INPUT_ID}
                value={userEmail || 'votre-email@exemple.com'}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="votre-email@exemple.com"
                className="font-mono text-sm"
              />
              <Button 
                variant="outline"
                onClick={() => copyToClipboard(userEmail || 'votre-email@exemple.com', 'email')}
              >
                {copied === 'email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <Button className="w-full" variant="outline" disabled>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Enregistrer les paramètres dans l&apos;extension
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Copiez ces valeurs dans le popup de l&apos;extension
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card className="bg-linear-to-br from-[#0077B5]/5 to-[#00A0DC]/5 border-[#0077B5]/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[#0077B5] text-white">
              <LinkedInMark className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Utilisation</h3>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li><strong>1.</strong> Allez sur un profil LinkedIn</li>
                <li><strong>2.</strong> Cliquez sur l&apos;icône ORCHESTR</li>
                <li><strong>3.</strong> Sélectionnez une mission (optionnel)</li>
                <li><strong>4.</strong> Cliquez &quot;Capturer ce profil&quot;</li>
              </ol>
              <p className="text-sm pt-2">
                ✨ Le candidat est automatiquement ajouté avec scoring IA !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Besoin d&apos;aide ?{' '}
          <a 
            href="https://github.com/clement-sporrer/orchestr/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            Ouvrir un ticket <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </div>
  )
}
