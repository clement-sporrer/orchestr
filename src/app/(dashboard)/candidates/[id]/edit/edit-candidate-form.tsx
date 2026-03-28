'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Plus,
  X,
  User,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateCandidate } from '@/lib/actions/candidates'
import { getOrganizationSettings } from '@/lib/actions/organization-settings'
import {
  SENIORITY_LABELS,
  RECRUITABLE_STATUS_LABELS,
  type UpdateCandidateInput,
  type LanguageEntry,
} from '@/lib/validations/candidate'
import { LocationSelector } from '@/components/candidates/form/location-selector'
import { LanguageInput } from '@/components/candidates/form/language-input'
import { CompanyAutocomplete } from '@/components/candidates/form/company-autocomplete'
import { PositionAutocomplete } from '@/components/candidates/form/position-autocomplete'
import { PhoneInput } from '@/components/candidates/form/phone-input'
import { SkillsInput } from '@/components/candidates/form/skills-input'
import { toast } from 'sonner'
import type { Candidate, RecruitableStatus } from '@/generated/prisma'

type OrgSettings = {
  domains: string[]
  sectors: string[]
  jobFamilies: string[]
} | null

type CandidateForEdit = Pick<
  Candidate,
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'linkedin'
  | 'phone'
  | 'age'
  | 'country'
  | 'city'
  | 'region'
  | 'languages'
  | 'seniority'
  | 'domain'
  | 'sector'
  | 'currentCompany'
  | 'currentPosition'
  | 'pastCompanies'
  | 'jobFamily'
  | 'hardSkills'
  | 'softSkills'
  | 'compensation'
  | 'comments'
  | 'references'
  | 'recruitable'
  | 'cvUrl'
  | 'location'
  | 'tags'
  | 'status'
>

interface EditCandidateFormProps {
  candidate: CandidateForEdit
}

function buildInitialFormData(c: CandidateForEdit): Partial<UpdateCandidateInput> {
  const languages = (c.languages as LanguageEntry[] | null) ?? []
  return {
    firstName: c.firstName ?? '',
    lastName: c.lastName ?? '',
    email: c.email ?? '',
    linkedin: c.linkedin ?? '',
    phone: c.phone ?? '',
    age: c.age ?? undefined,
    country: c.country ?? '',
    city: c.city ?? '',
    region: c.region ?? '',
    languages,
    seniority: (c.seniority as UpdateCandidateInput['seniority']) ?? undefined,
    domain: c.domain ?? '',
    sector: c.sector ?? '',
    currentCompany: c.currentCompany ?? '',
    currentPosition: c.currentPosition ?? '',
    pastCompanies: c.pastCompanies ?? '',
    jobFamily: c.jobFamily ?? '',
    hardSkills: c.hardSkills ?? '',
    softSkills: c.softSkills ?? '',
    compensation: c.compensation ?? '',
    comments: c.comments ?? '',
    references: c.references ?? '',
    recruitable: (c.recruitable as RecruitableStatus) ?? 'UNKNOWN',
    cvUrl: c.cvUrl ?? '',
    location: c.location ?? '',
    tags: c.tags ?? [],
    status: c.status ?? 'ACTIVE',
  }
}

export function EditCandidateForm({ candidate }: EditCandidateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orgSettings, setOrgSettings] = useState<OrgSettings>(null)
  const [formData, setFormData] = useState<Partial<UpdateCandidateInput>>(() =>
    buildInitialFormData(candidate)
  )
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    getOrganizationSettings().then((res) => {
      if (res.success && res.data) {
        setOrgSettings({
          domains: res.data.domains ?? [],
          sectors: res.data.sectors ?? [],
          jobFamilies: res.data.jobFamilies ?? [],
        })
      }
    })
  }, [])

  const updateField = <K extends keyof UpdateCandidateInput>(
    field: K,
    value: UpdateCandidateInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = (tag?: string) => {
    const newTag = (tag || tagInput).trim()
    if (newTag && !formData.tags?.includes(newTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), newTag],
      }))
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) ?? [],
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
      setError('Le prénom et le nom sont obligatoires')
      setLoading(false)
      return
    }

    try {
      const payload: Partial<UpdateCandidateInput> = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email?.trim() || undefined,
        linkedin: formData.linkedin?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        age: formData.age,
        country: formData.country?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        region: formData.region?.trim() || undefined,
        languages: (formData.languages?.length ? formData.languages : undefined) as
          | LanguageEntry[]
          | undefined,
        seniority: formData.seniority,
        domain: formData.domain?.trim() || undefined,
        sector: formData.sector?.trim() || undefined,
        currentCompany: formData.currentCompany?.trim() || undefined,
        currentPosition: formData.currentPosition?.trim() || undefined,
        pastCompanies: formData.pastCompanies?.trim() || undefined,
        jobFamily: formData.jobFamily?.trim() || undefined,
        hardSkills: formData.hardSkills?.trim() || undefined,
        softSkills: formData.softSkills?.trim() || undefined,
        compensation: formData.compensation?.trim() || undefined,
        comments: formData.comments?.trim() || undefined,
        references: formData.references?.trim() || undefined,
        recruitable: formData.recruitable ?? 'UNKNOWN',
        cvUrl: formData.cvUrl?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        tags: formData.tags ?? [],
        status: formData.status ?? 'ACTIVE',
      }

      await updateCandidate(candidate.id, payload)
      toast.success('Profil candidat mis à jour')
      router.push(`/candidates/${candidate.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/candidates/${candidate.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Modifier le candidat</h1>
          <p className="text-muted-foreground">
            {candidate.firstName} {candidate.lastName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Informations du candidat</CardTitle>
              <CardDescription>
                Identité, contact, localisation, expérience et compétences
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Identité
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName ?? ''}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Ex: Jean"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName ?? ''}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Ex: DUPONT"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email ?? ''}
                    onChange={(e) => updateField('email', e.target.value)}
                    disabled={loading}
                    placeholder="jean.dupont@exemple.fr"
                  />
                </div>
                <div className="space-y-2">
                  <PhoneInput
                    value={formData.phone ?? ''}
                    onChange={(v) => updateField('phone', v)}
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin">URL LinkedIn</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={formData.linkedin ?? ''}
                    onChange={(e) => updateField('linkedin', e.target.value)}
                    disabled={loading}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Âge (18–99)</Label>
                  <Input
                    id="age"
                    type="number"
                    min={18}
                    max={99}
                    value={formData.age ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      updateField('age', v === '' ? undefined : parseInt(v, 10))
                    }}
                    disabled={loading}
                    placeholder="Optionnel"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Localisation
              </h3>
              <LocationSelector
                country={formData.country ?? ''}
                city={formData.city ?? ''}
                region={formData.region ?? ''}
                onCountryChange={(v) => updateField('country', v)}
                onCityChange={(v) => updateField('city', v)}
                onRegionChange={(v) => updateField('region', v)}
                disabled={loading}
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Langues
              </h3>
              <LanguageInput
                value={(formData.languages as LanguageEntry[]) ?? []}
                onChange={(v) => updateField('languages', v)}
                disabled={loading}
              />
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Expérience professionnelle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Séniorité (années d&apos;expérience)</Label>
                  <Select
                    value={formData.seniority ?? ''}
                    onValueChange={(v) =>
                      updateField('seniority', v === '' ? undefined : (v as UpdateCandidateInput['seniority']))
                    }
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SENIORITY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Domaine</Label>
                  <Select
                    value={formData.domain ?? ''}
                    onValueChange={(v) => updateField('domain', v)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgSettings?.domains ?? []).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                      {!orgSettings?.domains?.length && (
                        <SelectItem value="_empty" disabled>
                          Aucun domaine configuré
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Secteur</Label>
                  <Select
                    value={formData.sector ?? ''}
                    onValueChange={(v) => updateField('sector', v)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgSettings?.sectors ?? []).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                      {!orgSettings?.sectors?.length && (
                        <SelectItem value="_empty" disabled>
                          Aucun secteur configuré
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Famille de métier</Label>
                  <Select
                    value={formData.jobFamily ?? ''}
                    onValueChange={(v) => updateField('jobFamily', v)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(orgSettings?.jobFamilies ?? []).map((j) => (
                        <SelectItem key={j} value={j}>
                          {j}
                        </SelectItem>
                      ))}
                      {!orgSettings?.jobFamilies?.length && (
                        <SelectItem value="_empty" disabled>
                          Aucune famille configurée
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CompanyAutocomplete
                  value={formData.currentCompany ?? ''}
                  onChange={(v) => updateField('currentCompany', v)}
                  disabled={loading}
                />
                <PositionAutocomplete
                  value={formData.currentPosition ?? ''}
                  onChange={(v) => updateField('currentPosition', v)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pastCompanies">Anciennes entreprises (séparées par ;)</Label>
                <Input
                  id="pastCompanies"
                  value={formData.pastCompanies ?? ''}
                  onChange={(e) => updateField('pastCompanies', e.target.value)}
                  disabled={loading}
                  placeholder="Entreprise A; Entreprise B; ..."
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Compétences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SkillsInput
                  label="Compétences techniques (point-virgule ou tags)"
                  value={formData.hardSkills ?? ''}
                  onChange={(v) => updateField('hardSkills', v)}
                  disabled={loading}
                  placeholder="Ex: Python; SQL; React..."
                />
                <SkillsInput
                  label="Compétences relationnelles (point-virgule ou tags)"
                  value={formData.softSkills ?? ''}
                  onChange={(v) => updateField('softSkills', v)}
                  disabled={loading}
                  placeholder="Ex: Leadership; Négociation..."
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Informations additionnelles
              </h3>
              <div className="space-y-2">
                <Label>Recrutable</Label>
                <Select
                  value={formData.recruitable ?? 'UNKNOWN'}
                  onValueChange={(v) =>
                    updateField('recruitable', v as UpdateCandidateInput['recruitable'])
                  }
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RECRUITABLE_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="compensation">Rémunération / prétentions</Label>
                <Textarea
                  id="compensation"
                  rows={2}
                  value={formData.compensation ?? ''}
                  onChange={(e) => updateField('compensation', e.target.value)}
                  disabled={loading}
                  placeholder="Texte libre..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comments">Notes internes</Label>
                <Textarea
                  id="comments"
                  rows={3}
                  value={formData.comments ?? ''}
                  onChange={(e) => updateField('comments', e.target.value)}
                  disabled={loading}
                  placeholder="Commentaires internes sur le candidat..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="references">Références / contacts</Label>
                <Textarea
                  id="references"
                  rows={2}
                  value={formData.references ?? ''}
                  onChange={(e) => updateField('references', e.target.value)}
                  disabled={loading}
                  placeholder="Références ou personnes à contacter..."
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Tags
              </h3>
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
              {(formData.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags!.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
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
            </section>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.firstName?.trim() || !formData.lastName?.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild disabled={loading}>
                <Link href={`/candidates/${candidate.id}`}>Annuler</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
