'use client'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import type { Visibility } from '@/generated/prisma'

interface FormData {
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
}

interface JobPreviewProps {
  formData: FormData
  audience: 'internal' | 'client' | 'candidate'
}

function isVisible(visibility: Visibility, audience: 'internal' | 'client' | 'candidate'): boolean {
  switch (visibility) {
    case 'INTERNAL':
      return audience === 'internal'
    case 'INTERNAL_CLIENT':
      return audience === 'internal' || audience === 'client'
    case 'INTERNAL_CANDIDATE':
      return audience === 'internal' || audience === 'candidate'
    case 'ALL':
      return true
    default:
      return false
  }
}

const contractLabels: Record<string, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Stage',
  APPRENTICESHIP: 'Alternance',
  OTHER: 'Autre',
}

const seniorityLabels: Record<string, string> = {
  JUNIOR: 'Junior',
  MID: 'Confirmé',
  SENIOR: 'Senior',
  LEAD: 'Lead',
  EXECUTIVE: 'Executive',
}

export function JobPreview({ formData, audience }: JobPreviewProps) {
  const hasContent = formData.title || formData.responsibilities || formData.mustHave

  if (!hasContent) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Commencez à remplir le formulaire pour voir l&apos;aperçu
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{formData.title || 'Titre du poste'}</h2>
        <div className="flex flex-wrap gap-3 mt-3">
          {formData.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {formData.location}
            </Badge>
          )}
          {formData.contractType && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {contractLabels[formData.contractType] || formData.contractType}
            </Badge>
          )}
          {formData.seniority && (
            <Badge variant="secondary">
              {seniorityLabels[formData.seniority] || formData.seniority}
            </Badge>
          )}
          {formData.salaryVisible && formData.salaryMin && formData.salaryMax && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formData.salaryMin}€ - {formData.salaryMax}€
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Context */}
      {formData.context && isVisible(formData.contextVisibility, audience) && (
        <div>
          <h3 className="font-semibold mb-2">Contexte</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{formData.context}</p>
        </div>
      )}

      {/* Responsibilities */}
      {formData.responsibilities && isVisible(formData.responsibilitiesVisibility, audience) && (
        <div>
          <h3 className="font-semibold mb-2">Responsabilités</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{formData.responsibilities}</p>
        </div>
      )}

      {/* Must Have */}
      {formData.mustHave && isVisible(formData.mustHaveVisibility, audience) && (
        <div>
          <h3 className="font-semibold mb-2">Compétences requises</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{formData.mustHave}</p>
        </div>
      )}

      {/* Nice to Have */}
      {formData.niceToHave && isVisible(formData.niceToHaveVisibility, audience) && (
        <div>
          <h3 className="font-semibold mb-2">Compétences appréciées</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{formData.niceToHave}</p>
        </div>
      )}

      {/* Red Flags - Internal Only */}
      {formData.redFlags && audience === 'internal' && (
        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <h3 className="font-semibold mb-2 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Red Flags (Interne)
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{formData.redFlags}</p>
        </div>
      )}

      {/* Process */}
      {formData.process && isVisible(formData.processVisibility, audience) && (
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Processus de recrutement
          </h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{formData.process}</p>
        </div>
      )}

      {/* CTA for candidate view */}
      {audience === 'candidate' && (
        <div className="pt-4">
          <Button size="lg" className="w-full">
            Postuler à cette offre
          </Button>
        </div>
      )}
    </div>
  )
}





