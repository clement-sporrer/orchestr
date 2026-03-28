'use client'

import { useState } from 'react'
import { Check, ChevronRight, Briefcase, User, Calendar, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { updateCandidatePortal, completePortal } from '@/lib/actions/portal'
import { toast } from 'sonner'
import type { Mission, Candidate, MissionCandidate, Questionnaire, QuestionnaireQuestion } from '@/generated/prisma'

interface CandidatePortalClientProps {
  token: string  // Raw portal token — passed to server actions for re-auth
  missionCandidate: MissionCandidate
  candidate: Candidate
  mission: Mission
  questionnaire: (Questionnaire & { questions: QuestionnaireQuestion[] }) | null
}

type Step = 'welcome' | 'profile' | 'job' | 'calendly' | 'questionnaire' | 'confirmation'

const STEPS: Step[] = ['welcome', 'profile', 'job', 'calendly', 'questionnaire', 'confirmation']

export function CandidatePortalClient({
  token,
  missionCandidate,
  candidate,
  mission,
  questionnaire,
}: CandidatePortalClientProps) {
  const [currentStep, setCurrentStep] = useState<Step>(
    missionCandidate.portalCompleted ? 'confirmation' : STEPS[missionCandidate.portalStep] || 'welcome'
  )
  const [loading, setLoading] = useState(false)
  const [consent, setConsent] = useState(candidate.consentGiven)
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({})
  
  // Form data
  const [profileData, setProfileData] = useState({
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email || '',
    phone: candidate.phone || '',
    linkedin: candidate.linkedin || '',
  })

  const currentStepIndex = STEPS.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100

  const goToStep = async (step: Step) => {
    const stepIndex = STEPS.indexOf(step)
    setLoading(true)
    try {
      await updateCandidatePortal(token, { portalStep: stepIndex })
      setCurrentStep(step)
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateCandidatePortal(token, {
        portalStep: STEPS.indexOf('job'),
        candidateData: profileData,
      })
      setCurrentStep('job')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!consent) {
      toast.error('Veuillez accepter les conditions')
      return
    }
    
    // Validate required questionnaire answers
    if (questionnaire && questionnaire.questions.length > 0) {
      const missingRequired = questionnaire.questions.filter(
        q => q.required && !questionnaireAnswers[q.id]?.trim()
      )
      if (missingRequired.length > 0) {
        toast.error(`Veuillez répondre à ${missingRequired.length} question(s) requise(s)`)
        return
      }
    }
    
    setLoading(true)
    try {
      await completePortal(token)
      setCurrentStep('confirmation')
      toast.success('Merci! Votre profil a été enregistré.')
    } catch {
      toast.error('Erreur lors de la finalisation')
    } finally {
      setLoading(false)
    }
  }

  // Filter steps based on what's available
  const _availableSteps = STEPS.filter((step) => {
    if (step === 'calendly' && !mission.calendlyLink) return false
    if (step === 'questionnaire' && (!questionnaire || questionnaire.questions.length === 0)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <span className="text-xl font-bold text-primary">ORCHESTR</span>
        </div>
      </header>

      <main className="container max-w-2xl py-8 px-4">
        {/* Progress */}
        {currentStep !== 'confirmation' && (
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Étape {currentStepIndex + 1} sur {STEPS.length}
            </p>
          </div>
        )}

        {/* Welcome */}
        {currentStep === 'welcome' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Bienvenue {candidate.firstName}!</CardTitle>
              <CardDescription>
                Nous sommes ravis de vous présenter cette opportunité
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-semibold text-lg">{mission.title}</h3>
                {mission.location && (
                  <p className="text-muted-foreground">{mission.location}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Ce parcours ne prendra que quelques minutes. Vous pourrez:
              </p>
              <ul className="text-sm text-left space-y-2 max-w-sm mx-auto">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Compléter votre profil
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Découvrir le poste en détail
                </li>
                {mission.calendlyLink && (
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Réserver un créneau d&apos;entretien
                  </li>
                )}
              </ul>
              <Button onClick={() => goToStep('profile')} disabled={loading} className="w-full max-w-xs">
                Commencer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Profile */}
        {currentStep === 'profile' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Votre profil</CardTitle>
                  <CardDescription>Vérifiez vos informations</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn (optionnel)</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({ ...profileData, linkedin: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Continuer
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Job Description */}
        {currentStep === 'job' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{mission.title}</CardTitle>
                  <CardDescription>{mission.location}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {mission.responsibilities && (
                <div>
                  <h3 className="font-semibold mb-2">Responsabilités</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{mission.responsibilities}</p>
                </div>
              )}
              {mission.mustHave && (
                <div>
                  <h3 className="font-semibold mb-2">Compétences requises</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{mission.mustHave}</p>
                </div>
              )}
              {mission.niceToHave && (
                <div>
                  <h3 className="font-semibold mb-2">Compétences appréciées</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{mission.niceToHave}</p>
                </div>
              )}
              <Button 
                onClick={() => goToStep(mission.calendlyLink ? 'calendly' : questionnaire ? 'questionnaire' : 'confirmation')} 
                disabled={loading} 
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Continuer
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Calendly */}
        {currentStep === 'calendly' && mission.calendlyLink && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Réserver un entretien</CardTitle>
                  <CardDescription>Choisissez un créneau qui vous convient</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden border">
                <iframe
                  src={mission.calendlyLink}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                />
              </div>
              <Button 
                onClick={() => goToStep(questionnaire ? 'questionnaire' : 'confirmation')} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Passer cette étape
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Questionnaire */}
        {currentStep === 'questionnaire' && questionnaire && questionnaire.questions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Quelques questions</CardTitle>
                  <CardDescription>Pour mieux vous connaître</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {questionnaire.questions.map((question) => {
                const answer = questionnaireAnswers[question.id] || ''
                const isRequired = question.required
                const hasError = isRequired && !answer.trim()
                
                return (
                  <div key={question.id} className="space-y-2">
                    <Label htmlFor={question.id}>
                      {question.text}
                      {isRequired && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {question.type === 'TEXT' && (
                      <Textarea
                        id={question.id}
                        rows={3}
                        value={answer}
                        onChange={(e) => setQuestionnaireAnswers(prev => ({
                          ...prev,
                          [question.id]: e.target.value
                        }))}
                        className={hasError ? 'border-destructive' : ''}
                        required={isRequired}
                      />
                    )}
                    {question.type === 'SINGLE_CHOICE' && (
                      <div className="space-y-2">
                        {question.options.map((option) => (
                          <label key={option} className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer">
                            <input
                              type="radio"
                              name={question.id}
                              value={option}
                              checked={answer === option}
                              onChange={(e) => setQuestionnaireAnswers(prev => ({
                                ...prev,
                                [question.id]: e.target.value
                              }))}
                              required={isRequired}
                              className="cursor-pointer"
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {hasError && (
                      <p className="text-xs text-destructive">Ce champ est requis</p>
                    )}
                  </div>
                )
              })}

              {/* Consent */}
              <div className="pt-4 border-t">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked === true)}
                  />
                  <span className="text-sm text-muted-foreground">
                    J&apos;accepte que mes informations soient utilisées dans le cadre de ce processus de recrutement. 
                    Je peux demander la suppression de mes données à tout moment.
                  </span>
                </label>
              </div>

              <Button 
                onClick={handleComplete} 
                disabled={loading || !consent || (questionnaire && questionnaire.questions.some(q => q.required && !questionnaireAnswers[q.id]?.trim()))} 
                className="w-full"
                size="lg"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Terminer
                <Check className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirmation */}
        {currentStep === 'confirmation' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Merci {candidate.firstName}!</CardTitle>
              <CardDescription>
                Votre profil a bien été enregistré
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Notre équipe va examiner votre profil et reviendra vers vous rapidement.
              </p>
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-semibold">Prochaines étapes</h3>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                  <li>1. Examen de votre candidature</li>
                  <li>2. Entretien avec notre équipe</li>
                  <li>3. Présentation au client</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}



