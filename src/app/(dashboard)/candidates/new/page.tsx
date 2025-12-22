'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { createCandidate } from '@/lib/actions/candidates'
import { toast } from 'sonner'

export default function NewCandidatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const missionId = searchParams.get('missionId')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      location: formData.get('location') as string || undefined,
      currentPosition: formData.get('currentPosition') as string || undefined,
      currentCompany: formData.get('currentCompany') as string || undefined,
      profileUrl: formData.get('profileUrl') as string || undefined,
      notes: formData.get('notes') as string || undefined,
      tags,
      status: 'ACTIVE' as const,
    }

    try {
      const candidate = await createCandidate(data)
      toast.success('Candidat créé avec succès')
      
      if (missionId) {
        // TODO: Add candidate to mission
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

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
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
            Ajoutez un candidat à votre vivier
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du candidat</CardTitle>
          <CardDescription>
            Les champs avec * sont obligatoires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Identity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  name="lastName"
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
                  name="email"
                  type="email"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input
                id="location"
                name="location"
                placeholder="Ex: Paris, France"
                disabled={loading}
              />
            </div>

            {/* Professional */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPosition">Poste actuel</Label>
                <Input
                  id="currentPosition"
                  name="currentPosition"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentCompany">Entreprise actuelle</Label>
                <Input
                  id="currentCompany"
                  name="currentCompany"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Profile URL */}
            <div className="space-y-2">
              <Label htmlFor="profileUrl">URL du profil (LinkedIn, etc.)</Label>
              <Input
                id="profileUrl"
                name="profileUrl"
                type="url"
                placeholder="https://linkedin.com/in/..."
                disabled={loading}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
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
                <Button type="button" variant="outline" onClick={addTag} disabled={loading}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
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
                name="notes"
                rows={4}
                placeholder="Notes internes sur le candidat..."
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer le candidat'
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
    </div>
  )
}

