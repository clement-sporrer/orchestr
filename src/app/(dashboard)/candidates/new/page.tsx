'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  X, 
  Linkedin, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  User,
  AlertCircle,
  CheckCircle2,
  Copy,
  Wand2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  createCandidateWithEnrichment, 
  enrichFromProfileText,
  checkCandidateExists,
  type LinkedInEnrichmentResult 
} from '@/lib/actions/candidates'
import { toast } from 'sonner'
import type { EnrichedProfileData } from '@/lib/ai/structuring'

type ImportMode = 'linkedin' | 'manual'
type EnrichmentStep = 'url' | 'paste' | 'review' | 'done'

const seniorityLabels = {
  JUNIOR: 'Junior (0-2 ans)',
  MID: 'Confirmé (3-5 ans)',
  SENIOR: 'Senior (6-10 ans)',
  LEAD: 'Lead / Manager',
  EXECUTIVE: 'Executive / Direction',
}

export default function NewCandidatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const missionId = searchParams.get('missionId')
  
  // Mode and step state
  const [importMode, setImportMode] = useState<ImportMode>('linkedin')
  const [enrichmentStep, setEnrichmentStep] = useState<EnrichmentStep>('url')
  const [showManualForm, setShowManualForm] = useState(false)
  
  // Form state
  const [loading, setLoading] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<{ id: string; name: string } | null>(null)
  
  // LinkedIn import state
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [profileText, setProfileText] = useState('')
  
  // Enriched/form data
  const [formData, setFormData] = useState<Partial<EnrichedProfileData>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    currentPosition: '',
    currentCompany: '',
    profileUrl: '',
    tags: [],
    notes: '',
  })
  const [tagInput, setTagInput] = useState('')

  // Update form field
  const updateField = (field: keyof typeof formData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Tag management
  const addTag = (tag?: string) => {
    const newTag = (tag || tagInput).trim()
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(t => t !== tag) || []
    }))
  }

  // Handle LinkedIn URL input - Enrichissement automatique
  const handleLinkedInUrlChange = async (url: string) => {
    setLinkedInUrl(url)
    setError(null)
    setDuplicateWarning(null)

    if (!url || !url.includes('linkedin.com/in/')) {
      return
    }

    // Enrichissement automatique via API
    setEnriching(true)
    try {
      const response = await fetch('/api/candidates/enrich-linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedInUrl: url }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        const enrichedData = result.data
        setFormData(prev => ({
          ...prev,
          ...enrichedData,
          tags: enrichedData.tags || [],
        }))
        
        // Check for duplicates
        if (result.duplicate?.exists) {
          setDuplicateWarning({
            id: result.duplicate.candidate.id,
            name: `${result.duplicate.candidate.firstName} ${result.duplicate.candidate.lastName}`
          })
        }
        
        // Aller directement à la révision (plus besoin de copier-coller)
        setEnrichmentStep('review')
        toast.success('Profil enrichi automatiquement avec succès !')
      } else {
        // Gérer les erreurs spécifiques
        if (result.action === 'connect_linkedin') {
          setError(
            result.message || 
            'Aucun compte LinkedIn connecté. Veuillez connecter un compte LinkedIn dans les paramètres.'
          )
        } else if (result.action === 'wait_or_connect') {
          setError(
            result.message || 
            'Tous les comptes LinkedIn ont atteint leur limite. Réessayez dans quelques minutes.'
          )
        } else if (result.action === 'use_extension') {
          setError(
            result.message || 
            'Pour votre sécurité, utilisez l\'extension Chrome ou copiez-collez le contenu.'
          )
          // Proposer de continuer avec le copier-coller
          setEnrichmentStep('paste')
        } else {
          setError(result.error || result.message || 'Erreur lors de l\'enrichissement')
          // Fallback : proposer le copier-coller
          setEnrichmentStep('paste')
        }
      }
    } catch (err) {
      console.error('Enrichment error:', err)
      setError('Erreur de connexion. Utilisez l\'extension Chrome ou copiez-collez le contenu.')
      setEnrichmentStep('paste')
    } finally {
      setEnriching(false)
    }
  }

  // Handle profile text enrichment with AI
  const handleEnrichFromText = async () => {
    if (!profileText.trim()) {
      setError('Veuillez coller le contenu du profil LinkedIn')
      return
    }

    setEnriching(true)
    setError(null)

    try {
      const result = await enrichFromProfileText(profileText, formData.profileUrl)
      
      if (result.success && result.data) {
        const enrichedData = result.data
        setFormData(prev => ({
          ...prev,
          ...enrichedData,
          // Keep LinkedIn URL from earlier step
          profileUrl: prev.profileUrl || enrichedData.profileUrl || '',
          // Merge tags
          tags: [...new Set([...(prev.tags || []), ...(enrichedData.tags || [])])],
        }))
        setEnrichmentStep('review')
        toast.success('Profil enrichi avec succès !')
      } else {
        setError(result.error || 'Erreur lors de l\'enrichissement')
      }
    } catch (err) {
      setError('Erreur lors de l\'analyse du profil')
      console.error(err)
    } finally {
      setEnriching(false)
    }
  }

  // Skip text enrichment and go to manual review
  const skipToManualReview = () => {
    setEnrichmentStep('review')
    setShowManualForm(true)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.firstName || !formData.lastName) {
      setError('Le prénom et le nom sont obligatoires')
      setLoading(false)
      return
    }

    try {
      const candidate = await createCandidateWithEnrichment({
        firstName: formData.firstName,
        lastName: formData.lastName || '',
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        location: formData.location || undefined,
        currentPosition: formData.currentPosition || undefined,
        currentCompany: formData.currentCompany || undefined,
        profileUrl: formData.profileUrl || undefined,
        tags: formData.tags || [],
        notes: formData.notes || formData.suggestedNotes || undefined,
        estimatedSeniority: formData.estimatedSeniority,
        estimatedSector: formData.estimatedSector,
        linkedinHeadline: formData.linkedinHeadline,
        linkedinSummary: formData.linkedinSummary,
        experiences: formData.experiences,
        education: formData.education,
        skills: formData.skills,
        languages: formData.languages,
      })
      
      toast.success('Candidat créé avec succès')
      
      if (missionId) {
        router.push(`/missions/${missionId}?tab=pipeline`)
      } else {
        router.push(`/candidates/${candidate.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Reset to start
  const resetForm = () => {
    setLinkedInUrl('')
    setProfileText('')
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      currentPosition: '',
      currentCompany: '',
      profileUrl: '',
      tags: [],
      notes: '',
    })
    setEnrichmentStep('url')
    setError(null)
    setDuplicateWarning(null)
    setShowManualForm(false)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={missionId ? `/missions/${missionId}?tab=sourcing` : '/candidates'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouveau candidat</h1>
          <p className="text-muted-foreground">
            Importez depuis LinkedIn ou ajoutez manuellement
          </p>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateWarning && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Un candidat similaire existe déjà : <strong>{duplicateWarning.name}</strong>
            </span>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/candidates/${duplicateWarning.id}`}>
                Voir le profil
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* LinkedIn Import Section */}
      {importMode === 'linkedin' && enrichmentStep !== 'review' && (
        <Card className="border-2 border-[#0077B5]/20 bg-gradient-to-br from-[#0077B5]/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0077B5]/10">
                <Linkedin className="h-5 w-5 text-[#0077B5]" />
              </div>
              <div>
                <CardTitle className="text-lg">Import LinkedIn</CardTitle>
                <CardDescription>
                  Remplissage automatique depuis un profil LinkedIn
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: LinkedIn URL */}
            {enrichmentStep === 'url' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      1
                    </span>
                    URL du profil LinkedIn
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/in/prenom-nom"
                      value={linkedInUrl}
                      onChange={(e) => handleLinkedInUrlChange(e.target.value)}
                      className="flex-1"
                    />
                    {enriching && (
                      <div className="flex items-center px-3">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Collez le lien du profil LinkedIn pour extraire automatiquement les informations
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 2: Paste Profile Text */}
            {enrichmentStep === 'paste' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>
                    Profil détecté : <strong className="text-foreground">{formData.firstName} {formData.lastName}</strong>
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="profileText" className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      2
                    </span>
                    <span className="flex items-center gap-2">
                      Enrichir avec l&apos;IA
                      <Sparkles className="h-4 w-4 text-amber-500" />
                    </span>
                  </Label>
                  <Textarea
                    id="profileText"
                    placeholder="Copiez-collez ici le contenu du profil LinkedIn (À propos, Expériences, Compétences...)"
                    value={profileText}
                    onChange={(e) => setProfileText(e.target.value)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Copy className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>
                      Sur LinkedIn, sélectionnez tout le contenu du profil (Cmd/Ctrl+A) et collez-le ici.
                      L&apos;IA analysera automatiquement les compétences, l&apos;expérience et générera des tags pertinents.
                    </span>
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleEnrichFromText}
                    disabled={enriching || !profileText.trim()}
                    className="flex-1 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#006399] hover:to-[#0088BC]"
                  >
                    {enriching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Enrichir avec l&apos;IA
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={skipToManualReview}
                  >
                    Passer cette étape
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Form Toggle (when in LinkedIn mode but not in review) */}
      {importMode === 'linkedin' && enrichmentStep !== 'review' && (
        <button
          type="button"
          onClick={() => {
            setImportMode('manual')
            setShowManualForm(true)
            setEnrichmentStep('review')
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <User className="h-4 w-4" />
          <span>Ou remplir manuellement sans LinkedIn</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {/* Review/Edit Form */}
      {(enrichmentStep === 'review' || showManualForm) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.tags && formData.tags.length > 0 && (
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                )}
                <div>
                  <CardTitle>
                    {formData.firstName || formData.lastName 
                      ? `${formData.firstName} ${formData.lastName}`.trim()
                      : 'Informations du candidat'
                    }
                  </CardTitle>
                  <CardDescription>
                    {formData.tags && formData.tags.length > 0 
                      ? 'Profil enrichi par IA - vérifiez et complétez les informations'
                      : 'Remplissez les informations du candidat'
                    }
                  </CardDescription>
                </div>
              </div>
              {enrichmentStep === 'review' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                >
                  Recommencer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Suggested Notes from AI */}
              {formData.suggestedNotes && (
                <Alert className="bg-amber-500/5 border-amber-500/20">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-sm">
                    <strong className="block mb-1">Résumé IA :</strong>
                    {formData.suggestedNotes}
                  </AlertDescription>
                </Alert>
              )}

              {/* Identity */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName || ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName || ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input
                  id="location"
                  placeholder="Ex: Paris, France"
                  value={formData.location || ''}
                  onChange={(e) => updateField('location', e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Professional */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPosition">Poste actuel</Label>
                  <Input
                    id="currentPosition"
                    value={formData.currentPosition || ''}
                    onChange={(e) => updateField('currentPosition', e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Entreprise actuelle</Label>
                  <Input
                    id="currentCompany"
                    value={formData.currentCompany || ''}
                    onChange={(e) => updateField('currentCompany', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Seniority & Sector */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seniority">Séniorité estimée</Label>
                  <Select
                    value={formData.estimatedSeniority || ''}
                    onValueChange={(value) => updateField('estimatedSeniority', value as string)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(seniorityLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sector">Secteur</Label>
                  <Input
                    id="sector"
                    placeholder="Ex: Tech, Finance, Santé..."
                    value={formData.estimatedSector || ''}
                    onChange={(e) => updateField('estimatedSector', e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Profile URL */}
              <div className="space-y-2">
                <Label htmlFor="profileUrl">URL du profil LinkedIn</Label>
                <Input
                  id="profileUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.profileUrl || ''}
                  onChange={(e) => updateField('profileUrl', e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Tags
                  {formData.tags && formData.tags.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Générés par IA
                    </Badge>
                  )}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Ajouter un tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    disabled={loading}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => addTag()} 
                    disabled={loading || !tagInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="gap-1 pr-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={4}
                  placeholder="Notes internes sur le candidat..."
                  value={formData.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Collapsible: Skills from enrichment */}
              {formData.skills && formData.skills.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowManualForm(!showManualForm)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showManualForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    <span>Compétences détectées ({formData.skills.length})</span>
                  </button>
                  {showManualForm && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {formData.skills.map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading || !formData.firstName || !formData.lastName}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Créer le candidat
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
