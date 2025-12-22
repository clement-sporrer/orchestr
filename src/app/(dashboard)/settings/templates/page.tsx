'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Plus,
  FileText,
  Star,
  Trash2,
  Pencil,
  GripVertical,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  getReportTemplates,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  DEFAULT_INDIVIDUAL_TEMPLATE,
} from '@/lib/actions/reports'
import type { ReportTemplate, ReportType } from '@/generated/prisma'

interface Section {
  title: string
  prompt: string
  required: boolean
  order: number
}

const typeLabels: Record<ReportType, string> = {
  INDIVIDUAL: 'Compte-rendu individuel',
  SHORTLIST: 'Rapport shortlist',
  CLIENT_SUMMARY: 'Resume client',
}

export default function TemplatesSettingsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'INDIVIDUAL' as ReportType,
    isDefault: false,
    sections: [] as Section[],
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await getReportTemplates()
      setTemplates(data)
    } catch (error) {
      toast.error('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const openNewDialog = () => {
    setEditingId(null)
    setFormData({
      name: '',
      type: 'INDIVIDUAL',
      isDefault: false,
      sections: [{ title: '', prompt: '', required: true, order: 0 }],
    })
    setShowDialog(true)
  }

  const openEditDialog = (template: ReportTemplate) => {
    setEditingId(template.id)
    setFormData({
      name: template.name,
      type: template.type,
      isDefault: template.isDefault,
      sections: (template.sections as unknown as Section[]) || [],
    })
    setShowDialog(true)
  }

  const useDefaultTemplate = () => {
    setFormData({
      ...formData,
      name: DEFAULT_INDIVIDUAL_TEMPLATE.name,
      type: DEFAULT_INDIVIDUAL_TEMPLATE.type,
      sections: DEFAULT_INDIVIDUAL_TEMPLATE.sections,
    })
  }

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        { title: '', prompt: '', required: true, order: formData.sections.length },
      ],
    })
  }

  const updateSection = (index: number, field: keyof Section, value: string | boolean | number) => {
    const newSections = [...formData.sections]
    newSections[index] = { ...newSections[index], [field]: value }
    setFormData({ ...formData, sections: newSections })
  }

  const removeSection = (index: number) => {
    const newSections = formData.sections.filter((_, i) => i !== index)
    setFormData({ ...formData, sections: newSections })
  }

  const handleSave = async () => {
    if (!formData.name || formData.sections.length === 0) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    if (formData.sections.some(s => !s.title || !s.prompt)) {
      toast.error('Chaque section doit avoir un titre et un prompt')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateReportTemplate(editingId, formData)
        toast.success('Template mis a jour')
      } else {
        await createReportTemplate(formData)
        toast.success('Template cree')
      }
      setShowDialog(false)
      loadTemplates()
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteReportTemplate(deleteId)
      toast.success('Template supprime')
      setDeleteId(null)
      loadTemplates()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Templates de compte-rendu</h1>
            <p className="text-muted-foreground">
              Configurez les templates pour generer des compte-rendus automatiques
            </p>
          </div>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau template
        </Button>
      </div>

      {/* Templates list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            {template.isDefault && (
              <Badge className="absolute top-3 right-3" variant="secondary">
                <Star className="h-3 w-3 mr-1" />
                Par defaut
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {template.name}
              </CardTitle>
              <CardDescription>
                {typeLabels[template.type]}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {((template.sections as unknown as Section[]) || []).length} sections
              </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Modifier
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleteId(template.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Aucun template configure</p>
              <Button onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Creer votre premier template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
            <DialogDescription>
              Definissez les sections qui seront generees automatiquement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name and type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom du template</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Compte-rendu standard"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as ReportType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                />
                <Label>Template par defaut</Label>
              </div>
              {!editingId && (
                <Button variant="outline" size="sm" onClick={useDefaultTemplate}>
                  Utiliser le modele par defaut
                </Button>
              )}
            </div>

            {/* Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sections</Label>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>

              {formData.sections.map((section, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <div className="p-2 cursor-move">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Titre</Label>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(index, 'title', e.target.value)}
                              placeholder="Ex: Points forts"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={section.required}
                              onCheckedChange={(checked) => updateSection(index, 'required', checked)}
                            />
                            <Label className="text-xs">Obligatoire</Label>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Prompt IA</Label>
                          <Textarea
                            value={section.prompt}
                            onChange={(e) => updateSection(index, 'prompt', e.target.value)}
                            placeholder="Ex: Liste les 3 principaux atouts du candidat"
                            rows={2}
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => removeSection(index)}
                        disabled={formData.sections.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? 'Enregistrer' : 'Creer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce template?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible. Les compte-rendus deja generes ne seront pas affectes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

