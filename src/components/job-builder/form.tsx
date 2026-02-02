'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, Users, Building2, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createMission } from '@/lib/actions/missions'
import { VisibilitySelect } from './visibility-select'
import { JobPreview } from './job-preview'
import { toast } from 'sonner'
import type { Visibility } from '@/generated/prisma'

interface Client {
  id: string
  name: string
}

interface JobBuilderFormProps {
  clients: Client[]
  defaultClientId?: string
}

interface FormData {
  clientId: string
  title: string
  location: string
  contractType: string
  seniority: string
  salaryMin: string
  salaryMax: string
  salaryVisible: boolean
  currency: string
  context: string
  contextVisibility: Visibility
  responsibilities: string
  responsibilitiesVisibility: Visibility
  mustHave: string
  mustHaveVisibility: Visibility
  niceToHave: string
  niceToHaveVisibility: Visibility
  redFlags: string
  process: string
  processVisibility: Visibility
  calendlyLink: string
  calendlyEmbed: boolean
  scoreThreshold: number
}

const defaultFormData: FormData = {
  clientId: '',
  title: '',
  location: '',
  contractType: '',
  seniority: '',
  salaryMin: '',
  salaryMax: '',
  salaryVisible: false,
  currency: 'EUR',
  context: '',
  contextVisibility: 'INTERNAL',
  responsibilities: '',
  responsibilitiesVisibility: 'ALL',
  mustHave: '',
  mustHaveVisibility: 'ALL',
  niceToHave: '',
  niceToHaveVisibility: 'ALL',
  redFlags: '',
  process: '',
  processVisibility: 'INTERNAL_CLIENT',
  calendlyLink: '',
  calendlyEmbed: false,
  scoreThreshold: 60,
}

export function JobBuilderForm({ clients, defaultClientId }: JobBuilderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('edit')
  const [previewAudience, setPreviewAudience] = useState<'internal' | 'client' | 'candidate'>('internal')
  const [formData, setFormData] = useState<FormData>({
    ...defaultFormData,
    clientId: defaultClientId || '',
  })

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data = {
        clientId: formData.clientId,
        title: formData.title,
        location: formData.location || undefined,
        contractType: formData.contractType as 'CDI' | 'CDD' | 'FREELANCE' | 'INTERNSHIP' | 'APPRENTICESHIP' | 'OTHER' | undefined,
        seniority: formData.seniority as 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE' | undefined,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
        salaryVisible: formData.salaryVisible,
        currency: formData.currency,
        context: formData.context || undefined,
        contextVisibility: formData.contextVisibility,
        responsibilities: formData.responsibilities || undefined,
        responsibilitiesVisibility: formData.responsibilitiesVisibility,
        mustHave: formData.mustHave || undefined,
        mustHaveVisibility: formData.mustHaveVisibility,
        niceToHave: formData.niceToHave || undefined,
        niceToHaveVisibility: formData.niceToHaveVisibility,
        redFlags: formData.redFlags || undefined,
        process: formData.process || undefined,
        processVisibility: formData.processVisibility,
        calendlyLink: formData.calendlyLink || undefined,
        calendlyEmbed: formData.calendlyEmbed,
        scoreThreshold: formData.scoreThreshold,
      }

      const mission = await createMission(data)
      toast.success('Mission créée avec succès')
      router.push(`/missions/${mission.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="edit">Édition</TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="mr-2 h-4 w-4" />
              Prévisualisation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations de base</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client *</Label>
                      <Select 
                        value={formData.clientId} 
                        onValueChange={(v) => updateField('clientId', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="title">Titre du poste *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Ex: Product Manager"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Localisation</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                        placeholder="Ex: Paris, Remote"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contractType">Type de contrat</Label>
                      <Select 
                        value={formData.contractType} 
                        onValueChange={(v) => updateField('contractType', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="FREELANCE">Freelance</SelectItem>
                          <SelectItem value="INTERNSHIP">Stage</SelectItem>
                          <SelectItem value="APPRENTICESHIP">Alternance</SelectItem>
                          <SelectItem value="OTHER">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seniority">Séniorité</Label>
                      <Select 
                        value={formData.seniority} 
                        onValueChange={(v) => updateField('seniority', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JUNIOR">Junior</SelectItem>
                          <SelectItem value="MID">Confirmé</SelectItem>
                          <SelectItem value="SENIOR">Senior</SelectItem>
                          <SelectItem value="LEAD">Lead</SelectItem>
                          <SelectItem value="EXECUTIVE">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Salaire min</Label>
                      <Input
                        id="salaryMin"
                        type="number"
                        value={formData.salaryMin}
                        onChange={(e) => updateField('salaryMin', e.target.value)}
                        placeholder="45000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Salaire max</Label>
                      <Input
                        id="salaryMax"
                        type="number"
                        value={formData.salaryMax}
                        onChange={(e) => updateField('salaryMax', e.target.value)}
                        placeholder="65000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Salaire visible?</Label>
                      <div className="flex items-center gap-2 pt-2">
                        <Switch
                          checked={formData.salaryVisible}
                          onCheckedChange={(v) => updateField('salaryVisible', v)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {formData.salaryVisible ? 'Oui' : 'Non'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Sections */}
              <Card>
                <CardHeader>
                  <CardTitle>Contenu de la fiche</CardTitle>
                  <CardDescription>
                    Définissez la visibilité de chaque section
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Context */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="context">Contexte</Label>
                      <VisibilitySelect
                        value={formData.contextVisibility}
                        onChange={(v) => updateField('contextVisibility', v)}
                      />
                    </div>
                    <Textarea
                      id="context"
                      value={formData.context}
                      onChange={(e) => updateField('context', e.target.value)}
                      placeholder="Contexte de la mission, environnement de travail..."
                      rows={3}
                    />
                  </div>

                  {/* Responsibilities */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="responsibilities">Responsabilités</Label>
                      <VisibilitySelect
                        value={formData.responsibilitiesVisibility}
                        onChange={(v) => updateField('responsibilitiesVisibility', v)}
                      />
                    </div>
                    <Textarea
                      id="responsibilities"
                      value={formData.responsibilities}
                      onChange={(e) => updateField('responsibilities', e.target.value)}
                      placeholder="Les principales missions du poste..."
                      rows={4}
                    />
                  </div>

                  {/* Must Have */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="mustHave">Compétences requises (Must have)</Label>
                      <VisibilitySelect
                        value={formData.mustHaveVisibility}
                        onChange={(v) => updateField('mustHaveVisibility', v)}
                      />
                    </div>
                    <Textarea
                      id="mustHave"
                      value={formData.mustHave}
                      onChange={(e) => updateField('mustHave', e.target.value)}
                      placeholder="Les compétences indispensables..."
                      rows={3}
                    />
                  </div>

                  {/* Nice to Have */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="niceToHave">Compétences souhaitées (Nice to have)</Label>
                      <VisibilitySelect
                        value={formData.niceToHaveVisibility}
                        onChange={(v) => updateField('niceToHaveVisibility', v)}
                      />
                    </div>
                    <Textarea
                      id="niceToHave"
                      value={formData.niceToHave}
                      onChange={(e) => updateField('niceToHave', e.target.value)}
                      placeholder="Les plus appréciés..."
                      rows={3}
                    />
                  </div>

                  {/* Red Flags - Internal Only */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="redFlags">Red Flags (Interne uniquement)</Label>
                      <span className="text-xs text-muted-foreground">🔒 Interne</span>
                    </div>
                    <Textarea
                      id="redFlags"
                      value={formData.redFlags}
                      onChange={(e) => updateField('redFlags', e.target.value)}
                      placeholder="Points de vigilance, profils à éviter..."
                      rows={2}
                      className="border-dashed"
                    />
                  </div>

                  {/* Process */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="process">Processus de recrutement</Label>
                      <VisibilitySelect
                        value={formData.processVisibility}
                        onChange={(v) => updateField('processVisibility', v)}
                      />
                    </div>
                    <Textarea
                      id="process"
                      value={formData.process}
                      onChange={(e) => updateField('process', e.target.value)}
                      placeholder="Étapes du processus..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Paramètres</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="calendlyLink">Lien Calendly</Label>
                      <Input
                        id="calendlyLink"
                        value={formData.calendlyLink}
                        onChange={(e) => updateField('calendlyLink', e.target.value)}
                        placeholder="https://calendly.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scoreThreshold">Seuil de score (%)</Label>
                      <Input
                        id="scoreThreshold"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.scoreThreshold}
                        onChange={(e) => updateField('scoreThreshold', parseInt(e.target.value) || 60)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer la mission'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Prévisualisation</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={previewAudience === 'internal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewAudience('internal')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Interne
                    </Button>
                    <Button
                      variant={previewAudience === 'client' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewAudience('client')}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      Client
                    </Button>
                    <Button
                      variant={previewAudience === 'candidate' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewAudience('candidate')}
                    >
                      <UserCircle className="mr-2 h-4 w-4" />
                      Candidat
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <JobPreview formData={formData} audience={previewAudience} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar - Quick preview */}
      <div className="hidden lg:block">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle className="text-sm">Aperçu rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-muted-foreground">Titre:</span>
              <p className="font-medium">{formData.title || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Localisation:</span>
              <p className="font-medium">{formData.location || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Contrat:</span>
              <p className="font-medium">{formData.contractType || '-'}</p>
            </div>
            {formData.salaryMin && formData.salaryMax && (
              <div>
                <span className="text-muted-foreground">Rémunération:</span>
                <p className="font-medium">
                  {formData.salaryMin}€ - {formData.salaryMax}€
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}





