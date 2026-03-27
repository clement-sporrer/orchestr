'use client'

import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Papa from 'papaparse'
import { 
  Upload, 
  FileText, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { previewCsvImport, executeCsvImport } from '@/lib/actions/csv-import'
import { toast } from 'sonner'

type Step = 'upload' | 'mapping' | 'preview' | 'complete'

interface CsvRow {
  [key: string]: string
}

const FIELD_OPTIONS = [
  { value: 'firstName', label: 'Prénom' },
  { value: 'lastName', label: 'Nom' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'location', label: 'Localisation' },
  { value: 'currentPosition', label: 'Poste actuel' },
  { value: 'currentCompany', label: 'Entreprise' },
  { value: 'profileUrl', label: 'URL profil' },
  { value: 'tags', label: 'Tags (séparés par virgule)' },
  { value: 'ignore', label: 'Ignorer' },
]

export default function ImportPage() {
  const searchParams = useSearchParams()
  const missionId = searchParams.get('missionId')
  const poolId = searchParams.get('poolId')

  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [rawData, setRawData] = useState<CsvRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewCsvImport>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Awaited<ReturnType<typeof executeCsvImport>> | null>(null)

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    setError(null)

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CsvRow[]
        if (data.length === 0) {
          setError('Le fichier est vide')
          return
        }

        const csvHeaders = Object.keys(data[0])
        setHeaders(csvHeaders)
        setRawData(data)

        // Auto-detect mapping
        const autoMapping: Record<string, string> = {}
        csvHeaders.forEach((header) => {
          const lowerHeader = header.toLowerCase().trim()
          
          if (lowerHeader.includes('prénom') || lowerHeader === 'firstname' || lowerHeader === 'first_name') {
            autoMapping[header] = 'firstName'
          } else if (lowerHeader.includes('nom') || lowerHeader === 'lastname' || lowerHeader === 'last_name') {
            autoMapping[header] = 'lastName'
          } else if (lowerHeader.includes('email') || lowerHeader.includes('mail')) {
            autoMapping[header] = 'email'
          } else if (lowerHeader.includes('phone') || lowerHeader.includes('téléphone') || lowerHeader.includes('tel')) {
            autoMapping[header] = 'phone'
          } else if (lowerHeader.includes('location') || lowerHeader.includes('ville') || lowerHeader.includes('city')) {
            autoMapping[header] = 'location'
          } else if (lowerHeader.includes('position') || lowerHeader.includes('poste') || lowerHeader.includes('title')) {
            autoMapping[header] = 'currentPosition'
          } else if (lowerHeader.includes('company') || lowerHeader.includes('entreprise') || lowerHeader.includes('société')) {
            autoMapping[header] = 'currentCompany'
          } else if (lowerHeader.includes('linkedin') || lowerHeader.includes('profile') || lowerHeader.includes('url')) {
            autoMapping[header] = 'profileUrl'
          } else if (lowerHeader.includes('tag')) {
            autoMapping[header] = 'tags'
          } else {
            autoMapping[header] = 'ignore'
          }
        })
        setMapping(autoMapping)
        setStep('mapping')
      },
      error: () => {
        setError('Erreur lors de la lecture du fichier')
      },
    })
  }, [])

  // Transform data using mapping
  const transformData = useCallback(() => {
    return rawData.map((row) => {
      const transformed: Record<string, string> = {}
      Object.entries(mapping).forEach(([csvHeader, field]) => {
        if (field !== 'ignore' && row[csvHeader]) {
          transformed[field] = row[csvHeader]
        }
      })
      return transformed
    })
  }, [rawData, mapping])

  // Generate preview
  const handleGeneratePreview = async () => {
    setLoading(true)
    setError(null)

    try {
      const destination = missionId ? 'MISSION' : poolId ? 'POOL' : 'VIVIER'
      const destinationId = missionId || poolId || undefined
      const transformedData = transformData()
      
      const result = await previewCsvImport(
        transformedData,
        destination,
        destinationId
      )
      setPreview(result)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la prévisualisation')
    } finally {
      setLoading(false)
    }
  }

  // Execute import
  const handleImport = async () => {
    setLoading(true)
    setError(null)

    try {
      const destination = missionId ? 'MISSION' : poolId ? 'POOL' : 'VIVIER'
      const destinationId = missionId || poolId || undefined
      const transformedData = transformData()
      
      const result = await executeCsvImport(
        transformedData,
        destination,
        destinationId,
        mapping,
        file?.name
      )
      setResult(result)
      setStep('complete')
      toast.success('Import terminé avec succès')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'import')
    } finally {
      setLoading(false)
    }
  }

  const destination = missionId ? 'cette mission' : poolId ? 'ce pool' : 'votre vivier'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={missionId ? `/missions/${missionId}` : poolId ? `/pools/${poolId}` : '/candidates'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importer des candidats</h1>
          <p className="text-muted-foreground">
            Importez un fichier CSV vers {destination}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {['upload', 'mapping', 'preview', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step === s ? 'bg-primary text-primary-foreground' : 
                ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'}
            `}>
              {['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i ? (
                <Check className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 3 && (
              <div className={`w-12 h-0.5 mx-2 ${
                ['upload', 'mapping', 'preview', 'complete'].indexOf(step) > i
                  ? 'bg-primary'
                  : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>1. Sélectionner un fichier</CardTitle>
            <CardDescription>
              Importez un fichier CSV contenant vos candidats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
                </p>
                <p className="text-xs text-muted-foreground">CSV uniquement</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={handleFileUpload}
              />
            </label>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mapping */}
      {step === 'mapping' && (
        <Card>
          <CardHeader>
            <CardTitle>2. Mapper les colonnes</CardTitle>
            <CardDescription>
              Associez les colonnes de votre fichier aux champs candidat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{file?.name}</span>
              <Badge variant="secondary">{rawData.length} lignes</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colonne CSV</TableHead>
                  <TableHead>Aperçu</TableHead>
                  <TableHead>Champ ORCHESTR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {headers.map((header) => (
                  <TableRow key={header}>
                    <TableCell className="font-medium">{header}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-48 truncate">
                      {rawData[0]?.[header] || '-'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mapping[header] || 'ignore'}
                        onValueChange={(value) => setMapping({ ...mapping, [header]: value })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={handleGeneratePreview} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Prévisualiser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && preview && (
        <Card>
          <CardHeader>
            <CardTitle>3. Vérifier l&apos;import</CardTitle>
            <CardDescription>
              Vérifiez les changements avant de confirmer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{preview.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600">{preview.new}</p>
                <p className="text-sm text-muted-foreground">Nouveaux</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-600">{preview.updated}</p>
                <p className="text-sm text-muted-foreground">Mis à jour</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-600">{preview.merged}</p>
                <p className="text-sm text-muted-foreground">Fusionnés</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-600">{preview.errors}</p>
                <p className="text-sm text-muted-foreground">Erreurs</p>
              </div>
            </div>

            {/* Preview Table */}
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Détail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.previews.slice(0, 50).map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Badge variant={
                          p.status === 'new' ? 'default' :
                          p.status === 'update' ? 'secondary' :
                          p.status === 'merge' ? 'outline' :
                          'destructive'
                        }>
                          {p.status === 'new' && 'Nouveau'}
                          {p.status === 'update' && 'Mise à jour'}
                          {p.status === 'merge' && 'Fusion'}
                          {p.status === 'error' && 'Erreur'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {p.data.firstName} {p.data.lastName}
                      </TableCell>
                      <TableCell>{p.data.email || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.existingCandidate && `Existe: ${p.existingCandidate.name}`}
                        {p.mergeWith && `Fusionne avec: ${p.mergeWith.name}`}
                        {p.error && <span className="text-destructive">{p.error}</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Confirmer l&apos;import
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-6 w-6" />
              Import terminé
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total traité</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-600">{result.new}</p>
                <p className="text-sm text-muted-foreground">Créés</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                <p className="text-sm text-muted-foreground">Mis à jour</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-500/10">
                <p className="text-2xl font-bold text-red-600">{result.errors}</p>
                <p className="text-sm text-muted-foreground">Erreurs</p>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" asChild>
                <Link href="/import">
                  Nouvel import
                </Link>
              </Button>
              <Button asChild>
                <Link href="/candidates">
                  Voir les candidats
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}





