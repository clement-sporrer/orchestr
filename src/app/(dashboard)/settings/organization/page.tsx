'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings,
  Plus,
  X,
  Loader2,
  RefreshCw,
  Building,
  Briefcase,
  Target,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  getOrganizationSettings,
  addDomain,
  removeDomain,
  addSector,
  removeSector,
  addJobFamily,
  removeJobFamily,
  resetOrganizationSettings,
} from '@/lib/actions/organization-settings'

export default function OrganizationSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Settings state
  const [domains, setDomains] = useState<string[]>([])
  const [sectors, setSectors] = useState<string[]>([])
  const [jobFamilies, setJobFamilies] = useState<string[]>([])

  // Input state
  const [newDomain, setNewDomain] = useState('')
  const [newSector, setNewSector] = useState('')
  const [newJobFamily, setNewJobFamily] = useState('')

  // Load settings
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const result = await getOrganizationSettings()
      if (result.success && result.data) {
        setDomains(result.data.domains || [])
        setSectors(result.data.sectors || [])
        setJobFamilies(result.data.jobFamilies || [])
      } else {
        toast.error(result.error || 'Erreur lors du chargement')
      }
    } catch (error) {
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  // Domain operations
  const handleAddDomain = async () => {
    if (!newDomain.trim()) return

    setSaving(true)
    try {
      const result = await addDomain(newDomain.trim())
      if (result.success && result.data) {
        setDomains(result.data)
        setNewDomain('')
        toast.success('Domaine ajouté')
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveDomain = async (domain: string) => {
    setSaving(true)
    try {
      const result = await removeDomain(domain)
      if (result.success && result.data) {
        setDomains(result.data)
        toast.success('Domaine supprimé')
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setSaving(false)
    }
  }

  // Sector operations
  const handleAddSector = async () => {
    if (!newSector.trim()) return

    setSaving(true)
    try {
      const result = await addSector(newSector.trim())
      if (result.success && result.data) {
        setSectors(result.data)
        setNewSector('')
        toast.success('Secteur ajouté')
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveSector = async (sector: string) => {
    setSaving(true)
    try {
      const result = await removeSector(sector)
      if (result.success && result.data) {
        setSectors(result.data)
        toast.success('Secteur supprimé')
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setSaving(false)
    }
  }

  // Job family operations
  const handleAddJobFamily = async () => {
    if (!newJobFamily.trim()) return

    setSaving(true)
    try {
      const result = await addJobFamily(newJobFamily.trim())
      if (result.success && result.data) {
        setJobFamilies(result.data)
        setNewJobFamily('')
        toast.success('Famille de poste ajoutée')
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveJobFamily = async (jobFamily: string) => {
    setSaving(true)
    try {
      const result = await removeJobFamily(jobFamily)
      if (result.success && result.data) {
        setJobFamilies(result.data)
        toast.success('Famille de poste supprimée')
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    } finally {
      setSaving(false)
    }
  }

  // Reset all settings
  const handleReset = async () => {
    if (
      !confirm(
        'Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? Cette action est irréversible.'
      )
    ) {
      return
    }

    setSaving(true)
    try {
      const result = await resetOrganizationSettings()
      if (result.success && result.data) {
        setDomains(result.data.domains || [])
        setSectors(result.data.sectors || [])
        setJobFamilies(result.data.jobFamilies || [])
        toast.success('Paramètres réinitialisés')
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Erreur lors de la réinitialisation')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Paramètres Organisation
          </h1>
          <p className="text-muted-foreground">
            Configurez les listes personnalisables pour vos candidats
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={saving}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          Ces listes apparaîtront comme options de sélection lors de la création
          ou modification de candidats. Personnalisez-les selon vos besoins.
        </AlertDescription>
      </Alert>

      {/* Tabs for each list type */}
      <Tabs defaultValue="domains" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Domaines
          </TabsTrigger>
          <TabsTrigger value="sectors" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Secteurs
          </TabsTrigger>
          <TabsTrigger value="jobFamilies" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Familles de Poste
          </TabsTrigger>
        </TabsList>

        {/* Domains Tab */}
        <TabsContent value="domains">
          <Card>
            <CardHeader>
              <CardTitle>Domaines d'Expertise</CardTitle>
              <CardDescription>
                Ex: Leasing, Crédit Conso, IT, M&A, Corporate Finance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new domain */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nouveau domaine..."
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddDomain()
                    }
                  }}
                  disabled={saving}
                />
                <Button
                  onClick={handleAddDomain}
                  disabled={saving || !newDomain.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {/* List of domains */}
              {domains.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {domains.map((domain) => (
                    <Badge
                      key={domain}
                      variant="secondary"
                      className="gap-1 pr-1 text-sm py-1.5"
                    >
                      {domain}
                      <button
                        onClick={() => handleRemoveDomain(domain)}
                        className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
                        disabled={saving}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun domaine configuré
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sectors Tab */}
        <TabsContent value="sectors">
          <Card>
            <CardHeader>
              <CardTitle>Secteurs</CardTitle>
              <CardDescription>
                Ex: Courtier, Captive, Asset Management, Banque Privée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new sector */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nouveau secteur..."
                  value={newSector}
                  onChange={(e) => setNewSector(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddSector()
                    }
                  }}
                  disabled={saving}
                />
                <Button
                  onClick={handleAddSector}
                  disabled={saving || !newSector.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {/* List of sectors */}
              {sectors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sectors.map((sector) => (
                    <Badge
                      key={sector}
                      variant="secondary"
                      className="gap-1 pr-1 text-sm py-1.5"
                    >
                      {sector}
                      <button
                        onClick={() => handleRemoveSector(sector)}
                        className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
                        disabled={saving}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun secteur configuré
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Job Families Tab */}
        <TabsContent value="jobFamilies">
          <Card>
            <CardHeader>
              <CardTitle>Familles de Poste</CardTitle>
              <CardDescription>
                Ex: Commercial, Manager, Direction, Technique, Support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new job family */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nouvelle famille de poste..."
                  value={newJobFamily}
                  onChange={(e) => setNewJobFamily(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddJobFamily()
                    }
                  }}
                  disabled={saving}
                />
                <Button
                  onClick={handleAddJobFamily}
                  disabled={saving || !newJobFamily.trim()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>

              {/* List of job families */}
              {jobFamilies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {jobFamilies.map((jobFamily) => (
                    <Badge
                      key={jobFamily}
                      variant="secondary"
                      className="gap-1 pr-1 text-sm py-1.5"
                    >
                      {jobFamily}
                      <button
                        onClick={() => handleRemoveJobFamily(jobFamily)}
                        className="ml-1 hover:text-destructive rounded-full p-0.5 hover:bg-destructive/10 transition-colors"
                        disabled={saving}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune famille de poste configurée
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
