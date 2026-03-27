'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Building2, Users, Briefcase, ArrowRight, ArrowLeft } from 'lucide-react'
import { updateOrganization } from '@/lib/actions/organizations'
import { createClient } from '@/lib/actions/clients'
import { createMission } from '@/lib/actions/missions'

const STEPS = [
  {
    id: 'organization',
    title: 'Votre cabinet',
    description: 'Configurez les informations de base de votre organisation',
    icon: Building2,
  },
  {
    id: 'client',
    title: 'Premier client',
    description: 'Ajoutez votre premier client pour commencer',
    icon: Users,
  },
  {
    id: 'mission',
    title: 'Premiere mission',
    description: 'Creez votre premiere mission de recrutement',
    icon: Briefcase,
  },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const success = searchParams.get('success')

  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)

  // Organization data
  const [orgName, setOrgName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [calendlyLink, setCalendlyLink] = useState('')

  // Client data
  const [clientName, setClientName] = useState('')
  const [clientSector, setClientSector] = useState('')
  const [clientWebsite, setClientWebsite] = useState('')

  // Mission data
  const [missionTitle, setMissionTitle] = useState('')
  const [missionLocation, setMissionLocation] = useState('')
  const [missionContractType, setMissionContractType] = useState<string>('')

  useEffect(() => {
    if (success) {
      toast.success('Paiement confirme ! Bienvenue sur ORCHESTR.')
    }
  }, [success])

  const progress = ((currentStep + 1) / STEPS.length) * 100

  const handleOrganizationSubmit = async () => {
    if (!orgName.trim()) {
      toast.error('Veuillez entrer le nom de votre cabinet')
      return
    }

    setLoading(true)
    try {
      await updateOrganization({
        name: orgName,
        contactEmail: orgEmail || undefined,
        defaultCalendlyLink: calendlyLink || undefined,
      })
      setCurrentStep(1)
    } catch {
      toast.error('Erreur lors de la mise a jour')
    } finally {
      setLoading(false)
    }
  }

  const handleClientSubmit = async () => {
    if (!clientName.trim()) {
      toast.error('Veuillez entrer le nom du client')
      return
    }

    setLoading(true)
    try {
      const result = await createClient({
        name: clientName,
        sector: clientSector || undefined,
        website: clientWebsite || undefined,
      })
      if (result.id) {
        setCreatedClientId(result.id)
        setCurrentStep(2)
      }
    } catch {
      toast.error('Erreur lors de la creation du client')
    } finally {
      setLoading(false)
    }
  }

  const handleMissionSubmit = async () => {
    if (!missionTitle.trim()) {
      toast.error('Veuillez entrer le titre du poste')
      return
    }
    if (!createdClientId) {
      toast.error('Erreur: aucun client selectionne')
      return
    }

    setLoading(true)
    try {
      await createMission({
        clientId: createdClientId,
        title: missionTitle,
        location: missionLocation || undefined,
        contractType: missionContractType as any || undefined,
      })
      
      // Mark onboarding as complete
      await updateOrganization({ onboardingCompleted: true })
      
      toast.success('Felicitations ! Votre espace est pret.')
      router.push('/dashboard')
    } catch {
      toast.error('Erreur lors de la creation de la mission')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    await updateOrganization({ onboardingCompleted: true })
    router.push('/dashboard')
  }

  const StepIcon = STEPS[currentStep].icon

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bienvenue sur ORCHESTR
          </h1>
          <p className="text-muted-foreground">
            Configurons votre espace de travail en quelques etapes
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-1.5 text-xs ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <StepIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>{STEPS[currentStep].title}</CardTitle>
                <CardDescription>{STEPS[currentStep].description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 0 && (
              <>
                <div>
                  <Label htmlFor="orgName">Nom du cabinet *</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Cabinet Recrutement SA"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="orgEmail">Email de contact</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="contact@cabinet.com"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="calendly">Lien Calendly par defaut</Label>
                  <Input
                    id="calendly"
                    value={calendlyLink}
                    onChange={(e) => setCalendlyLink(e.target.value)}
                    placeholder="https://calendly.com/votre-lien"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce lien sera utilise par defaut pour les prises de RDV
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button onClick={handleOrganizationSubmit} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div>
                  <Label htmlFor="clientName">Nom du client *</Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Entreprise ABC"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="clientSector">Secteur d&apos;activite</Label>
                  <Input
                    id="clientSector"
                    value={clientSector}
                    onChange={(e) => setClientSector(e.target.value)}
                    placeholder="Tech, Finance, Industrie..."
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="clientWebsite">Site web</Label>
                  <Input
                    id="clientWebsite"
                    value={clientWebsite}
                    onChange={(e) => setClientWebsite(e.target.value)}
                    placeholder="https://entreprise-abc.com"
                    className="mt-1.5"
                  />
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setCurrentStep(0)} disabled={loading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button onClick={handleClientSubmit} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Continuer
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div>
                  <Label htmlFor="missionTitle">Titre du poste *</Label>
                  <Input
                    id="missionTitle"
                    value={missionTitle}
                    onChange={(e) => setMissionTitle(e.target.value)}
                    placeholder="Developpeur Senior"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="missionLocation">Localisation</Label>
                  <Input
                    id="missionLocation"
                    value={missionLocation}
                    onChange={(e) => setMissionLocation(e.target.value)}
                    placeholder="Paris, France"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="contractType">Type de contrat</Label>
                  <Select value={missionContractType} onValueChange={setMissionContractType}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="CDD">CDD</SelectItem>
                      <SelectItem value="FREELANCE">Freelance</SelectItem>
                      <SelectItem value="INTERNSHIP">Stage</SelectItem>
                      <SelectItem value="APPRENTICESHIP">Alternance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setCurrentStep(1)} disabled={loading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour
                  </Button>
                  <Button onClick={handleMissionSubmit} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Terminer
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="text-center mt-6">
          <Button variant="link" className="text-muted-foreground" onClick={handleSkip}>
            Passer et acceder au tableau de bord
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}

